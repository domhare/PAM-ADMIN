<?php
/**
 * Konfiguration fuer die Mail-Anbindung.
 *
 * Diese Datei nach api/config.php kopieren und ausfuellen.
 * api/config.php wird von .gitignore ausgeschlossen und darf NIEMALS
 * ins Repository committet werden - sie enthaelt das Postfach-Passwort.
 */

return [
    // Passwort-Hash fuer den Zugang zum Admin-Panel.
    // Erzeugen mit:  php -r "echo password_hash('DEIN-PANEL-PASSWORT', PASSWORD_DEFAULT), PHP_EOL;"
    // (oder einmalig api/hash.php im Browser aufrufen)
    'panel_password_hash' => '',

    // Postfach bei Strato
    'imap' => [
        'host'     => 'imap.strato.de',
        'port'     => 993,
        'encrypt'  => 'ssl',                        // 'ssl' (993) oder 'tls' (143)
        'user'     => 'info@kfzservice-buila.de',   // Benutzername = komplette Adresse
        'password' => '',
        // Ordnernamen bei Strato. Leer lassen = automatisch erkennen.
        'folders'  => [
            'inbox'   => 'INBOX',
            'sent'    => '',
            'drafts'  => '',
            'trash'   => '',
            'spam'    => '',
        ],
    ],

    // Versand bei Strato
    'smtp' => [
        'host'     => 'smtp.strato.de',
        'port'     => 465,
        'encrypt'  => 'ssl',                        // 'ssl' (465) oder 'tls' (587, STARTTLS)
        'user'     => 'info@kfzservice-buila.de',
        'password' => '',
    ],

    // Absender, wie er beim Empfaenger erscheint
    'from_address' => 'info@kfzservice-buila.de',
    'from_name'    => 'KFZ Service Buila',

    // Wie viele Mails pro Seite geladen werden
    'page_size' => 25,
];
