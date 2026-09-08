<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_login();
require_csrf();

/**
 * Aendert den Status einer oder mehrerer Nachrichten.
 *
 * POST-Body: {"folder":"inbox","uids":[1,2],"action":"read|unread|star|unstar|delete"}
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Methode nicht erlaubt.', 405);
}

$body = json_body();
$folderKey = (string) ($body['folder'] ?? 'inbox');
$action = (string) ($body['action'] ?? '');
$uids = array_values(array_filter(array_map('intval', (array) ($body['uids'] ?? [])), static fn (int $u): bool => $u > 0));

if ($uids === []) {
    json_error('Keine Nachricht ausgewählt.');
}
if (!in_array($action, ['read', 'unread', 'star', 'unstar', 'delete'], true)) {
    json_error('Unbekannte Aktion: ' . $action);
}

$imap = imap_connect_configured();

try {
    $folders = resolve_folders($imap);
    $sourceKey = $folderKey === 'starred' ? 'inbox' : $folderKey;
    $imap->select($folders[$sourceKey] ?? 'INBOX');

    foreach ($uids as $uid) {
        match ($action) {
            'read'   => $imap->storeFlags($uid, ['\\Seen'], true),
            'unread' => $imap->storeFlags($uid, ['\\Seen'], false),
            'star'   => $imap->storeFlags($uid, ['\\Flagged'], true),
            'unstar' => $imap->storeFlags($uid, ['\\Flagged'], false),
            'delete' => delete_message($imap, $folders, $sourceKey, $uid),
        };
    }

    if ($action === 'delete') {
        $imap->expunge();
    }

    json_response(['ok' => true, 'action' => $action, 'count' => count($uids)]);
} finally {
    $imap->logout();
}

/**
 * Verschiebt in den Papierkorb; liegt die Mail schon dort, wird sie
 * endgültig gelöscht.
 *
 * @param array<string, string> $folders
 */
function delete_message(Imap $imap, array $folders, string $sourceKey, int $uid): void
{
    if ($sourceKey !== 'trash' && isset($folders['trash'])) {
        $imap->copy($uid, $folders['trash']);
    }
    $imap->storeFlags($uid, ['\\Deleted'], true);
}
