<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class UpdateLastSeen
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()) {
            $request->user()->timestamps = false;
            $request->user()->last_seen_at = now();
            $request->user()->save();
            $request->user()->timestamps = true;
        }

        return $next($request);
    }
}
