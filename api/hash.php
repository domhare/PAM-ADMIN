<?php
declare(strict_types=1);

/**
 * Kleine Hilfe fuer die Einrichtung: erzeugt den Hash fuer das Panel-Passwort.
 * Nach dem Einrichten kann diese Datei gelöscht werden.
 */

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');

// Der Deploy spiegelt das Repository und laedt diese Datei nach dem
// Einrichten wieder hoch. Steht die Konfiguration, wird sie nicht mehr
// gebraucht - dann lieber gar nichts anbieten.
if (is_file(__DIR__ . '/config.php')) {
    http_response_code(404);
    echo '<!doctype html><meta charset="utf-8"><title>Nicht mehr noetig</title>'
        . '<p style="font:15px/1.6 system-ui,sans-serif;margin:3rem auto;max-width:32rem">'
        . 'Die Einrichtung ist abgeschlossen; diese Seite wird nicht mehr gebraucht '
        . 'und kann per FTP geloescht werden.</p>';
    exit;
}

$password = $_POST['password'] ?? '';
$hash = $password !== '' ? password_hash($password, PASSWORD_DEFAULT) : '';
?>
<!doctype html>
<meta charset="utf-8">
<title>Panel-Passwort erzeugen</title>
<style>
  body { font: 15px/1.6 system-ui, sans-serif; max-width: 44rem; margin: 3rem auto; padding: 0 1rem; }
  input, button { font: inherit; padding: .5rem .7rem; }
  code { display: block; word-break: break-all; background: #f2f4f7; padding: 1rem; border-radius: .4rem; }
</style>
<h1>Panel-Passwort erzeugen</h1>
<p>Passwort eingeben, den erzeugten Hash nach <code style="display:inline;padding:.1rem .3rem">api/config.php</code> in <code style="display:inline;padding:.1rem .3rem">panel_password_hash</code> eintragen &ndash; und diese Datei danach löschen.</p>
<form method="post">
  <input type="text" name="password" placeholder="Wunschpasswort" size="32" autofocus>
  <button type="submit">Hash erzeugen</button>
</form>
<?php if ($hash !== ''): ?>
  <p>Hash:</p>
  <code><?= htmlspecialchars($hash, ENT_QUOTES, 'UTF-8') ?></code>
<?php endif; ?>
