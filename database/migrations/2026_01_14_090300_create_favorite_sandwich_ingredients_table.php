<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favorite_sandwich_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('favorite_sandwich_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->foreignId('ingredient_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->unique(
                ['favorite_sandwich_id', 'ingredient_id'],
                'fav_sand_ing_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorite_sandwich_ingredients');
    }
};
