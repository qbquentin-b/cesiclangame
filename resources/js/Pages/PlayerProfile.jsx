import React from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, Link, router } from '@inertiajs/react';

const G = {
    gold:    '#C9933C',
    goldBrt: '#F0C060',
    parch:   '#F2E4C4',
    parchDm: 'rgba(242,228,196,0.45)',
    forge:   '#0A0705',
    card:    '#1E1208',
    cardLt:  '#291A0C',
    border:  'rgba(201,147,60,0.18)',
    borderA: 'rgba(201,147,60,0.35)',
    crimson: '#8B1A1A',
    crimBrt: '#C53030',
    emerald: '#2D7A4F',
};

const RARITY = {
    legendary: { label: 'Légendaire', color: '#F0C060', bg: 'rgba(240,192,96,0.12)', border: 'rgba(240,192,96,0.4)', icon: '👑' },
    epic:      { label: 'Épique',     color: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.4)', icon: '🏆' },
    rare:      { label: 'Rare',       color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.4)', icon: '⚜️' },
    common:    { label: 'Commun',     color: G.parchDm, bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', icon: '⚔️' },
};

const RANK_LABEL = {
    leader:  { label: 'Chef',        color: G.goldBrt },
    officer: { label: 'Officier',    color: '#F97316' },
    veteran: { label: 'Vétéran',     color: '#A3A3A3' },
    member:  { label: 'Membre',      color: G.parchDm },
};

function timeAgo(isoDate) {
    if (!isoDate) return 'jamais';
    const diff = Date.now() - new Date(isoDate).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 2)   return 'à l\'instant';
    if (m < 60)  return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 30)  return `il y a ${d}j`;
    return `il y a ${Math.floor(d / 30)}mois`;
}

