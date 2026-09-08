<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_login();

/** Liefert die Standardordner mit Gesamt- und Ungelesen-Zahl. */

$imap = imap_connect_configured();

try {
    $resolved = resolve_folders($imap);
    $labels = [
        'inbox'  => 'Posteingang',
        'starred'=> 'Markiert',
        'sent'   => 'Gesendet',
        'drafts' => 'Entwürfe',
        'trash'  => 'Papierkorb',
        'spam'   => 'Spam',
    ];

    $folders = [];
    foreach ($labels as $key => $label) {
        if ($key === 'starred') {
            // Markierte Mails sind kein eigener Ordner, sondern ein Flag im Posteingang.
            $imap->select($resolved['inbox'], true);
            $folders[] = [
                'key'      => 'starred',
                'label'    => $label,
                'messages' => count($imap->search('FLAGGED')),
                'unseen'   => count($imap->search('FLAGGED UNSEEN')),
            ];
            continue;
        }
        if (!isset($resolved[$key])) {
            continue;
        }
        $status = $imap->status($resolved[$key]);
        $folders[] = [
            'key'      => $key,
            'label'    => $label,
            'messages' => $status['messages'],
            'unseen'   => $status['unseen'],
        ];
    }

    json_response(['ok' => true, 'folders' => $folders]);
} finally {
    $imap->logout();
}
