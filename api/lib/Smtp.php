<?php
declare(strict_types=1);

/**
 * Schlanker SMTP-Client mit Authentifizierung, ohne externe Bibliothek.
 */
final class SmtpException extends RuntimeException {}

final class Smtp
{
    /** @var resource */
    private $sock;

    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly string $encrypt = 'ssl',
        private readonly float $timeout = 20.0
    ) {
        $transport = $this->encrypt === 'ssl' ? 'ssl://' : 'tcp://';
        $context = stream_context_create([
            'ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true],
        ]);

        $errno = 0;
        $errstr = '';
        $sock = @stream_socket_client(
            $transport . $this->host . ':' . $this->port,
            $errno,
            $errstr,
            $this->timeout,
            STREAM_CLIENT_CONNECT,
            $context
        );
        if ($sock === false) {
            throw new SmtpException(sprintf('Verbindung zu %s:%d fehlgeschlagen: %s', $this->host, $this->port, $errstr ?: 'unbekannt'));
        }
        $this->sock = $sock;
        stream_set_timeout($this->sock, (int) $this->timeout);

        $this->expect(220);
        $this->hello();

        if ($this->encrypt === 'tls') {
            $this->command('STARTTLS', 220);
            if (!@stream_socket_enable_crypto($this->sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new SmtpException('STARTTLS fehlgeschlagen.');
            }
            $this->hello();
        }
    }

    public function login(string $user, string $password): void
    {
        try {
            $this->command('AUTH LOGIN', 334);
            $this->command(base64_encode($user), 334);
            $this->command(base64_encode($password), 235);
        } catch (SmtpException $e) {
            throw new SmtpException('SMTP-Anmeldung fehlgeschlagen. Bitte Benutzername und Passwort prüfen.', 0, $e);
        }
    }

    /** @param list<string> $recipients */
    public function send(string $from, array $recipients, string $message): void
    {
        $this->command('MAIL FROM:<' . $from . '>', 250);
        foreach ($recipients as $recipient) {
            $this->command('RCPT TO:<' . $recipient . '>', 250);
        }
        $this->command('DATA', 354);

        // Punkte am Zeilenanfang maskieren (RFC 5321).
        $body = preg_replace('/^\./m', '..', preg_replace('/\r?\n/', "\r\n", $message) ?? $message);
        $this->write($body . "\r\n.\r\n");
        $this->expect(250);
    }

    public function quit(): void
    {
        if (!is_resource($this->sock)) {
            return;
        }
        try {
            $this->command('QUIT', 221);
        } catch (SmtpException) {
            // Beim Abmelden ist ein Fehler egal.
        }
        @fclose($this->sock);
    }

    private function hello(): void
    {
        $name = $_SERVER['SERVER_NAME'] ?? 'localhost';
        try {
            $this->command('EHLO ' . $name, 250);
        } catch (SmtpException) {
            $this->command('HELO ' . $name, 250);
        }
    }

    private function command(string $command, int $expected): void
    {
        $this->write($command . "\r\n");
        $this->expect($expected);
    }

    private function expect(int $code): string
    {
        $response = '';
        while (true) {
            $line = fgets($this->sock, 8192);
            if ($line === false) {
                throw new SmtpException('Verbindung zum SMTP-Server abgebrochen.');
            }
            $response .= $line;
            // Mehrzeilige Antworten: "250-..." geht weiter, "250 ..." ist das Ende.
            if (preg_match('/^\d{3} /', $line) === 1) {
                break;
            }
        }

        if ((int) substr($response, 0, 3) !== $code) {
            throw new SmtpException('Unerwartete SMTP-Antwort: ' . trim($response));
        }

        return $response;
    }

    private function write(string $data): void
    {
        if (@fwrite($this->sock, $data) === false) {
            throw new SmtpException('Schreiben zum SMTP-Server fehlgeschlagen.');
        }
    }

    /**
     * Baut eine versandfertige MIME-Nachricht (Text + HTML).
     *
     * @param list<array{name: string, address: string}> $to
     */
    public static function build(
        array $from,
        array $to,
        string $subject,
        string $text,
        string $html = '',
        array $extraHeaders = []
    ): string {
        $boundary = 'b' . bin2hex(random_bytes(12));
        $headers = array_merge([
            'Date'         => date('r'),
            'From'         => self::formatAddress($from['name'], $from['address']),
            'To'           => implode(', ', array_map(
                static fn (array $a): string => self::formatAddress($a['name'], $a['address']),
                $to
            )),
            'Subject'      => self::encodeHeader($subject),
            'Message-ID'   => '<' . bin2hex(random_bytes(16)) . '@' . (explode('@', $from['address'])[1] ?? 'localhost') . '>',
            'MIME-Version' => '1.0',
        ], $extraHeaders);

        $lines = [];
        foreach ($headers as $name => $value) {
            if ($value === '' || $value === null) {
                continue;
            }
            $lines[] = $name . ': ' . $value;
        }

        if ($html === '') {
            $lines[] = 'Content-Type: text/plain; charset=UTF-8';
            $lines[] = 'Content-Transfer-Encoding: base64';
            $lines[] = '';
            $lines[] = trim(chunk_split(base64_encode($text), 76, "\r\n"));

            return implode("\r\n", $lines);
        }

        $lines[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
        $lines[] = '';
        $lines[] = '--' . $boundary;
        $lines[] = 'Content-Type: text/plain; charset=UTF-8';
        $lines[] = 'Content-Transfer-Encoding: base64';
        $lines[] = '';
        $lines[] = trim(chunk_split(base64_encode($text), 76, "\r\n"));
        $lines[] = '--' . $boundary;
        $lines[] = 'Content-Type: text/html; charset=UTF-8';
        $lines[] = 'Content-Transfer-Encoding: base64';
        $lines[] = '';
        $lines[] = trim(chunk_split(base64_encode($html), 76, "\r\n"));
        $lines[] = '--' . $boundary . '--';

        return implode("\r\n", $lines);
    }

    private static function formatAddress(string $name, string $address): string
    {
        if ($name === '' || $name === $address) {
            return $address;
        }

        return self::encodeHeader($name) . ' <' . $address . '>';
    }

    private static function encodeHeader(string $value): string
    {
        if (mb_check_encoding($value, 'ASCII')) {
            return $value;
        }

        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }
}
