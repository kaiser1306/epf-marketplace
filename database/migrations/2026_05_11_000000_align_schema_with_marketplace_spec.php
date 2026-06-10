<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->deduplicateCategoryNames();

        Schema::table('categories', function (Blueprint $table) {
            $table->unique('name');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
            $table->index('role');
        });

        $this->setUsersRatingDefault();

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('category_id')->nullable()->change();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
        });

        DB::table('products')->whereNull('description')->update(['description' => '']);

        Schema::table('products', function (Blueprint $table) {
            $table->text('description')->nullable(false)->change();
            $table->string('status', 32)->default('draft')->change();
            $table->softDeletes();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'products_user_id_status_index');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->index(['product_id', 'seller_id'], 'reviews_product_id_seller_id_index');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('read_at')->nullable()->after('is_read');
            $table->index(['sender_id', 'recipient_id'], 'messages_sender_recipient_index');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->default(1)->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_number', 20)->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_number', 32)->change();
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->change();
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_sender_recipient_index');
            $table->dropColumn('read_at');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('reviews_product_id_seller_id_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_user_id_status_index');
            $table->dropSoftDeletes();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('category_id')->nullable(false)->change();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreign('category_id')->references('id')->on('categories')->restrictOnDelete();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->text('description')->nullable()->change();
            $table->string('status', 32)->default('published')->change();
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['name']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropSoftDeletes();
        });

        $this->revertUsersRatingDefault();
    }

    private function deduplicateCategoryNames(): void
    {
        $dupNames = DB::table('categories')
            ->select('name')
            ->groupBy('name')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('name');

        foreach ($dupNames as $name) {
            $ids = DB::table('categories')->where('name', $name)->orderBy('id')->pluck('id');
            foreach ($ids->slice(1) as $id) {
                DB::table('categories')->where('id', $id)->update(['name' => $name.' #'.$id]);
            }
        }
    }

    private function setUsersRatingDefault(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE users MODIFY rating DECIMAL(3,2) NOT NULL DEFAULT 5.00');
        } elseif ($driver === 'sqlite') {
            DB::statement('UPDATE users SET rating = 5 WHERE rating = 0');
        }
    }

    private function revertUsersRatingDefault(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE users MODIFY rating DECIMAL(3,2) NOT NULL DEFAULT 0');
        }
    }
};
