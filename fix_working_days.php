<?php

require 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$pdo = new PDO(
    'mysql:host=127.0.0.1;dbname=panini_app;charset=utf8mb4',
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== Before Update ===\n";
$stmt = $pdo->query("SELECT id, day, max_orders FROM working_days WHERE max_orders > 99");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['id']}, Day: {$row['day']}, Max Orders: {$row['max_orders']}\n";
}

echo "\n=== Updating Records ===\n";
$updateStmt = $pdo->prepare("UPDATE working_days SET max_orders = 99 WHERE max_orders > 99");
$affectedRows = $updateStmt->execute();
echo "Updated {$updateStmt->rowCount()} rows\n";

echo "\n=== After Update ===\n";
$stmt = $pdo->query("SELECT id, day, max_orders FROM working_days WHERE max_orders > 99");
$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['id']}, Day: {$row['day']}, Max Orders: {$row['max_orders']}\n";
    $count++;
}
if ($count === 0) {
    echo "No more records with max_orders > 99\n";
}