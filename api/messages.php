<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_login();

/**
 * Nachrichtenliste eines Ordners.
 *
 * GET-Parameter: folder (inbox|starred|sent|drafts|trash|spam), page, search
 */

$folderKey = (string) ($_GET['folder'] ?? 'inbox');
$page = max(1, (int) ($_GET['page'] ?? 1));
$search = trim((string) ($_GET['search'] ?? ''));
$pageSize = max(5, min(100, (int) (config()['page_size'] ?? 25)));

$imap = imap_connect_configured();

try {
    $isStarred = $folderKey === 'starred';
    $folder = folder_name($imap, $isStarred ? 'inbox' : $folderKey);
    $imap->select($folder, true);

    $criteria = $isStarred ? 'FLAGGED' : 'ALL';
    $terms = [];
    if ($search !== '') {
        // Der Begriff geht als Literal raus, nicht in Anfuehrungszeichen -
        // sonst scheitert die Suche an Umlauten. CHARSET gehoert dabei laut
        // RFC 3501 vor alle uebrigen Suchkriterien.
        $criteria = 'CHARSET UTF-8 ' . ($isStarred ? 'FLAGGED ' : '')
            . 'OR OR SUBJECT %s FROM %s TEXT %s';
        $terms = [$search, $search, $search];
    }

    $uids = $imap->search($criteria, $terms);
    $total = count($uids);

    // Neueste zuerst.
    $uids = array_reverse($uids);
    $slice = array_slice($uids, ($page - 1) * $pageSize, $pageSize);
    $fetched = $imap->fetchHeaders($slice);

    $messages = [];
    foreach ($slice as $uid) {
        if (!isset($fetched[$uid])) {
            continue;
        }
        $entry = $fetched[$uid];
        $headers = Mime::parseHeaders($entry['headers']);

        $peer = in_array($folderKey, ['sent', 'drafts'], true)
            ? Mime::parseAddressList($headers['to'] ?? '')
            : Mime::parseAddressList($headers['from'] ?? '');
        $contact = $peer[0] ?? ['name' => '(unbekannt)', 'address' => ''];

        $date = parse_mail_date($headers['date'] ?? null);

        $messages[] = [
            'uid'      => $uid,
            'name'     => $contact['name'],
            'address'  => $contact['address'],
            'subject'  => Mime::decodeHeader($headers['subject'] ?? '(kein Betreff)'),
            'date'     => $date,
            'size'     => $entry['size'],
            'seen'     => in_array('\\Seen', $entry['flags'], true),
            'flagged'  => in_array('\\Flagged', $entry['flags'], true),
            'answered' => in_array('\\Answered', $entry['flags'], true),
        ];
    }

    json_response([
        'ok'       => true,
        'folder'   => $folderKey,
        'page'     => $page,
        'pageSize' => $pageSize,
        'total'    => $total,
        'unseen'   => count($imap->search($isStarred ? 'FLAGGED UNSEEN' : 'UNSEEN')),
        'messages' => $messages,
    ]);
} finally {
    $imap->logout();
}
