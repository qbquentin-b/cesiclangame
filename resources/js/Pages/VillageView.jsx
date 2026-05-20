import React, { useState } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, router, usePage } from '@inertiajs/react';

const RESOURCE_META = {
    wood:     { icon: '🪵', label: 'Bois',       color: '#8B5E3C' },
    metal:    { icon: '⚙️', label: 'Fer',        color: '#607D8B' },
    food:     { icon: '🌾', label: 'Nourriture', color: '#c8a227' },
    gold:     { icon: '🪙', label: 'Or',         color: '#D4A017' },
    crystals: { icon: '💎', label: 'Cristaux',   color: '#0288D1' },
};

function ResourceBadge({ type, amount }) {
    const meta = RESOURCE_META[type] || {};
    return (
        <div className="flex items-center gap-1 bg-black/20 rounded-lg px-3 py-1.5 text-sm font-bold" style={{ color: meta.color || '#fff' }}>
            <span>{meta.icon}</span>
            <span>{amount}</span>
        </div>
    );
}

function BuildingCard({ building, userResources, onContribute, onShowHistory }) {
    const [amounts, setAmounts] = useState({ wood: 0, metal: 0, food: 0, gold: 0, crystals: 0 });
    const [showContrib, setShowContrib] = useState(false);

    const cost     = building.upgrade_cost;
    const isMax    = building.is_max_level;

    const LEVEL_COLORS = ['', '#9E9E9E', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];

    const progressPct = (resource, required) => {
        if (!required) return 100;
        const contributed = building['contributed_' + resource] ?? 0;
        return Math.min(100, Math.round((contributed / required) * 100));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onContribute(building.id, amounts);
        setAmounts({ wood: 0, metal: 0, food: 0, gold: 0, crystals: 0 });
        setShowContrib(false);
    };

    return (
        <div className="bg-[#f4ead7] border-[3px] border-[#765a19]/50 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between"
                 style={{ background: `linear-gradient(135deg, ${LEVEL_COLORS[building.level] || '#555'}22, ${LEVEL_COLORS[building.level] || '#555'}55)` }}>
                <div className="flex items-center gap-3">
                    <span className="text-4xl">{building.icon}</span>
                    <div>
                        <h3 className="font-headline font-bold text-lg text-[#2c1a0c]">{building.label}</h3>
                        <span className="text-xs font-label uppercase tracking-widest font-bold"
                              style={{ color: LEVEL_COLORS[building.level] }}>
                            Niveau {building.level}{isMax ? ' (MAX)' : ''}
                        </span>
                    </div>
                </div>
                <button onClick={() => onShowHistory(building)}
                        className="text-xl opacity-60 hover:opacity-100 transition" title="Historique des contributions">
                    💬
                </button>
            </div>

            <div className="p-4 flex-1 space-y-3">
                {/* Production Info */}
                {building.produces && (
                    <div className="flex items-center justify-between text-sm font-label bg-black/5 rounded-lg px-3 py-2">
                        <span className="text-[#2c1a0c]/70">Production</span>
                        <span className="font-bold">{RESOURCE_META[building.produces]?.icon} +{building.production_rate}/h</span>
                    </div>
                )}
                {!building.produces && (
                    <div className="flex items-center justify-between text-sm font-label bg-black/5 rounded-lg px-3 py-2">
                        <span className="text-[#2c1a0c]/70">Bonus Guerre</span>
                        <span className="font-bold">+{building.production_rate}%</span>
                    </div>
                )}

                {/* Upgrade progress bars */}
                {!isMax && cost && (
                    <div className="space-y-1.5">
                        <p className="text-xs font-label uppercase font-bold text-[#765a19]/70">Progression vers Nv.{building.level + 1}</p>
                        {[['wood', cost[0]], ['metal', cost[1]], ['food', cost[2]], ['gold', cost[3]], ['crystals', cost[4]]].map(([res, req]) => {
                            if (!req) return null;
                            const pct = progressPct(res, req);
                            const contributed = building['contributed_' + res] ?? 0;
                            return (
                                <div key={res}>
                                    <div className="flex justify-between text-[10px] font-label mb-0.5 text-[#2c1a0c]/60">
                                        <span>{RESOURCE_META[res].icon} {RESOURCE_META[res].label}</span>
                                        <span>{contributed}/{req}</span>
                                    </div>
                                    <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all"
                                             style={{ width: `${pct}%`, backgroundColor: RESOURCE_META[res].color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {isMax && (
                    <div className="text-center text-xs font-label text-yellow-700 font-bold bg-yellow-50 rounded-lg py-2 border border-yellow-300">
                        ✨ Niveau Maximal Atteint
                    </div>
                )}
            </div>

            {/* Contribute section */}
            {!isMax && (
                <div className="border-t border-[#765a19]/20 p-4">
                    {!showContrib ? (
                        <button onClick={() => setShowContrib(true)}
                                className="w-full py-2.5 bg-[#765a19] text-white text-sm uppercase font-bold tracking-wide rounded-xl hover:brightness-110 transition">
                            ⬆️ Contribuer
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-2">
                            {Object.entries(amounts).map(([res, val]) => {
                                const max = userResources[res] ?? 0;
                                const costIdx = ['wood','metal','food','gold','crystals'].indexOf(res);
                                if (!cost || !cost[costIdx]) return null;
                                return (
                                    <div key={res} className="flex items-center gap-2">
                                        <span className="text-sm w-6">{RESOURCE_META[res].icon}</span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={max}
                                            value={val}
                                            onChange={e => setAmounts(a => ({ ...a, [res]: +e.target.value }))}
                                            className="flex-1 accent-[#765a19]"
                                        />
                                        <span className="text-xs font-mono w-10 text-right text-[#2c1a0c]">{val}</span>
                                    </div>
                                );
                            })}
                            <div className="flex gap-2 pt-1">
                                <button type="submit" className="flex-1 py-2 bg-[#3c6704] text-white text-xs uppercase font-bold rounded-lg hover:brightness-110">
                                    Confirmer
                                </button>
                                <button type="button" onClick={() => setShowContrib(false)}
                                        className="px-3 py-2 bg-black/10 text-[#2c1a0c] text-xs rounded-lg hover:bg-black/20">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}

function HistoryModal({ building, onClose }) {
    if (!building) return null;
    const contributions = building.contributions ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#f4ead7] border-4 border-[#765a19] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                 onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[#765a19]/30 flex items-center justify-between bg-[#765a19]/10">
                    <h3 className="font-headline font-bold text-lg text-[#2c1a0c]">
                        {building.icon} {building.label} — Historique
                    </h3>
                    <button onClick={onClose} className="text-xl opacity-50 hover:opacity-100">✕</button>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto space-y-2">
                    {contributions.length === 0 && (
                        <p className="text-center italic text-[#2c1a0c]/50 font-label py-4">Aucune contribution pour l'instant.</p>
                    )}
                    {contributions.map((c) => (
                        <div key={c.id} className="flex items-start gap-3 bg-white/50 rounded-xl p-3">
                            <div className="w-8 h-8 rounded-full bg-[#765a19] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(c.user?.username || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-[#2c1a0c]">{c.user?.username || 'Inconnu'}</p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {c.wood > 0  && <span className="text-xs bg-[#8B5E3C]/20 rounded px-1.5 py-0.5">🪵 {c.wood}</span>}
                                    {c.metal > 0 && <span className="text-xs bg-[#607D8B]/20 rounded px-1.5 py-0.5">⚙️ {c.metal}</span>}
                                    {c.food > 0  && <span className="text-xs bg-[#c8a227]/20 rounded px-1.5 py-0.5">🌾 {c.food}</span>}
                                    {c.gold > 0  && <span className="text-xs bg-[#D4A017]/20 rounded px-1.5 py-0.5">🪙 {c.gold}</span>}
                                </div>
                            </div>
                            <p className="text-[10px] text-[#2c1a0c]/40 flex-shrink-0 mt-1">
                                {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Village map layout — fixed positions for each building
const VILLAGE_POSITIONS = {
    farm:     { top: '10%',   left: '10%'  },
    mine:     { top: '10%',   right: '10%' },
    sawmill:  { top: '45%',   left: '5%'   },
    market:   { top: '45%',   right: '5%'  },
    fortress: { bottom: '8%', left: '30%'  },
    barracks: { bottom: '8%', right: '30%' },
};

export default function VillageView({ buildings = [], userResources = {}, noClan = false }) {
    const flash  = usePage().props.flash || {};
    const errors = usePage().props.errors || {};
    const [historyBuilding, setHistoryBuilding] = useState(null);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'map'

    const handleContribute = (buildingId, amounts) => {
        router.post(route('village.contribute', buildingId), amounts, { preserveScroll: true });
    };

    const handleCollect = () => {
        router.post(route('village.collect'), {}, { preserveScroll: true });
    };

    return (
        <GameLayout activeTab="village">
            <Head title="Village de Clan" />

            {/* Flash messages */}
            {flash.message && (
                <div className="mb-4 px-4 py-3 bg-green-800/80 border border-green-500 rounded-xl text-green-200 text-sm font-label">
                    ✅ {flash.message}
                </div>
            )}
            {errors.message && (
                <div className="mb-4 px-4 py-3 bg-red-900/80 border border-red-500 rounded-xl text-red-200 text-sm font-label">
                    ⚠️ {errors.message}
                </div>
            )}

            {/* Resources bar */}
            <div className="bg-[#2c1a0c] border-2 border-[#765a19] rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {Object.entries(userResources).map(([key, val]) => (
                        <ResourceBadge key={key} type={key} amount={val} />
                    ))}
                </div>
                <button onClick={handleCollect}
                        className="px-4 py-2 bg-[#765a19] text-white text-sm font-bold uppercase rounded-xl hover:brightness-110 transition active:scale-95">
                    🌾 Collecter les ressources
                </button>
            </div>

            {/* Header */}
            <section className="relative overflow-hidden rounded-xl bg-[#2c1a0c] border-4 border-[#765a19] shadow-2xl p-6 mb-6 text-center text-secondary-fixed">
                <h2 className="font-headline text-3xl font-extrabold uppercase tracking-wider">Village de Clan</h2>
                <p className="font-label text-sm uppercase mt-2 opacity-70">Améliorez vos bâtiments pour prospérer.</p>
                <div className="mt-3 flex justify-center gap-2">
                    <button onClick={() => setViewMode('cards')}
                            className={`px-4 py-1.5 text-xs uppercase font-bold rounded-full transition ${viewMode === 'cards' ? 'bg-[#765a19] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                        📋 Fiches
                    </button>
                    <button onClick={() => setViewMode('map')}
                            className={`px-4 py-1.5 text-xs uppercase font-bold rounded-full transition ${viewMode === 'map' ? 'bg-[#765a19] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                        🗺️ Carte du Village
                    </button>
                </div>
            </section>

            {noClan && (
                <div className="text-center py-16 text-[#765a19]/60 font-label italic">
                    <p className="text-5xl mb-4">🏚️</p>
                    <p>Vous devez rejoindre ou créer un clan pour accéder au village.</p>
                </div>
            )}

            {!noClan && viewMode === 'cards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {buildings.map(b => (
                        <BuildingCard
                            key={b.id}
                            building={b}
                            userResources={userResources}
                            onContribute={handleContribute}
                            onShowHistory={setHistoryBuilding}
                        />
                    ))}
                </div>
            )}

            {!noClan && viewMode === 'map' && (
                <div className="relative w-full rounded-2xl border-8 border-[#3c2a1a] overflow-hidden shadow-2xl"
                     style={{ minHeight: '520px', backgroundImage: "url('/images/world_map.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="absolute inset-0 bg-[#2c1a0c]/40" />
                    {buildings.map(b => {
                        const pos = VILLAGE_POSITIONS[b.type] || { top: '50%', left: '50%' };
                        return (
                            <button key={b.id}
                                    onClick={() => setHistoryBuilding(b)}
                                    className="absolute flex flex-col items-center gap-1 group"
                                    style={pos}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-2xl border-2 border-white/30 bg-[#2c1a0c]/70 backdrop-blur-sm group-hover:scale-110 transition">
                                    {b.icon}
                                </div>
                                <div className="bg-[#2c1a0c]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                                    {b.label} Nv.{b.level}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {historyBuilding && (
                <HistoryModal building={historyBuilding} onClose={() => setHistoryBuilding(null)} />
            )}
        </GameLayout>
    );
}
