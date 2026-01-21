<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('favorite_sandwiches', function (Blueprint $table) {
            $table->string('ingredient_configuration_id', 16)
                  ->after('user_id')
                  ->nullable();
            $table->index(['user_id', 'ingredient_configuration_id'], 'favorite_user_config_idx');
        });
    }

    public function down(): void
    {
        Schema::table('favorite_sandwiches', function (Blueprint $table) {
            $table->dropIndex('favorite_user_config_idx');
            $table->dropColumn('ingredient_configuration_id');
        });
    }
};
