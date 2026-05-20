import React, { useState, useEffect } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import ChestPanel from '@/Components/ChestPanel';
import { Head, Link, router, usePage } from '@inertiajs/react';

const G = {
    gold:    '#C9933C',
    goldDim: '#8B6914',
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

const CLAN_RANK_LABELS = {
    leader:  'Chef',
    officer: 'Officier',
    member:  'Membre',
};

const DROP_TYPE_ICONS = {
    crystals:     'diamond',
    resource:     'inventory_2',
    weapon_plan:  'gavel',
    boost:        'bolt',
};

function StatCard({ icon, value, label, accentColor }) {
    return (
        <div
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{
                background: `linear-gradient(135deg, ${G.cardLt} 0%, ${G.card} 100%)`,
                border: `1px solid ${G.border}`,
            }}
        >
            <span
                className="material-symbols-outlined text-[26px]"
                style={{ color: accentColor, fontVariationSettings: "'FILL' 1", filter: `drop-shadow(0 0 6px ${accentColor}55)` }}
            >
                {icon}
            </span>
            <div className="font-headline text-xl font-black" style={{ color: G.parch }}>{value}</div>
            <div className="font-label text-[9px] uppercase tracking-widest" style={{ color: G.parchDm }}>{label}</div>
        </div>
    );
}

