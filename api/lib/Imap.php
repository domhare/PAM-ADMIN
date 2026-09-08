<?php
declare(strict_types=1);

/**
 * Schlanker IMAP4rev1-Client ueber Sockets.
 *
 * Bewusst ohne die PHP-Erweiterung ext-imap: die ist auf vielen Hostern nicht
 * aktiviert und wurde in PHP 8.4 aus dem Kern entfernt. Benoetigt nur openssl
 * und mbstring, beides ist bei Strato Standard.
 */
final class ImapException extends RuntimeException {}

final class Imap
{
    /** @var resource */
    private $sock;
    private int $tag = 0;
    private ?string $selected = null;

    public function __construct(string $host, int $port, string $encrypt = 'ssl', float $timeout = 20.0)
    {
        $transport = $encrypt === 'ssl' ? 'ssl://' : 'tcp://';
        $context = stream_context_create([
            'ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true],
        ]);

        $errno = 0;
        $errstr = '';
        $warnings = [];
        set_error_handler(static function (int $number, string $message) use (&$warnings): bool {
            $warnings[] = $message;

            return true;
        });
        $sock = stream_socket_client(
            $transport . $host . ':' . $port,
            $errno,
            $errstr,
            $timeout,
            STREAM_CLIENT_CONNECT,
            $context
        );
        restore_error_handler();

        if ($sock === false) {
            throw new ImapException(sprintf(
                'Verbindung zu %s:%d fehlgeschlagen: %s',
                $host,
                $port,
                self::connectionError($errstr, $warnings)
            ));
        }
        $this->sock = $sock;
        stream_set_timeout($this->sock, (int) $timeout);

        $greeting = $this->readLine();
        if (!str_starts_with($greeting['text'], '* OK')) {
            throw new ImapException('Unerwartete Server-Begrüßung: ' . $greeting['text']);
        }

        if ($encrypt === 'tls') {
            $this->command('STARTTLS');
            if (!@stream_socket_enable_crypto($this->sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new ImapException('STARTTLS fehlgeschlagen.');
            }
        }
    }

    public function login(string $user, string $password): void
    {
        try {
            $this->command('LOGIN ' . self::quote($user) . ' ' . self::quote($password));
        } catch (ImapException $e) {
            throw new ImapException('Anmeldung am Postfach fehlgeschlagen. Bitte Benutzername und Passwort prüfen.', 0, $e);
        }
    }

    /**
     * Alle Ordner des Postfachs.
     *
     * @return list<array{name: string, flags: string}>
     */
    public function listFolders(): array
    {
        $response = $this->command('LIST "" "*"');
        $folders = [];
        foreach ($response as $line) {
            if (preg_match('/^\* LIST \(([^)]*)\) (?:"[^"]*"|NIL) (.+)$/', $line['text'], $m) !== 1) {
                continue;
            }
            $name = trim($m[2]);
            if (str_starts_with($name, '"')) {
                $name = stripslashes(substr($name, 1, -1));
            }
            $folders[] = ['name' => self::fromUtf7($name), 'flags' => $m[1]];
        }

        return $folders;
    }

    /** @return array{messages: int, unseen: int} */
    public function status(string $folder): array
    {
        $response = $this->command('STATUS ' . self::quote(self::toUtf7($folder)) . ' (MESSAGES UNSEEN)');
        $messages = 0;
        $unseen = 0;
        foreach ($response as $line) {
            if (preg_match('/MESSAGES (\d+)/', $line['text'], $m) === 1) {
                $messages = (int) $m[1];
            }
            if (preg_match('/UNSEEN (\d+)/', $line['text'], $m) === 1) {
                $unseen = (int) $m[1];
            }
        }

        return ['messages' => $messages, 'unseen' => $unseen];
    }

    public function select(string $folder, bool $readOnly = false): void
    {
        if ($this->selected === $folder) {
            return;
        }
        $verb = $readOnly ? 'EXAMINE' : 'SELECT';
        $this->command($verb . ' ' . self::quote(self::toUtf7($folder)));
        $this->selected = $folder;
    }

    /**
     * UIDs im aktuell gewaehlten Ordner, aelteste zuerst.
     *
     * @return list<int>
     */
    public function search(string $criteria = 'ALL'): array
    {
        $response = $this->command('UID SEARCH ' . $criteria);
        $uids = [];
        foreach ($response as $line) {
            if (preg_match('/^\* SEARCH(.*)$/', $line['text'], $m) === 1) {
                foreach (preg_split('/\s+/', trim($m[1]), -1, PREG_SPLIT_NO_EMPTY) ?: [] as $uid) {
                    $uids[] = (int) $uid;
                }
            }
        }

        return $uids;
    }

    /**
     * Kopfzeilen und Flags mehrerer Nachrichten in einem Rutsch.
     *
     * @param  list<int> $uids
     * @return array<int, array{flags: list<string>, headers: string, size: int}>
     */
    public function fetchHeaders(array $uids, string $fields = 'FROM TO SUBJECT DATE MESSAGE-ID'): array
    {
        if ($uids === []) {
            return [];
        }

        $response = $this->command(sprintf(
            'UID FETCH %s (UID FLAGS RFC822.SIZE BODY.PEEK[HEADER.FIELDS (%s)])',
            implode(',', $uids),
            $fields
        ));

        $messages = [];
        foreach ($response as $line) {
            if (!str_contains($line['text'], 'FETCH (') || preg_match('/UID (\d+)/', $line['text'], $m) !== 1) {
                continue;
            }
            $flags = [];
            if (preg_match('/FLAGS \(([^)]*)\)/', $line['text'], $f) === 1) {
                $flags = preg_split('/\s+/', trim($f[1]), -1, PREG_SPLIT_NO_EMPTY) ?: [];
            }
            $size = preg_match('/RFC822\.SIZE (\d+)/', $line['text'], $s) === 1 ? (int) $s[1] : 0;

            $messages[(int) $m[1]] = [
                'flags'   => $flags,
                'headers' => $line['literals'][0] ?? '',
                'size'    => $size,
            ];
        }

        return $messages;
    }

    /** Komplette Rohnachricht (Header + Body), ohne \Seen zu setzen. */
    public function fetchRaw(int $uid): string
    {
        $response = $this->command('UID FETCH ' . $uid . ' (BODY.PEEK[])');
        foreach ($response as $line) {
            if (isset($line['literals'][0]) && str_contains($line['text'], 'FETCH (')) {
                return $line['literals'][0];
            }
        }

        throw new ImapException('Nachricht ' . $uid . ' konnte nicht geladen werden.');
    }

    /** @param list<string> $flags */
    public function storeFlags(int $uid, array $flags, bool $add): void
    {
        $this->command(sprintf(
            'UID STORE %d %sFLAGS.SILENT (%s)',
            $uid,
            $add ? '+' : '-',
            implode(' ', $flags)
        ));
    }

    public function copy(int $uid, string $folder): void
    {
        $this->command('UID COPY ' . $uid . ' ' . self::quote(self::toUtf7($folder)));
    }

    public function expunge(): void
    {
        $this->command('EXPUNGE');
    }

    public function append(string $folder, string $raw, string $flags = '\\Seen'): void
    {
        $raw = preg_replace('/\r?\n/', "\r\n", $raw) ?? $raw;
        $this->sendLiteralCommand(
            sprintf('APPEND %s (%s)', self::quote(self::toUtf7($folder)), $flags),
            $raw
        );
    }

    public function logout(): void
    {
        if (!is_resource($this->sock)) {
            return;
        }
        try {
            $this->command('LOGOUT');
        } catch (ImapException) {
            // Beim Abmelden ist ein Fehler egal.
        }
        @fclose($this->sock);
    }

    /**
     * Sendet ein Kommando und liest bis zur getaggten Antwort.
     *
     * @return list<array{text: string, literals: list<string>}>
     */
    private function command(string $command): array
    {
        $tag = 'a' . ++$this->tag;
        $this->write($tag . ' ' . $command . "\r\n");

        return $this->readUntilTagged($tag, $command);
    }

    /** Kommando mit angehaengtem Literal (fuer APPEND). */
    private function sendLiteralCommand(string $command, string $payload): void
    {
        $tag = 'a' . ++$this->tag;
        $this->write($tag . ' ' . $command . ' {' . strlen($payload) . "}\r\n");

        $line = $this->readLine();
        if (!str_starts_with($line['text'], '+')) {
            throw new ImapException('Server hat das Literal abgelehnt: ' . $line['text']);
        }
        $this->write($payload . "\r\n");
        $this->readUntilTagged($tag, $command);
    }

    /** @return list<array{text: string, literals: list<string>}> */
    private function readUntilTagged(string $tag, string $command): array
    {
        $lines = [];
        while (true) {
            $line = $this->readLine();
            if (str_starts_with($line['text'], $tag . ' ')) {
                $status = substr($line['text'], strlen($tag) + 1);
                if (!str_starts_with($status, 'OK')) {
                    throw new ImapException(sprintf(
                        'IMAP-Kommando %s fehlgeschlagen: %s',
                        strtok($command, ' ') ?: $command,
                        $status
                    ));
                }

                return $lines;
            }
            $lines[] = $line;
        }
    }

    /**
     * Liest eine logische Antwortzeile. Literale ({n}) werden byte-genau
     * gelesen und separat zurueckgegeben, damit Binaerdaten das Parsen der
     * Zeile nicht durcheinanderbringen.
     *
     * @return array{text: string, literals: list<string>}
     */
    private function readLine(): array
    {
        $text = '';
        $literals = [];

        while (true) {
            $chunk = fgets($this->sock, 8192);
            if ($chunk === false) {
                $meta = stream_get_meta_data($this->sock);
                throw new ImapException($meta['timed_out'] ? 'Zeitüberschreitung beim Lesen vom IMAP-Server.' : 'Verbindung zum IMAP-Server abgebrochen.');
            }
            // Eine Zeile kann laenger als der Puffer sein.
            while (!str_ends_with($chunk, "\n")) {
                $more = fgets($this->sock, 8192);
                if ($more === false) {
                    break;
                }
                $chunk .= $more;
            }
            $chunk = rtrim($chunk, "\r\n");
            $text .= $chunk;

            if (preg_match('/\{(\d+)\}$/', $chunk, $m) !== 1) {
                return ['text' => $text, 'literals' => $literals];
            }

            $literals[] = $this->readBytes((int) $m[1]);
            $text = substr($text, 0, -strlen($m[0]));
        }
    }

    private function readBytes(int $length): string
    {
        $data = '';
        while (strlen($data) < $length) {
            $part = fread($this->sock, min(65536, $length - strlen($data)));
            if ($part === false || $part === '') {
                throw new ImapException('Unvollständige Antwort vom IMAP-Server.');
            }
            $data .= $part;
        }

        return $data;
    }

    private function write(string $data): void
    {
        if (@fwrite($this->sock, $data) === false) {
            throw new ImapException('Schreiben zum IMAP-Server fehlgeschlagen.');
        }
    }

    private static function quote(string $value): string
    {
        return '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], $value) . '"';
    }

    /** Ordnernamen: UTF-8 -> modifiziertes UTF-7 (RFC 3501). */
    private static function toUtf7(string $name): string
    {
        if (mb_check_encoding($name, 'ASCII')) {
            return $name;
        }

        return mb_convert_encoding($name, 'UTF7-IMAP', 'UTF-8');
    }

    private static function fromUtf7(string $name): string
    {
        if (!str_contains($name, '&')) {
            return $name;
        }

        return mb_convert_encoding($name, 'UTF-8', 'UTF7-IMAP');
    }

    /**
     * Der Grund eines fehlgeschlagenen Verbindungsaufbaus. Bei TLS-Problemen
     * steht die eigentliche Ursache (abgelaufenes Zertifikat, falscher
     * Hostname) nur in der unterdrueckten PHP-Warnung.
     */
    private static function connectionError(string $errstr, array $warnings): string
    {
        $details = [];
        foreach ($warnings as $warning) {
            $warning = preg_replace('/^stream_socket_client\(\):\s*/', '', trim($warning)) ?? $warning;
            // Die generische Abschlusswarnung sagt nichts ueber die Ursache.
            if ($warning === '' || str_starts_with($warning, 'Unable to connect to')) {
                continue;
            }
            $details[] = $warning;
        }

        if ($details === []) {
            return $errstr !== '' ? $errstr : 'unbekannter Fehler';
        }

        $detail = implode('; ', array_unique($details));

        return $errstr !== '' ? $errstr . ' (' . $detail . ')' : $detail;
    }

}
