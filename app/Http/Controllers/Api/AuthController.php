<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'phone' => ['nullable', 'string', 'max:32'],
            'role' => ['nullable', 'string', Rule::in(['buyer', 'seller'])],
            'city' => ['nullable', 'string', 'max:120'],
            'bio' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'] ?? 'buyer',
            'city' => $data['city'] ?? null,
            'bio' => $data['bio'] ?? null,
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
            'message' => __('Inscription réussie.'),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => __('Identifiants invalides.'),
            ], 401);
        }

        if ($user->suspended_at !== null) {
            return response()->json([
                'message' => __('Compte suspendu. Contactez le support.'),
            ], 403);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
            'message' => __('Connexion réussie.'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => __('Déconnexion réussie.'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'phone' => ['nullable', 'string', 'max:32'],
            'city' => ['nullable', 'string', 'max:120'],
            'profile_image' => ['nullable', 'file', 'image', 'max:2048', 'mimes:jpeg,png,jpg,webp,gif'],
        ]);

        if ($request->hasFile('profile_image')) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }
            $path = $request->file('profile_image')->store('profiles', 'public');
            $user->profile_image = $path;
        }

        $user->fill([
            'name' => $data['name'] ?? $user->name,
            'bio' => array_key_exists('bio', $data) ? $data['bio'] : $user->bio,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $user->phone,
            'city' => array_key_exists('city', $data) ? $data['city'] : $user->city,
        ]);
        $user->save();

        return response()->json([
            'user' => $this->userPayload($user->fresh()),
            'message' => __('Profil mis à jour.'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'bio' => $user->bio,
            'phone' => $user->phone,
            'city' => $user->city,
            'profile_image' => PublicStorage::url($user->profile_image),
            'rating' => $user->rating,
            'total_reviews' => $user->total_reviews,
        ];
    }
}
