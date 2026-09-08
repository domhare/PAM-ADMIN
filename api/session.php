<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/**
 * Meldet an, ab und gibt den aktuellen Anmeldestatus zurueck.
 *
 * GET  -> Status inkl. CSRF-Token
 * POST -> {"action":"login","password":"..."} oder {"action":"logout"}
 */

$config = config();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response([
        'ok'            => true,
        'authenticated' => is_logged_in(),
        'csrf'          => csrf_token(),
        'account'       => [
            'address' => $config['from_address'] ?? ($config['imap']['user'] ?? ''),
            'name'    => $config['from_name'] ?? '',
        ],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Methode nicht erlaubt.', 405);
}

$body = json_body();
$action = $body['action'] ?? 'login';

if ($action === 'logout') {
    start_session();
    $_SESSION = [];
    session_destroy();
    json_response(['ok' => true, 'authenticated' => false]);
}

$hash = (string) ($config['panel_password_hash'] ?? '');
if ($hash === '') {
    json_error('Es ist noch kein Panel-Passwort gesetzt. Bitte panel_password_hash in api/config.php eintragen.', 500);
}

$password = (string) ($body['password'] ?? '');
if ($password === '' || !password_verify($password, $hash)) {
    // Bremst das Durchprobieren von Passwoertern etwas aus.
    usleep(400000);
    json_error('Passwort falsch.', 401);
}

start_session();
session_regenerate_id(true);
$_SESSION['authenticated'] = true;

json_response([
    'ok'            => true,
    'authenticated' => true,
    'csrf'          => csrf_token(),
    'account'       => [
        'address' => $config['from_address'] ?? ($config['imap']['user'] ?? ''),
        'name'    => $config['from_name'] ?? '',
    ],
]);
