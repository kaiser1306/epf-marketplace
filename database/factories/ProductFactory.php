<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => 'seller']),
            'category_id' => Category::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 5, 250),
            'quantity' => fake()->numberBetween(5, 40),
            'image' => 'products/placeholder-'.fake()->uuid().'.jpg',
            'images' => [],
            'status' => 'published',
            'views' => 0,
            'rating' => 0,
            'total_reviews' => 0,
            'sales_count' => 0,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }
}
