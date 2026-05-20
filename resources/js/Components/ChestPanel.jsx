import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';

const G = {
    gold:    '#C9933C',
    goldBrt: '#F0C060',
    parch:   '#F2E4C4',
    parchDm: 'rgba(242,228,196,0.45)',
    forge:   '#0A0705',
    card:    '#1E1208',
    border:  'rgba(201,147,60,0.18)',
};

const CHEST_META = {
    common:    { label: 'Commun',     emoji: '📦', color: '#A0A0A0', glow: 'rgba(160,160,160,0.6)', rays: '#C8C8C8' },
    rare:      { label: 'Rare',       emoji: '💜', color: '#9B59B6', glow: 'rgba(155,89,182,0.7)', rays: '#C39BD3' },
    legendary: { label: 'Légendaire', emoji: '✨', color: '#FFD700', glow: 'rgba(255,215,0,0.8)',  rays: '#FFF176' },
};

const RESOURCE_LABELS = {
    food:     { icon: '🌾', name: 'Nourriture' },
    wood:     { icon: '🪵', name: 'Bois' },
    metal:    { icon: '⚙️', name: 'Fer' },
    gold:     { icon: '🪙', name: 'Or' },
    crystals: { icon: '💎', name: 'Cristaux' },
};

// ── Animation Clash Royale ────────────────────────────────────────────────────

function Particle({ color, angle, distance, delay, size }) {
    return (
        <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: size, height: size,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 ${size * 2}px ${color}`,
            animation: `particle 0.9s ease-out ${delay}s forwards`,
            '--angle': `${angle}deg`,
            '--dist':  `${distance}px`,
            opacity: 0,
            transform: 'translate(-50%, -50%)',
        }} />
    );
}

function LightRay({ angle, color }) {
    return (
        <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: 3, height: 180,
            background: `linear-gradient(to top, ${color}, transparent)`,
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${angle}deg)`,
            animation: 'rayFade 1.5s ease-out forwards',
            opacity: 0,
        }} />
    );
}

