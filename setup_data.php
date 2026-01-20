<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Genera time slots per ogni working day esistente
foreach (\App\Models\WorkingDay::all() as $wd) {
    $generator = new \App\Services\TimeSlotGeneratorService();
    $count = $generator->generate($wd);
    echo "Generated $count time slots for {$wd->day}\n";
}
echo "Time slots setup complete!\n";