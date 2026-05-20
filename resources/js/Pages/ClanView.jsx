import React, { useState } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

const G = {
    gold:    '#C9933C',
    goldBrt: '#F0C060',
    parch:   '#F2E4C4',
    parchDm: 'rgba(242,228,196,0.45)',
    forge:   '#0A0705',
    card:    '#1E1208',
    cardLt:  '#291A0C',
    crimBrt: '#C53030',
    forBrt:  '#4A9040',
    blue:    '#7B9ED9',
    border:  'rgba(201,147,60,0.18)',
    borderA: 'rgba(201,147,60,0.35)',
};

const RANK_LABELS = { leader: 'Chef', officer: 'Officier', veteran: 'Vétéran', member: 'Membre' };
const RANK_COLORS = {
    leader:  { bg: 'rgba(201,147,60,0.15)', border: 'rgba(201,147,60,0.4)',  text: G.gold },
    officer: { bg: 'rgba(74,160,64,0.12)',  border: 'rgba(74,160,64,0.35)', text: G.forBrt },
    veteran: { bg: 'rgba(123,158,217,0.12)', border: 'rgba(123,158,217,0.35)', text: G.blue },
    member:  { bg: 'rgba(242,228,196,0.06)', border: 'rgba(242,228,196,0.15)', text: 'rgba(242,228,196,0.4)' },
};

// leader=3, officer=2, veteran=1, member=0
const HIERARCHY = { leader: 3, officer: 2, veteran: 1, member: 0 };
const PROMOTE_MAP = { member: 'veteran', veteran: 'officer', officer: 'leader' };
const DEMOTE_MAP  = { officer: 'veteran', veteran: 'member' };

