<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_login();

/**
 * Selbsttest fuer die Einrichtung: prueft PHP-Umgebung, Erreichbarkeit der
 * Strato-Server und die Zugangsdaten. Hilfreich, wenn etwas nicht laeuft.
 */

$config = config();
$checks = [];

$checks[] = ['name' => 'PHP-Version', 'ok' => PHP_VERSION_ID >= 80100, 'detail' => PHP_VERSION . ' (mindestens 8.1 nötig)'];
foreach (['openssl', 'mbstring', 'iconv'] as $extension) {
    $checks[] = [
        'name'   => 'Erweiterung ' . $extension,
        'ok'     => extension_loaded($extension),
        'detail' => extension_loaded($extension) ? 'geladen' : 'fehlt - im Strato-Kundenlogin die PHP-Version umstellen',
    ];
}
$checks[] = [
    'name'   => 'Panel-Passwort gesetzt',
    'ok'     => ($config['panel_password_hash'] ?? '') !== '',
    'detail' => ($config['panel_password_hash'] ?? '') !== '' ? 'ja' : 'panel_password_hash in api/config.php fehlt',
];

/** Prueft, ob ein Host/Port erreichbar ist. */
$reachable = static function (string $host, int $port): array {
    $errno = 0;
    $errstr = '';
    $sock = @stream_socket_client('tcp://' . $host . ':' . $port, $errno, $errstr, 8.0);
    if ($sock === false) {
        return [false, $errstr ?: 'nicht erreichbar (Firewall des Hosters?)'];
    }
    fclose($sock);

    return [true, 'erreichbar'];
};

[$imapReachable, $imapDetail] = $reachable($config['imap']['host'], (int) $config['imap']['port']);
$checks[] = ['name' => 'IMAP ' . $config['imap']['host'] . ':' . $config['imap']['port'], 'ok' => $imapReachable, 'detail' => $imapDetail];

[$smtpReachable, $smtpDetail] = $reachable($config['smtp']['host'], (int) $config['smtp']['port']);
$checks[] = ['name' => 'SMTP ' . $config['smtp']['host'] . ':' . $config['smtp']['port'], 'ok' => $smtpReachable, 'detail' => $smtpDetail];

$folders = [];
if ($imapReachable) {
    try {
        $imap = imap_connect_configured();
        try {
            $folders = array_map(static fn (array $f): string => $f['name'], $imap->listFolders());
            $checks[] = ['name' => 'IMAP-Anmeldung', 'ok' => true, 'detail' => count($folders) . ' Ordner gefunden'];
            $checks[] = ['name' => 'Ordnerzuordnung', 'ok' => true, 'detail' => json_encode(resolve_folders($imap), JSON_UNESCAPED_UNICODE) ?: ''];
        } finally {
            $imap->logout();
        }
    } catch (Throwable $e) {
        $checks[] = ['name' => 'IMAP-Anmeldung', 'ok' => false, 'detail' => $e->getMessage()];
    }
}

if ($smtpReachable) {
    try {
        $smtp = new Smtp($config['smtp']['host'], (int) $config['smtp']['port'], $config['smtp']['encrypt'] ?? 'ssl');
        try {
            $smtp->login($config['smtp']['user'], $config['smtp']['password']);
            $checks[] = ['name' => 'SMTP-Anmeldung', 'ok' => true, 'detail' => 'erfolgreich'];
        } finally {
            $smtp->quit();
        }
    } catch (Throwable $e) {
        $checks[] = ['name' => 'SMTP-Anmeldung', 'ok' => false, 'detail' => $e->getMessage()];
    }
}

json_response([
    'ok'      => !in_array(false, array_column($checks, 'ok'), true),
    'checks'  => $checks,
    'folders' => $folders,
]);
