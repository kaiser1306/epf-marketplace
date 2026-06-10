<?php

use App\Http\Controllers\Api\Admin\AdminCouponController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SellerController;
use App\Http\Controllers\Api\SellerDashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:auth')->group(function (): void {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
});

Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category}', [CategoryController::class, 'show']);

Route::get('products', [ProductController::class, 'index']);
Route::get('products/top-selling', [ProductController::class, 'topSelling']);
Route::get('products/{product}/reviews', [ReviewController::class, 'index']);
Route::get('products/{product}', [ProductController::class, 'show']);

Route::get('sellers/{user}', [SellerController::class, 'show']);
Route::get('sellers/{user}/products', [SellerController::class, 'products']);
Route::get('sellers/{user}/reviews', [SellerController::class, 'reviews']);

Route::get('search', SearchController::class);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('auth/logout', [AuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'not_suspended'])->group(function (): void {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('products/my-products', [ProductController::class, 'myProducts']);
    Route::get('products/{product}/is-favorite', [ProductController::class, 'isFavorite']);
    Route::post('products/{product}/reviews', [ReviewController::class, 'store']);

    Route::middleware('seller')->group(function (): void {
        Route::post('products', [ProductController::class, 'store']);
    });

    Route::put('products/{product}', [ProductController::class, 'update']);
    Route::delete('products/{product}', [ProductController::class, 'destroy']);

    Route::delete('reviews/{review}', [ReviewController::class, 'destroy']);

    Route::get('cart', [CartController::class, 'index']);
    Route::post('cart/add', [CartController::class, 'add']);
    Route::put('cart/items/{cartItem}', [CartController::class, 'updateItem']);
    Route::delete('cart/items/{cartItem}', [CartController::class, 'removeItem']);
    Route::delete('cart/clear', [CartController::class, 'clear']);

    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/my-orders', [OrderController::class, 'myOrders']);
    Route::get('orders/{order}', [OrderController::class, 'show']);
    Route::put('orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);

    Route::get('seller/orders', [OrderController::class, 'sellerOrders']);
    Route::get('seller/dashboard', [SellerDashboardController::class, 'dashboard']);
    Route::get('seller/statistics', [SellerDashboardController::class, 'statistics']);

    Route::post('favorites/add', [FavoriteController::class, 'add']);
    Route::delete('favorites/{product_id}', [FavoriteController::class, 'remove']);
    Route::get('favorites', [FavoriteController::class, 'index']);

    Route::post('messages', [MessageController::class, 'store']);
    Route::get('messages/conversations', [MessageController::class, 'conversations']);
    Route::get('messages/with/{user_id}', [MessageController::class, 'thread']);
    Route::get('messages/unread-count', [MessageController::class, 'unreadCount']);
});

Route::middleware(['auth:sanctum', 'not_suspended', 'admin'])->prefix('admin')->group(function (): void {
    Route::get('stats', [AdminDashboardController::class, 'stats']);

    Route::get('users', [AdminUserController::class, 'index']);
    Route::post('users/{user}/suspend', [AdminUserController::class, 'suspend']);
    Route::post('users/{user}/activate', [AdminUserController::class, 'activate']);

    Route::patch('products/{id}/status', [AdminProductController::class, 'updateStatus']);
    Route::delete('products/{id}/force', [AdminProductController::class, 'destroy']);

    Route::get('coupons', [AdminCouponController::class, 'index']);
    Route::post('coupons', [AdminCouponController::class, 'store']);
    Route::put('coupons/{coupon}', [AdminCouponController::class, 'update']);
    Route::delete('coupons/{coupon}', [AdminCouponController::class, 'destroy']);
});
