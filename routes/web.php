<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ChestController;
use App\Http\Controllers\ClanAnnouncementController;
use App\Http\Controllers\ClanChatController;
use App\Http\Controllers\ClanController;
use App\Http\Controllers\CommanderController;
use App\Http\Controllers\CraftingController;
use App\Http\Controllers\DailyGameController;
use App\Http\Controllers\LegendaryWarController;
use App\Http\Controllers\WarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DropController;
use App\Http\Controllers\FriendController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\MapZoneController;
use App\Http\Controllers\MarketController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\RankingController;
use App\Http\Controllers\TroopController;
use App\Http\Controllers\VillageController;
use App\Http\Controllers\ZoneBuildingController;
use App\Http\Middleware\IsAdmin;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/clan', [ClanController::class, 'index'])->name('clan');
    Route::post('/clan', [ClanController::class, 'create'])->name('clan.create');
    Route::post('/clan/join/{clan}', [ClanController::class, 'join'])->name('clan.join');
    Route::post('/clan/donate', [ClanController::class, 'donate'])->name('clan.donate');
    Route::patch('/clan/logo', [ClanController::class, 'updateLogo'])->name('clan.logo');
    Route::post('/clan/promote/{user}', [ClanController::class, 'promote'])->name('clan.promote');
    Route::post('/clan/demote/{user}', [ClanController::class, 'demote'])->name('clan.demote');
    Route::post('/clan/kick/{user}', [ClanController::class, 'kick'])->name('clan.kick');

    // Clan chat (pigeonnier)
    Route::get('/api/clan/chat', [ClanChatController::class, 'messages'])->name('clan.chat.messages');
    Route::post('/api/clan/chat', [ClanChatController::class, 'send'])->name('clan.chat.send');

    // Clan announcements
    Route::post('/clan/announcements', [ClanAnnouncementController::class, 'store'])->name('clan.announcements.store');
    Route::delete('/clan/announcements/{announcement}', [ClanAnnouncementController::class, 'destroy'])->name('clan.announcements.destroy');

    Route::get('/drops', [DropController::class, 'index'])->name('drops');

    Route::post('/drops/claim/{drop}', [DropController::class, 'claim'])->name('drops.claim');

    Route::get('/wars', function () {
        $user = auth()->user()->load('clan');
        $activeWar  = null;
        $warHistory = collect();
        $warScores  = null;

        if ($user->clan_id) {
            $activeWar = \App\Models\War::with(['clanA', 'clanB'])
                ->where(function ($q) use ($user) {
                    $q->where('clan_a_id', $user->clan_id)->orWhere('clan_b_id', $user->clan_id);
                })
                ->whereIn('status', ['pending', 'active'])
                ->latest()
                ->first();

            if ($activeWar) {
                $scoreA = \App\Models\WarDeployment::where('war_id', $activeWar->id)
                    ->where('clan_id', $activeWar->clan_a_id)
                    ->sum('contribution_score');
                $scoreB = \App\Models\WarDeployment::where('war_id', $activeWar->id)
                    ->where('clan_id', $activeWar->clan_b_id)
                    ->sum('contribution_score');
                $warScores = ['score_a' => $scoreA, 'score_b' => $scoreB];

                $clanDeployments = \App\Models\WarDeployment::where('war_id', $activeWar->id)
                    ->where('clan_id', $user->clan_id)
                    ->with(['user:id,username,clan_rank', 'commander'])
                    ->orderByDesc('contribution_score')
                    ->get();
            }

            $warHistory = \App\Models\War::with(['clanA', 'clanB'])
                ->where(function ($q) use ($user) {
                    $q->where('clan_a_id', $user->clan_id)->orWhere('clan_b_id', $user->clan_id);
                })
                ->where('status', 'finished')
                ->latest()
                ->take(20)
                ->get();
        }

        return Inertia::render('WarView', [
            'activeWar'        => $activeWar,
            'warHistory'       => $warHistory,
            'warScores'        => $warScores,
            'clanDeployments'  => $clanDeployments ?? collect(),
        ]);
    })->name('wars');

    // Détail d'une guerre + actions
    Route::get('/wars/{war}', [WarController::class, 'show'])->name('wars.show');
    Route::post('/wars/{war}/action', [WarController::class, 'submitAction'])->name('wars.action');
    Route::patch('/wars/{war}/strategy', [WarController::class, 'setStrategy'])->name('wars.strategy');
    Route::post('/wars/{war}/napoleon-bonus', [WarController::class, 'napoleonBonus'])->name('wars.napoleon');

    // Batailles légendaires (Idée 8)
    Route::get('/legendary-wars/{legendaryWar}', [LegendaryWarController::class, 'show'])->name('legendary-wars.show');
    Route::post('/legendary-wars/{legendaryWar}/action', [LegendaryWarController::class, 'submitAction'])->name('legendary-wars.action');

    // Troupes & Commandants
    Route::get('/troops', [TroopController::class, 'index'])->name('troops');
    Route::post('/troops/train', [TroopController::class, 'train'])->name('troops.train');
    Route::post('/troops/collect', [TroopController::class, 'collect'])->name('troops.collect');
    Route::post('/troops/deploy', [TroopController::class, 'deploy'])->name('troops.deploy');
    Route::post('/commanders/{userCommander}/activate', [CommanderController::class, 'setActive'])->name('commanders.activate');
    Route::post('/commanders/deactivate', [CommanderController::class, 'deactivate'])->name('commanders.deactivate');

    Route::get('/games', [GameController::class, 'index'])->name('games');

    Route::get('/daily-games', [DailyGameController::class, 'index'])->name('daily-games');
    Route::post('/daily-games/{type}/complete', [DailyGameController::class, 'complete'])->name('daily-games.complete');

    Route::get('/api/chests', [ChestController::class, 'index'])->name('chests.index');
    Route::post('/chests/{chest}/open', [ChestController::class, 'open'])->name('chests.open');

    Route::get('/rankings', [RankingController::class, 'index'])->name('rankings');

    // Pigeonnier — messages & amis
    Route::get('/messages', [MessageController::class, 'index'])->name('messages');
    Route::get('/api/messages/{user}', [MessageController::class, 'thread'])->name('messages.thread');
    Route::post('/api/messages/{user}', [MessageController::class, 'send'])->name('messages.send');
    Route::post('/friends/request', [FriendController::class, 'request'])->name('friends.request');
    Route::post('/friends/{friendship}/accept', [FriendController::class, 'accept'])->name('friends.accept');
    Route::post('/friends/{friendship}/decline', [FriendController::class, 'decline'])->name('friends.decline');
    Route::delete('/friends/{user}', [FriendController::class, 'remove'])->name('friends.remove');

    Route::get('/map', [MapZoneController::class, 'index'])->name('map');
    Route::post('/map/zones/{zone}/claim', [MapZoneController::class, 'claim'])->name('map.claim');
    Route::patch('/map/zones/{zone}/rename', [MapZoneController::class, 'rename'])->name('map.rename');
    Route::post('/map/zones/{zone}/set-capital', [MapZoneController::class, 'setCapital'])->name('map.setCapital');
    Route::post('/map/zones/{zone}/declare-war', [MapZoneController::class, 'declareWar'])->name('map.declareWar');
    Route::post('/map/zones/{zone}/buildings', [ZoneBuildingController::class, 'store'])->name('zone.building.store');
    Route::patch('/map/zones/buildings/{building}/upgrade', [ZoneBuildingController::class, 'upgrade'])->name('zone.building.upgrade');
    Route::delete('/map/zones/buildings/{building}', [ZoneBuildingController::class, 'destroy'])->name('zone.building.destroy');

    Route::get('/market', [MarketController::class, 'index'])->name('market');
    Route::post('/market', [MarketController::class, 'store'])->name('market.store');
    Route::post('/market/{offer}/accept', [MarketController::class, 'accept'])->name('market.accept');

    Route::get('/village', [VillageController::class, 'index'])->name('village');
    Route::post('/village/buildings/{building}/contribute', [VillageController::class, 'contribute'])->name('village.contribute');
    Route::post('/village/collect', [VillageController::class, 'collect'])->name('village.collect');

    // Mini-games endpoints
    Route::get('/api/games/quiz/{quiz}', [GameController::class, 'getQuizQuestions'])->name('games.quiz.questions');
    Route::post('/games/quiz/complete', [GameController::class, 'completeQuiz'])->name('games.quiz.complete');
    Route::post('/games/bet', [GameController::class, 'placeBet'])->name('games.bet');
    Route::post('/games/missions/{mission}/submit', [GameController::class, 'submitMission'])->name('games.missions.submit');

    // Crafting
    Route::post('/craft', [CraftingController::class, 'craft'])->name('craft');

    Route::middleware([IsAdmin::class])->group(function () {
        Route::get('/admin', [AdminController::class, 'index'])->name('admin');
        
        // Admin Specific Endpoints
        Route::post('/admin/drops', [AdminController::class, 'createDrop'])->name('admin.drops.create');
        Route::post('/admin/drops/flash', [AdminController::class, 'createFlashDrop'])->name('admin.drops.flash');
        Route::post('/admin/wars/trigger', [AdminController::class, 'triggerWar'])->name('admin.wars.trigger');
        Route::post('/admin/wars/blitz', [AdminController::class, 'triggerBlitzWar'])->name('admin.wars.blitz');
        Route::patch('/admin/wars/{war}/resolve', [AdminController::class, 'resolveWar'])->name('admin.wars.resolve');
        Route::post('/admin/players/credit', [AdminController::class, 'creditPlayer'])->name('admin.players.credit');
        Route::post('/admin/players/kick', [AdminController::class, 'kickPlayer'])->name('admin.players.kick');
        Route::post('/admin/players/reset', [AdminController::class, 'resetPlayer'])->name('admin.players.reset');
        Route::post('/admin/clans/credit', [AdminController::class, 'creditClan'])->name('admin.clans.credit');
        Route::delete('/admin/clans/{clan}', [AdminController::class, 'dissolveClan'])->name('admin.clans.dissolve');
        Route::post('/admin/missions/{mission}/validate', [AdminController::class, 'validateMission'])->name('admin.missions.validate');
        Route::post('/admin/betting-events', [AdminController::class, 'storeEvent'])->name('admin.events.store');
        Route::delete('/admin/betting-events/{event}', [AdminController::class, 'destroyEvent'])->name('admin.events.destroy');
        Route::post('/admin/quizzes', [AdminController::class, 'storeQuiz'])->name('admin.quizzes.store');
        Route::patch('/admin/quizzes/{quiz}/archive', [AdminController::class, 'archiveQuiz'])->name('admin.quizzes.archive');
        Route::delete('/admin/quizzes/{quiz}', [AdminController::class, 'destroyQuiz'])->name('admin.quizzes.destroy');
        Route::post('/admin/chests/give', [AdminController::class, 'giveChest'])->name('admin.chests.give');
        Route::post('/admin/legendary-wars/trigger', [AdminController::class, 'triggerLegendaryWar'])->name('admin.legendary-wars.trigger');
    });
});

require __DIR__.'/auth.php';
