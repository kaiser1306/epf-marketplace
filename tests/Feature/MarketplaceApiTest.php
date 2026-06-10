<?php

use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');
});

test('inscription avec rôle et profil auth', function (): void {
    $reg = $this->postJson('/api/auth/register', [
        'name' => 'Vendeur',
        'email' => 'v@example.com',
        'password' => 'secret1',
        'role' => 'seller',
        'city' => 'Paris',
    ])->assertCreated()
        ->assertJsonPath('user.role', 'seller')
        ->assertJsonStructure(['user', 'token', 'message']);

    $token = $reg->json('token');
    $user = User::query()->where('email', 'v@example.com')->firstOrFail();

    $this->withToken($token)->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.email', 'v@example.com');

    $this->withToken($token)->postJson('/api/auth/logout')->assertOk();

    expect($user->tokens()->count())->toBe(0);

    $this->postJson('/api/auth/login', [
        'email' => 'v@example.com',
        'password' => 'secret1',
    ])->assertOk()->assertJsonStructure(['user', 'token', 'message']);
});

test('catégories liste et détail par slug', function (): void {
    $cat = Category::factory()->create(['name' => 'Test', 'slug' => 'test-cat']);

    $this->getJson('/api/categories')->assertOk();
    $this->getJson('/api/categories/'.$cat->slug)->assertOk()->assertJsonPath('slug', 'test-cat');
});

test('produits publics tri et pagination', function (): void {
    $seller = User::factory()->create(['role' => 'seller']);
    $cat = Category::factory()->create();
    Product::factory()->count(3)->create([
        'user_id' => $seller->id,
        'category_id' => $cat->id,
        'status' => 'published',
        'price' => 50,
        'sales_count' => 5,
    ]);

    $this->getJson('/api/products?sort=cheapest&per_page=2')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('vendeur crée un produit avec image', function (): void {
    $seller = User::factory()->create(['role' => 'seller']);
    $cat = Category::factory()->create();
    Sanctum::actingAs($seller);

    $image = UploadedFile::fake()->image('p.jpg', 600, 600);

    $this->post('/api/products', [
        'title' => 'Article',
        'description' => 'Desc',
        'price' => 19.99,
        'quantity' => 3,
        'category_id' => $cat->id,
        'image' => $image,
        'status' => 'published',
    ])->assertCreated();

    $this->assertDatabaseHas('products', ['title' => 'Article', 'status' => 'published']);
});

test('acheteur ne peut pas créer de produit', function (): void {
    $buyer = User::factory()->create(['role' => 'buyer']);
    $cat = Category::factory()->create();
    Sanctum::actingAs($buyer);

    $this->post('/api/products', [
        'title' => 'X',
        'description' => 'Y',
        'price' => 1,
        'category_id' => $cat->id,
        'image' => UploadedFile::fake()->image('x.jpg'),
    ])->assertForbidden();
});

test('panier et commande', function (): void {
    $seller = User::factory()->create(['role' => 'seller']);
    $buyer = User::factory()->create(['role' => 'buyer']);
    $cat = Category::factory()->create();
    $product = Product::factory()->create([
        'user_id' => $seller->id,
        'category_id' => $cat->id,
        'quantity' => 10,
        'price' => 20,
        'status' => 'published',
    ]);

    Sanctum::actingAs($buyer);

    $this->postJson('/api/cart/add', [
        'product_id' => $product->id,
        'quantity' => 2,
    ])->assertCreated();

    $this->postJson('/api/orders', [
        'shipping_address' => '1 rue Test',
        'shipping_city' => 'Paris',
        'shipping_postal_code' => '75001',
        'shipping_phone' => '0600000000',
    ])->assertCreated();

    expect(CartItem::query()->count())->toBe(0);
    expect(Order::query()->count())->toBe(1);
    $product->refresh();
    expect($product->quantity)->toBe(8);
});

test('avis après achat livré', function (): void {
    $seller = User::factory()->create(['role' => 'seller']);
    $buyer = User::factory()->create(['role' => 'buyer']);
    $cat = Category::factory()->create();
    $product = Product::factory()->create([
        'user_id' => $seller->id,
        'category_id' => $cat->id,
        'status' => 'published',
    ]);

    $order = Order::query()->create([
        'user_id' => $buyer->id,
        'order_number' => 'ORDER-TEST123',
        'total_amount' => 10,
        'discount_amount' => 0,
        'shipping_cost' => 0,
        'status' => 'delivered',
        'shipping_address' => 'Addr',
        'shipping_city' => 'City',
        'shipping_postal_code' => '00000',
        'shipping_phone' => '0600000000',
    ]);

    OrderItem::query()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'seller_id' => $seller->id,
        'quantity' => 1,
        'unit_price' => 10,
        'subtotal' => 10,
        'status' => 'delivered',
    ]);

    Sanctum::actingAs($buyer);

    $this->postJson("/api/products/{$product->id}/reviews", [
        'rating' => 5,
        'comment' => 'Super',
    ])->assertCreated();

    $product->refresh();
    expect($product->rating)->toBeGreaterThan(0);
});

