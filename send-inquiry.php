<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function json_response(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function clean_value($value): string
{
    $value = is_string($value) ? $value : '';
    $value = trim($value);
    $value = strip_tags($value);
    $value = preg_replace("/[\r\n]+/", ' ', $value);
    return trim((string) $value);
}

function clean_message($value): string
{
    $value = is_string($value) ? $value : '';
    $value = strip_tags($value);
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    return trim($value);
}

function encode_header(string $value): string
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function load_smtp_config(): array
{
    $config = [
        'host' => getenv('SMTP_HOST') ?: '',
        'port' => (int) (getenv('SMTP_PORT') ?: 587),
        'encryption' => strtolower(getenv('SMTP_ENCRYPTION') ?: 'tls'),
        'username' => getenv('SMTP_USERNAME') ?: (getenv('SMTP_USER') ?: ''),
        'password' => getenv('SMTP_PASSWORD') ?: (getenv('SMTP_PASS') ?: ''),
        'from_email' => getenv('SMTP_FROM_EMAIL') ?: '',
        'from_name' => getenv('SMTP_FROM_NAME') ?: 'Footprints to Feel Better',
        'to_email' => getenv('SMTP_TO_EMAIL') ?: 'intake@meetfootprints.com',
        'helo_domain' => getenv('SMTP_HELO_DOMAIN') ?: ($_SERVER['SERVER_NAME'] ?? 'localhost'),
        'timeout' => (int) (getenv('SMTP_TIMEOUT') ?: 15),
    ];

    $configFile = __DIR__ . '/smtp-config.php';
    if (is_file($configFile)) {
        $fileConfig = include $configFile;
        if (is_array($fileConfig)) {
            $config = array_replace($config, $fileConfig);
        }
    }

    return $config;
}

function smtp_read_response($stream): array
{
    $response = '';

    while (($line = fgets($stream, 515)) !== false) {
        $response .= $line;
        if (preg_match('/^\d{3}\s/', $line)) {
            break;
        }
    }

    if ($response === '') {
        throw new RuntimeException('SMTP server returned no response.');
    }

    if (!preg_match('/^(\d{3})/', $response, $matches)) {
        throw new RuntimeException("Unexpected SMTP response: " . trim($response));
    }

    return [(int) $matches[1], $response];
}

function smtp_send_command($stream, string $command, array $expectedCodes): string
{
    fwrite($stream, $command . "\r\n");
    [$code, $response] = smtp_read_response($stream);

    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException(trim($response));
    }

    return $response;
}

