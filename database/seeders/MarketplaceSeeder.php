<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MarketplaceSeeder extends Seeder
{
    public function run(): void
    {
        $buyer = User::query()->create([
            'name' => 'Acheteur Démo',
            'email' => 'buyer@example.com',
            'password' => Hash::make('secret12'),
            'role' => 'buyer',
            'city' => 'Paris',
            'phone' => '0600000000',
        ]);
        $buyer->forceFill(['rating' => 5, 'total_reviews' => 0])->saveQuietly();

        $seller = User::query()->create([
            'name' => 'Vendeur Démo',
            'email' => 'seller@example.com',
            'password' => Hash::make('secret12'),
            'role' => 'seller',
            'bio' => 'Boutique de démonstration.',
            'city' => 'Lyon',
            'phone' => '0611111111',
        ]);
        $seller->forceFill(['rating' => 5, 'total_reviews' => 0])->saveQuietly();

        $admin = User::query()->create([
            'name' => 'Admin Démo',
            'email' => 'admin@example.com',
            'password' => Hash::make('secret12'),
            'role' => 'admin',
            'city' => 'Paris',
        ]);
        $admin->forceFill(['rating' => 5, 'total_reviews' => 0])->saveQuietly();

        Coupon::query()->firstOrCreate(
            ['code' => 'DEMO10'],
            [
                'type' => 'percent',
                'value' => 10,
                'usage_limit' => 1000,
                'times_used' => 0,
                'min_order_total' => 20,
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addYear(),
                'is_active' => true,
            ]
        );

        $categories = collect([
            ['name' => 'Électronique', 'slug' => 'electronique', 'description' => 'Gadgets et accessoires'],
            ['name' => 'Maison', 'slug' => 'maison', 'description' => 'Décoration'],
            ['name' => 'Mode', 'slug' => 'mode', 'description' => 'Vêtements'],
        ])->map(fn (array $c) => Category::query()->firstOrCreate(
            ['slug' => $c['slug']],
            ['name' => $c['name'], 'description' => $c['description'], 'icon' => 'tag']
        ));

        foreach (['Lampe design', 'Casque audio', 'T-shirt bio'] as $title) {
            Product::query()->create([
                'user_id' => $seller->id,
                'category_id' => $categories->random()->id,
                'title' => $title,
                'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
                'description' => 'Description de démonstration pour '.$title,
                'price' => fake()->randomFloat(2, 15, 120),
                'quantity' => 20,
                'image' => 'products/demo-'.Str::slug($title).'.jpg',
                'images' => [],
                'status' => 'published',
            ]);
        }

        $this->command->info('Comptes démo : buyer@ / seller@ / admin@example.com — mot de passe: secret12 — coupon: DEMO10 (-10% si panier ≥ 20)');
    }
}
