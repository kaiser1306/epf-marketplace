<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'content' => ['required', 'string', 'max:5000'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
        ]);

        if ((int) $data['recipient_id'] === $request->user()->id) {
            abort(422, __('Destinataire invalide.'));
        }

        $message = Message::query()->create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $data['recipient_id'],
            'product_id' => $data['product_id'] ?? null,
            'content' => $data['content'],
        ]);

        return response()->json([
            'message' => [
                'id' => $message->id,
                'content' => $message->content,
                'created_at' => $message->created_at?->toIso8601String(),
            ],
            'notification_sent' => false,
        ], 201);
    }

    public function conversations(Request $request): JsonResponse
    {
        $uid = $request->user()->id;

        $messages = Message::query()
            ->where(function ($q) use ($uid): void {
                $q->where('sender_id', $uid)->orWhere('recipient_id', $uid);
            })
            ->with(['sender:id,name,profile_image', 'recipient:id,name,profile_image', 'product:id,title'])
            ->orderByDesc('created_at')
            ->limit(500)
            ->get();

        $seen = [];
        $rows = [];

        foreach ($messages as $m) {
            $otherId = (int) ($m->sender_id === $uid ? $m->recipient_id : $m->sender_id);
            $pid = $m->product_id ? (int) $m->product_id : 0;
            $key = $otherId.'-'.$pid;
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;

            $other = User::query()->find($otherId);

            $unread = Message::query()
                ->where('recipient_id', $uid)
                ->where('sender_id', $otherId)
                ->when($pid > 0, fn ($q) => $q->where('product_id', $pid))
                ->where('is_read', false)
                ->count();

            $rows[] = [
                'user' => $other ? [
                    'id' => $other->id,
                    'name' => $other->name,
                    'profile_image' => PublicStorage::url($other->profile_image),
                ] : null,
                'last_message' => [
                    'content' => $m->content,
                    'created_at' => $m->created_at?->toIso8601String(),
                ],
                'unread_count' => $unread,
                'product' => $m->product ? [
                    'id' => $m->product->id,
                    'title' => $m->product->title,
                ] : null,
            ];
        }

        return response()->json([
            'data' => $rows,
            'pagination' => [
                'current_page' => 1,
                'last_page' => 1,
                'total' => count($rows),
            ],
        ]);
    }

    public function thread(Request $request, int $user_id): JsonResponse
    {
        $uid = $request->user()->id;

        $query = Message::query()
            ->where(function ($q) use ($uid, $user_id): void {
                $q->where(function ($q2) use ($uid, $user_id): void {
                    $q2->where('sender_id', $uid)->where('recipient_id', $user_id);
                })->orWhere(function ($q2) use ($uid, $user_id): void {
                    $q2->where('sender_id', $user_id)->where('recipient_id', $uid);
                });
            })
            ->with('sender:id,name,profile_image');

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        Message::query()
            ->where('recipient_id', $uid)
            ->where('sender_id', $user_id)
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->integer('product_id')))
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        $query->orderByDesc('id');

        $perPage = min(max($request->integer('per_page', 30), 1), 100);
        $paginator = $query->paginate($perPage);

        $paginator->through(fn (Message $m) => [
            'id' => $m->id,
            'sender' => $m->sender ? [
                'id' => $m->sender->id,
                'name' => $m->sender->name,
                'profile_image' => PublicStorage::url($m->sender->profile_image),
            ] : null,
            'content' => $m->content,
            'created_at' => $m->created_at?->toIso8601String(),
            'is_read' => $m->is_read,
        ]);

        return response()->json([
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = Message::query()
            ->where('recipient_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['unread_count' => $count]);
    }
}
