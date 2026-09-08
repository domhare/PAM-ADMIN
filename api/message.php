<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_login();

/**
 * Eine einzelne Nachricht mit Inhalt und Anhangsliste.
 *
 * GET-Parameter: folder, uid, markRead (0|1)
 */

$folderKey = (string) ($_GET['folder'] ?? 'inbox');
$uid = (int) ($_GET['uid'] ?? 0);
$markRead = ($_GET['markRead'] ?? '1') !== '0';

if ($uid <= 0) {
    json_error('Keine Nachricht angegeben.');
}

$imap = imap_connect_configured();

try {
    $folder = folder_name($imap, $folderKey === 'starred' ? 'inbox' : $folderKey);
    $imap->select($folder);

    $raw = $imap->fetchRaw($uid);
    $parsed = Mime::parse($raw);
    $headers = $parsed['headers'];

    if ($markRead) {
        $imap->storeFlags($uid, ['\\Seen'], true);
    }

    $date = parse_mail_date($headers['date'] ?? null);

    json_response([
        'ok'      => true,
        'message' => [
            'uid'         => $uid,
            'folder'      => $folderKey,
            'subject'     => Mime::decodeHeader($headers['subject'] ?? '(kein Betreff)'),
            'from'        => Mime::parseAddressList($headers['from'] ?? ''),
            'to'          => Mime::parseAddressList($headers['to'] ?? ''),
            'cc'          => Mime::parseAddressList($headers['cc'] ?? ''),
            'replyTo'     => Mime::parseAddressList($headers['reply-to'] ?? $headers['from'] ?? ''),
            'messageId'   => $headers['message-id'] ?? '',
            'date'        => $date,
            'text'        => $parsed['text'],
            'html'        => $parsed['html'],
            'attachments' => $parsed['attachments'],
        ],
    ]);
} finally {
    $imap->logout();
}
