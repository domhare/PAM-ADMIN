<?php
declare(strict_types=1);

/**
 * Gemeinsame Basis aller API-Endpunkte: Konfiguration, Sitzung, JSON-Ausgabe
 * und der Verbindungsaufbau zum Postfach.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

/*
 * Diese Datei kommt bewusst ohne Syntax aus, die neuer als PHP 7.0 ist, und
 * laedt lib/ erst nach der Pruefung unten. Sonst waere auf einer zu alten
 * PHP-Version schon das Einlesen ein Parse-Fehler - also eine leere Antwort
 * mit HTTP 500, aus der niemand die Ursache ablesen kann.
 */
if (PHP_VERSION_ID < 80100) {
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => 'Der Webspace laeuft mit PHP ' . PHP_VERSION . ', die Mail-Anbindung braucht mindestens PHP 8.1. '
            . 'Umzustellen im Strato-Kundenlogin unter "Paket verwalten -> PHP-Version". Einzelheiten: api/check.php',
    ]);
    exit;
}

$missingExtensions = [];
foreach (['openssl', 'mbstring', 'iconv'] as $extension) {
    if (!extension_loaded($extension)) {
        $missingExtensions[] = $extension;
    }
}
if ($missingExtensions !== []) {
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => 'Dem PHP dieses Webspace fehlen die Erweiterungen ' . implode(', ', $missingExtensions)
            . '. Im Strato-Kundenlogin eine andere PHP-Version waehlen. Einzelheiten: api/check.php',
    ]);
    exit;
}

require_once __DIR__ . '/lib/Imap.php';
require_once __DIR__ . '/lib/Mime.php';
require_once __DIR__ . '/lib/Smtp.php';

mb_internal_encoding('UTF-8');

/**
 * Beendet die Anfrage mit einer JSON-Antwort.
 *
 * @return never
 */
function json_response(array $payload, int $status = 200)
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** @return never */
function json_error(string $message, int $status = 400)
{
    json_response(['ok' => false, 'error' => $message], $status);
}

/** Liest die Konfiguration; bricht mit einer verständlichen Meldung ab, wenn sie fehlt. */
function config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $path = __DIR__ . '/config.php';
    if (!is_file($path)) {
        json_error('api/config.php fehlt. Bitte api/config.example.php kopieren und ausfüllen.', 500);
    }

    $config = require $path;
    if (!is_array($config)) {
        json_error('api/config.php liefert keine Konfiguration zurück.', 500);
    }

    return $config;
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https',
    ]);
    session_name('pamadmin_mail');
    session_start();
}

function is_logged_in(): bool
{
    start_session();

    return ($_SESSION['authenticated'] ?? false) === true;
}

/** Bricht ab, wenn kein gueltiger Login vorliegt. */
function require_login(): void
{
    if (!is_logged_in()) {
        json_error('Nicht angemeldet.', 401);
    }
}

function csrf_token(): string
{
    start_session();
    if (!isset($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf'];
}

/** Prueft bei schreibenden Zugriffen das CSRF-Token. */
function require_csrf(): void
{
    start_session();
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if ($sent === '' || !hash_equals($_SESSION['csrf'] ?? '', $sent)) {
        json_error('Ungültiges Sicherheits-Token. Bitte Seite neu laden.', 403);
    }
}

/** Liest den JSON-Body einer POST-Anfrage. */
function json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}

/** Baut eine angemeldete IMAP-Verbindung auf. */
function imap_connect_configured(): Imap
{
    $imapConfig = config()['imap'];
    $imap = new Imap(
        $imapConfig['host'],
        (int) $imapConfig['port'],
        $imapConfig['encrypt'] ?? 'ssl'
    );
    $imap->login($imapConfig['user'], $imapConfig['password']);

    return $imap;
}

/**
 * Ordnet die Standardordner (Posteingang, Gesendet, ...) den tatsaechlichen
 * Ordnernamen des Postfachs zu - erst ueber die SPECIAL-USE-Flags, sonst
 * ueber die ueblichen deutschen und englischen Bezeichnungen.
 *
 * @return array<string, string>
 */
function resolve_folders(Imap $imap): array
{
    static $resolved = null;
    if ($resolved !== null) {
        return $resolved;
    }

    $configured = array_filter(config()['imap']['folders'] ?? []);
    $map = ['inbox' => 'INBOX'] + $configured;

    $byFlag = [
        '\\Sent'    => 'sent',
        '\\Drafts'  => 'drafts',
        '\\Trash'   => 'trash',
        '\\Junk'    => 'spam',
    ];
    $byName = [
        'sent'   => ['sent', 'sent items', 'sent messages', 'gesendet', 'gesendete objekte', 'gesendete elemente'],
        'drafts' => ['drafts', 'entwurf', 'entwuerfe', 'entwürfe'],
        'trash'  => ['trash', 'deleted', 'deleted items', 'papierkorb', 'geloeschte objekte', 'gelöschte objekte'],
        'spam'   => ['spam', 'junk', 'junk-e-mail', 'unerwuenscht', 'unerwünscht'],
    ];

    foreach ($imap->listFolders() as $folder) {
        $leaf = strtolower(preg_replace('/^.*[.\/]/', '', $folder['name']) ?? $folder['name']);

        foreach ($byFlag as $flag => $key) {
            if (!isset($map[$key]) && stripos($folder['flags'], $flag) !== false) {
                $map[$key] = $folder['name'];
            }
        }
        foreach ($byName as $key => $names) {
            if (!isset($map[$key]) && in_array($leaf, $names, true)) {
                $map[$key] = $folder['name'];
            }
        }
    }

    return $resolved = $map;
}

/** Uebersetzt einen Ordner-Schluessel aus dem Frontend in den echten Ordnernamen. */
function folder_name(Imap $imap, string $key): string
{
    $folders = resolve_folders($imap);
    if (isset($folders[$key])) {
        return $folders[$key];
    }
    // Unbekannte Schluessel koennen echte Ordnernamen sein (eigene Ordner).
    foreach ($imap->listFolders() as $folder) {
        if ($folder['name'] === $key) {
            return $key;
        }
    }

    return 'INBOX';
}

/**
 * Liest einen Date-Header. Der Wochentag wird vorher entfernt: passt er nicht
 * zum Datum (kommt bei fehlerhaften Absendern vor), wuerde strtotime sonst auf
 * den naechsten passenden Wochentag weiterspringen.
 */
function parse_mail_date(?string $value): ?string
{
    $value = trim((string) $value);
    if ($value === '') {
        return null;
    }
    $value = preg_replace('/^[A-Za-z]{3,9},\s*/', '', $value) ?? $value;
    // Kommentare wie "(CEST)" hinter der Zeitzone stoeren die Auswertung.
    $value = preg_replace('/\s*\([^)]*\)\s*$/', '', $value) ?? $value;

    $timestamp = strtotime($value);

    return $timestamp !== false ? date(DATE_ATOM, $timestamp) : null;
}

/**
 * Wandelt eine Fehlermeldung in eine JSON-Antwort um.
 *
 * @return never
 */
function handle_exception(Throwable $e)
{
    $status = $e instanceof ImapException || $e instanceof SmtpException ? 502 : 500;
    json_error($e->getMessage(), $status);
}

set_exception_handler('handle_exception');
