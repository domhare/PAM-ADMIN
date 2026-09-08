<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_login();
require_csrf();

/**
 * Versendet eine Mail ueber den Strato-SMTP und legt sie im Ordner
 * "Gesendet" ab.
 *
 * POST-Body: {"to": "...", "cc": "...", "subject": "...", "text": "...",
 *             "inReplyTo": "<...>"}
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Methode nicht erlaubt.', 405);
}

$config = config();
$body = json_body();

$to = Mime::parseAddressList((string) ($body['to'] ?? ''));
$cc = Mime::parseAddressList((string) ($body['cc'] ?? ''));
$subject = trim((string) ($body['subject'] ?? ''));
$text = (string) ($body['text'] ?? '');
$inReplyTo = trim((string) ($body['inReplyTo'] ?? ''));

if ($to === []) {
    json_error('Bitte mindestens einen Empfänger angeben.');
}

foreach (array_merge($to, $cc) as $recipient) {
    if (filter_var($recipient['address'], FILTER_VALIDATE_EMAIL) === false) {
        json_error('Ungültige Empfängeradresse: ' . $recipient['address']);
    }
}
if ($text === '' && $subject === '') {
    json_error('Die Nachricht ist leer.');
}

$from = [
    'name'    => (string) ($config['from_name'] ?? ''),
    'address' => (string) ($config['from_address'] ?? $config['smtp']['user']),
];

$extraHeaders = [];
if ($cc !== []) {
    $extraHeaders['Cc'] = implode(', ', array_map(
        static fn (array $a): string => $a['address'],
        $cc
    ));
}
if ($inReplyTo !== '') {
    $extraHeaders['In-Reply-To'] = $inReplyTo;
    $extraHeaders['References'] = $inReplyTo;
}

// Zeilenumbrueche des Textfelds als einfaches HTML mitschicken.
$html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5">'
    . nl2br(htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'))
    . '</div>';

$message = Smtp::build($from, $to, $subject, $text, $html, $extraHeaders);

$smtp = new Smtp(
    $config['smtp']['host'],
    (int) $config['smtp']['port'],
    $config['smtp']['encrypt'] ?? 'ssl'
);

try {
    $smtp->login($config['smtp']['user'], $config['smtp']['password']);
    $recipients = array_map(
        static fn (array $a): string => $a['address'],
        array_merge($to, $cc)
    );
    $smtp->send($from['address'], $recipients, $message);
} finally {
    $smtp->quit();
}

// Kopie im Ordner "Gesendet" ablegen - schlaegt das fehl, gilt die Mail
// trotzdem als versendet.
$storedInSent = false;
try {
    $imap = imap_connect_configured();
    try {
        $folders = resolve_folders($imap);
        if (isset($folders['sent'])) {
            $imap->append($folders['sent'], $message);
            $storedInSent = true;
        }
    } finally {
        $imap->logout();
    }
} catch (Throwable) {
    $storedInSent = false;
}

json_response(['ok' => true, 'storedInSent' => $storedInSent]);
