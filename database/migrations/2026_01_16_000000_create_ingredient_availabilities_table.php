<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('working_day_id')
                ->constrained('working_days')
                ->cascadeOnDelete();
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->unique(['ingredient_id', 'working_day_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_availabilities');
    }
};
