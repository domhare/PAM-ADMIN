<?php
declare(strict_types=1);

/**
 * Minimaler MIME-Parser fuer die Rohnachrichten aus dem IMAP-Client.
 *
 * Zerlegt eine RFC-822-Nachricht in Kopfzeilen, Textteile und Anhaenge und
 * normalisiert alles nach UTF-8.
 */
final class Mime
{
    /**
     * Zerlegt eine Rohnachricht.
     *
     * @return array{
     *   headers: array<string, string>,
     *   text: string,
     *   html: string,
     *   attachments: list<array{name: string, mime: string, size: int, index: int}>
     * }
     */
    public static function parse(string $raw): array
    {
        [$headerBlock, $body] = self::split($raw);
        $headers = self::parseHeaders($headerBlock);

        $result = ['text' => '', 'html' => '', 'attachments' => []];
        self::walk($headers, $body, $result);

        return [
            'headers'     => $headers,
            'text'        => $result['text'],
            'html'        => $result['html'],
            'attachments' => $result['attachments'],
        ];
    }

    /** Liefert den Inhalt eines Anhangs anhand seines Index aus parse(). */
    public static function attachment(string $raw, int $index): ?array
    {
        [$headerBlock, $body] = self::split($raw);
        $result = ['text' => '', 'html' => '', 'attachments' => []];
        self::walk(self::parseHeaders($headerBlock), $body, $result, true);

        foreach ($result['attachments'] as $attachment) {
            if ($attachment['index'] === $index) {
                return $attachment;
            }
        }

        return null;
    }

    /** Nur die Kopfzeilen eines Header-Blocks (z. B. aus BODY[HEADER.FIELDS]). */
    public static function parseHeaders(string $block): array
    {
        $headers = [];
        // Gefaltete Kopfzeilen wieder zusammenfuehren.
        $block = preg_replace('/\r?\n[ \t]+/', ' ', $block) ?? $block;

        foreach (preg_split('/\r?\n/', $block) ?: [] as $line) {
            if (preg_match('/^([!-9;-~]+):\s?(.*)$/', $line, $m) !== 1) {
                continue;
            }
            $name = strtolower($m[1]);
            // Mehrfach vorkommende Header (z. B. Received) interessieren uns nur einmal.
            if (!isset($headers[$name])) {
                $headers[$name] = $m[2];
            }
        }

        return $headers;
    }

    /**
     * Dekodiert RFC-2047-Kopfzeilen ("=?UTF-8?B?...?=") nach UTF-8.
     *
     * Bewusst nicht ueber mb_decode_mimeheader(): das ersetzt in Kopfzeilen,
     * die einfach nur rohes UTF-8 enthalten, jedes Byte durch "?". Hier werden
     * daher nur die tatsaechlich kodierten Woerter ersetzt, der Rest bleibt
     * unveraendert.
     */
    public static function decodeHeader(string $value): string
    {
        if ($value === '') {
            return '';
        }

        // Zwischen zwei kodierten Woertern steht laut RFC 2047 kein Leerzeichen.
        $value = preg_replace('/\?=[ \t]+(?==\?)/', '?=', $value) ?? $value;

        $decoded = preg_replace_callback(
            '/=\?([A-Za-z0-9_\-]+)(?:\*[A-Za-z0-9\-]+)?\?([BbQq])\?([^?]*)\?=/',
            static function (array $match): string {
                $text = strtoupper($match[2]) === 'B'
                    ? (base64_decode($match[3], false) ?: '')
                    : quoted_printable_decode(str_replace('_', ' ', $match[3]));

                return self::toUtf8($text, $match[1]);
            },
            $value
        ) ?? $value;

        return mb_check_encoding($decoded, 'UTF-8')
            ? $decoded
            : mb_convert_encoding($decoded, 'UTF-8', 'ISO-8859-1');
    }

