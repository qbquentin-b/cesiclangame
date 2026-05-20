<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user?->load('clan'),
                'resources' => $user ? [
                    'crystals' => $user->crystals,
                    'wood'     => $user->wood,
                    'metal'    => $user->metal,
                    'food'     => $user->food,
                    'gold'     => $user->gold,
                ] : null,
            ],
            'flash' => fn () => array_merge(
                ['message' => $request->session()->get('message')],
                $request->session()->get('flash', [])
            ),
            'errors' => fn () => $request->session()->get('errors')
                ? $request->session()->get('errors')->getBag('default')->getMessages()
                : (object)[],
            'unread_messages' => $user
                ? \App\Models\Message::where('receiver_id', $user->id)->whereNull('read_at')->count()
                : 0,
            'pending_friends' => $user
                ? \App\Models\Friendship::where('addressee_id', $user->id)->where('status', 'pending')->count()
                : 0,
        ];
    }
}
