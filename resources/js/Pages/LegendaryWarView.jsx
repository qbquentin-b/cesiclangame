import React, { useState } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, router } from '@inertiajs/react';

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
    epic:    '#9B59B6',
};

const TACTIC_CONFIG = {
    frontal_attack:   { label: 'Charge frontale',    icon: 'swords',                atk: '+30%', loss: '25–50%', color: G.crimBrt },
    echelon_defense:  { label: 'Défense en échelon', icon: 'shield',                atk: '−30%', loss: '10–20%', color: '#4A90D9' },
    targeted_strike:  { label: 'Frappe ciblée',      icon: 'gps_fixed',             atk: '+10%', loss: '20–35%', color: G.gold },
    tactical_retreat: { label: 'Repli tactique',     icon: 'directions_walk',       atk: '0',    loss: '5%',     color: G.forBrt },
    final_push:       { label: 'Poussée finale',     icon: 'local_fire_department', atk: '×2',   loss: '40–70%', color: G.epic },
};

const moraleColor = (m) => m >= 70 ? G.forBrt : m >= 50 ? G.gold : m >= 30 ? G.crimBrt : G.crimson;

/* ─── ClanCard ─── */
function ClanCard({ participant, isMe, isEliminated }) {
    const clan   = participant.clan;
    const morale = participant.morale ?? 100;
    const score  = participant.score ?? 0;
    const color  = isMe ? G.gold : isEliminated ? 'rgba(242,228,196,.2)' : G.parch;

    return (
        <div className="rounded-xl p-4 flex flex-col gap-2"
             style={{ background: isEliminated ? 'rgba(10,7,5,.4)' : 'rgba(30,18,8,.8)', border: `1px solid ${isMe ? G.gold + '44' : G.border}`, opacity: isEliminated ? 0.5 : 1 }}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                         style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}>
                        {clan?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                        <div className="font-headline font-black text-sm" style={{ color }}>
                            {clan?.name ?? '—'} {isMe && <span className="text-[9px] font-normal" style={{ color: G.parchDm }}>(vous)</span>}
                        </div>
                        {isEliminated && (
                            <div className="font-label text-[8px] uppercase" style={{ color: G.crimBrt }}>
                                Éliminé au round {participant.eliminated_round}
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-headline font-black text-lg" style={{ color: G.goldBrt }}>{score.toLocaleString('fr-FR')}</div>
                    <div className="font-label text-[8px] uppercase" style={{ color: G.parchDm }}>pts</div>
                </div>
            </div>

            {/* Moral */}
            {!isEliminated && (
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="font-label text-[8px]" style={{ color: G.parchDm }}>Moral</span>
                        <span className="font-label text-[8px] font-black" style={{ color: moraleColor(morale) }}>{morale}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                             style={{ width: `${morale}%`, background: moraleColor(morale) }} />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── RoundRow ─── */
function RoundRow({ round, participants }) {
    const statusStyle = {
        finished: { bg: 'rgba(74,160,64,.1)', border: 'rgba(74,160,64,.3)', color: G.forBrt, label: 'Terminé' },
        active:   { bg: 'rgba(201,147,60,.1)', border: `${G.gold}44`, color: G.gold, label: 'En cours' },
        pending:  { bg: 'rgba(0,0,0,.15)', border: 'rgba(201,147,60,.08)', color: G.parchDm, label: 'À venir' },
    }[round.status] ?? {};

    const clanScores = round.clan_scores ?? {};
    const sortedClans = Object.entries(clanScores).sort(([, a], [, b]) => b - a);

    return (
        <div className="rounded-xl p-4" style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="font-headline font-black text-sm" style={{ color: statusStyle.color }}>
                        Round {round.round_number}
                    </span>
                    <span className="px-1.5 py-0.5 rounded font-label text-[8px] uppercase font-black"
                          style={{ background: statusStyle.border + '44', color: statusStyle.color }}>
                        {statusStyle.label}
                    </span>
                </div>
                {round.eliminated_clan_id && (
                    <span className="font-label text-[8px]" style={{ color: G.crimBrt }}>
                        <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
                        {' '}Clan éliminé
                    </span>
                )}
            </div>

            {sortedClans.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                    {sortedClans.map(([clanId, score], idx) => {
                        const p = participants.find(p => p.clan_id === clanId);
                        return (
                            <div key={clanId} className="flex items-center gap-2 text-[11px]"
                                 style={{ color: idx === 0 ? G.goldBrt : idx === sortedClans.length - 1 ? G.crimBrt : G.parchDm }}>
                                <span className="material-symbols-outlined text-[12px]"
                                      style={{ fontVariationSettings: "'FILL' 1" }}>
                                    {idx === 0 ? 'emoji_events' : idx === sortedClans.length - 1 ? 'skull' : 'remove'}
                                </span>
                                <span className="font-label text-[9px]">{p?.clan?.name ?? '?'}</span>
                                <span className="font-black ml-auto">{Math.round(score).toLocaleString('fr-FR')}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─── ActionForm ─── */
function ActionForm({ legendaryWar, activeRound, myTroops, soldierTypes, userActionThisRound, myClanId, participants }) {
    const [tactic, setTactic] = useState('frontal_attack');
    const [troops, setTroops] = useState({});
    const [busy, setBusy]     = useState(false);

    const myParticipant = participants.find(p => p.clan_id === myClanId);
    if (!myParticipant || myParticipant.eliminated_round !== null) {
        return (
            <div className="text-center py-8 font-label text-sm" style={{ color: G.crimBrt }}>
                Votre clan a été éliminé de cette bataille.
            </div>
        );
    }

    if (userActionThisRound) {
        return (
            <div className="text-center py-6 font-label text-sm" style={{ color: G.forBrt }}>
                <span className="material-symbols-outlined text-2xl block mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Action soumise — tactique : <strong>{TACTIC_CONFIG[userActionThisRound.tactic]?.label}</strong>
            </div>
        );
    }

    const submit = () => {
        setBusy(true);
        const committed = {};
        Object.entries(troops).forEach(([id, q]) => { if (q > 0) committed[id] = q; });
        router.post(`/legendary-wars/${legendaryWar.id}/action`, { tactic, troops: committed }, {
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="space-y-4">
            {/* Tactic */}
            <div>
                <label className="font-label text-[9px] uppercase tracking-widest mb-2 block" style={{ color: G.parchDm }}>Tactique</label>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TACTIC_CONFIG).map(([key, cfg]) => (
                        <button key={key} onClick={() => setTactic(key)}
                                className="rounded-lg p-2.5 text-left transition-all"
                                style={{
                                    background: tactic === key ? `${cfg.color}18` : 'rgba(10,7,5,.5)',
                                    border: `1px solid ${tactic === key ? cfg.color + '66' : G.border}`,
                                }}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="material-symbols-outlined text-[13px]" style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                                <span className="font-label text-[9px] font-black" style={{ color: tactic === key ? cfg.color : G.parch }}>{cfg.label}</span>
                            </div>
                            <div className="font-label text-[8px]" style={{ color: G.parchDm }}>Atk {cfg.atk} · Pertes {cfg.loss}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Troops */}
            <div>
                <label className="font-label text-[9px] uppercase tracking-widest mb-2 block" style={{ color: G.parchDm }}>Troupes à engager</label>
                <div className="space-y-2">
                    {soldierTypes.map(st => {
                        const available = myTroops[String(st.id)] ?? 0;
                        if (available <= 0) return null;
                        const qty = troops[String(st.id)] ?? 0;
                        return (
                            <div key={st.id} className="flex items-center gap-3">
                                <span className="font-label text-[9px] w-24" style={{ color: G.parch }}>{st.name}</span>
                                <input type="range" min="0" max={available} value={qty}
                                       onChange={e => setTroops(t => ({ ...t, [String(st.id)]: Number(e.target.value) }))}
                                       className="flex-1" />
                                <span className="font-label text-[9px] w-16 text-right" style={{ color: G.gold }}>{qty}/{available}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button onClick={submit} disabled={busy}
                    className="w-full py-3 rounded-xl font-headline font-black text-sm transition-all"
                    style={{ background: `linear-gradient(135deg,${G.gold},${G.goldBrt})`, color: G.forge }}>
                {busy ? 'Envoi…' : 'Confirmer l\'action'}
            </button>
        </div>
    );
}

/* ─── Main Page ─── */
export default function LegendaryWarView({
    war, participants, rounds, activeRound, userActionThisRound, myTroops, soldierTypes, myClanId,
}) {
    const statusLabel = {
        pending:  { label: 'En attente', color: G.gold },
        active:   { label: 'En cours',   color: G.forBrt },
        finished: { label: 'Terminée',   color: G.parchDm },
    }[war.status] ?? { label: war.status, color: G.parchDm };

    const winner     = war.winner_clan_id ? participants.find(p => p.clan_id === war.winner_clan_id) : null;
    const sortedPart = [...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return (
        <GameLayout activeTab="guerres">
            <Head title="Bataille Légendaire" />

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-3xl" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                    <div>
                        <h2 className="font-headline text-2xl font-black" style={{ color: G.parch }}>Bataille Légendaire</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full font-label text-[9px] uppercase font-black"
                                  style={{ background: `${statusLabel.color}15`, border: `1px solid ${statusLabel.color}44`, color: statusLabel.color }}>
                                {statusLabel.label}
                            </span>
                            {war.status === 'active' && (
                                <span className="font-label text-[9px]" style={{ color: G.parchDm }}>
                                    Round {war.current_round}/{war.total_rounds} · {participants.filter(p => !p.eliminated_round).length} clans actifs
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Winner banner */}
                {war.status === 'finished' && winner && (
                    <div className="mt-4 rounded-xl p-4 text-center"
                         style={{ background: 'rgba(201,147,60,.12)', border: `1px solid ${G.gold}44` }}>
                        <span className="material-symbols-outlined text-4xl" style={{ color: G.goldBrt, fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                        <div className="font-headline font-black text-xl mt-1" style={{ color: G.goldBrt }}>
                            {winner.clan?.name} remporte la bataille légendaire !
                        </div>
                        <div className="font-label text-[9px] mt-1" style={{ color: G.parchDm }}>
                            Récompense : +1000 cristaux clan · +25 pts de guerre
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Clans */}
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="font-headline font-black text-sm flex items-center gap-2" style={{ color: G.parch }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: G.gold }}>groups</span>
                        Clans participants
                    </h3>
                    {sortedPart.map(p => (
                        <ClanCard key={p.id} participant={p} isMe={p.clan_id === myClanId} isEliminated={p.eliminated_round !== null} />
                    ))}
                </div>

                {/* Right: Rounds + Action */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Rounds timeline */}
                    <div>
                        <h3 className="font-headline font-black text-sm flex items-center gap-2 mb-3" style={{ color: G.parch }}>
                            <span className="material-symbols-outlined text-[16px]" style={{ color: G.gold }}>timer</span>
                            Rounds
                        </h3>
                        <div className="space-y-2">
                            {rounds.map(r => (
                                <RoundRow key={r.id} round={r} participants={participants} />
                            ))}
                        </div>
                    </div>

                    {/* Action panel */}
                    {war.status === 'active' && activeRound && (
                        <div className="rounded-xl p-5" style={{ background: 'rgba(30,18,8,.8)', border: `1px solid ${G.border}` }}>
                            <h3 className="font-headline font-black text-sm mb-4 flex items-center gap-2" style={{ color: G.parch }}>
                                <span className="material-symbols-outlined text-[16px]" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>swords</span>
                                Votre action — Round {activeRound.round_number}
                            </h3>
                            <ActionForm
                                legendaryWar={war}
                                activeRound={activeRound}
                                myTroops={myTroops}
                                soldierTypes={soldierTypes}
                                userActionThisRound={userActionThisRound}
                                myClanId={myClanId}
                                participants={participants}
                            />
                        </div>
                    )}

                    {war.status === 'pending' && (
                        <div className="text-center py-10 font-label text-sm" style={{ color: G.parchDm }}>
                            <span className="material-symbols-outlined text-4xl block mb-2" style={{ color: G.gold }}>hourglass_top</span>
                            La bataille commence bientôt…
                        </div>
                    )}
                </div>
            </div>
        </GameLayout>
    );
}