    /**
     * Zerlegt eine Adressliste in Name/Adresse-Paare.
     *
     * @return list<array{name: string, address: string}>
     */
    public static function parseAddressList(string $value): array
    {
        $value = self::decodeHeader($value);
        $addresses = [];
        // An Kommas trennen, die nicht in Anfuehrungszeichen stehen.
        $parts = preg_split('/,(?=(?:[^"]*"[^"]*")*[^"]*$)/', $value) ?: [];

        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }
            if (preg_match('/^(.*)<([^>]+)>$/', $part, $m) === 1) {
                $name = trim(trim($m[1]), '"\' ');
                $address = trim($m[2]);
            } else {
                $name = '';
                $address = trim($part, '<> ');
            }
            $addresses[] = [
                'name'    => $name !== '' ? $name : $address,
                'address' => $address,
            ];
        }

        return $addresses;
    }

    /** @return array{0: string, 1: string} */
    private static function split(string $raw): array
    {
        $position = strpos($raw, "\r\n\r\n");
        $offset = 4;
        if ($position === false) {
            $position = strpos($raw, "\n\n");
            $offset = 2;
        }
        if ($position === false) {
            return [$raw, ''];
        }

        return [substr($raw, 0, $position), substr($raw, $position + $offset)];
    }

    /**
     * Laeuft rekursiv durch die MIME-Struktur.
     *
     * @param array{text: string, html: string, attachments: list<array>} $result
     */
    private static function walk(array $headers, string $body, array &$result, bool $withData = false, int $depth = 0): void
    {
        if ($depth > 20) {
            return;
        }

        $contentType = strtolower($headers['content-type'] ?? 'text/plain');
        $mime = trim(strtok($contentType, ';') ?: 'text/plain');

        if (str_starts_with($mime, 'multipart/')) {
            $boundary = self::parameter($headers['content-type'] ?? '', 'boundary');
            if ($boundary === null) {
                return;
            }
            foreach (self::splitParts($body, $boundary) as $part) {
                [$partHeaderBlock, $partBody] = self::split($part);
                self::walk(self::parseHeaders($partHeaderBlock), $partBody, $result, $withData, $depth + 1);
            }

            return;
        }

        $encoding = strtolower(trim($headers['content-transfer-encoding'] ?? '7bit'));
        $disposition = strtolower($headers['content-disposition'] ?? '');
        $filename = self::parameter($headers['content-disposition'] ?? '', 'filename')
            ?? self::parameter($headers['content-type'] ?? '', 'name');

        $isAttachment = str_starts_with($disposition, 'attachment')
            || ($filename !== null && !str_starts_with($mime, 'text/'));

        if ($isAttachment) {
            $data = self::decodeBody($body, $encoding);
            $attachment = [
                'name'  => self::decodeHeader($filename ?? 'anhang'),
                'mime'  => $mime,
                'size'  => strlen($data),
                'index' => count($result['attachments']),
            ];
            if ($withData) {
                $attachment['data'] = $data;
            }
            $result['attachments'][] = $attachment;

            return;
        }

        $charset = self::parameter($headers['content-type'] ?? '', 'charset') ?? 'UTF-8';
        $content = self::toUtf8(self::decodeBody($body, $encoding), $charset);

        if ($mime === 'text/html') {
            $result['html'] .= $content;
        } elseif (str_starts_with($mime, 'text/')) {
            $result['text'] .= $content;
        }
    }

    /** @return list<string> */
    private static function splitParts(string $body, string $boundary): array
    {
        $marker = '--' . $boundary;
        $segments = explode($marker, $body);
        array_shift($segments); // Praeambel

        $parts = [];
        foreach ($segments as $segment) {
            if (str_starts_with(ltrim($segment), '--')) {
                break; // Abschlussmarke
            }
            $parts[] = ltrim($segment, "\r\n");
        }

        return $parts;
    }

    private static function decodeBody(string $body, string $encoding): string
    {
        return match ($encoding) {
            'base64'           => base64_decode(preg_replace('/\s+/', '', $body) ?? $body, false) ?: '',
            'quoted-printable' => quoted_printable_decode($body),
            default            => $body,
        };
    }

    private static function toUtf8(string $value, string $charset): string
    {
        $charset = strtoupper(trim($charset, "\"' "));
        if ($charset === '' || $charset === 'UTF-8' || $charset === 'UTF8') {
            return mb_check_encoding($value, 'UTF-8') ? $value : mb_convert_encoding($value, 'UTF-8', 'ISO-8859-1');
        }
        $converted = @iconv($charset, 'UTF-8//TRANSLIT', $value);

        return $converted !== false ? $converted : mb_convert_encoding($value, 'UTF-8', 'ISO-8859-1');
    }

    private static function parameter(string $headerValue, string $name): ?string
    {
        // RFC 2231: filename*=UTF-8''foo.pdf
        if (preg_match('/;\s*' . preg_quote($name, '/') . '\*\s*=\s*([^\';]*)\'[^\']*\'([^;]+)/i', $headerValue, $m) === 1) {
            $decoded = rawurldecode(trim($m[2]));

            return self::toUtf8($decoded, $m[1] !== '' ? $m[1] : 'UTF-8');
        }
        if (preg_match('/;\s*' . preg_quote($name, '/') . '\s*=\s*"([^"]*)"/i', $headerValue, $m) === 1) {
            return $m[1];
        }
        if (preg_match('/;\s*' . preg_quote($name, '/') . '\s*=\s*([^;\s]+)/i', $headerValue, $m) === 1) {
            return $m[1];
        }

        return null;
    }
}
