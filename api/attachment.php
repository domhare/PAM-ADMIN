<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_login();

/**
 * Laedt einen Anhang herunter.
 *
 * GET-Parameter: folder, uid, index
 */

$folderKey = (string) ($_GET['folder'] ?? 'inbox');
$uid = (int) ($_GET['uid'] ?? 0);
$index = (int) ($_GET['index'] ?? -1);

if ($uid <= 0 || $index < 0) {
    json_error('Anhang nicht angegeben.');
}

$imap = imap_connect_configured();

try {
    $imap->select(folder_name($imap, $folderKey === 'starred' ? 'inbox' : $folderKey), true);
    $attachment = Mime::attachment($imap->fetchRaw($uid), $index);
} finally {
    $imap->logout();
}

if ($attachment === null) {
    json_error('Anhang nicht gefunden.', 404);
}

// Dateinamen entschaerfen: keine Pfade, keine Steuerzeichen.
$name = preg_replace('/[^\w.\- ]+/u', '_', basename($attachment['name'])) ?: 'anhang';

header_remove('Content-Type');
header('Content-Type: ' . $attachment['mime']);
header('Content-Length: ' . strlen($attachment['data']));
header('Content-Disposition: attachment; filename="' . $name . '"');
header('X-Content-Type-Options: nosniff');
echo $attachment['data'];
