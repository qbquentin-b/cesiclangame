import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, router, usePage } from '@inertiajs/react';

// ── Design tokens ─────────────────────────────────────────────────────────────
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
    border:  'rgba(201,147,60,0.18)',
    borderA: 'rgba(201,147,60,0.35)',
    emerald: '#2D7A4F',
    ruby:    '#9B2335',
    sapphire:'#1A3A6B',
};

// CSRF token helper
function getCsrf() {
    return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}

async function apiFetch(url, opts = {}) {
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrf(),
            'Accept': 'application/json',
            ...opts.headers,
        },
        ...opts,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');
    return data;
}

// ── Symbols definition ────────────────────────────────────────────────────────
const SYMBOLS = [
    { id: 'cristal',    emoji: '💎' },
    { id: 'couronne',   emoji: '👑' },
    { id: 'epee',       emoji: '⚔️' },
    { id: 'bouclier',   emoji: '🛡️' },
    { id: 'or',         emoji: '🪙' },
    { id: 'nourriture', emoji: '🌾' },
    { id: 'feu',        emoji: '🔥' },
];

function symbolEmoji(id) {
    return SYMBOLS.find(s => s.id === id)?.emoji ?? '❓';
}

// ── Slot Machine ──────────────────────────────────────────────────────────────

const BET_OPTIONS = [5, 10, 25, 50, 100, 250, 500];

