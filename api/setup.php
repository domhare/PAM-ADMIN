<?php
declare(strict_types=1);

/**
 * Gefuehrte Einrichtung: prueft die Umgebung, testet die Zugangsdaten gegen
 * Strato und schreibt api/config.php selbst. Ersetzt das Bearbeiten der
 * Konfiguration und api/hash.php von Hand.
 *
 * Laeuft nur, solange es noch keine api/config.php gibt, und kann sich am
 * Ende selbst loeschen.
 */

require_once __DIR__ . '/lib/Imap.php';
require_once __DIR__ . '/lib/Smtp.php';

mb_internal_encoding('UTF-8');
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');

const CONFIG_PATH = __DIR__ . '/config.php';

$configExists = is_file(CONFIG_PATH);
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

/** Umgebungspruefung. @return list<array{name: string, ok: bool, detail: string}> */
function environment_checks(): array
{
    $checks = [];
    $checks[] = [
        'name'   => 'PHP-Version',
        'ok'     => PHP_VERSION_ID >= 80100,
        'detail' => PHP_VERSION . (PHP_VERSION_ID >= 80100 ? '' : ' – mindestens 8.1 nötig, im Strato-Kundenlogin umstellen'),
    ];
    foreach (['openssl' => 'Verschlüsselte Verbindungen', 'mbstring' => 'Umlaute und Ordnernamen', 'iconv' => 'Zeichensätze'] as $extension => $purpose) {
        $checks[] = [
            'name'   => 'Erweiterung ' . $extension,
            'ok'     => extension_loaded($extension),
            'detail' => extension_loaded($extension) ? $purpose : 'fehlt – im Strato-Kundenlogin eine andere PHP-Version wählen',
        ];
    }
    $checks[] = [
        'name'   => 'Ordner api/ beschreibbar',
        'ok'     => is_writable(__DIR__),
        'detail' => is_writable(__DIR__)
            ? 'config.php kann automatisch angelegt werden'
            : 'nicht beschreibbar – die Konfiguration wird unten zum Kopieren angezeigt',
    ];

    return $checks;
}

/**
 * Probiert die üblichen Ports durch, damit ein blockierter Port nicht
 * gleich die ganze Einrichtung scheitern lässt.
 *
 * @return array{ok: bool, port: int, encrypt: string, error: string}
 */
function try_imap(string $host, string $user, string $password): array
{
    $attempts = [];
    foreach ([[993, 'ssl'], [143, 'tls']] as [$port, $encrypt]) {
        try {
            $imap = new Imap($host, $port, $encrypt, 12.0);
            try {
                $imap->login($user, $password);
                $imap->listFolders();
            } finally {
                $imap->logout();
            }

            return ['ok' => true, 'port' => $port, 'encrypt' => $encrypt, 'error' => ''];
        } catch (Throwable $e) {
            $attempts[$port] = $e->getMessage();
            // Falsches Passwort: ein anderer Port hilft nicht.
            if (stripos($e->getMessage(), 'Anmeldung') !== false) {
                return ['ok' => false, 'port' => $port, 'encrypt' => $encrypt, 'error' => $e->getMessage()];
            }
        }
    }

    return ['ok' => false, 'port' => 993, 'encrypt' => 'ssl', 'error' => format_attempts($attempts)];
}

/** @return array{ok: bool, port: int, encrypt: string, error: string} */
function try_smtp(string $host, string $user, string $password): array
{
    $attempts = [];
    foreach ([[465, 'ssl'], [587, 'tls']] as [$port, $encrypt]) {
        try {
            $smtp = new Smtp($host, $port, $encrypt, 12.0);
            try {
                $smtp->login($user, $password);
            } finally {
                $smtp->quit();
            }

            return ['ok' => true, 'port' => $port, 'encrypt' => $encrypt, 'error' => ''];
        } catch (Throwable $e) {
            $attempts[$port] = $e->getMessage();
            if (stripos($e->getMessage(), 'Anmeldung') !== false) {
                return ['ok' => false, 'port' => $port, 'encrypt' => $encrypt, 'error' => $e->getMessage()];
            }
        }
    }

    return ['ok' => false, 'port' => 465, 'encrypt' => 'ssl', 'error' => format_attempts($attempts)];
}

/**
 * Fasst die Fehlschlaege aller Portversuche zusammen, damit nicht nur der
 * letzte Versuch sichtbar ist.
 *
 * @param array<int, string> $attempts
 */
