<?php
/**
 * Umgebungspruefung fuer den Webspace.
 *
 * Anders als diagnose.php laeuft diese Seite auf jeder PHP-Version, bindet
 * nichts ein und liest keine Zugangsdaten. Genau darum geht es: wenn die
 * Mail-Anbindung gar nicht erst anspringt, liefert jede andere Datei unter
 * api/ nur eine leere Seite mit HTTP 500. Diese hier sagt, woran es liegt.
 *
 * Bewusst in alter Syntax gehalten (kein ??, keine Typangaben, keine
 * Pfeilfunktionen), damit sie auch unter PHP 5 noch etwas anzeigt.
 */

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

define('PHP_MINIMUM', '8.1');

$checks = array();

/** Haengt eine Zeile an die Ergebnisliste an. */
function check_add($name, $ok, $detail, $hint)
{
    global $checks;
    $checks[] = array('name' => $name, 'ok' => $ok, 'detail' => $detail, 'hint' => $hint);
}

function e($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/* ------------------------------------------------------------------ PHP */

$phpOk = version_compare(PHP_VERSION, PHP_MINIMUM, '>=');
check_add(
    'PHP-Version',
    $phpOk,
    PHP_VERSION,
    $phpOk ? '' : 'Mindestens PHP ' . PHP_MINIMUM . ' noetig. Im Strato-Kundenlogin unter '
        . '"Paket verwalten -> PHP-Version" umstellen und diese Seite neu laden.'
);

$purposes = array(
    'openssl'  => 'verschluesselte Verbindungen zu IMAP und SMTP',
    'mbstring' => 'Umlaute in Betreff und Ordnernamen',
    'iconv'    => 'fremde Zeichensaetze in eingehenden Mails',
);
foreach ($purposes as $extension => $purpose) {
    $loaded = extension_loaded($extension);
    check_add(
        'Erweiterung ' . $extension,
        $loaded,
        $loaded ? 'geladen (fuer ' . $purpose . ')' : 'fehlt',
        $loaded ? '' : 'Wird gebraucht fuer ' . $purpose . '. Im Strato-Kundenlogin eine andere PHP-Version waehlen.'
    );
}

/* -------------------------------------------------------------- Dateien */

$configPath = dirname(__FILE__) . '/config.php';
$hasConfig = file_exists($configPath);
check_add(
    'api/config.php',
    $hasConfig,
    $hasConfig ? 'vorhanden' : 'fehlt',
    $hasConfig ? '' : 'Die Zugangsdaten sind noch nicht hinterlegt. Dafuer setup.php aufrufen.'
);

$writable = is_writable(dirname(__FILE__));
check_add(
    'Ordner api/ beschreibbar',
    $writable,
    $writable ? 'ja' : 'nein',
    $writable ? '' : 'setup.php kann config.php nicht selbst anlegen und zeigt den Inhalt stattdessen zum Kopieren an.'
);

// Nach dem Einrichten sind diese beiden Dateien nur noch Angriffsflaeche.
// Der Deploy-Workflow laedt sie bei jedem Push erneut hoch.
if ($hasConfig) {
    foreach (array('setup.php', 'hash.php') as $leftover) {
        $exists = file_exists(dirname(__FILE__) . '/' . $leftover);
        check_add(
            'api/' . $leftover,
            !$exists,
            $exists ? 'liegt noch auf dem Server' : 'geloescht',
            $exists ? 'Wird nicht mehr gebraucht und kann per FTP geloescht werden.' : ''
        );
    }
}

/* ------------------------------------------------------------ Netzwerk */

/**
 * Prueft, ob eine TCP-Verbindung zustande kommt. Manche Hoster lassen
 * ausgehende Verbindungen nicht zu - dann ist hier Schluss, egal wie
 * richtig die Zugangsdaten sind.
 */
function check_reachable($host, $port)
{
    $errno = 0;
    $errstr = '';
    $sock = @fsockopen($host, $port, $errno, $errstr, 3);
    if ($sock === false) {
        return array(false, $errstr !== '' ? $errstr : 'keine Verbindung');
    }
    fclose($sock);

    return array(true, 'erreichbar');
}

$targets = array(
    array('IMAP', 'imap.strato.de', 993, 'SSL'),
    array('IMAP', 'imap.strato.de', 143, 'STARTTLS'),
    array('SMTP', 'smtp.strato.de', 465, 'SSL'),
    array('SMTP', 'smtp.strato.de', 587, 'STARTTLS'),
);
$anyImap = false;
$anySmtp = false;
foreach ($targets as $target) {
    list($kind, $host, $port, $mode) = $target;
    list($ok, $detail) = check_reachable($host, $port);
    if ($ok && $kind === 'IMAP') {
        $anyImap = true;
    }
    if ($ok && $kind === 'SMTP') {
        $anySmtp = true;
    }
    check_add($kind . ' ' . $host . ':' . $port . ' (' . $mode . ')', $ok, $detail, '');
}
if (!$anyImap || !$anySmtp) {
    check_add(
        'Ausgehende Verbindungen',
        false,
        'kein Mailserver erreichbar',
        'Der Webspace laesst offenbar keine ausgehenden Verbindungen zu den Mailservern zu. '
            . 'Ohne die kann die Anbindung nicht funktionieren - beim Strato-Support nachfragen.'
    );
}

/* ------------------------------------------------------------------ TLS */

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
check_add(
    'Aufruf ueber HTTPS',
    $isHttps,
    $isHttps ? 'ja' : 'nein',
    $isHttps ? '' : 'Ohne HTTPS gehen Panel-Passwort und Mailinhalte unverschluesselt durchs Netz. '
        . 'Strato stellt ein kostenloses Zertifikat bereit.'
);

$failed = 0;
foreach ($checks as $check) {
    if (!$check['ok']) {
        $failed++;
    }
}
?>
<!doctype html>
<html lang="de">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Umgebung pruefen</title>
<style>
	body { font: 15px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; margin: 0; background: #f6f8fb; color: #1f2937; }
	main { max-width: 44rem; margin: 2.5rem auto; padding: 0 1rem 4rem; }
	h1 { font-size: 1.5rem; margin: 0 0 .3rem; }
	.lead { color: #6b7280; margin: 0 0 1.5rem; }
	.card { background: #fff; border: 1px solid #e5e7eb; border-radius: .6rem; padding: .4rem 1.4rem; }
	ul { list-style: none; padding: 0; margin: 0; }
	li { display: flex; gap: .6rem; padding: .55rem 0; border-bottom: 1px solid #f3f4f6; }
	li:last-child { border-bottom: 0; }
	.mark { flex: 0 0 1.2rem; font-weight: 700; }
	.ok .mark { color: #15803d; }
	.bad .mark { color: #b91c1c; }
	.detail { color: #6b7280; font-size: .87rem; }
	.hint { color: #b91c1c; font-size: .87rem; }
	.notice { border-left: 4px solid #005CA9; background: #eef4f9; padding: .8rem 1rem; border-radius: .3rem; margin: 0 0 1.5rem; }
	.notice.bad { border-color: #b91c1c; background: #fef2f2; }
	.notice.good { border-color: #15803d; background: #f0fdf4; }
	code { background: #eef2f7; padding: .1rem .35rem; border-radius: .25rem; }
	p.foot { color: #6b7280; font-size: .87rem; margin-top: 1.5rem; }
</style>
<main>
	<h1>Umgebung pruefen</h1>
	<p class="lead">Was der Webspace kann &ndash; ohne Anmeldung und ohne Zugangsdaten.<br>
		Der Netzwerktest braucht ein paar Sekunden.</p>

	<?php if ($failed === 0): ?>
		<div class="notice good"><strong>Alles in Ordnung.</strong> Weiter mit
			<?php if ($hasConfig): ?><a href="../email.html">email.html</a><?php else: ?><a href="setup.php">setup.php</a><?php endif; ?>.</div>
	<?php else: ?>
		<div class="notice bad"><strong><?= $failed ?> Punkt<?= $failed === 1 ? '' : 'e' ?></strong>
			<?= $failed === 1 ? 'braucht' : 'brauchen' ?> noch Aufmerksamkeit.</div>
	<?php endif; ?>

	<div class="card">
		<ul>
			<?php foreach ($checks as $check): ?>
				<li class="<?= $check['ok'] ? 'ok' : 'bad' ?>">
					<span class="mark"><?= $check['ok'] ? '&#10003;' : '&#10007;' ?></span>
					<span>
						<?= e($check['name']) ?><br>
						<span class="detail"><?= e($check['detail']) ?></span>
						<?php if ($check['hint'] !== ''): ?><br><span class="hint"><?= e($check['hint']) ?></span><?php endif; ?>
					</span>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>

	<p class="foot">Diese Seite zeigt keine Zugangsdaten und kann liegen bleiben.
		Ausfuehrlicher, aber erst nach Anmeldung: <code>api/diagnose.php</code>.</p>
</main>
</html>
