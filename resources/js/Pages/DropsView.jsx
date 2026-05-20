import React, { useState, useEffect } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, router, usePage } from '@inertiajs/react';

const G = {
    gold:    '#C9933C',
    goldBrt: '#F0C060',
    parch:   '#F2E4C4',
    parchDm: 'rgba(242,228,196,0.45)',
    forge:   '#0A0705',
    card:    '#1E1208',
    cardLt:  '#291A0C',
    crimson: '#8B1A1A',
    crimBrt: '#C53030',
    forBrt:  '#4A9040',
    border:  'rgba(201,147,60,0.18)',
    borderA: 'rgba(201,147,60,0.35)',
};

const RIVET_POS = [
    { top: 10, left: 10 },
    { top: 10, right: 10 },
    { bottom: 10, left: 10 },
    { bottom: 10, right: 10 },
];

const TYPE_META = {
    crystals:    { icon: 'diamond',       label: 'Cristaux',     color: G.gold },
    resource:    { icon: 'inventory_2',   label: 'Ressource',    color: '#78A050' },
    weapon_plan: { icon: 'gavel',         label: "Plan d'Arme",  color: '#B07040' },
    boost:       { icon: 'bolt',          label: 'Boost',        color: '#8050C0' },
    commander:   { icon: 'military_tech', label: 'Commandant',   color: '#F39C12' },
};

const RARITY_META = {
    common:    { label: 'Commun',     color: 'rgba(242,228,196,0.6)', bg: 'rgba(242,228,196,0.08)' },
    rare:      { label: 'Rare',       color: '#4A90D9',               bg: 'rgba(74,144,217,0.1)' },
    epic:      { label: 'Épique',     color: '#9B59B6',               bg: 'rgba(155,89,182,0.1)' },
    legendary: { label: 'Légendaire', color: '#F39C12',               bg: 'rgba(243,156,18,0.12)' },
};

const ROTATIONS = [1.2, -1.5, 0.8, -0.6, 1.8, -1.1];
const PIN_OFFSETS = ['48%', '30%', '60%', '40%', '55%', '35%'];

function useCountdown(expiresAt) {
    const [label, setLabel] = useState('');

    useEffect(() => {
        const update = () => {
            if (!expiresAt) { setLabel('—'); return; }
            const diff = new Date(expiresAt) - Date.now();
            if (diff <= 0) { setLabel('Expiré'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setLabel(h > 0 ? `${h}h ${String(m).padStart(2,'0')}m` : `${m}m ${String(s).padStart(2,'0')}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    return label;
}

function NoteCard({ drop, claimed, rotate, pinOffset }) {
    const timer = useCountdown(drop.expires_at);
    const meta  = TYPE_META[drop.type] || TYPE_META.crystals;

    const handleClaim = () => {
        router.post(route('drops.claim', drop.id), {}, { preserveScroll: true });
    };

    return (
        <div
            className="relative note-paper rounded-sm"
            style={{ transform: `rotate(${rotate}deg)`, padding: '20px' }}
        >
            {/* Thumbtack */}
            <div className="absolute -top-3 z-10" style={{ left: pinOffset, transform: 'translateX(-50%)' }}>
                <div
                    className="w-5 h-5 rounded-full border-2"
                    style={{
                        background: 'radial-gradient(circle at 35% 35%, #6b6b5a, #1a1a12)',
                        borderColor: '#0a0a06',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                />
            </div>

            <div className="flex justify-between items-start mb-2">
                <h3 className="font-headline text-lg font-black leading-tight" style={{ color: '#2a1a06', maxWidth: '65%' }}>
                    {drop.title}
                </h3>
                <div
                    className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(101,67,33,0.15)', border: '1px solid rgba(101,67,33,0.3)' }}
                >
                    <span className="material-symbols-outlined text-sm" style={{ color: '#6b4010', fontVariationSettings: "'FILL' 1" }}>
                        {meta.icon}
                    </span>
                    <span className="font-headline font-black text-sm" style={{ color: '#3d2005' }}>
                        {drop.value} {meta.label}
                    </span>
                </div>
            </div>

            {drop.description && (
                <p className="font-label text-[11px] leading-relaxed italic mb-4" style={{ color: '#5a3e1e' }}>
                    "{drop.description}"
                </p>
            )}

            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2" style={{ color: '#8B1A1A' }}>
                    <span className="material-symbols-outlined text-base">schedule</span>
                    <span className="font-label font-black text-xs uppercase tracking-wider">{timer}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-label text-[9px] text-[#5a3e1e]">
                        {drop.current_claims}/{drop.max_claims}
                    </span>
                    {claimed ? (
                        <span className="font-label text-[11px] font-black uppercase tracking-widest px-5 py-1.5 rounded-sm"
                              style={{ background: 'rgba(74,160,64,0.15)', color: G.forBrt, border: '1px solid rgba(74,160,64,0.3)' }}>
                            ✓ Réclamé
                        </span>
                    ) : (
                        <button
                            onClick={handleClaim}
                            className="font-label text-[11px] font-black uppercase tracking-widest px-5 py-1.5 rounded-sm transition-all active:scale-95 hover:brightness-110"
                            style={{
                                background: 'linear-gradient(135deg, #4a2a08, #2a1505)',
                                color: G.goldBrt,
                                border: '1px solid rgba(201,147,60,0.4)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            }}
                        >
                            Réclamer
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function CommanderRoster({ commanders }) {
    if (!commanders || commanders.length === 0) return null;
    const grouped = { legendary: [], epic: [], rare: [], common: [] };
    commanders.forEach(c => { if (grouped[c.rarity]) grouped[c.rarity].push(c); });

    return (
        <div className="mt-8">
            <h3 className="font-headline font-black text-[17px] mb-4 flex items-center gap-2" style={{ color: G.parch }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#F39C12', fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                Commandants disponibles dans les coffres
            </h3>
            <div className="grid grid-cols-1 gap-3">
                {Object.entries(grouped).map(([rarity, cmds]) => {
                    if (cmds.length === 0) return null;
                    const meta = RARITY_META[rarity];
                    return cmds.map(cmd => (
                        <div key={cmd.id} className="rounded-xl p-3 flex items-start gap-3"
                             style={{ background: meta.bg, border: `1px solid ${meta.color}33` }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                 style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}44` }}>
                                <span className="material-symbols-outlined text-[18px]"
                                      style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-headline font-black text-[13px]" style={{ color: G.parch }}>{cmd.name}</span>
                                    <span className="px-1.5 py-0.5 rounded-full font-label text-[8px] uppercase tracking-wider"
                                          style={{ background: `${meta.color}22`, color: meta.color }}>
                                        {meta.label}
                                    </span>
                                </div>
                                {cmd.title && <p className="font-label text-[9px] italic" style={{ color: meta.color }}>{cmd.title}</p>}
                                <p className="font-label text-[10px] mt-1 leading-relaxed" style={{ color: G.parchDm }}>{cmd.description}</p>
                            </div>
                        </div>
                    ));
                })}
            </div>
        </div>
    );
}

