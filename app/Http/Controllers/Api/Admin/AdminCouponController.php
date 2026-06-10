<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminCouponController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $paginator = Coupon::query()->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40', 'unique:coupons,code'],
            'type' => ['required', 'string', Rule::in(['percent', 'fixed'])],
            'value' => ['required', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'min_order_total' => ['nullable', 'numeric', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($data['type'] === 'percent' && (float) $data['value'] > 100) {
            abort(422, __('Un pourcentage ne peut pas dépasser 100.'));
        }

        $coupon = Coupon::query()->create([
            'code' => mb_strtoupper(trim($data['code'])),
            'type' => $data['type'],
            'value' => $data['value'],
            'usage_limit' => $data['usage_limit'] ?? null,
            'min_order_total' => $data['min_order_total'] ?? null,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['coupon' => $coupon, 'message' => __('Coupon créé.')], 201);
    }

    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:40', Rule::unique('coupons', 'code')->ignore($coupon->id)],
            'type' => ['sometimes', 'string', Rule::in(['percent', 'fixed'])],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'min_order_total' => ['nullable', 'numeric', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $coupon->fill($data);
        $coupon->save();

        return response()->json(['coupon' => $coupon->fresh(), 'message' => __('Coupon mis à jour.')]);
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();

        return response()->json(['message' => __('Coupon supprimé.')]);
    }
}