function format_attempts(array $attempts): string
{
    if ($attempts === []) {
        return 'unbekannter Fehler';
    }
    $parts = [];
    foreach ($attempts as $port => $message) {
        $parts[] = 'Port ' . $port . ': ' . $message;
    }

    return implode(' | ', $parts);
}

/** Baut den Inhalt von config.php. */
function build_config(array $values): string
{
    $export = static fn (string $value): string => var_export($value, true);

    return "<?php\n"
        . "// Von api/setup.php erzeugt am " . date('d.m.Y H:i') . ".\n"
        . "// Enthält Zugangsdaten – nicht ins Repository übernehmen.\n\n"
        . "return [\n"
        . "    'panel_password_hash' => " . $export($values['panel_hash']) . ",\n\n"
        . "    'imap' => [\n"
        . "        'host'     => " . $export($values['imap_host']) . ",\n"
        . "        'port'     => " . (int) $values['imap_port'] . ",\n"
        . "        'encrypt'  => " . $export($values['imap_encrypt']) . ",\n"
        . "        'user'     => " . $export($values['address']) . ",\n"
        . "        'password' => " . $export($values['mail_password']) . ",\n"
        . "        'folders'  => ['inbox' => 'INBOX', 'sent' => '', 'drafts' => '', 'trash' => '', 'spam' => ''],\n"
        . "    ],\n\n"
        . "    'smtp' => [\n"
        . "        'host'     => " . $export($values['smtp_host']) . ",\n"
        . "        'port'     => " . (int) $values['smtp_port'] . ",\n"
        . "        'encrypt'  => " . $export($values['smtp_encrypt']) . ",\n"
        . "        'user'     => " . $export($values['address']) . ",\n"
        . "        'password' => " . $export($values['mail_password']) . ",\n"
        . "    ],\n\n"
        . "    'from_address' => " . $export($values['address']) . ",\n"
        . "    'from_name'    => " . $export($values['from_name']) . ",\n"
        . "    'page_size'    => 25,\n"
        . "];\n";
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

// --------------------------------------------------------------- Ablaufsteuerung

$action = $_POST['action'] ?? '';
$errors = [];
$results = [];
$configSource = '';
$written = false;

// Selbstzerstoerung nach erfolgreicher Einrichtung.
if ($action === 'finish' && $configExists) {
    @unlink(__DIR__ . '/hash.php');
    $self = __FILE__;
    echo '<!doctype html><meta charset="utf-8"><title>Einrichtung abgeschlossen</title>'
        . '<p style="font:16px/1.6 system-ui,sans-serif;margin:3rem auto;max-width:36rem">'
        . 'Einrichtung abgeschlossen. Die Einrichtungsdateien wurden gelöscht.<br>'
        . '<a href="../email.html">Zum Postfach</a></p>';
    @unlink($self);
    exit;
}

if ($action === 'save' && !$configExists) {
    $address = trim((string) ($_POST['address'] ?? ''));
    $fromName = trim((string) ($_POST['from_name'] ?? ''));
    $mailPassword = (string) ($_POST['mail_password'] ?? '');
    $panelPassword = (string) ($_POST['panel_password'] ?? '');
    $panelRepeat = (string) ($_POST['panel_repeat'] ?? '');
    $imapHost = trim((string) ($_POST['imap_host'] ?? 'imap.strato.de'));
    $smtpHost = trim((string) ($_POST['smtp_host'] ?? 'smtp.strato.de'));

    if (filter_var($address, FILTER_VALIDATE_EMAIL) === false) {
        $errors[] = 'Bitte eine gültige E-Mail-Adresse angeben.';
    }
    if ($mailPassword === '') {
        $errors[] = 'Bitte das Passwort des Postfachs angeben.';
    }
    if (mb_strlen($panelPassword) < 8) {
        $errors[] = 'Das Panel-Passwort muss mindestens 8 Zeichen haben.';
    }
    if ($panelPassword !== $panelRepeat) {
        $errors[] = 'Die beiden Panel-Passwörter stimmen nicht überein.';
    }

    if ($errors === []) {
        $imap = try_imap($imapHost, $address, $mailPassword);
        $results[] = [
            'name'   => 'IMAP ' . $imapHost . ($imap['ok'] ? ':' . $imap['port'] : ''),
            'ok'     => $imap['ok'],
            'detail' => $imap['ok'] ? 'Anmeldung erfolgreich (' . strtoupper($imap['encrypt']) . ')' : $imap['error'],
        ];

        $smtp = try_smtp($smtpHost, $address, $mailPassword);
        $results[] = [
            'name'   => 'SMTP ' . $smtpHost . ($smtp['ok'] ? ':' . $smtp['port'] : ''),
            'ok'     => $smtp['ok'],
            'detail' => $smtp['ok'] ? 'Anmeldung erfolgreich (' . strtoupper($smtp['encrypt']) . ')' : $smtp['error'],
        ];

        if ($imap['ok'] && $smtp['ok']) {
            $configSource = build_config([
                'panel_hash'    => password_hash($panelPassword, PASSWORD_DEFAULT),
                'address'       => $address,
                'from_name'     => $fromName !== '' ? $fromName : $address,
                'mail_password' => $mailPassword,
                'imap_host'     => $imapHost,
                'imap_port'     => $imap['port'],
                'imap_encrypt'  => $imap['encrypt'],
                'smtp_host'     => $smtpHost,
                'smtp_port'     => $smtp['port'],
                'smtp_encrypt'  => $smtp['encrypt'],
            ]);

            if (is_writable(__DIR__) && @file_put_contents(CONFIG_PATH, $configSource) !== false) {
                @chmod(CONFIG_PATH, 0600);
                $written = true;
                $configExists = true;
                $configSource = '';
            }
        } else {
            $errors[] = 'Die Zugangsdaten wurden nicht gespeichert, weil die Anmeldung fehlgeschlagen ist.';
        }
    }
}
?>
<!doctype html>
<html lang="de">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Postfach einrichten</title>
<style>
	:root { color-scheme: light; }
	body { font: 15px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; margin: 0; background: #f6f8fb; color: #1f2937; }
	main { max-width: 44rem; margin: 2.5rem auto; padding: 0 1rem 4rem; }
	h1 { font-size: 1.5rem; margin: 0 0 .3rem; }
	h2 { font-size: 1.05rem; margin: 2rem 0 .6rem; }
	.card { background: #fff; border: 1px solid #e5e7eb; border-radius: .6rem; padding: 1.2rem 1.4rem; margin-bottom: 1rem; }
	.lead { color: #6b7280; margin: 0 0 1.5rem; }
	label { display: block; font-weight: 600; margin: .9rem 0 .25rem; }
	input { width: 100%; box-sizing: border-box; font: inherit; padding: .55rem .7rem; border: 1px solid #d1d5db; border-radius: .4rem; }
	.hint { color: #6b7280; font-size: .87rem; margin-top: .25rem; }
	button { font: inherit; font-weight: 600; padding: .65rem 1.2rem; border: 0; border-radius: .4rem; background: #005CA9; color: #fff; cursor: pointer; margin-top: 1.4rem; }
	button.secondary { background: #4b5563; }
	ul.checks { list-style: none; padding: 0; margin: 0; }
	ul.checks li { display: flex; gap: .6rem; padding: .35rem 0; border-bottom: 1px solid #f3f4f6; }
	ul.checks li:last-child { border-bottom: 0; }
	.mark { flex: 0 0 1.2rem; font-weight: 700; }
	.ok .mark { color: #15803d; } .bad .mark { color: #b91c1c; }
	.detail { color: #6b7280; font-size: .87rem; }
	.notice { border-left: 4px solid #005CA9; background: #eef4f9; padding: .8rem 1rem; border-radius: .3rem; margin: 1rem 0; }
	.notice.bad { border-color: #b91c1c; background: #fef2f2; }
	.notice.good { border-color: #15803d; background: #f0fdf4; }
	pre { background: #111827; color: #e5e7eb; padding: 1rem; border-radius: .4rem; overflow-x: auto; font-size: .82rem; }
	code { background: #eef2f7; padding: .1rem .35rem; border-radius: .25rem; }
</style>
<main>
	<h1>Postfach einrichten</h1>
	<p class="lead">Diese Seite prüft die Zugangsdaten direkt gegen Strato und legt <code>api/config.php</code> selbst an.</p>

	<?php if (!$isHttps): ?>
		<div class="notice bad"><strong>Achtung:</strong> Diese Seite läuft ohne HTTPS. Das Passwort würde unverschlüsselt übertragen.
			Bitte die Adresse mit <code>https://</code> aufrufen (Strato stellt ein kostenloses Zertifikat bereit).</div>
	<?php endif; ?>

	<h2>1. Umgebung</h2>
	<div class="card">
		<ul class="checks">
			<?php foreach (environment_checks() as $check): ?>
				<li class="<?= $check['ok'] ? 'ok' : 'bad' ?>">
					<span class="mark"><?= $check['ok'] ? '✓' : '✕' ?></span>
					<span><?= e($check['name']) ?><br><span class="detail"><?= e($check['detail']) ?></span></span>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>

	<?php if ($written): ?>
		<div class="notice good"><strong>Fertig.</strong> <code>api/config.php</code> wurde angelegt und die Anmeldung an Postfach und Versand getestet.</div>
	<?php endif; ?>

	<?php if ($results !== []): ?>
		<h2>Verbindungstest</h2>
		<div class="card">
			<ul class="checks">
				<?php foreach ($results as $result): ?>
					<li class="<?= $result['ok'] ? 'ok' : 'bad' ?>">
						<span class="mark"><?= $result['ok'] ? '✓' : '✕' ?></span>
						<span><?= e($result['name']) ?><br><span class="detail"><?= e($result['detail']) ?></span></span>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>
	<?php endif; ?>

	<?php foreach ($errors as $error): ?>
		<div class="notice bad"><?= e($error) ?></div>
	<?php endforeach; ?>

	<?php if ($configSource !== ''): ?>
		<h2>Konfiguration von Hand anlegen</h2>
		<div class="notice">Der Ordner <code>api/</code> ist nicht beschreibbar. Bitte den folgenden Inhalt als
			<code>api/config.php</code> speichern und per FTP hochladen.</div>
		<pre><?= e($configSource) ?></pre>
	<?php endif; ?>

	<?php if ($configExists): ?>
		<h2><?= $written ? '3' : '2' ?>. Abschließen</h2>
		<div class="card">
			<p style="margin-top:0">Es gibt bereits eine <code>api/config.php</code>. Zum Schutz des Postfachs sollten die
				Einrichtungsdateien jetzt gelöscht werden – sonst könnte jemand die Seite aufrufen und die Konfiguration ersetzen.</p>
			<form method="post">
				<input type="hidden" name="action" value="finish">
				<button type="submit">Einrichtung abschließen und diese Datei löschen</button>
			</form>
			<p class="hint">Zum Ändern der Zugangsdaten: <code>api/config.php</code> per FTP löschen und diese Seite erneut aufrufen.</p>
		</div>
	<?php else: ?>
		<h2>2. Zugangsdaten</h2>
		<div class="card">
			<form method="post" autocomplete="off">
				<input type="hidden" name="action" value="save">

				<label for="address">E-Mail-Adresse des Postfachs</label>
				<input type="email" id="address" name="address" required
					value="<?= e((string) ($_POST['address'] ?? 'info@kfzservice-buila.de')) ?>">

				<label for="mail_password">Passwort des Postfachs</label>
				<input type="password" id="mail_password" name="mail_password" required>
				<p class="hint">Das Passwort, mit dem du dich auch im Strato-Webmail anmeldest. Es wird nur auf diesem Server gespeichert.</p>

				<label for="from_name">Absendername</label>
				<input type="text" id="from_name" name="from_name"
					value="<?= e((string) ($_POST['from_name'] ?? 'KFZ Service Buila')) ?>">
				<p class="hint">So erscheint der Absender beim Empfänger.</p>

				<label for="panel_password">Passwort für dieses Panel</label>
				<input type="password" id="panel_password" name="panel_password" required minlength="8">
				<p class="hint">Frei wählbar, mindestens 8 Zeichen. Damit meldest du dich in <code>email.html</code> an –
					nimm nicht dasselbe wie fürs Postfach.</p>

				<label for="panel_repeat">Panel-Passwort wiederholen</label>
				<input type="password" id="panel_repeat" name="panel_repeat" required minlength="8">

				<label for="imap_host">IMAP-Server</label>
				<input type="text" id="imap_host" name="imap_host"
					value="<?= e((string) ($_POST['imap_host'] ?? 'imap.strato.de')) ?>">

				<label for="smtp_host">SMTP-Server</label>
				<input type="text" id="smtp_host" name="smtp_host"
					value="<?= e((string) ($_POST['smtp_host'] ?? 'smtp.strato.de')) ?>">
				<p class="hint">Die Ports werden automatisch ermittelt: erst SSL (993 bzw. 465), sonst STARTTLS (143 bzw. 587).</p>

				<button type="submit">Verbindung testen und speichern</button>
			</form>
		</div>
	<?php endif; ?>
</main>
</html>
