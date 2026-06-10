<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('image')->nullable();
            $table->json('images')->nullable();
            $table->unsignedInteger('quantity')->default(0);
            $table->string('status', 32)->default('published');
            $table->unsignedInteger('views')->default(0);
            $table->decimal('rating', 3, 2)->default(0);
            $table->unsignedInteger('total_reviews')->default(0);
            $table->unsignedInteger('sales_count')->default(0);
        });

        if (Schema::hasColumn('products', 'stock')) {
            DB::statement('UPDATE products SET quantity = stock');
        }

        if (Schema::hasColumn('products', 'is_active')) {
            DB::statement("UPDATE products SET status = CASE WHEN is_active != 0 THEN 'published' ELSE 'draft' END");
        }

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'sqlite') {
            Schema::table('products', function (Blueprint $table) {
                $table->dropIndex('products_category_id_is_active_index');
            });
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['stock', 'is_active']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['category_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['category_id', 'status']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('stock')->default(0);
            $table->boolean('is_active')->default(true);
        });

        DB::statement('UPDATE products SET stock = quantity');
        DB::statement("UPDATE products SET is_active = CASE WHEN status = 'published' THEN 1 ELSE 0 END");

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'image',
                'images',
                'quantity',
                'status',
                'views',
                'rating',
                'total_reviews',
                'sales_count',
            ]);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['category_id', 'is_active']);
        });
    }
};