const inputCls   = "w-full px-3 py-2 rounded-lg text-sm font-label outline-none focus:ring-1 focus:ring-[#C9933C]";
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,147,60,0.25)', color: '#F2E4C4' };

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr);
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'à l\'instant';
    if (m < 60) return `il y a ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
}

// ── No-clan view ────────────────────────────────────────────────────────────

function NoClanView({ publicClans }) {
    const [createName, setCreateName] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        router.post(route('clan.create'), { name: createName }, { preserveScroll: true });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl block mb-4" style={{ color: G.parchDm }}>groups</span>
                <h2 className="font-headline text-2xl font-black" style={{ color: G.parch }}>Vous n'avez pas de clan</h2>
                <p className="font-label text-sm mt-2" style={{ color: G.parchDm }}>Rejoignez un clan existant ou fondez le vôtre.</p>
            </div>

            <div className="rounded-xl p-5" style={{ background: G.card, border: `1px solid ${G.borderA}` }}>
                <h3 className="font-headline font-bold text-base mb-4" style={{ color: G.gold }}>Fonder un clan (50 💎)</h3>
                <form onSubmit={handleCreate} className="flex gap-3">
                    <input type="text" required minLength={2} maxLength={30} placeholder="Nom du clan"
                           className={inputCls} style={inputStyle}
                           value={createName} onChange={e => setCreateName(e.target.value)} />
                    <button type="submit" className="px-5 py-2 rounded-lg font-headline font-bold text-sm uppercase whitespace-nowrap"
                            style={{ background: G.gold, color: G.forge }}>
                        Créer
                    </button>
                </form>
            </div>

            {publicClans.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                    <div className="px-5 py-3" style={{ background: G.cardLt, borderBottom: `1px solid ${G.border}` }}>
                        <h3 className="font-headline font-bold text-sm uppercase tracking-wider" style={{ color: G.parch }}>Clans disponibles</h3>
                    </div>
                    {publicClans.map((clan, i) => (
                        <div key={clan.id} className="flex items-center justify-between px-5 py-3"
                             style={{ background: i % 2 === 0 ? G.card : G.cardLt, borderTop: i > 0 ? `1px solid ${G.border}` : 'none' }}>
                            <div className="flex items-center gap-3">
                                {clan.crest_url
                                    ? <img src={clan.crest_url} alt="" className="w-10 h-10 rounded-lg object-cover" style={{ border: `1px solid ${G.border}` }} />
                                    : <div className="w-10 h-10 rounded-lg flex items-center justify-center font-headline font-black text-lg"
                                           style={{ background: clan.color || '#765a19', color: '#fff' }}>
                                        {clan.name[0]}
                                      </div>
                                }
                                <div>
                                    <div className="font-headline font-bold text-sm" style={{ color: G.parch }}>{clan.name}</div>
                                    <div className="font-label text-[10px]" style={{ color: G.parchDm }}>
                                        Nv.{clan.level ?? 1} · {clan.tier ?? 'Débutant'} · 💎 {(clan.crystals_pool ?? 0).toLocaleString('fr-FR')}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => router.post(route('clan.join', clan.id))}
                                    className="px-4 py-1.5 rounded-lg font-headline font-bold text-xs uppercase"
                                    style={{ background: 'rgba(201,147,60,0.15)', border: `1px solid ${G.borderA}`, color: G.gold }}>
                                Rejoindre
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Announcement card ───────────────────────────────────────────────────────

function AnnouncementCard({ ann }) {
    const rs = RANK_COLORS[ann.sender.clan_rank] || RANK_COLORS.member;
    return (
        <div className="rounded-xl p-4" style={{ background: G.cardLt, border: `1px solid ${G.border}` }}>
            <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                    <div className="font-headline font-bold text-sm" style={{ color: G.parch }}>{ann.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-label text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                              style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.text }}>
                            {RANK_LABELS[ann.sender.clan_rank] ?? ann.sender.clan_rank}
                        </span>
                        <span className="font-label text-[10px]" style={{ color: G.parchDm }}>
                            {ann.sender.username} · {timeAgo(ann.created_at)}
                        </span>
                    </div>
                </div>
                {ann.can_delete && (
                    <button onClick={() => router.delete(route('clan.announcements.destroy', ann.id), { preserveScroll: true })}
                            className="shrink-0 text-[10px] px-2 py-1 rounded-lg font-label font-bold uppercase transition hover:brightness-125"
                            style={{ background: 'rgba(139,26,26,0.2)', color: G.crimBrt }}>
                        Supprimer
                    </button>
                )}
            </div>
            <p className="font-label text-[11px] leading-relaxed whitespace-pre-line" style={{ color: G.parchDm }}>{ann.body}</p>
        </div>
    );
}

// ── Main clan view ──────────────────────────────────────────────────────────

export default function ClanView({ clan, members = [], publicClans = [], announcements = [] }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const myRank     = user.clan_rank;
    const isLeader   = myRank === 'leader';
    const canAnnounce = ['leader', 'officer'].includes(myRank);
    const myLevel    = HIERARCHY[myRank] ?? -1;

    const [donateAmount,    setDonateAmount]    = useState('');
    const [logoFile,        setLogoFile]        = useState(null);
    const [logoPreview,     setLogoPreview]     = useState(clan?.crest_url ?? null);
    const [showLogoForm,    setShowLogoForm]    = useState(false);
    const [annTitle,        setAnnTitle]        = useState('');
    const [annBody,         setAnnBody]         = useState('');
    const [showAnnForm,     setShowAnnForm]     = useState(false);
    const [activeTab,       setActiveTab]       = useState('members'); // members | announcements

    const flash  = usePage().props.flash  || {};
    const errors = usePage().props.errors || {};

    if (!clan) return (
        <GameLayout activeTab="clan">
            <Head title="Clan" />
            <NoClanView publicClans={publicClans} />
        </GameLayout>
    );

    const handleDonate = (e) => {
        e.preventDefault();
        router.post(route('clan.donate'), { amount: parseInt(donateAmount) }, {
            preserveScroll: true,
            onSuccess: () => setDonateAmount(''),
        });
    };

    const handleLogoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleLogoUpdate = (e) => {
        e.preventDefault();
        if (!logoFile) return;
        const fd = new FormData();
        fd.append('logo', logoFile);
        router.post(route('clan.logo'), fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { setShowLogoForm(false); setLogoFile(null); },
        });
    };

    const handleAnnounce = (e) => {
        e.preventDefault();
        router.post(route('clan.announcements.store'), { title: annTitle, body: annBody }, {
            preserveScroll: true,
            onSuccess: () => { setAnnTitle(''); setAnnBody(''); setShowAnnForm(false); },
        });
    };

    return (
        <GameLayout activeTab="clan">
            <Head title={clan.name} />

            {flash.message && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm font-label"
                     style={{ background: 'rgba(74,160,64,0.15)', border: '1px solid rgba(74,160,64,0.4)', color: G.forBrt }}>
                    ✅ {flash.message}
                </div>
            )}
            {errors.message && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm font-label"
                     style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(197,48,48,0.4)', color: G.crimBrt }}>
                    ⚠️ {errors.message}
                </div>
            )}

            {/* ── Header clan ── */}
            <section className="rounded-2xl p-6 flex items-center gap-6 mb-6"
                     style={{ background: `linear-gradient(135deg, ${G.cardLt} 0%, ${G.card} 100%)`, border: `1px solid ${G.borderA}` }}>
                <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center font-headline font-black text-3xl"
                         style={{ background: clan.color || '#765a19', border: `2px solid ${G.gold}`, boxShadow: `0 0 20px ${clan.color || G.gold}44` }}>
                        {clan.crest_url
                            ? <img src={clan.crest_url} alt="" className="w-full h-full object-cover" />
                            : <span style={{ color: '#fff' }}>{clan.name[0]}</span>
                        }
                    </div>
                    {isLeader && (
                        <button onClick={() => setShowLogoForm(p => !p)}
                                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: G.gold, color: G.forge }}>
                            <span className="material-symbols-outlined text-[13px]">edit</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="font-headline text-2xl font-black" style={{ color: G.parch }}>{clan.name}</h2>
                    <p className="font-label text-[11px] uppercase tracking-widest mt-1" style={{ color: `${G.gold}99` }}>
                        Nv.{clan.level ?? 1} · {clan.tier ?? 'Débutant'} · {members.length} membres
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>diamond</span>
                            <span className="font-headline font-black text-sm" style={{ color: G.gold }}>
                                {(clan.crystals_pool ?? 0).toLocaleString('fr-FR')} trésorerie
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm" style={{ color: G.crimBrt, fontVariationSettings: "'FILL' 1" }}>swords</span>
                            <span className="font-headline font-black text-sm" style={{ color: G.crimBrt }}>
                                {(clan.power_score ?? 0).toLocaleString('fr-FR')} puissance
                            </span>
                        </div>
                    </div>
                </div>

                {/* Donate */}
                <form onSubmit={handleDonate} className="flex gap-2 shrink-0">
                    <input type="number" min="1" max={user.crystals} placeholder="Cristaux"
                           className="w-28 px-3 py-2 rounded-lg text-sm font-label outline-none"
                           style={inputStyle}
                           value={donateAmount} onChange={e => setDonateAmount(e.target.value)} />
                    <button type="submit" className="px-4 py-2 rounded-lg font-headline font-bold text-sm uppercase"
                            style={{ background: 'rgba(201,147,60,0.15)', border: `1px solid ${G.borderA}`, color: G.gold }}>
                        Donner
                    </button>
                </form>
            </section>

            {/* Logo form */}
            {isLeader && showLogoForm && (
                <section className="mb-4 rounded-xl p-4" style={{ background: G.cardLt, border: `1px solid ${G.borderA}` }}>
                    <h4 className="font-headline font-bold text-sm mb-3" style={{ color: G.gold }}>Modifier le logo du clan</h4>
                    <form onSubmit={handleLogoUpdate} className="flex flex-wrap gap-3 items-center">
                        <label className="cursor-pointer px-4 py-2 rounded-lg font-headline font-bold text-sm uppercase"
                               style={{ background: 'rgba(201,147,60,0.12)', border: `1px solid ${G.borderA}`, color: G.parch }}>
                            Choisir une image
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                        </label>
                        {logoPreview && (
                            <img src={logoPreview} alt="" className="w-12 h-12 rounded-xl object-cover"
                                 style={{ border: `1px solid ${G.border}` }} />
                        )}
                        <button type="submit" disabled={!logoFile}
                                className="px-5 py-2 rounded-lg font-headline font-bold text-sm uppercase whitespace-nowrap disabled:opacity-40"
                                style={{ background: G.gold, color: G.forge }}>
                            Enregistrer
                        </button>
                        <button type="button" onClick={() => setShowLogoForm(false)}
                                className="px-3 py-2 rounded-lg font-headline font-bold text-sm"
                                style={{ color: G.parchDm }}>
                            Annuler
                        </button>
                    </form>
                    {!logoFile && (
                        <p className="mt-2 font-label text-[11px]" style={{ color: G.parchDm }}>
                            Formats acceptés : JPG, PNG, GIF, WEBP — max 2 Mo
                        </p>
                    )}
                </section>
            )}

            {/* ── Tabs ── */}
            <div className="flex mb-4" style={{ borderBottom: `1px solid ${G.border}` }}>
                {[
                    { key: 'members',       label: `Membres (${members.length})` },
                    { key: 'announcements', label: `Annonces${announcements.length ? ` (${announcements.length})` : ''}` },
                ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className="px-4 py-2.5 font-label text-[11px] font-black uppercase tracking-wider transition"
                            style={{
                                color: activeTab === t.key ? G.gold : G.parchDm,
                                borderBottom: activeTab === t.key ? `2px solid ${G.gold}` : '2px solid transparent',
                                background: 'transparent',
                            }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Membres ── */}
            {activeTab === 'members' && (
                <section>
                    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                        {members.map((member, i) => {
                            const rs    = RANK_COLORS[member.clan_rank] || RANK_COLORS.member;
                            const isMe  = member.id === user.id;
                            const mLvl  = HIERARCHY[member.clan_rank] ?? -1;
                            const canKick    = !isMe && myLevel > mLvl;
                            const canPromote = isLeader && !isMe && PROMOTE_MAP[member.clan_rank];
                            const canDemote  = isLeader && !isMe && DEMOTE_MAP[member.clan_rank];
                            return (
                                <div key={member.id}
                                     className="flex items-center gap-4 px-4 py-3 transition-all hover:brightness-110"
                                     style={{
                                         background: i % 2 === 0
                                             ? 'linear-gradient(135deg, #1c1108 0%, #140d06 100%)'
                                             : 'linear-gradient(135deg, #180e06 0%, #110b05 100%)',
                                         borderTop: i > 0 ? '1px solid rgba(201,147,60,0.06)' : 'none',
                                     }}>

                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-headline font-black text-sm shrink-0"
                                         style={{ background: 'rgba(201,147,60,0.1)', border: `1px solid ${rs.border}`, color: rs.text }}>
                                        {(member.username || '?').slice(0, 2).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Link href={route('players.show', member.id)}
                                                  className="font-headline font-bold text-sm hover:underline"
                                                  style={{ color: G.parch }}>
                                                {member.username} {isMe && <span style={{ color: G.parchDm }}>(vous)</span>}
                                            </Link>
                                            <span className="font-label text-[9px] font-black uppercase px-2 py-0.5 rounded"
                                                  style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.text }}>
                                                {RANK_LABELS[member.clan_rank] ?? member.clan_rank}
                                            </span>
                                        </div>
                                        <div className="font-label text-[10px] mt-0.5" style={{ color: G.parchDm }}>
                                            Nv.{member.level ?? 1} · {(member.war_points ?? 0).toLocaleString('fr-FR')} WP
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="material-symbols-outlined text-sm" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>diamond</span>
                                        <span className="font-headline text-sm font-black" style={{ color: G.gold }}>
                                            {(member.crystals ?? 0).toLocaleString('fr-FR')}
                                        </span>
                                    </div>

                                    {/* Actions (leader/officer) */}
                                    {(canPromote || canDemote || canKick) && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {canPromote && (
                                                <button
                                                    onClick={() => router.post(route('clan.promote', member.id), {}, { preserveScroll: true })}
                                                    title={`Promouvoir en ${RANK_LABELS[PROMOTE_MAP[member.clan_rank]]}`}
                                                    className="px-2 py-1 rounded-lg text-[9px] font-label font-black uppercase transition hover:brightness-125"
                                                    style={{ background: 'rgba(201,147,60,0.15)', border: `1px solid ${G.borderA}`, color: G.gold }}>
                                                    ▲ {RANK_LABELS[PROMOTE_MAP[member.clan_rank]]}
                                                </button>
                                            )}
                                            {canDemote && (
                                                <button
                                                    onClick={() => router.post(route('clan.demote', member.id), {}, { preserveScroll: true })}
                                                    title={`Rétrograder en ${RANK_LABELS[DEMOTE_MAP[member.clan_rank]]}`}
                                                    className="px-2 py-1 rounded-lg text-[9px] font-label font-black uppercase transition hover:brightness-125"
                                                    style={{ background: 'rgba(123,158,217,0.1)', border: '1px solid rgba(123,158,217,0.3)', color: G.blue }}>
                                                    ▼ {RANK_LABELS[DEMOTE_MAP[member.clan_rank]]}
                                                </button>
                                            )}
                                            {canKick && (
                                                <button
                                                    onClick={() => { if (confirm(`Expulser ${member.username} ?`)) router.post(route('clan.kick', member.id), {}, { preserveScroll: true }); }}
                                                    title="Expulser du clan"
                                                    className="px-2 py-1 rounded-lg text-[9px] font-label font-black uppercase transition hover:brightness-125"
                                                    style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(197,48,48,0.3)', color: G.crimBrt }}>
                                                    Expulser
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Annonces ── */}
            {activeTab === 'announcements' && (
                <section className="space-y-4">
                    {/* Formulaire de création (chef / officier) */}
                    {canAnnounce && (
                        <div>
                            {!showAnnForm ? (
                                <button onClick={() => setShowAnnForm(true)}
                                        className="w-full py-2.5 rounded-xl font-headline font-bold text-sm uppercase tracking-wide transition hover:brightness-125"
                                        style={{ background: 'rgba(201,147,60,0.1)', border: `1px solid ${G.borderA}`, color: G.gold }}>
                                    + Nouvelle annonce
                                </button>
                            ) : (
                                <div className="rounded-xl p-4" style={{ background: G.cardLt, border: `1px solid ${G.borderA}` }}>
                                    <h4 className="font-headline font-bold text-sm mb-3" style={{ color: G.gold }}>Nouvelle annonce</h4>
                                    <form onSubmit={handleAnnounce} className="space-y-3">
                                        <input type="text" required maxLength={100} placeholder="Titre de l'annonce"
                                               className={inputCls} style={inputStyle}
                                               value={annTitle} onChange={e => setAnnTitle(e.target.value)} />
                                        <textarea required maxLength={1000} placeholder="Contenu de l'annonce…" rows={4}
                                                  className="w-full px-3 py-2 rounded-lg text-sm font-label outline-none resize-none"
                                                  style={inputStyle}
                                                  value={annBody} onChange={e => setAnnBody(e.target.value)} />
                                        <div className="flex gap-2">
                                            <button type="submit"
                                                    className="px-5 py-2 rounded-lg font-headline font-bold text-sm uppercase"
                                                    style={{ background: G.gold, color: G.forge }}>
                                                Publier
                                            </button>
                                            <button type="button" onClick={() => setShowAnnForm(false)}
                                                    className="px-4 py-2 rounded-lg font-headline font-bold text-sm"
                                                    style={{ color: G.parchDm }}>
                                                Annuler
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {announcements.length === 0 ? (
                        <div className="text-center py-10" style={{ color: G.parchDm }}>
                            <span className="material-symbols-outlined text-4xl block mb-2" style={{ color: G.parchDm }}>campaign</span>
                            <p className="font-label text-sm">Aucune annonce pour l'instant.</p>
                        </div>
                    ) : (
                        announcements.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)
                    )}
                </section>
            )}
        </GameLayout>
    );
}