test('favoris et recherche', function (): void {
    $seller = User::factory()->create(['role' => 'seller']);
    $buyer = User::factory()->create(['role' => 'buyer']);
    $product = Product::factory()->create([
        'user_id' => $seller->id,
        'title' => 'Montre unique XYZ',
        'status' => 'published',
    ]);

    Sanctum::actingAs($buyer);
    $this->postJson('/api/favorites/add', ['product_id' => $product->id])->assertOk();
    $this->getJson('/api/products/'.$product->id.'/is-favorite')->assertOk()->assertJsonPath('is_favorite', true);

    $this->getJson('/api/search?q=Montre&type=products')->assertOk()->assertJsonStructure(['products']);
});

test('messages entre utilisateurs', function (): void {
    $a = User::factory()->create();
    $b = User::factory()->create();
    Sanctum::actingAs($a);

    $this->postJson('/api/messages', [
        'recipient_id' => $b->id,
        'content' => 'Bonjour',
    ])->assertCreated()->assertJsonStructure(['message', 'notification_sent']);

    $this->getJson('/api/messages/unread-count')->assertOk()->assertJsonPath('unread_count', 0);

    Sanctum::actingAs($b);
    $this->getJson('/api/messages/unread-count')->assertOk()->assertJsonPath('unread_count', 1);
});

test('profil vendeur et commandes vendeur', function (): void {
    $seller = User::factory()->create(['role' => 'seller']);
    $buyer = User::factory()->create(['role' => 'buyer']);
    $product = Product::factory()->create(['user_id' => $seller->id, 'status' => 'published']);

    $order = Order::query()->create([
        'user_id' => $buyer->id,
        'order_number' => 'ORDER-V1',
        'total_amount' => 30,
        'discount_amount' => 0,
        'shipping_cost' => 0,
        'status' => 'pending',
        'shipping_address' => 'A',
        'shipping_city' => 'B',
        'shipping_postal_code' => 'C',
        'shipping_phone' => 'D',
    ]);

    OrderItem::query()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'seller_id' => $seller->id,
        'quantity' => 1,
        'unit_price' => 30,
        'subtotal' => 30,
        'status' => 'pending',
    ]);

    $this->getJson('/api/sellers/'.$seller->id)->assertOk()->assertJsonStructure(['products_count', 'recent_products']);

    Sanctum::actingAs($seller);
    $this->getJson('/api/seller/orders')->assertOk();
    $this->getJson('/api/seller/dashboard')->assertOk()->assertJsonStructure(['total_sales', 'top_products']);
});

test('top selling et prix promo', function (): void {
    $seller = User::factory()->create(['role' => 'seller']);
    $cat = Category::factory()->create();
    Product::factory()->create([
        'user_id' => $seller->id,
        'category_id' => $cat->id,
        'sales_count' => 50,
        'status' => 'published',
    ]);
    Product::factory()->create([
        'user_id' => $seller->id,
        'category_id' => $cat->id,
        'sales_count' => 2,
        'status' => 'published',
    ]);

    $this->getJson('/api/products/top-selling?limit=1')
        ->assertOk()
        ->assertJsonPath('data.0.sales_count', 50);
});

test('commande avec coupon et stats admin', function (): void {
    $seller = User::factory()->create(['role' => 'seller']);
    $buyer = User::factory()->create(['role' => 'buyer']);
    $admin = User::factory()->create(['role' => 'admin']);
    $cat = Category::factory()->create();
    $product = Product::factory()->create([
        'user_id' => $seller->id,
        'category_id' => $cat->id,
        'quantity' => 10,
        'price' => 20,
        'status' => 'published',
    ]);

    Coupon::query()->create([
        'code' => 'FIXED5',
        'type' => 'fixed',
        'value' => 5,
        'usage_limit' => null,
        'times_used' => 0,
        'min_order_total' => null,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addDay(),
        'is_active' => true,
    ]);

    Sanctum::actingAs($buyer);
    $this->postJson('/api/cart/add', [
        'product_id' => $product->id,
        'quantity' => 2,
    ])->assertCreated();

    $res = $this->postJson('/api/orders', [
        'shipping_address' => '1 rue Test',
        'shipping_city' => 'Paris',
        'shipping_postal_code' => '75001',
        'shipping_phone' => '0600000000',
        'coupon_code' => 'fixed5',
    ])->assertCreated();

    expect((float) $res->json('order.total_amount'))->toBe(35.0);
    expect((float) $res->json('order.discount_amount'))->toBe(5.0);

    $coupon = Coupon::query()->where('code', 'FIXED5')->firstOrFail();
    expect($coupon->times_used)->toBe(1);

    Sanctum::actingAs($admin);
    $this->getJson('/api/admin/stats')->assertOk()->assertJsonStructure([
        'users_count',
        'products_count',
        'orders_count',
        'total_revenue',
    ]);
});
