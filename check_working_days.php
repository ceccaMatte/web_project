<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->boot();

use Illuminate\Support\Facades\DB;

echo "=== Working Days with max_orders > 99 ===\n";
$invalidRecords = DB::table('working_days')->where('max_orders', '>', 99)->get();
foreach ($invalidRecords as $record) {
    echo "ID: {$record->id}, Day: {$record->day}, Max Orders: {$record->max_orders}\n";
}

echo "\n=== All Working Days (last 10) ===\n";
$allRecords = DB::table('working_days')->orderBy('created_at', 'desc')->limit(10)->get();
foreach ($allRecords as $record) {
    echo "ID: {$record->id}, Day: {$record->day}, Max Orders: {$record->max_orders}, Max Time: {$record->max_time}\n";
}