function OpeningAnimation({ chest, contents, onDone }) {
    const meta  = CHEST_META[chest.chest_type];
    // phases: 'shake' → 'burst' → 'waiting' → 'reveal'
    const [phase, setPhase]         = useState('shake');
    const [showRewards, setRewards] = useState([]);

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('burst'), 1200);
        const t2 = setTimeout(() => setPhase('waiting'), 2000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Passe en reveal dès que les contenus arrivent ET qu'on est en waiting
    useEffect(() => {
        if (phase === 'waiting' && contents) setPhase('reveal');
    }, [phase, contents]);

    // Apparition progressive des récompenses
    useEffect(() => {
        if (phase !== 'reveal' || !contents) return;
        const rewards = Object.entries(contents)
            .filter(([k, v]) => k !== 'commander' && v > 0)
            .concat(contents.commander ? [['commander', contents.commander]] : []);
        rewards.forEach(([k, v], i) => {
            setTimeout(() => setRewards(r => [...r, { key: k, val: v }]), i * 200);
        });
    }, [phase]);

    const particles = Array.from({ length: 24 }, (_, i) => ({
        angle:    (i / 24) * 360,
        distance: 80 + Math.random() * 80,
        delay:    Math.random() * 0.3,
        size:     4 + Math.random() * 6,
        color:    i % 3 === 0 ? meta.rays : i % 3 === 1 ? G.goldBrt : meta.color,
    }));

    const rays = Array.from({ length: 12 }, (_, i) => (i / 12) * 360);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
             style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)' }}>

            <style>{`
                @keyframes chestShake {
                    0%,100% { transform: translateX(0) rotate(0deg) scale(1); }
                    10%     { transform: translateX(-8px) rotate(-5deg) scale(1.05); }
                    20%     { transform: translateX(8px)  rotate(5deg)  scale(1.07); }
                    30%     { transform: translateX(-10px) rotate(-7deg) scale(1.06); }
                    40%     { transform: translateX(10px)  rotate(7deg)  scale(1.09); }
                    50%     { transform: translateX(-8px) rotate(-5deg) scale(1.08); }
                    60%     { transform: translateX(8px)  rotate(5deg)  scale(1.1); }
                    70%     { transform: translateX(-6px) rotate(-4deg) scale(1.07); }
                    80%     { transform: translateX(6px)  rotate(4deg)  scale(1.05); }
                    90%     { transform: translateX(-3px) rotate(-2deg); }
                }
                @keyframes chestGlow {
                    0%,100% { box-shadow: 0 0 30px ${meta.glow}, 0 0 60px ${meta.glow}; }
                    50%     { box-shadow: 0 0 60px ${meta.glow}, 0 0 120px ${meta.glow}, 0 0 180px ${meta.glow}; }
                }
                @keyframes burst {
                    0%   { transform: translate(-50%,-50%) scale(0); opacity: 1; }
                    60%  { opacity: 0.8; }
                    100% { transform: translate(-50%,-50%) scale(6); opacity: 0; }
                }
                @keyframes rayFade {
                    0%   { opacity: 0; height: 0; }
                    20%  { opacity: 0.9; height: 180px; }
                    100% { opacity: 0; height: 180px; }
                }
                @keyframes particle {
                    0%   { transform: translate(-50%,-50%); opacity: 1; }
                    100% { transform: translate(calc(-50% + cos(var(--angle)) * var(--dist)), calc(-50% + sin(var(--angle)) * var(--dist))); opacity: 0; }
                }
                @keyframes chestPop {
                    0%   { transform: scale(1); opacity: 1; }
                    30%  { transform: scale(1.4); }
                    60%  { transform: scale(0.1); opacity: 0; }
                    100% { transform: scale(0); opacity: 0; }
                }
                @keyframes rewardFlyUp {
                    0%   { transform: translateY(60px) scale(0.4); opacity: 0; }
                    50%  { transform: translateY(-10px) scale(1.1); opacity: 1; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes shimmer {
                    0%,100% { filter: brightness(1); }
                    50%     { filter: brightness(1.5) drop-shadow(0 0 12px ${meta.color}); }
                }
                @keyframes pulseGlow {
                    0%,100% { opacity: 0.4; transform: translate(-50%,-50%) scale(1); }
                    50%     { opacity: 0.8; transform: translate(-50%,-50%) scale(1.15); }
                }
                @keyframes spinRays {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>

            {/* Phase shake */}
            {phase === 'shake' && (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Halo */}
                    <div style={{
                        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                        background: `radial-gradient(circle, ${meta.color}33 0%, transparent 70%)`,
                        animation: 'chestGlow 0.6s ease-in-out infinite, pulseGlow 0.6s ease-in-out infinite',
                        left: '50%', top: '50%',
                    }} />
                    <div style={{ fontSize: 96, animation: 'chestShake 0.18s ease-in-out infinite, shimmer 0.6s ease-in-out infinite', position: 'relative', zIndex: 2 }}>
                        {meta.emoji}
                    </div>
                    <div className="font-label text-xs uppercase tracking-widest mt-4"
                         style={{ color: meta.color, position: 'absolute', bottom: -48, whiteSpace: 'nowrap', animation: 'shimmer 1s ease-in-out infinite' }}>
                        Le coffre s'ouvre…
                    </div>
                </div>
            )}

            {/* Phase waiting (burst terminé, contenus pas encore arrivés) */}
            {phase === 'waiting' && (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 80, animation: 'shimmer 0.6s ease-in-out infinite' }}>{meta.emoji}</div>
                    <div className="font-label text-xs uppercase tracking-widest" style={{ color: meta.color, animation: 'shimmer 0.6s ease-in-out infinite' }}>
                        Chargement…
                    </div>
                </div>
            )}

            {/* Phase burst */}
            {phase === 'burst' && (
                <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Cercle d'explosion */}
                    <div style={{
                        position: 'absolute', width: 80, height: 80, borderRadius: '50%',
                        background: meta.color,
                        left: '50%', top: '50%',
                        animation: 'burst 0.8s ease-out forwards',
                    }} />
                    {/* Rayons */}
                    <div style={{ position: 'absolute', width: '100%', height: '100%', animation: 'spinRays 2s linear infinite' }}>
                        {rays.map((angle, i) => <LightRay key={i} angle={angle} color={meta.rays} />)}
                    </div>
                    {/* Particules */}
                    {particles.map((p, i) => <Particle key={i} {...p} />)}
                    {/* Coffre qui explose */}
                    <div style={{ fontSize: 96, animation: 'chestPop 0.6s ease-in forwards', position: 'relative', zIndex: 3 }}>
                        {meta.emoji}
                    </div>
                </div>
            )}

            {/* Phase reveal */}
            {phase === 'reveal' && (
                <div className="rounded-2xl max-w-sm w-full mx-4 overflow-hidden"
                     style={{ background: `linear-gradient(160deg, #1a0e04 0%, ${G.card} 100%)`, border: `2px solid ${meta.color}`, boxShadow: `0 0 80px ${meta.glow}, 0 0 200px ${meta.glow}44` }}>

                    {/* Header */}
                    <div className="py-6 text-center relative overflow-hidden">
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: `radial-gradient(ellipse at 50% 0%, ${meta.color}33 0%, transparent 70%)`,
                        }} />
                        <div className="text-5xl mb-2" style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}>
                            {meta.emoji}
                        </div>
                        <div className="font-headline text-2xl font-black" style={{ color: meta.color }}>
                            Coffre {meta.label} !
                        </div>
                    </div>

                    {/* Récompenses */}
                    <div className="px-6 pb-2 space-y-2">
                        {showRewards.map(({ key, val }, i) => {
                            if (key === 'commander') {
                                return (
                                    <div key={i} className="rounded-xl p-3 text-center"
                                         style={{ background: `${CHEST_META.legendary.color}15`, border: `1px solid ${CHEST_META.legendary.color}66`, animation: 'rewardFlyUp 0.4s ease-out' }}>
                                        <div className="text-3xl mb-1">{val?.emoji}</div>
                                        <div className="font-headline font-black text-sm" style={{ color: CHEST_META.legendary.color }}>
                                            {val?.name}
                                        </div>
                                        {val?.title && (
                                            <div className="font-label text-[10px] mt-0.5 opacity-70" style={{ color: CHEST_META.legendary.color }}>
                                                {val.title}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            const res = RESOURCE_LABELS[key];
                            if (!res || !val) return null;
                            return (
                                <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                                     style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${G.border}`, animation: 'rewardFlyUp 0.4s ease-out' }}>
                                    <span className="font-label text-sm" style={{ color: G.parch }}>
                                        {res.icon} {res.name}
                                    </span>
                                    <span className="font-headline font-black text-xl" style={{ color: G.goldBrt }}>
                                        +{val}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-6 pb-6 pt-4">
                        <button onClick={onDone}
                                className="w-full py-3 font-label text-sm font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 hover:brightness-125"
                                style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.rays})`, color: G.forge }}>
                            Superbe !
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── ChestCard ─────────────────────────────────────────────────────────────────

function ChestCard({ chest, onOpen }) {
    const meta = CHEST_META[chest.chest_type];
    return (
        <div className="rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-[1.03]"
             style={{ background: `${meta.color}11`, border: `1px solid ${meta.color}44` }}>
            <div className="text-4xl">{meta.emoji}</div>
            <div className="font-label text-[10px] font-black uppercase tracking-wider" style={{ color: meta.color }}>
                {meta.label}
            </div>
            <button onClick={() => onOpen(chest)}
                    className="w-full py-1.5 font-label text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 hover:brightness-125"
                    style={{ background: meta.color, color: G.forge }}>
                Ouvrir
            </button>
        </div>
    );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function ChestPanel({ chestCount = 0 }) {
    const [open, setOpen]                     = useState(false);
    const [chests, setChests]                 = useState([]);
    const [loading, setLoading]               = useState(false);
    const [opening, setOpening]               = useState(null);
    const [openedContents, setOpenedContents] = useState(null);
    const [localCount, setLocalCount]         = useState(chestCount);

    const flash = usePage().props.flash || {};

    useEffect(() => { setLocalCount(chestCount); }, [chestCount]);

    useEffect(() => {
        if (flash.chestOpened) setOpenedContents(flash.chestOpened);
    }, [flash.chestOpened]);

    const loadChests = async () => {
        setLoading(true);
        try {
            const res  = await fetch(route('chests.index'));
            const data = await res.json();
            const unopened = data.filter(c => c.status === 'unopened');
            setChests(unopened);
            setLocalCount(unopened.length);
        } catch {}
        setLoading(false);
    };

    const handleOpenPanel = () => { setOpen(true); loadChests(); };

    const handleOpenChest = (chest) => {
        setOpening(chest);
        router.post(route('chests.open', chest.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setChests(prev => prev.filter(c => c.id !== chest.id));
                setLocalCount(c => Math.max(0, c - 1));
            },
        });
    };

    const handleDone = () => { setOpening(null); setOpenedContents(null); };

    return (
        <>
            {/* Bouton flottant fixe en bas à droite */}
            <button onClick={handleOpenPanel}
                    className="fixed z-30 flex items-center gap-2 px-4 py-3 rounded-2xl font-label text-xs font-black uppercase tracking-wider transition-all hover:brightness-125 active:scale-95"
                    style={{
                        bottom: 28, right: 20,
                        background: localCount > 0 ? `linear-gradient(135deg, rgba(201,147,60,0.25), rgba(201,147,60,0.1))` : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${localCount > 0 ? G.gold : G.border}`,
                        color: localCount > 0 ? G.goldBrt : G.parchDm,
                        boxShadow: localCount > 0 ? `0 0 20px rgba(201,147,60,0.3)` : 'none',
                        animation: localCount > 0 ? 'chestPulse 2s ease-in-out infinite' : 'none',
                    }}>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    redeem
                </span>
                Coffres
                {localCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                          style={{ background: G.gold, color: G.forge }}>
                        {localCount}
                    </span>
                )}
            </button>

            <style>{`
                @keyframes chestPulse {
                    0%,100% { box-shadow: 0 0 20px rgba(201,147,60,0.3); }
                    50%     { box-shadow: 0 0 40px rgba(201,147,60,0.6), 0 0 80px rgba(201,147,60,0.2); }
                }
            `}</style>

            {/* Bottom sheet */}
            {open && (
                <div className="fixed inset-0 z-40 flex items-end"
                     onClick={() => setOpen(false)}
                     style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
                    <div className="w-full rounded-t-3xl p-6"
                         onClick={e => e.stopPropagation()}
                         style={{ background: 'linear-gradient(0deg, #0a0705 0%, #1e1208 100%)', border: `1px solid ${G.border}`, borderBottom: 'none', boxShadow: '0 -12px 60px rgba(0,0,0,0.8)', maxHeight: '70vh', overflowY: 'auto' }}>

                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-headline text-xl font-black" style={{ color: G.parch }}>
                                Mes Coffres
                            </h3>
                            <button onClick={() => setOpen(false)}
                                    className="material-symbols-outlined text-xl"
                                    style={{ color: G.parchDm }}>
                                close
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-10 font-label text-xs" style={{ color: G.parchDm }}>Chargement…</div>
                        ) : chests.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="text-4xl mb-3">📭</div>
                                <div className="font-label text-xs" style={{ color: G.parchDm }}>
                                    Aucun coffre à ouvrir.<br />Complète les jeux quotidiens pour en gagner !
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {chests.map(chest => (
                                    <ChestCard key={chest.id} chest={chest} onOpen={handleOpenChest} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Animation Clash Royale — démarre immédiatement au clic, contents arrive ensuite */}
            {opening && (
                <OpeningAnimation chest={opening} contents={openedContents} onDone={handleDone} />
            )}
        </>
    );
}
