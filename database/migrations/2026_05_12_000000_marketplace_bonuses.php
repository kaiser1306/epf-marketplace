<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('suspended_at')->nullable();
            $table->index('suspended_at');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('sale_price', 12, 2)->nullable();
            $table->timestamp('sale_starts_at')->nullable();
            $table->timestamp('sale_ends_at')->nullable();
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('type', 16);
            $table->decimal('value', 12, 2);
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('times_used')->default(0);
            $table->decimal('min_order_total', 12, 2)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->nullOnDelete();
            $table->decimal('discount_amount', 12, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['coupon_id']);
            $table->dropColumn(['coupon_id', 'discount_amount']);
        });

        Schema::dropIfExists('coupons');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['sale_price', 'sale_starts_at', 'sale_ends_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['suspended_at']);
            $table->dropColumn('suspended_at');
        });
    }
};
