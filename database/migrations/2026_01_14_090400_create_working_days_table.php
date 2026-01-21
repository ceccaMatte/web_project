<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('working_days', function (Blueprint $table) {
            $table->id();
            $table->date('day')->unique();
            $table->string('location');
            $table->unsignedInteger('max_orders');
            $table->unsignedInteger('max_time');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('working_days');
    }
};
