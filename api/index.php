<?php
// X10 THINK /api bridge. Keep the Laravel source OUTSIDE public_html.
$backend = dirname(__DIR__, 2).'/X10THINK_Laravel_Backend_V7';
if (!is_file($backend.'/vendor/autoload.php')) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['message' => 'X10 API is not installed. Run composer install in X10THINK_Laravel_Backend_V7.']);
    exit;
}
define('LARAVEL_START', microtime(true));
if (file_exists($maintenance = $backend.'/storage/framework/maintenance.php')) require $maintenance;
require $backend.'/vendor/autoload.php';
$app = require_once $backend.'/bootstrap/app.php';
$app->handleRequest(Illuminate\Http\Request::capture());
