<?php

namespace App\Http\Controllers;

use App\Models\MarketOffer;
use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MarketController extends Controller
{
    public function index()
    {
        $offers = MarketOffer::with('seller.clan:id,name')
            ->where('status', 'open')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return Inertia::render('MarketView', [
            'offers' => $offers
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'offer_type' => 'required|string',
            'offer_amount' => 'required|integer|min:1',
            'wanted_type' => 'required|string',
            'wanted_amount' => 'required|integer|min:1',
        ]);

        $user = auth()->user();

        DB::transaction(function () use ($request, $user) {
            // Lock user/resource
            if ($request->offer_type === 'crystals') {
                $user = DB::table('users')->where('id', $user->id)->lockForUpdate()->first();
                if ($user->crystals < $request->offer_amount) {
                    abort(400, "Pas assez de cristaux.");
                }
                DB::table('users')->where('id', $user->id)->decrement('crystals', $request->offer_amount);
            } else {
                $resourceType = str_replace('resource_', '', $request->offer_type);
                $resource = DB::table('resources')
                    ->where('user_id', $user->id)
                    ->where('type', $resourceType)
                    ->lockForUpdate()
                    ->first();
                    
                if (!$resource || $resource->amount < $request->offer_amount) {
                    abort(400, "Pas assez de ressources.");
                }
                DB::table('resources')->where('id', $resource->id)->decrement('amount', $request->offer_amount);
            }

            MarketOffer::create([
                'seller_id' => $user->id,
                'offer_type' => $request->offer_type,
                'offer_amount' => $request->offer_amount,
                'wanted_type' => $request->wanted_type,
                'wanted_amount' => $request->wanted_amount,
                'status' => 'open'
            ]);
        });

        return back()->with('success', 'Offre créée.');
    }

    public function accept(MarketOffer $offer)
    {
        $user = auth()->user();

        if ($offer->status !== 'open') {
            abort(400, "Offre n'est plus disponible.");
        }
        
        if ($offer->seller_id === $user->id) {
            abort(400, "Vous ne pouvez pas accepter votre propre offre.");
        }

        DB::transaction(function () use ($offer, $user) {
            $offer = DB::table('market_offers')->where('id', $offer->id)->lockForUpdate()->first();
            if ($offer->status !== 'open') {
                abort(400, "Offre n'est plus disponible.");
            }

            // Buyer pays "wanted"
            if ($offer->wanted_type === 'crystals') {
                $buyer = DB::table('users')->where('id', $user->id)->lockForUpdate()->first();
                if ($buyer->crystals < $offer->wanted_amount) {
                    abort(400, "Vous n'avez pas assez de cristaux.");
                }
                DB::table('users')->where('id', $user->id)->decrement('crystals', $offer->wanted_amount);
            } else {
                $wantedResType = str_replace('resource_', '', $offer->wanted_type);
                $buyerRes = DB::table('resources')
                    ->where('user_id', $user->id)
                    ->where('type', $wantedResType)
                    ->lockForUpdate()
                    ->first();
                if (!$buyerRes || $buyerRes->amount < $offer->wanted_amount) {
                    abort(400, "Vous n'avez pas assez de cette ressource.");
                }
                DB::table('resources')->where('id', $buyerRes->id)->decrement('amount', $offer->wanted_amount);
            }

            // Seller gets "wanted"
            if ($offer->wanted_type === 'crystals') {
                DB::table('users')->where('id', $offer->seller_id)->increment('crystals', $offer->wanted_amount);
            } else {
                $wantedResType = str_replace('resource_', '', $offer->wanted_type);
                DB::table('resources')->updateOrInsert(
                    ['user_id' => $offer->seller_id, 'type' => $wantedResType],
                    ['amount' => DB::raw("amount + {$offer->wanted_amount}")]
                );
            }

            // Buyer gets "offer"
            if ($offer->offer_type === 'crystals') {
                DB::table('users')->where('id', $user->id)->increment('crystals', $offer->offer_amount);
            } else {
                $offerResType = str_replace('resource_', '', $offer->offer_type);
                DB::table('resources')->updateOrInsert(
                    ['user_id' => $user->id, 'type' => $offerResType],
                    ['amount' => DB::raw("amount + {$offer->offer_amount}")]
                );
            }

            DB::table('market_offers')->where('id', $offer->id)->update(['status' => 'completed']);
        });

        return back()->with('success', 'Échange réussi.');
    }
}
