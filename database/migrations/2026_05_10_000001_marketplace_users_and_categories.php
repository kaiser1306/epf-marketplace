<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 32)->default('buyer');
            $table->string('phone', 32)->nullable();
            $table->string('city', 120)->nullable();
            $table->string('profile_image')->nullable();
            $table->decimal('rating', 3, 2)->default(0);
            $table->unsignedInteger('total_reviews')->default(0);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->string('icon', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['description', 'icon']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'phone', 'city', 'profile_image', 'rating', 'total_reviews']);
        });
    }
};