function DropCard({ drop, claimed, onClaim }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const update = () => {
            if (!drop.expires_at) { setTimeLeft('—'); return; }
            const diff = new Date(drop.expires_at) - Date.now();
            if (diff <= 0) { setTimeLeft('Expiré'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [drop.expires_at]);

    const pct = Math.round((drop.current_claims / drop.max_claims) * 100);
    const icon = DROP_TYPE_ICONS[drop.type] || 'redeem';

    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${G.cardLt} 0%, ${G.card} 100%)`, border: `1px solid ${G.border}` }}
        >
            <div className="p-4 flex items-center gap-3">
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(201,147,60,0.08)', border: `1px solid rgba(201,147,60,0.25)` }}
                >
                    <span className="material-symbols-outlined text-xl" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>
                        {icon}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-headline text-sm font-bold truncate" style={{ color: G.parch }}>{drop.title}</div>
                    <div className="font-label text-[10px] mt-0.5" style={{ color: G.parchDm }}>
                        Valeur : {drop.value} · {drop.current_claims}/{drop.max_claims} réclamés
                    </div>
                    <div className="mt-2 h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8B1A1A, #C53030)' }} />
                    </div>
                </div>
            </div>
            <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(201,147,60,0.08)', background: 'rgba(0,0,0,0.2)' }}
            >
                <span className="font-label text-xs flex items-center gap-1.5" style={{ color: G.crimBrt }}>
                    <span className="material-symbols-outlined text-xs">timer</span>
                    {timeLeft}
                </span>
                {claimed ? (
                    <span className="font-label text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(74,160,64,0.15)', color: G.forBrt }}>
                        Réclamé ✓
                    </span>
                ) : (
                    <button
                        onClick={() => onClaim(drop.id)}
                        className="font-label text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-lg transition-all hover:brightness-125 active:scale-95"
                        style={{ background: G.gold, color: G.forge }}
                    >
                        Réclamer
                    </button>
                )}
            </div>
        </div>
    );
}

function WarEntry({ war, userClanId }) {
    const clanA = war.clan_a;
    const clanB = war.clan_b;
    const won   = war.winner_id && war.winner_id === userClanId;
    const lost  = war.winner_id && war.winner_id !== userClanId;
    const isDone = war.status === 'completed' || war.status === 'finished';

    const resultLabel = !isDone ? 'En cours' : won ? 'Victoire' : lost ? 'Défaite' : 'Nul';
    const resultColor = !isDone ? G.gold : won ? G.forBrt : lost ? G.crimBrt : G.parchDm;

    return (
        <div
            className="p-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #1a1208 0%, #120c06 100%)' }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
                    style={{
                        background: won ? 'rgba(45,90,39,0.15)' : 'rgba(139,26,26,0.12)',
                        border: `1px solid ${won ? 'rgba(74,160,64,0.3)' : 'rgba(197,48,48,0.3)'}`,
                        color: won ? G.forBrt : G.crimBrt,
                    }}
                >
                    VS
                </div>
                <div>
                    <div className="font-headline font-bold text-sm" style={{ color: G.parch }}>
                        {clanA?.name ?? '—'} <span style={{ color: G.parchDm }}>vs</span> {clanB?.name ?? '—'}
                    </div>
                    <div className="font-label text-[10px] uppercase tracking-wide mt-0.5" style={{ color: G.parchDm }}>
                        {war.score_a} – {war.score_b} · {resultLabel}
                    </div>
                </div>
            </div>
            <div
                className="font-headline font-black text-sm px-3 py-1 rounded-lg"
                style={{ background: `${resultColor}15`, color: resultColor }}
            >
                {resultLabel}
            </div>
        </div>
    );
}

export default function Dashboard({ activeDrops = [], userClaims = [], recentWars = [], chestCount = 0 }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const clan = user.clan;

    const initials = (user.username || '?').slice(0, 2).toUpperCase();

    const handleClaim = (dropId) => {
        router.post(`/drops/claim/${dropId}`, {}, { preserveScroll: true });
    };

    return (
        <GameLayout activeTab="hub">
            <Head title="Hub" />
            <ChestPanel chestCount={chestCount} />
            {/* ── Player Identity ── */}
            <section className="mb-6">
                <div
                    className="rounded-2xl p-5"
                    style={{
                        background: `linear-gradient(135deg, ${G.cardLt} 0%, ${G.card} 65%, #1a1005 100%)`,
                        border: `1px solid ${G.borderA}`,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                >
                    <div className="flex items-center gap-5">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center font-headline font-black text-xl"
                                style={{
                                    background: 'rgba(201,147,60,0.12)',
                                    border: `2px solid ${G.gold}`,
                                    color: G.gold,
                                    boxShadow: `0 0 20px rgba(201,147,60,0.25)`,
                                }}
                            >
                                {initials}
                            </div>
                            <div
                                className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full font-black text-[10px] leading-none"
                                style={{ background: G.gold, color: G.forge }}
                            >
                                {user.level ?? 1}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h2 className="font-headline text-2xl font-black" style={{ color: G.parch }}>
                                {user.username}
                            </h2>
                            <p className="font-label text-[10px] uppercase tracking-widest flex items-center gap-1 mt-1"
                               style={{ color: `${G.gold}aa` }}>
                                <span className="material-symbols-outlined text-[11px]">shield</span>
                                {clan ? `${clan.name} · ${CLAN_RANK_LABELS[user.clan_rank] ?? user.clan_rank}` : 'Sans clan'}
                            </p>
                        </div>

                        {/* Resources rapides */}
                        <div className="flex items-center gap-4 shrink-0">
                            {[
                                { icon: 'forest',    val: user.wood,      color: '#8B5E3C', label: 'Bois' },
                                { icon: 'settings',  val: user.metal,     color: '#607D8B', label: 'Métal' },
                                { icon: 'grain',     val: user.food,      color: '#c8a227', label: 'Nourriture' },
                                { icon: 'paid',      val: user.gold,      color: '#D4A017', label: 'Or' },
                            ].map(r => (
                                <div key={r.label} className="flex flex-col items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[18px]"
                                          style={{ color: r.color, fontVariationSettings: "'FILL' 1" }}>
                                        {r.icon}
                                    </span>
                                    <span className="font-headline text-xs font-black" style={{ color: G.parch }}>
                                        {(r.val ?? 0).toLocaleString('fr-FR')}
                                    </span>
                                    <span className="font-label text-[8px] uppercase" style={{ color: G.parchDm }}>
                                        {r.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats Grid ── */}
            <section className="grid grid-cols-4 gap-3 mb-6">
                <StatCard icon="diamond"           value={(user.crystals ?? 0).toLocaleString('fr-FR')} label="Cristaux"    accentColor={G.gold} />
                <StatCard icon="swords"            value={(user.war_points ?? 0).toLocaleString('fr-FR')} label="Points de guerre" accentColor={G.crimBrt} />
                <StatCard icon="military_tech"     value={user.global_rank ? `#${user.global_rank}` : '—'} label="Rang global" accentColor={G.gold} />
                <StatCard icon="castle"            value={clan ? `${clan.name} Nv.${clan.level ?? 1}` : '—'} label="Clan"   accentColor={G.goldDim} />
            </section>

            {/* ── 2 colonnes : Drops + Guerres ── */}
            <div className="grid grid-cols-2 gap-6">

                {/* Drops */}
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-headline text-[16px] font-black" style={{ color: G.parch }}>Butins Actifs</h3>
                        <Link href="/drops" className="font-label text-[10px] font-bold uppercase tracking-widest hover:brightness-125 transition-all"
                              style={{ color: G.gold }}>
                            Voir tout
                        </Link>
                    </div>
                    {activeDrops.length === 0 ? (
                        <div className="rounded-xl p-8 text-center" style={{ border: `1px dashed ${G.border}` }}>
                            <span className="material-symbols-outlined text-4xl block mb-2" style={{ color: G.parchDm }}>inbox</span>
                            <p className="font-label text-sm" style={{ color: G.parchDm }}>Aucun butin actif</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeDrops.map(drop => (
                                <DropCard
                                    key={drop.id}
                                    drop={drop}
                                    claimed={userClaims.includes(drop.id)}
                                    onClaim={handleClaim}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Guerres */}
                <section>
                    <h3 className="font-headline text-[16px] font-black mb-3" style={{ color: G.parch }}>
                        Journal de Guerre
                    </h3>
                    {recentWars.length === 0 ? (
                        <div className="rounded-xl p-8 text-center" style={{ border: `1px dashed ${G.border}` }}>
                            <span className="material-symbols-outlined text-4xl block mb-2" style={{ color: G.parchDm }}>swords</span>
                            <p className="font-label text-sm" style={{ color: G.parchDm }}>Aucune guerre récente</p>
                        </div>
                    ) : (
                        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                            {recentWars.map((war, i) => (
                                <div key={war.id} style={i > 0 ? { borderTop: '1px solid rgba(201,147,60,0.08)' } : {}}>
                                    <WarEntry war={war} userClanId={user.clan_id} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* ── Clan Management ── */}
            {clan && (
                <section className="mt-6 space-y-2">
                    <h3 className="font-headline text-[16px] font-black mb-3" style={{ color: G.parch }}>
                        Gestion du Clan
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: 'trending_up', label: 'Progression', link: '/clan' },
                            { icon: 'shield',      label: 'Membres',     link: '/clan' },
                            { icon: 'payments',    label: 'Trésorerie',  link: '/clan' },
                        ].map((item) => (
                            <Link
                                key={item.label}
                                href={item.link}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:brightness-125"
                                style={{
                                    background: `linear-gradient(135deg, ${G.cardLt} 0%, ${G.card} 100%)`,
                                    border: `1px solid ${G.border}`,
                                }}
                            >
                                <span className="material-symbols-outlined text-xl"
                                      style={{ color: 'rgba(242,228,196,0.45)', fontVariationSettings: "'FILL' 0" }}>
                                    {item.icon}
                                </span>
                                <span className="font-headline text-[14px] font-bold" style={{ color: G.parchDm }}>
                                    {item.label}
                                </span>
                                <span className="material-symbols-outlined text-sm ml-auto" style={{ color: 'rgba(201,147,60,0.25)' }}>
                                    chevron_right
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </GameLayout>
    );
}