function joinDate(isoDate) {
    return new Date(isoDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
}

const card = { background: G.cardLt, border: `1px solid ${G.borderA}`, borderRadius: 16 };

function StatCard({ icon, iconColor, label, value, valueColor, sub }) {
    return (
        <div className="rounded-2xl p-5" style={card}>
            <div className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: G.parchDm }}>
                {label}
            </div>
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[28px]"
                      style={{ color: iconColor, fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                </span>
                <div>
                    <div className="font-headline text-2xl font-black" style={{ color: valueColor }}>
                        {value}
                    </div>
                    {sub && <div className="font-label text-[10px]" style={{ color: G.parchDm }}>{sub}</div>}
                </div>
            </div>
        </div>
    );
}

export default function PlayerProfile({
    profile,
    is_self,
    friendship_status,
    friendship_id,
    i_am_requester,
}) {
    const handleSendRequest = () => {
        router.post(route('friends.request'), { username: profile.username }, { preserveScroll: true });
    };

    const handleAccept = () => {
        router.post(route('friends.accept', friendship_id), {}, { preserveScroll: true });
    };

    const handleDecline = () => {
        router.post(route('friends.decline', friendship_id), {}, { preserveScroll: true });
    };

    const handleRemove = () => {
        if (!confirm(`Retirer ${profile.username} de vos amis ?`)) return;
        router.delete(route('friends.remove', profile.id), { preserveScroll: true });
    };

    const FriendButton = () => {
        if (is_self) return null;

        if (!friendship_status) {
            return (
                <button onClick={handleSendRequest}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-headline font-bold text-sm transition-all hover:brightness-110"
                        style={{ background: 'rgba(201,147,60,0.18)', border: `1px solid ${G.borderA}`, color: G.parch }}>
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    Ajouter en ami
                </button>
            );
        }

        if (friendship_status === 'pending' && i_am_requester) {
            return (
                <span className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-headline font-bold text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}`, color: G.parchDm }}>
                    <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
                    Demande envoyée
                </span>
            );
        }

        if (friendship_status === 'pending' && !i_am_requester) {
            return (
                <div className="flex gap-2">
                    <button onClick={handleAccept}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-headline font-bold text-sm hover:brightness-110"
                            style={{ background: 'rgba(45,122,79,0.25)', border: '1px solid rgba(45,122,79,0.5)', color: '#6EE7A4' }}>
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        Accepter
                    </button>
                    <button onClick={handleDecline}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-headline font-bold text-sm hover:brightness-110"
                            style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(197,48,48,0.4)', color: '#F87171' }}>
                        <span className="material-symbols-outlined text-[18px]">close</span>
                        Refuser
                    </button>
                </div>
            );
        }

        if (friendship_status === 'accepted') {
            return (
                <div className="flex gap-2">
                    <Link href={route('messages')}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-headline font-bold text-sm hover:brightness-110"
                          style={{ background: 'rgba(201,147,60,0.15)', border: `1px solid ${G.borderA}`, color: G.parch }}>
                        <span className="material-symbols-outlined text-[18px]">mail</span>
                        Message
                    </Link>
                    <button onClick={handleRemove}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-headline font-bold text-sm hover:brightness-110"
                            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}`, color: G.parchDm }}>
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        Retirer
                    </button>
                </div>
            );
        }

        return null;
    };

    const initial = profile.username[0]?.toUpperCase() ?? '?';
    const rank    = RANK_LABEL[profile.clan_rank] ?? null;

    return (
        <GameLayout activeTab="top">
            <Head title={profile.username} />

            <div className="max-w-3xl mx-auto space-y-5">

                {/* ── Hero card ─────────────────────────────────────── */}
                <div className="rounded-2xl p-6 flex items-center gap-6" style={card}>

                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-headline font-black text-4xl shrink-0"
                         style={{ background: 'rgba(201,147,60,0.12)', border: `2px solid ${G.gold}`, color: G.goldBrt,
                                  boxShadow: `0 0 24px rgba(201,147,60,0.25)` }}>
                        {initial}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="font-headline text-2xl font-black" style={{ color: G.parch }}>
                                {profile.username}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full font-headline font-black text-xs"
                                  style={{ background: 'rgba(201,147,60,0.18)', color: G.gold }}>
                                Nv.{profile.level}
                            </span>
                            {is_self && (
                                <span className="px-2.5 py-0.5 rounded-full font-label text-[10px] uppercase tracking-wide"
                                      style={{ background: 'rgba(96,165,250,0.12)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.3)' }}>
                                    Vous
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                            {profile.clan ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center text-[11px] font-black shrink-0"
                                         style={{ background: profile.clan.color || '#765a19' }}>
                                        {profile.clan.crest_url
                                            ? <img src={profile.clan.crest_url} alt="" className="w-full h-full object-cover" />
                                            : <span style={{ color: '#fff' }}>{profile.clan.name[0]}</span>}
                                    </div>
                                    <Link href={route('clan')}
                                          className="font-label text-xs font-bold hover:underline"
                                          style={{ color: G.gold }}>
                                        {profile.clan.name}
                                    </Link>
                                    {rank && (
                                        <span className="font-label text-[10px]" style={{ color: rank.color }}>
                                            · {rank.label}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="font-label text-xs" style={{ color: G.parchDm }}>Sans clan</span>
                            )}

                            <span className="font-label text-[11px]" style={{ color: G.parchDm }}>
                                Membre depuis {joinDate(profile.created_at)}
                            </span>

                            {profile.last_seen_at && (
                                <span className="font-label text-[11px]" style={{ color: G.parchDm }}>
                                    Vu {timeAgo(profile.last_seen_at)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0">
                        <FriendButton />
                    </div>
                </div>

                {/* ── Stats ─────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        icon="diamond" iconColor={G.gold}
                        label="Cristaux actuels"
                        value={profile.crystals.toLocaleString('fr-FR')}
                        valueColor={G.gold}
                    />
                    <StatCard
                        icon="swords" iconColor={G.crimBrt}
                        label="Points de guerre"
                        value={profile.war_points.toLocaleString('fr-FR')}
                        valueColor={G.crimBrt}
                    />
                    <StatCard
                        icon="casino" iconColor="#A855F7"
                        label="Gains nets casino"
                        value={(profile.casino_winnings >= 0 ? '+' : '') + profile.casino_winnings.toLocaleString('fr-FR')}
                        valueColor={profile.casino_winnings >= 0 ? '#4ADE80' : '#F87171'}
                        sub="cristaux (slot + blackjack)"
                    />
                    <StatCard
                        icon="payments" iconColor={G.goldBrt}
                        label="Total dépensé"
                        value={profile.total_spent.toLocaleString('fr-FR')}
                        valueColor={G.parch}
                        sub="toutes activités confondues"
                    />
                </div>

                {/* ── Commanders ────────────────────────────────────── */}
                <div className="rounded-2xl p-5" style={card}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-headline font-black text-base" style={{ color: G.parch }}>
                            Commandants
                        </h3>
                        <span className="font-label text-[11px]" style={{ color: G.parchDm }}>
                            {profile.commanders.length} débloqué{profile.commanders.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    {profile.commanders.length === 0 ? (
                        <div className="py-8 text-center font-label text-sm" style={{ color: G.parchDm }}>
                            Aucun commandant pour l'instant
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {profile.commanders.map(cmd => {
                                const r = RARITY[cmd.rarity] ?? RARITY.common;
                                return (
                                    <div key={cmd.id}
                                         className="rounded-xl p-3 flex items-center gap-3 relative"
                                         style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                                        <span className="text-xl shrink-0">{r.icon}</span>
                                        <div className="min-w-0">
                                            <div className="font-headline font-bold text-sm truncate"
                                                 style={{ color: r.color }}>
                                                {cmd.name}
                                            </div>
                                            {cmd.title && (
                                                <div className="font-label text-[10px] truncate"
                                                     style={{ color: G.parchDm }}>
                                                    {cmd.title}
                                                </div>
                                            )}
                                        </div>
                                        {cmd.is_active && (
                                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                                                  style={{ background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </GameLayout>
    );
}