function smtp_send_mail(array $config, string $fromEmail, string $fromName, string $toEmail, string $replyToEmail, string $subject, string $body): void
{
    $host = trim((string) ($config['host'] ?? ''));
    $port = (int) ($config['port'] ?? 587);
    $encryption = strtolower((string) ($config['encryption'] ?? 'tls'));
    $username = trim((string) ($config['username'] ?? ''));
    $password = (string) ($config['password'] ?? '');
    $heloDomain = trim((string) ($config['helo_domain'] ?? 'localhost')) ?: 'localhost';
    $timeout = max(5, (int) ($config['timeout'] ?? 15));

    if ($host === '' || $port <= 0 || $username === '' || $password === '') {
        throw new RuntimeException('SMTP settings are incomplete.');
    }

    $remote = ($encryption === 'ssl') ? "ssl://{$host}:{$port}" : "tcp://{$host}:{$port}";
    $stream = stream_socket_client($remote, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);

    if (!$stream) {
        throw new RuntimeException("Unable to connect to SMTP server: {$errstr}");
    }

    stream_set_timeout($stream, $timeout);

    try {
        [$bannerCode] = smtp_read_response($stream);
        if ($bannerCode !== 220) {
            throw new RuntimeException('SMTP server did not return a ready banner.');
        }

        smtp_send_command($stream, "EHLO {$heloDomain}", [250]);

        if ($encryption === 'tls') {
            smtp_send_command($stream, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($stream, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Unable to negotiate TLS with the SMTP server.');
            }
            smtp_send_command($stream, "EHLO {$heloDomain}", [250]);
        }

        smtp_send_command($stream, 'AUTH LOGIN', [334]);
        smtp_send_command($stream, base64_encode($username), [334]);
        smtp_send_command($stream, base64_encode($password), [235]);

        smtp_send_command($stream, 'MAIL FROM:<' . $fromEmail . '>', [250]);
        smtp_send_command($stream, 'RCPT TO:<' . $toEmail . '>', [250, 251]);
        smtp_send_command($stream, 'DATA', [354]);

        $headers = [
            'From: ' . encode_header($fromName) . " <{$fromEmail}>",
            'To: ' . $toEmail,
            'Reply-To: ' . $replyToEmail,
            'Subject: ' . encode_header($subject),
            'Date: ' . date(DATE_RFC2822),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
        ];

        $message = implode("\r\n", $headers) . "\r\n\r\n" . preg_replace('/^\./m', '..', $body) . "\r\n.";
        fwrite($stream, $message . "\r\n");

        [$dataCode, $dataResponse] = smtp_read_response($stream);
        if ($dataCode !== 250) {
            throw new RuntimeException(trim($dataResponse));
        }

        smtp_send_command($stream, 'QUIT', [221]);
    } finally {
        if (is_resource($stream)) {
            fclose($stream);
        }
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_response(405, [
        'ok' => false,
        'message' => 'Method not allowed.',
    ]);
}

$honeypot = clean_value($_POST['companyWebsite'] ?? '');
if ($honeypot !== '') {
    json_response(200, [
        'ok' => true,
        'message' => 'Thank you.',
    ]);
}

$firstName = clean_value($_POST['firstName'] ?? '');
$lastName = clean_value($_POST['lastName'] ?? '');
$email = clean_value($_POST['email'] ?? '');
$phone = clean_value($_POST['phone'] ?? '');
$service = clean_value($_POST['service'] ?? '');
$message = clean_message($_POST['message'] ?? '');

if ($firstName === '' || $lastName === '' || $email === '' || $phone === '' || $service === '') {
    json_response(422, [
        'ok' => false,
        'message' => 'Please complete all required fields.',
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, [
        'ok' => false,
        'message' => 'Please enter a valid email address.',
    ]);
}

$config = load_smtp_config();
$fromEmail = clean_value((string) ($config['from_email'] ?? ''));
if ($fromEmail === '') {
    $fromEmail = clean_value((string) ($config['username'] ?? ''));
}

$fromName = clean_value((string) ($config['from_name'] ?? 'Footprints to Feel Better')) ?: 'Footprints to Feel Better';
$toEmail = clean_value((string) ($config['to_email'] ?? 'intake@meetfootprints.com')) ?: 'intake@meetfootprints.com';

if ($fromEmail === '') {
    json_response(500, [
        'ok' => false,
        'message' => 'SMTP sender address is not configured.',
    ]);
}

$subject = "Service Inquiry: {$service} - {$firstName} {$lastName}";
$body = implode("\n", [
    'Hello Footprints Team,',
    '',
    'You have received a new service inquiry from the website.',
    '',
    'Inquiry Details:',
    '------------------------------------------',
    'First Name: ' . $firstName,
    'Last Name: ' . $lastName,
    'Email Address: ' . $email,
    'Phone Number: ' . $phone,
    'Interested Service: ' . $service,
    '',
    'Message / Additional Notes:',
    $message !== '' ? $message : 'No additional message provided.',
    '',
    '------------------------------------------',
    'Submitted via "Our Sessions" page.',
]);

try {
    smtp_send_mail($config, $fromEmail, $fromName, $toEmail, $email, $subject, $body);
    json_response(200, [
        'ok' => true,
        'message' => 'Inquiry sent successfully.',
        'service' => $service,
    ]);
} catch (Throwable $e) {
    json_response(500, [
        'ok' => false,
        'message' => 'We could not send your inquiry right now. Please try again or email intake directly.',
        'error' => $e->getMessage(),
    ]);
}