export default function DropsView({ activeDrops = [], userClaims = [], commanders = [] }) {
    const flash  = usePage().props.flash || {};
    const errors = usePage().props.errors || {};
    const claimedSet = new Set(userClaims);

    return (
        <GameLayout activeTab="drops">
            <Head title="Tableau des Butins" />

            {/* Flash */}
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

            {/* Header */}
            <div>
                <h2 className="font-headline text-3xl font-black flex items-center gap-3"
                    style={{ color: G.parch, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                    <span className="material-symbols-outlined text-3xl"
                          style={{ color: G.gold, filter: 'drop-shadow(0 0 8px rgba(201,147,60,0.5))' }}>
                        history_edu
                    </span>
                    Tableau des Butins
                </h2>
                <p className="font-label text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: G.parchDm }}>
                    {activeDrops.length} butin{activeDrops.length !== 1 ? 's' : ''} disponible{activeDrops.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Wooden Board */}
            <div
                className="wooden-board relative rounded-sm overflow-hidden"
                style={{
                    borderLeft: '10px solid #1a0e06', borderRight: '10px solid #1a0e06',
                    borderTop: '6px solid #241505',   borderBottom: '6px solid #160d04',
                    boxShadow: '0 16px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.03)',
                    minHeight: '320px',
                }}
            >
                {RIVET_POS.map((pos, i) => <div key={i} className="rivet absolute" style={pos} />)}

                <div className="p-6 space-y-9 py-8">
                    {activeDrops.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-50">
                            <span className="material-symbols-outlined text-5xl" style={{ color: G.gold }}>scroll</span>
                            <p className="font-headline font-bold text-base" style={{ color: G.parch }}>
                                Aucun butin disponible pour l'instant.
                            </p>
                            <p className="font-label text-[10px] uppercase tracking-widest" style={{ color: G.parchDm }}>
                                Revenez plus tard ou attendez un drop flash.
                            </p>
                        </div>
                    ) : (
                        activeDrops.map((drop, i) => (
                            <NoteCard
                                key={drop.id}
                                drop={drop}
                                claimed={claimedSet.has(drop.id)}
                                rotate={ROTATIONS[i % ROTATIONS.length]}
                                pinOffset={PIN_OFFSETS[i % PIN_OFFSETS.length]}
                            />
                        ))
                    )}
                </div>
            </div>

            <CommanderRoster commanders={commanders} />
        </GameLayout>
    );
}