function SlotMachine({ jackpot: initialJackpot, freeSpins: initialFreeSpins, crystals: initialCrystals }) {
    const [crystals, setCrystals]     = useState(initialCrystals);
    const [freeSpins, setFreeSpins]   = useState(initialFreeSpins);
    const [jackpot, setJackpot]       = useState(initialJackpot);
    const [bet, setBet]               = useState(10);
    const [spinning, setSpinning]     = useState(false);
    const [reels, setReels]           = useState([
        [SYMBOLS[4], SYMBOLS[2], SYMBOLS[5]],
        [SYMBOLS[1], SYMBOLS[3], SYMBOLS[0]],
        [SYMBOLS[5], SYMBOLS[4], SYMBOLS[2]],
    ]);
    const [animReels, setAnimReels]   = useState([null, null, null]);
    const [lastWin, setLastWin]       = useState(null);
    const [flashType, setFlashType]   = useState(null); // 'win'|'jackpot'|'free_spins'|null
    const intervalRefs                = useRef([]);
    const flashTimer                  = useRef(null);

    const stopAnimations = () => {
        intervalRefs.current.forEach(clearInterval);
        intervalRefs.current = [];
    };

    const spin = async () => {
        if (spinning) return;
        if (!freeSpins && crystals < bet) {
            alert('Pas assez de cristaux !');
            return;
        }

        setFlashType(null);
        setLastWin(null);
        setSpinning(true);

        // Start reel animations
        const animIntervals = [0, 1, 2].map(ri =>
            setInterval(() => {
                setAnimReels(prev => {
                    const next = [...prev];
                    next[ri] = [
                        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    ];
                    return next;
                });
            }, 80)
        );
        intervalRefs.current = animIntervals;

        try {
            const data = await apiFetch('/casino/slot/spin', {
                method: 'POST',
                body: JSON.stringify({ bet }),
            });

            // Stop animations after 1.5s
            await new Promise(r => setTimeout(r, 1500));
            stopAnimations();
            setAnimReels([null, null, null]);

            // Set final reels (convert server format to symbol objects)
            const finalReels = data.reels.map(col =>
                col.map(sym => ({ id: sym.id, emoji: sym.emoji }))
            );
            setReels(finalReels);

            setCrystals(data.crystals);
            setFreeSpins(data.free_spins);
            setJackpot(data.jackpot);
            setLastWin(data.win);
            router.reload({ only: ['auth'] });

            // Flash animation
            if (data.win.type === 'jackpot') {
                setFlashType('jackpot');
            } else if (data.win.type === 'free_spins') {
                setFlashType('free_spins');
            } else if (data.win.type === 'win' || data.win.type === 'small_win') {
                setFlashType('win');
            }

            flashTimer.current = setTimeout(() => setFlashType(null), 3000);
        } catch (err) {
            stopAnimations();
            setAnimReels([null, null, null]);
            alert(err.message);
        } finally {
            setSpinning(false);
        }
    };

    useEffect(() => {
        return () => {
            stopAnimations();
            if (flashTimer.current) clearTimeout(flashTimer.current);
        };
    }, []);

    const displayReels = animReels[0] ? animReels.map((a, i) => a ?? reels[i]) : reels;

    const flashColors = {
        win:        { border: G.goldBrt, glow: 'rgba(240,192,96,0.6)', bg: 'rgba(201,147,60,0.08)' },
        jackpot:    { border: '#FFD700', glow: 'rgba(255,215,0,0.9)',  bg: 'rgba(255,215,0,0.12)' },
        free_spins: { border: '#60A5FA', glow: 'rgba(96,165,250,0.7)', bg: 'rgba(96,165,250,0.08)' },
    };
    const fc = flashType ? flashColors[flashType] : null;

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Jackpot display */}
            <div className="w-full max-w-md rounded-2xl p-4 text-center relative overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, #1a0e04 0%, #2d1a06 100%)', border: `2px solid ${G.gold}`, boxShadow: `0 0 24px rgba(201,147,60,0.4)` }}>
                <div className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: G.gold }}>
                    JACKPOT PROGRESSIF
                </div>
                <div className="font-headline text-4xl font-black"
                     style={{ color: G.goldBrt, textShadow: `0 0 20px ${G.gold}, 0 0 40px rgba(201,147,60,0.5)` }}>
                    {jackpot.toLocaleString('fr-FR')} 💎
                </div>
            </div>

            {/* Slot machine cabinet */}
            <div className="rounded-3xl p-6 relative"
                 style={{
                     background: 'linear-gradient(180deg, #1a0a02 0%, #0d0501 100%)',
                     border: `3px solid ${fc ? fc.border : G.gold}`,
                     boxShadow: fc
                         ? `0 0 40px ${fc.glow}, inset 0 0 20px ${fc.bg}`
                         : `0 8px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(201,147,60,0.04)`,
                     transition: 'border-color 0.3s, box-shadow 0.3s',
                     minWidth: 340,
                 }}>

                {/* Info bar */}
                <div className="flex justify-between items-center mb-4 px-2">
                    <div className="text-center">
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: G.parchDm }}>Cristaux</div>
                        <div className="font-headline text-lg font-black" style={{ color: G.gold }}>{crystals.toLocaleString('fr-FR')} 💎</div>
                    </div>
                    {freeSpins > 0 && (
                        <div className="px-3 py-1 rounded-full text-sm font-bold animate-pulse"
                             style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid #60A5FA', color: '#60A5FA' }}>
                            {freeSpins} tours gratuits
                        </div>
                    )}
                    <div className="text-center">
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: G.parchDm }}>Mise</div>
                        <div className="font-headline text-lg font-black" style={{ color: G.parch }}>{bet} 💎</div>
                    </div>
                </div>

                {/* Reels */}
                <div className="flex gap-3 mb-4 p-3 rounded-xl relative"
                     style={{ background: 'rgba(0,0,0,0.7)', border: `1px solid rgba(201,147,60,0.2)` }}>

                    {/* Payline indicator */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center">
                        <div className="h-[2px] w-full opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${G.goldBrt}, transparent)` }} />
                    </div>

                    {[0, 1, 2].map(ri => {
                        const col = displayReels[ri] ?? reels[ri];
                        const isAnim = animReels[ri] !== null;
                        return (
                            <div key={ri} className="flex-1 flex flex-col gap-1 items-center overflow-hidden" style={{ minHeight: 180 }}>
                                {(col ?? []).map((sym, rowIdx) => (
                                    <div
                                        key={rowIdx}
                                        className="flex items-center justify-center w-full rounded-lg text-3xl"
                                        style={{
                                            height: 56,
                                            background: rowIdx === 1
                                                ? 'rgba(201,147,60,0.12)'
                                                : 'rgba(0,0,0,0.3)',
                                            border: rowIdx === 1
                                                ? `1px solid rgba(201,147,60,0.3)`
                                                : '1px solid rgba(255,255,255,0.04)',
                                            transition: isAnim ? 'none' : 'all 0.2s',
                                            filter: rowIdx !== 1 ? 'brightness(0.6)' : 'none',
                                        }}
                                    >
                                        {sym?.emoji ?? '?'}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>

                {/* Win message */}
                <div className="min-h-[40px] flex items-center justify-center mb-3">
                    {lastWin && (
                        <div className="text-center animate-bounce">
                            {lastWin.type === 'jackpot' && (
                                <div className="font-headline text-2xl font-black" style={{ color: '#FFD700', textShadow: '0 0 20px #FFD700' }}>
                                    JACKPOT ! +{lastWin.amount.toLocaleString('fr-FR')} 💎
                                </div>
                            )}
                            {lastWin.type === 'win' && (
                                <div className="font-headline text-xl font-black" style={{ color: G.goldBrt }}>
                                    Victoire ×{lastWin.multiplier} ! +{lastWin.amount.toLocaleString('fr-FR')} 💎
                                </div>
                            )}
                            {lastWin.type === 'small_win' && (
                                <div className="font-headline text-lg font-bold" style={{ color: G.gold }}>
                                    +{lastWin.amount.toLocaleString('fr-FR')} 💎
                                </div>
                            )}
                            {lastWin.type === 'free_spins' && (
                                <div className="font-headline text-xl font-black" style={{ color: '#60A5FA' }}>
                                    +{lastWin.free_spins} Tours Gratuits !
                                </div>
                            )}
                            {lastWin.type === 'loss' && (
                                <div className="font-label text-sm" style={{ color: 'rgba(242,228,196,0.35)' }}>
                                    Pas de chance…
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bet selector */}
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {BET_OPTIONS.map(b => (
                        <button
                            key={b}
                            onClick={() => setBet(b)}
                            disabled={spinning}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                            style={{
                                background: bet === b ? G.gold : 'rgba(201,147,60,0.08)',
                                border: `1px solid ${bet === b ? G.gold : 'rgba(201,147,60,0.25)'}`,
                                color: bet === b ? G.forge : G.parchDm,
                            }}
                        >
                            {b}
                        </button>
                    ))}
                </div>

                {/* Spin button */}
                <button
                    onClick={spin}
                    disabled={spinning}
                    className="w-full py-4 rounded-xl font-headline font-black text-xl uppercase tracking-widest transition-all relative overflow-hidden"
                    style={{
                        background: spinning
                            ? 'rgba(201,147,60,0.2)'
                            : freeSpins > 0
                                ? 'linear-gradient(135deg, #1A3A6B 0%, #2A5AA0 100%)'
                                : `linear-gradient(135deg, #7A4A10 0%, ${G.gold} 50%, #7A4A10 100%)`,
                        color: spinning ? G.parchDm : '#fff',
                        border: `2px solid ${spinning ? 'rgba(201,147,60,0.2)' : freeSpins > 0 ? '#60A5FA' : G.goldBrt}`,
                        boxShadow: spinning ? 'none' : freeSpins > 0
                            ? '0 4px 20px rgba(96,165,250,0.4)'
                            : `0 4px 20px rgba(201,147,60,0.4)`,
                        cursor: spinning ? 'not-allowed' : 'pointer',
                    }}
                >
                    {spinning ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="inline-block w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                                  style={{ borderColor: `${G.gold} transparent transparent transparent` }} />
                            En cours…
                        </span>
                    ) : freeSpins > 0 ? (
                        `SPIN GRATUIT (${freeSpins})`
                    ) : (
                        'LANCER'
                    )}
                </button>
            </div>

            {/* Paytable */}
            <div className="w-full max-w-md rounded-xl p-4"
                 style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${G.border}` }}>
                <div className="text-center text-xs uppercase tracking-widest font-bold mb-3" style={{ color: G.gold }}>
                    Tableau des gains (mise × multiplicateur)
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                        { sym: 'cristal',    label: 'Jackpot progressif' },
                        { sym: 'couronne',   label: '×30' },
                        { sym: 'epee',       label: '×15' },
                        { sym: 'bouclier',   label: '×8' },
                        { sym: 'or',         label: '×4' },
                        { sym: 'nourriture', label: '×2' },
                        { sym: 'feu',        label: '+8 tours gratuits' },
                    ].map(row => (
                        <div key={row.sym} className="flex items-center gap-2 px-2 py-1 rounded"
                             style={{ background: 'rgba(201,147,60,0.04)' }}>
                            <span className="text-xl">{symbolEmoji(row.sym)}</span>
                            <span className="text-xl">{symbolEmoji(row.sym)}</span>
                            <span className="text-xl">{symbolEmoji(row.sym)}</span>
                            <span className="ml-auto text-xs font-bold" style={{ color: G.goldBrt }}>{row.label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 px-2 py-1 rounded col-span-2"
                         style={{ background: 'rgba(201,147,60,0.04)' }}>
                        <span className="text-sm" style={{ color: G.parchDm }}>Paire = ×0.5 mise</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Blackjack ─────────────────────────────────────────────────────────────────

function CardDisplay({ card }) {
    if (!card) return null;

    if (card.hidden) {
        return (
            <div className="flex items-center justify-center w-12 h-18 rounded-lg text-2xl font-black"
                 style={{ background: 'linear-gradient(135deg, #1a1a6e, #2a2a9e)', border: '2px solid #4444cc', minHeight: 72, width: 48 }}>
                🂠
            </div>
        );
    }

    const isRed = ['♥', '♦'].includes(card.suit);
    return (
        <div className="flex flex-col items-center justify-between p-1 rounded-lg font-black text-sm"
             style={{
                 background: '#fff',
                 border: '2px solid #ccc',
                 minHeight: 72,
                 width: 48,
                 color: isRed ? '#CC0000' : '#111',
             }}>
            <div className="self-start text-xs leading-none">{card.rank}{card.suit}</div>
            <div className="text-xl">{card.suit}</div>
            <div className="self-end text-xs leading-none rotate-180">{card.rank}{card.suit}</div>
        </div>
    );
}

function HandDisplay({ hand = [], total, label }) {
    return (
        <div className="flex flex-col items-center gap-2">
            {label && <div className="text-xs uppercase tracking-wider font-bold" style={{ color: G.parchDm }}>{label}</div>}
            <div className="flex gap-1 flex-wrap justify-center">
                {hand.map((card, i) => <CardDisplay key={i} card={card} />)}
                {hand.length === 0 && <div className="text-sm" style={{ color: G.parchDm }}>—</div>}
            </div>
            {total !== undefined && hand.length > 0 && !hand.some(c => c?.hidden) && (
                <div className="text-sm font-bold px-3 py-0.5 rounded-full"
                     style={{ background: 'rgba(201,147,60,0.15)', color: G.gold }}>
                    {total}
                </div>
            )}
        </div>
    );
}

const STATUS_LABELS = {
    waiting:    { label: 'En attente',   color: G.parchDm },
    bet_placed: { label: 'Misé',         color: G.gold },
    playing:    { label: 'En jeu',       color: '#4ADE80' },
    standing:   { label: 'Reste',        color: '#60A5FA' },
    busted:     { label: 'Perdu !',      color: G.crimBrt },
    blackjack:  { label: 'Blackjack !',  color: '#FFD700' },
    won:        { label: 'Gagné !',      color: '#4ADE80' },
    lost:       { label: 'Perdu',        color: G.crimBrt },
    push:       { label: 'Égalité',      color: G.parchDm },
};

function PlayerRow({ player, isMe, isCurrentTurn }) {
    const st = STATUS_LABELS[player.status] ?? { label: player.status, color: G.parchDm };
    return (
        <div className="rounded-xl p-3"
             style={{
                 background: isCurrentTurn ? 'rgba(201,147,60,0.12)' : 'rgba(0,0,0,0.3)',
                 border: `1px solid ${isCurrentTurn ? G.gold : 'rgba(201,147,60,0.1)'}`,
             }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: isMe ? G.goldBrt : G.parch }}>
                        {isMe ? '👤 ' : ''}{player.username}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: `${st.color}22`, color: st.color, border: `1px solid ${st.color}44` }}>
                        {st.label}
                    </span>
                    {isCurrentTurn && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold animate-pulse"
                              style={{ background: 'rgba(201,147,60,0.2)', color: G.gold, border: `1px solid ${G.gold}` }}>
                            Son tour
                        </span>
                    )}
                </div>
                <div className="text-sm font-bold" style={{ color: G.gold }}>
                    Mise: {player.bet} 💎
                </div>
            </div>
            <HandDisplay hand={player.hand ?? []} total={player.total} />
        </div>
    );
}

function BlackjackGame({ tableId, onLeave, myUserId }) {
    const [state, setState] = useState(null);
    const [betInput, setBetInput] = useState(50);
    const [loading, setLoading] = useState('');
    const [error, setError]   = useState('');
    const pollRef = useRef(null);

    const fetchState = useCallback(async () => {
        try {
            const data = await apiFetch(`/casino/blackjack/${tableId}/state`);
            setState(data);
        } catch (e) {
            setError(e.message);
        }
    }, [tableId]);

    useEffect(() => {
        fetchState();
        pollRef.current = setInterval(fetchState, 3000);
        return () => clearInterval(pollRef.current);
    }, [fetchState]);

    const doAction = async (url, method = 'POST', body = {}) => {
        setLoading(url);
        setError('');
        try {
            await apiFetch(url, { method, body: method !== 'GET' ? JSON.stringify(body) : undefined });
            await fetchState();
            router.reload({ only: ['auth'] });
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading('');
        }
    };

    const handleLeave = async () => {
        await doAction(`/casino/blackjack/${tableId}/leave`);
        onLeave();
    };

    const handleRestart = async () => {
        await doAction(`/casino/blackjack/${tableId}/restart`);
    };

    if (!state) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 rounded-full animate-spin"
                     style={{ borderColor: `${G.gold} transparent transparent transparent` }} />
            </div>
        );
    }

    const { table, players, my_player, is_my_turn } = state;
    const isCreator = table.created_by === myUserId;
    const status    = table.status;

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="font-headline text-xl font-black" style={{ color: G.parch }}>
                        Table de Blackjack
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-bold uppercase"
                          style={{ background: 'rgba(201,147,60,0.12)', color: G.gold, border: `1px solid ${G.borderA}` }}>
                        {status}
                    </span>
                </div>
                <button
                    onClick={handleLeave}
                    disabled={['playing', 'betting', 'dealer_turn'].includes(status)}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                    style={{
                        background: 'rgba(139,26,26,0.15)',
                        border: '1px solid rgba(139,26,26,0.4)',
                        color: '#EF4444',
                        opacity: ['playing', 'betting', 'dealer_turn'].includes(status) ? 0.4 : 1,
                    }}
                >
                    Quitter
                </button>
            </div>

            {error && (
                <div className="rounded-lg px-4 py-2 text-sm font-bold"
                     style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(139,26,26,0.5)', color: '#EF4444' }}>
                    {error}
                </div>
            )}

            {/* Dealer area */}
            <div className="rounded-2xl p-4"
                 style={{ background: 'linear-gradient(135deg, #0d2a1a 0%, #0a1f12 100%)', border: `1px solid rgba(45,122,79,0.4)` }}>
                <HandDisplay
                    hand={table.dealer_hand ?? []}
                    total={status !== 'playing' ? table.dealer_total : undefined}
                    label="Croupier"
                />
            </div>

            {/* Players */}
            <div className="flex flex-col gap-3">
                {players.map(p => (
                    <PlayerRow
                        key={p.id}
                        player={p}
                        isMe={p.user_id === myUserId}
                        isCurrentTurn={status === 'playing' && Number(table.current_seat) === Number(p.seat)}
                    />
                ))}
            </div>

            {/* Action panel */}
            <div className="rounded-xl p-4"
                 style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${G.border}` }}>

                {/* Waiting — creator can start */}
                {status === 'waiting' && isCreator && (
                    <button
                        onClick={() => doAction(`/casino/blackjack/${tableId}/start`)}
                        disabled={!!loading}
                        className="w-full py-3 rounded-xl font-headline font-black text-lg uppercase tracking-wide"
                        style={{ background: `linear-gradient(135deg, #2D7A4F, #4ADE80)`, color: '#fff', border: 'none' }}
                    >
                        Démarrer la partie
                    </button>
                )}

                {status === 'waiting' && !isCreator && (
                    <div className="text-center py-2 font-bold" style={{ color: G.parchDm }}>
                        En attente du créateur…
                    </div>
                )}

                {/* Betting phase */}
                {status === 'betting' && my_player?.status === 'waiting' && (
                    <div className="flex flex-col gap-3">
                        <div className="text-center font-bold" style={{ color: G.parch }}>Placez votre mise</div>
                        <div className="flex gap-2 flex-wrap justify-center">
                            {[10, 25, 50, 100, 250, 500].map(v => (
                                <button key={v} onClick={() => setBetInput(v)}
                                        className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                                        style={{
                                            background: betInput === v ? G.gold : 'rgba(201,147,60,0.08)',
                                            border: `1px solid ${betInput === v ? G.gold : G.border}`,
                                            color: betInput === v ? G.forge : G.parchDm,
                                        }}>
                                    {v}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => doAction(`/casino/blackjack/${tableId}/bet`, 'POST', { bet: betInput })}
                            disabled={!!loading}
                            className="w-full py-3 rounded-xl font-headline font-black text-lg"
                            style={{ background: `linear-gradient(135deg, #7A4A10, ${G.gold})`, color: '#fff', border: 'none' }}
                        >
                            Miser {betInput} 💎
                        </button>
                    </div>
                )}

                {status === 'betting' && my_player?.status === 'bet_placed' && (
                    <div className="text-center py-2 font-bold" style={{ color: G.gold }}>
                        Mise placée — en attente des autres joueurs…
                    </div>
                )}

                {/* Playing phase */}
                {status === 'playing' && is_my_turn && my_player?.status === 'playing' && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => doAction(`/casino/blackjack/${tableId}/hit`)}
                            disabled={!!loading}
                            className="flex-1 py-3 rounded-xl font-headline font-black text-lg uppercase"
                            style={{ background: 'linear-gradient(135deg, #1A3A6B, #2A5AA0)', color: '#fff', border: '2px solid #60A5FA' }}
                        >
                            Tirer (Hit)
                        </button>
                        <button
                            onClick={() => doAction(`/casino/blackjack/${tableId}/stand`)}
                            disabled={!!loading}
                            className="flex-1 py-3 rounded-xl font-headline font-black text-lg uppercase"
                            style={{ background: 'linear-gradient(135deg, #7A2A2A, #C53030)', color: '#fff', border: '2px solid #EF4444' }}
                        >
                            Rester (Stand)
                        </button>
                    </div>
                )}

                {status === 'playing' && !is_my_turn && my_player && (
                    <div className="text-center py-2 font-bold" style={{ color: G.parchDm }}>
                        En attente des autres joueurs…
                    </div>
                )}

                {status === 'finished' && (
                    <div className="text-center">
                        <div className="font-headline text-2xl font-black mb-3" style={{ color: G.goldBrt }}>
                            Partie terminée
                        </div>
                        {my_player && (
                            <div className="text-lg font-bold mb-3"
                                 style={{ color: STATUS_LABELS[my_player.status]?.color ?? G.parch }}>
                                {STATUS_LABELS[my_player.status]?.label ?? my_player.status}
                            </div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleRestart}
                                className="px-6 py-2 rounded-xl font-bold"
                                style={{ background: G.emerald, color: '#fff', border: 'none' }}
                            >
                                🔄 Rejouer
                            </button>
                            <button
                                onClick={handleLeave}
                                className="px-6 py-2 rounded-xl font-bold"
                                style={{ background: 'rgba(255,255,255,0.08)', color: G.parchDm, border: `1px solid ${G.border}` }}
                            >
                                Quitter
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function BlackjackLobby({ myTableId, myUserId, crystals }) {
    const [tables, setTables]       = useState([]);
    const [activeTable, setActive]  = useState(myTableId ?? null);
    const [loading, setLoading]     = useState('');
    const [error, setError]         = useState('');
    const pollRef = useRef(null);

    const fetchTables = useCallback(async () => {
        try {
            const data = await apiFetch('/casino/blackjack/tables');
            setTables(data);
        } catch (e) { /* silent */ }
    }, []);

    useEffect(() => {
        if (!activeTable) {
            fetchTables();
            pollRef.current = setInterval(fetchTables, 5000);
        }
        return () => clearInterval(pollRef.current);
    }, [activeTable, fetchTables]);

    const createTable = async () => {
        setLoading('create');
        setError('');
        try {
            const data = await apiFetch('/casino/blackjack/create', { method: 'POST' });
            setActive(data.table_id);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading('');
        }
    };

    const joinTable = async (tableId) => {
        setLoading(tableId);
        setError('');
        try {
            await apiFetch(`/casino/blackjack/${tableId}/join`, { method: 'POST' });
            setActive(tableId);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading('');
        }
    };

    if (activeTable) {
        return (
            <BlackjackGame
                tableId={activeTable}
                myUserId={myUserId}
                onLeave={() => { setActive(null); fetchTables(); }}
            />
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {error && (
                <div className="rounded-lg px-4 py-2 text-sm font-bold"
                     style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(139,26,26,0.5)', color: '#EF4444' }}>
                    {error}
                </div>
            )}

            <button
                onClick={createTable}
                disabled={loading === 'create'}
                className="w-full py-4 rounded-2xl font-headline font-black text-xl uppercase tracking-wide"
                style={{
                    background: `linear-gradient(135deg, #2D7A4F 0%, #4ADE80 100%)`,
                    color: '#fff',
                    border: '2px solid #4ADE80',
                    boxShadow: '0 4px 20px rgba(74,222,128,0.3)',
                }}
            >
                {loading === 'create' ? 'Création…' : '+ Créer une table'}
            </button>

            <div>
                <div className="font-headline font-bold text-lg mb-3" style={{ color: G.parch }}>
                    Tables disponibles ({tables.length})
                </div>

                {tables.length === 0 && (
                    <div className="text-center py-8 font-bold" style={{ color: G.parchDm }}>
                        Aucune table ouverte. Créez la première !
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {tables.map(t => (
                        <div key={t.id} className="flex items-center justify-between rounded-xl p-4"
                             style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${G.border}` }}>
                            <div>
                                <div className="font-bold text-sm mb-1" style={{ color: G.parch }}>
                                    Table · {t.player_count}/{t.max_players} joueurs
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                    {t.players.map((p, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 rounded"
                                              style={{ background: 'rgba(201,147,60,0.1)', color: G.gold }}>
                                            {p.username}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-xs mt-1 uppercase font-bold"
                                     style={{ color: t.status === 'waiting' ? '#4ADE80' : G.parchDm }}>
                                    {t.status === 'waiting' ? 'Ouverte' : t.status}
                                </div>
                            </div>
                            {t.status === 'waiting' && t.player_count < t.max_players && (
                                <button
                                    onClick={() => joinTable(t.id)}
                                    disabled={loading === t.id}
                                    className="px-4 py-2 rounded-xl font-bold text-sm"
                                    style={{
                                        background: G.gold,
                                        color: G.forge,
                                        border: 'none',
                                    }}
                                >
                                    {loading === t.id ? '…' : 'Rejoindre'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Rules */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${G.border}` }}>
                <div className="font-bold text-sm mb-2" style={{ color: G.gold }}>Règles du Blackjack</div>
                <ul className="text-xs space-y-1" style={{ color: G.parchDm }}>
                    <li>• Approchez 21 sans le dépasser pour battre le croupier</li>
                    <li>• Blackjack (As + figure) paie ×2.5</li>
                    <li>• Victoire paie ×2 la mise</li>
                    <li>• Égalité : mise remboursée</li>
                    <li>• Le croupier s'arrête à 17 ou plus</li>
                    <li>• 1 à 4 joueurs par table</li>
                </ul>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CasinoView({ jackpot, free_spins, crystals, my_table_id }) {
    const [tab, setTab] = useState(my_table_id ? 'blackjack' : 'slots');
    const { auth } = usePage().props;
    const userId = auth?.user?.id ?? null;

    const tabs = [
        { id: 'slots',     label: 'Machine à Sous',   icon: '🎰' },
        { id: 'blackjack', label: 'Black Jack',        icon: '🃏' },
    ];

    return (
        <GameLayout activeTab="casino">
            <Head title="Casino" />

            <div className="max-w-4xl mx-auto">
                {/* Page header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <span className="text-4xl">🎲</span>
                        <div>
                            <h1 className="font-headline text-3xl font-black" style={{ color: G.goldBrt }}>
                                Casino Royal
                            </h1>
                            <p className="text-sm" style={{ color: G.parchDm }}>
                                Tentez votre chance et remportez des cristaux
                            </p>
                        </div>
                    </div>

                    {/* Crystals display */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mt-2"
                         style={{ background: 'rgba(201,147,60,0.08)', border: `1px solid ${G.border}` }}>
                        <span className="text-lg">💎</span>
                        <span className="font-headline font-black" style={{ color: G.gold }}>
                            {crystals.toLocaleString('fr-FR')} cristaux
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 rounded-xl p-1.5"
                     style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${G.border}` }}>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-headline font-bold text-sm transition-all"
                            style={{
                                background: tab === t.id ? 'rgba(201,147,60,0.12)' : 'transparent',
                                border: `1px solid ${tab === t.id ? G.gold : 'transparent'}`,
                                color: tab === t.id ? G.parch : G.parchDm,
                                boxShadow: tab === t.id ? `0 0 12px rgba(201,147,60,0.2)` : 'none',
                            }}
                        >
                            <span className="text-xl">{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="rounded-2xl p-6"
                     style={{ background: 'rgba(10,7,5,0.8)', border: `1px solid ${G.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>

                    {tab === 'slots' && (
                        <SlotMachine
                            jackpot={jackpot}
                            freeSpins={free_spins}
                            crystals={crystals}
                        />
                    )}

                    {tab === 'blackjack' && (
                        <BlackjackLobby
                            myTableId={my_table_id}
                            myUserId={userId}
                            crystals={crystals}
                        />
                    )}
                </div>
            </div>
        </GameLayout>
    );
}
