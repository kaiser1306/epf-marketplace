<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('un utilisateur non autorisé ne peut pas supprimer un produit d\'un autre', function (): void {
    $seller = User::factory()->create(['role' => 'seller']);
    $buyer = User::factory()->create(['role' => 'buyer']);
    $product = Product::factory()->create(['user_id' => $seller->id]);

    Sanctum::actingAs($buyer);

    $this->deleteJson('/api/products/'.$product->id)->assertForbidden();
});

test('un utilisateur peut consulter les produits publics sans être authentifié', function (): void {
    $seller = User::factory()->create(['role' => 'seller']);
    $category = Category::factory()->create();
    Product::factory()->create([
        'user_id' => $seller->id,
        'category_id' => $category->id,
        'status' => 'published',
    ]);

    $this->getJson('/api/products')->assertOk();
});
