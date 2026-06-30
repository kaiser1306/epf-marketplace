<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->softDeletes();
        });

        Schema::table('order_items', function (Blueprint $table): void {
            $table->softDeletes();
        });

        Schema::table('reviews', function (Blueprint $table): void {
            $table->softDeletes();
        });

        Schema::table('messages', function (Blueprint $table): void {
            $table->softDeletes();
        });

        Schema::table('cart_items', function (Blueprint $table): void {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });

        Schema::table('order_items', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });

        Schema::table('reviews', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });

        Schema::table('messages', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });

        Schema::table('cart_items', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });
    }
};
