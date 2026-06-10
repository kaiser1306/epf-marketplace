<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'bio', 'role', 'phone', 'city', 'profile_image'])]
#[Hidden(['password', 'remember_token', 'deleted_at'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'user_id');
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    public function reviewsWritten(): HasMany
    {
        return $this->hasMany(Review::class, 'buyer_id');
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoriteProducts(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'favorites')->withTimestamps();
    }

    public function messagesSent(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function messagesReceived(): HasMany
    {
        return $this->hasMany(Message::class, 'recipient_id');
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'rating' => 'decimal:2',
            'total_reviews' => 'integer',
            'suspended_at' => 'datetime',
        ];
    }

    public function hasPurchasedProduct(int $productId): bool
    {
        return OrderItem::query()
            ->where('product_id', $productId)
            ->whereHas('order', function ($q): void {
                $q->where('user_id', $this->id)
                    ->where('status', 'delivered');
            })
            ->exists();
    }
}
