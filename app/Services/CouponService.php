<?php

namespace App\Services;

use App\Models\Coupon;
use Illuminate\Validation\ValidationException;

final class CouponService
{
    /**
     * @throws ValidationException
     */
    public static function validateAndComputeDiscount(?string $code, string $subtotal): array
    {
        if ($code === null || trim($code) === '') {
            return ['coupon' => null, 'discount' => '0.00'];
        }

        $coupon = Coupon::query()
            ->whereRaw('UPPER(code) = ?', [mb_strtoupper(trim($code))])
            ->lockForUpdate()
            ->first();

        if (! $coupon || ! $coupon->isCurrentlyValid()) {
            throw ValidationException::withMessages([
                'coupon_code' => [__('Code promo invalide ou expiré.')],
            ]);
        }

        $sub = (float) $subtotal;
        if ($coupon->min_order_total !== null && $sub < (float) $coupon->min_order_total) {
            throw ValidationException::withMessages([
                'coupon_code' => [__('Montant minimum de commande non atteint pour ce code.')],
            ]);
        }

        if ($coupon->type === 'percent') {
            $discount = round($sub * ((float) $coupon->value / 100), 2);
        } else {
            $discount = min((float) $coupon->value, $sub);
        }

        $discount = number_format($discount, 2, '.', '');

        return ['coupon' => $coupon, 'discount' => $discount];
    }
}
