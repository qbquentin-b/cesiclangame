import React, { useState } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

const G = {
    gold:      '#C9933C',
    goldBrt:   '#F0C060',
    parch:     '#F2E4C4',
    parchDm:   'rgba(242,228,196,0.45)',
    forge:     '#0A0705',
    card:      '#1E1208',
    cardLt:    '#291A0C',
    crimson:   '#8B1A1A',
    crimBrt:   '#C53030',
    forBrt:    '#4A9040',
    border:    'rgba(201,147,60,0.18)',
    rare:      '#4A90D9',
    epic:      '#9B59B6',
    legendary: '#F39C12',
};

const RARITY_COLOR = {
    common:    G.parchDm,
    rare:      G.rare,
    epic:      G.epic,
    legendary: G.legendary,
};

const SOLDIER_ICONS = {
    eclaireur: 'directions_run',
    fantassin: 'shield_person',
    archer:    'sports_martial_arts',
    cavalier:  'emoji_transportation',
    catapulte: 'hardware',
};

const TACTIC_CONFIG = {
    frontal_attack:   { label: 'Charge frontale',    icon: 'swords',                 desc: 'Attaque directe.', atk: '+30%', loss: '25–50%', color: G.crimBrt },
    echelon_defense:  { label: 'Défense en échelon', icon: 'shield',                 desc: 'Résistance prioritaire.', atk: '−30%', loss: '10–20%', color: G.rare },
    targeted_strike:  { label: 'Frappe ciblée',      icon: 'gps_fixed',              desc: 'Précision chirurgicale.', atk: '+10%', loss: '20–35%', color: G.legendary },
    tactical_retreat: { label: 'Repli tactique',     icon: 'directions_walk',        desc: 'Conserve les troupes.', atk: '0',    loss: '5%',     color: G.forBrt },
    final_push:       { label: 'Poussée finale',     icon: 'local_fire_department',  desc: 'Tout ou rien.', atk: '×2',   loss: '40–70%', color: G.epic },
};

// Pentagone de contre-unités (pour le tooltip côté front)
const COUNTER_TIPS = [
    { attacker: 'Cavalier',  target: 'Éclaireur' },
    { attacker: 'Éclaireur', target: 'Catapulte' },
    { attacker: 'Catapulte', target: 'Fantassin' },
    { attacker: 'Fantassin', target: 'Archer'    },
    { attacker: 'Archer',    target: 'Cavalier'  },
];

const RANK_LABEL = { leader: 'Chef', officer: 'Officier', veteran: 'Vétéran', member: 'Membre' };

/* ─────────────── MoraleBar (Idée 7) ─────────────── */
function MoraleBar({ moraleA, moraleB, clanA, clanB, isA }) {
    const myMorale   = isA ? moraleA : moraleB;
    const theyMorale = isA ? moraleB : moraleA;
    const myClan     = isA ? clanA : clanB;
    const theyClan   = isA ? clanB : clanA;

    const moraleColor = (m) => {
        if (m >= 70) return '#4A9040';
        if (m >= 50) return '#C9933C';
        if (m >= 30) return '#C53030';
        return '#8B1A1A';
    };
    const moraleLabel = (m) => {
        if (m >= 70) return 'Moral élevé';
        if (m >= 50) return 'Moral affaibli −10%';
        if (m >= 30) return 'Démoralisé −20%';
        return 'En déroute −30%';
    };

    return (
        <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(10,7,5,.6)', border: '1px solid rgba(201,147,60,.12)' }}>
            <h4 className="font-label text-[9px] uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'rgba(242,228,196,.5)' }}>
                <span className="material-symbols-outlined text-[13px]" style={{ color: '#C9933C', fontVariationSettings: "'FILL' 1" }}>sentiment_very_dissatisfied</span>
                Moral des troupes (Idée 7)
            </h4>
            <div className="space-y-2.5">
                {[
                    { label: myClan?.name + ' (vous)', morale: myMorale },
                    { label: theyClan?.name,            morale: theyMorale },
                ].map(({ label, morale }) => (
                    <div key={label}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-label text-[9px]" style={{ color: 'rgba(242,228,196,.6)' }}>{label}</span>
                            <span className="font-label text-[9px] font-black" style={{ color: moraleColor(morale) }}>
                                {morale}/100 — {moraleLabel(morale)}
                            </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
                            <div className="h-full rounded-full transition-all duration-700"
                                 style={{ width: `${morale}%`, background: `linear-gradient(90deg,${moraleColor(morale)},${moraleColor(morale)}bb)` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────── ScoreBar ─────────────── */
function ScoreBar({ scoreA, scoreB, clanA, clanB, isA }) {
    const total = scoreA + scoreB;
    const pctA  = total > 0 ? Math.round((scoreA / total) * 100) : 50;
    const myClan    = isA ? clanA : clanB;
    const theyClan  = isA ? clanB : clanA;
    const myScore   = isA ? scoreA : scoreB;
    const theyScore = isA ? scoreB : scoreA;
    const myPct     = isA ? pctA : 100 - pctA;

    return (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
            <div className="grid grid-cols-2 divide-x" style={{ divideColor: G.border, borderBottom: `1px solid ${G.border}` }}>
                <div className="p-4 flex flex-col items-center" style={{ background: 'linear-gradient(135deg,rgba(201,147,60,.08),rgba(201,147,60,.03))' }}>
                    <span className="font-label text-[8px] uppercase tracking-widest mb-1" style={{ color: G.parchDm }}>{myClan?.name} (vous)</span>
                    <span className="font-headline font-black text-3xl" style={{ color: G.gold }}>{myScore.toLocaleString('fr-FR')}</span>
                </div>
                <div className="p-4 flex flex-col items-center" style={{ background: 'linear-gradient(135deg,rgba(139,26,26,.08),rgba(139,26,26,.03))' }}>
                    <span className="font-label text-[8px] uppercase tracking-widest mb-1" style={{ color: G.parchDm }}>{theyClan?.name}</span>
                    <span className="font-headline font-black text-3xl" style={{ color: G.crimBrt }}>{theyScore.toLocaleString('fr-FR')}</span>
                </div>
            </div>
            <div className="p-3" style={{ background: 'linear-gradient(135deg,#1c1208,#140d06)' }}>
                <div className="h-4 rounded-full overflow-hidden relative" style={{ background: 'rgba(139,26,26,.3)' }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                         style={{ width: `${myPct}%`, background: `linear-gradient(90deg,${G.gold},${G.goldBrt})`, boxShadow: `0 0 12px ${G.gold}66` }} />
                    {myPct > 8 && myPct < 92 && (
                        <span className="absolute inset-0 flex items-center justify-center font-label text-[9px] font-black" style={{ color: 'rgba(0,0,0,.7)' }}>
                            {myPct}% — {100 - myPct}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────── Round Timeline ─────────────── */
function RoundTimeline({ rounds, war, isA }) {
    const total = war.total_rounds ?? 4;

    const statusStyle = {
        finished: { bg: 'rgba(74,160,64,.15)', border: 'rgba(74,160,64,.4)', color: G.forBrt, label: 'Terminé' },
        active:   { bg: 'rgba(201,147,60,.15)', border: `${G.gold}55`, color: G.gold, label: 'En cours' },
        pending:  { bg: 'rgba(0,0,0,.2)', border: 'rgba(201,147,60,.1)', color: G.parchDm, label: 'À venir' },
    };

    return (
        <div className="mt-6">
            <h3 className="font-headline font-black text-[15px] mb-3 flex items-center gap-2" style={{ color: G.parch }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: G.gold }}>timer</span>
                Progression des rounds
            </h3>
            <div className="flex gap-2">
                {Array.from({ length: total }, (_, i) => {
                    const round  = rounds.find(r => r.round_number === i + 1);
                    const status = round?.status ?? 'pending';
                    const st     = statusStyle[status];
                    const myScore   = isA ? round?.score_a : round?.score_b;
                    const theyScore = isA ? round?.score_b : round?.score_a;
                    const wonRound  = round?.status === 'finished' && myScore > theyScore;
                    const lostRound = round?.status === 'finished' && myScore < theyScore;

                    return (
                        <div key={i} className="flex-1 rounded-lg p-2 text-center"
                             style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                            <div className="font-label text-[8px] uppercase tracking-wider mb-1" style={{ color: G.parchDm }}>
                                Round {i + 1}
                            </div>
                            {round?.status === 'finished' ? (
                                <>
                                    <div className="font-headline font-black text-sm"
                                         style={{ color: wonRound ? G.forBrt : lostRound ? G.crimBrt : G.parchDm }}>
                                        {wonRound ? '✓' : lostRound ? '✗' : '='}
                                    </div>
                                    <div className="font-label text-[8px] mt-0.5" style={{ color: G.parchDm }}>
                                        {(myScore ?? 0).toLocaleString('fr-FR')} — {(theyScore ?? 0).toLocaleString('fr-FR')}
                                    </div>
                                </>
                            ) : (
                                <div className="font-label text-[8px]" style={{ color: st.color }}>{st.label}</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─────────────── Contre-unités info ─────────────── */
function CounterInfo() {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-lg overflow-hidden mt-3" style={{ border: `1px solid rgba(155,89,182,.3)` }}>
            <button onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-white/5"
                    style={{ background: 'rgba(155,89,182,.07)' }}>
                <span className="flex items-center gap-2 font-label text-[10px] uppercase tracking-wider" style={{ color: G.epic }}>
                    <span className="material-symbols-outlined text-[14px]">hub</span>
                    Contre-unités (×1.5 puissance)
                </span>
                <span className="material-symbols-outlined text-[14px] transition-transform"
                      style={{ color: G.epic, transform: open ? 'rotate(180deg)' : '' }}>expand_more</span>
            </button>
            {open && (
                <div className="px-3 pb-3 pt-2 flex flex-wrap gap-2" style={{ background: 'rgba(0,0,0,.2)' }}>
                    {COUNTER_TIPS.map(({ attacker, target }) => (
                        <span key={attacker} className="font-label text-[9px] px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(155,89,182,.1)', border: '1px solid rgba(155,89,182,.25)', color: G.parchDm }}>
                            <span style={{ color: G.epic }}>{attacker}</span> bat {target}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─────────────── Formulaire de soumission de round ─────────────── */
function RoundActionForm({ war, activeRound, availableTroops, soldierTypes, userActionThisRound }) {
    const [tactic, setTactic]       = useState('frontal_attack');
    const [committed, setCommitted] = useState({});
    const [submitting, setSubmitting] = useState(false);

    if (!activeRound) return null;

    // Déjà soumis
    if (userActionThisRound) {
        const cfg = TACTIC_CONFIG[userActionThisRound.tactic] ?? TACTIC_CONFIG.frontal_attack;
        return (
            <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(74,160,64,.06)', border: '1px solid rgba(74,160,64,.3)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: G.forBrt, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="font-headline font-bold text-[14px]" style={{ color: G.forBrt }}>Action soumise — Round {activeRound.round_number}</span>
                </div>
                <div className="flex items-center gap-2 font-label text-[11px]" style={{ color: G.parchDm }}>
                    <span className="material-symbols-outlined text-[14px]" style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                    Tactique : <span style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
                <p className="font-label text-[9px] mt-2 uppercase tracking-wider" style={{ color: G.parchDm }}>
                    En attente de la fin du round.
                </p>
            </div>
        );
    }

    const typeMap = {};
    soldierTypes.forEach(t => { typeMap[t.id] = t; });

    const hasTroops = Object.values(availableTroops ?? {}).some(v => v > 0);

    const handleCommit = (typeId, value) => {
        const max = availableTroops[typeId] ?? 0;
        setCommitted(prev => ({ ...prev, [typeId]: Math.min(Math.max(0, parseInt(value) || 0), max) }));
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(`/wars/${war.id}/action`, { tactic, troops: committed }, {
            onFinish: () => setSubmitting(false),
        });
    };

    const endsAt = activeRound.ends_at ? new Date(activeRound.ends_at) : null;

    return (
        <div className="rounded-xl overflow-hidden mt-4" style={{ border: `1px solid ${G.gold}44` }}>
            <div className="px-4 py-3 flex items-center justify-between"
                 style={{ background: 'rgba(201,147,60,.07)', borderBottom: `1px solid ${G.border}` }}>
                <span className="font-headline font-black text-[14px] flex items-center gap-2" style={{ color: G.gold }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>swords</span>
                    Round {activeRound.round_number} — Choisir votre action
                </span>
                {endsAt && (
                    <span className="font-label text-[9px]" style={{ color: G.parchDm }}>
                        Fin : {endsAt.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>

            <div className="p-4 space-y-4" style={{ background: 'linear-gradient(135deg,#1c1208,#140d06)' }}>
                {/* Sélecteur de tactique */}
                <div>
                    <p className="font-label text-[9px] uppercase tracking-wider mb-2" style={{ color: G.parchDm }}>Tactique</p>
                    <div className="grid grid-cols-1 gap-1.5">
                        {Object.entries(TACTIC_CONFIG).map(([key, cfg]) => (
                            <button key={key} onClick={() => setTactic(key)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                                    style={{
                                        background: tactic === key ? `${cfg.color}15` : 'rgba(0,0,0,.2)',
                                        border: `1px solid ${tactic === key ? cfg.color + '66' : 'rgba(201,147,60,.1)'}`,
                                    }}>
                                <span className="material-symbols-outlined text-[18px] shrink-0"
                                      style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-headline font-bold text-[12px]" style={{ color: tactic === key ? cfg.color : G.parch }}>
                                        {cfg.label}
                                    </div>
                                    <div className="font-label text-[9px]" style={{ color: G.parchDm }}>
                                        {cfg.desc} · Atk {cfg.atk} · Pertes {cfg.loss}
                                    </div>
                                </div>
                                {tactic === key && (
                                    <span className="material-symbols-outlined text-[16px] shrink-0"
                                          style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}>radio_button_checked</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sélecteur de troupes */}
                {tactic !== 'tactical_retreat' && (
                    <div>
                        <p className="font-label text-[9px] uppercase tracking-wider mb-2" style={{ color: G.parchDm }}>
                            Troupes à engager {!hasTroops && '— aucune disponible'}
                        </p>
                        <div className="space-y-2">
                            {Object.entries(availableTroops ?? {}).filter(([, qty]) => qty > 0).map(([typeId, maxQty]) => {
                                const type = typeMap[typeId];
                                if (!type) return null;
                                const icon = SOLDIER_ICONS[type.slug] ?? 'person';
                                const val  = committed[typeId] ?? 0;
                                return (
                                    <div key={typeId} className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[16px]"
                                              style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                                        <span className="font-label text-[11px] flex-1" style={{ color: G.parch }}>{type.name}</span>
                                        <span className="font-label text-[9px]" style={{ color: G.parchDm }}>/{maxQty}</span>
                                        <input
                                            type="number" min="0" max={maxQty} value={val}
                                            onChange={e => handleCommit(typeId, e.target.value)}
                                            className="w-16 text-center rounded-lg px-2 py-1 font-label text-[11px] font-black"
                                            style={{
                                                background: 'rgba(0,0,0,.4)', border: `1px solid ${G.border}`,
                                                color: G.gold, outline: 'none',
                                            }}
                                        />
                                    </div>
                                );
                            })}
                            {!hasTroops && (
                                <p className="font-label text-[10px] italic" style={{ color: G.parchDm }}>
                                    Déployez des troupes depuis <Link href="/troops" style={{ color: G.gold }}>Mon Armée</Link>.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {tactic === 'tactical_retreat' && (
                    <p className="font-label text-[10px] italic" style={{ color: G.forBrt }}>
                        Repli tactique : aucune troupe engagée ce round. Pertes minimales (5%).
                    </p>
                )}

                <button onClick={handleSubmit} disabled={submitting || (!hasTroops && tactic !== 'tactical_retreat')}
                        className="w-full py-2.5 rounded-xl font-headline font-black text-[13px] uppercase tracking-wider transition-all"
                        style={{
                            background: submitting ? 'rgba(201,147,60,.2)' : `linear-gradient(135deg,${G.gold},${G.goldBrt})`,
                            color: submitting ? G.parchDm : G.forge,
                            opacity: (!hasTroops && tactic !== 'tactical_retreat') ? 0.4 : 1,
                        }}>
                    {submitting ? 'Envoi…' : `Valider — ${TACTIC_CONFIG[tactic]?.label}`}
                </button>
            </div>
        </div>
    );
}

/* ─────────────── Détail d'un round terminé ─────────────── */
function RoundResultCard({ round, war, isA, soldierTypes }) {
    const [open, setOpen] = useState(false);

    const myScore   = isA ? round.score_a : round.score_b;
    const theyScore = isA ? round.score_b : round.score_a;
    const won       = myScore > theyScore;
    const draw      = myScore === theyScore;

    const typeMap = {};
    soldierTypes.forEach(t => { typeMap[t.id] = t; });

    return (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${won ? 'rgba(74,160,64,.3)' : draw ? G.border : 'rgba(139,26,26,.3)'}` }}>
            <button onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                    style={{ background: won ? 'rgba(74,160,64,.07)' : draw ? 'rgba(201,147,60,.05)' : 'rgba(139,26,26,.07)' }}>
                <div className="flex items-center gap-3">
                    <span className="font-headline font-black text-[11px] px-2.5 py-0.5 rounded-full"
                          style={{
                              background: won ? 'rgba(74,160,64,.15)' : draw ? 'rgba(201,147,60,.1)' : 'rgba(139,26,26,.15)',
                              color: won ? G.forBrt : draw ? G.gold : G.crimBrt,
                          }}>
                        Round {round.round_number}
                    </span>
                    <span className="font-headline font-bold text-[13px]" style={{ color: won ? G.forBrt : draw ? G.parch : G.crimBrt }}>
                        {won ? 'Victoire' : draw ? 'Égalité' : 'Défaite'}
                    </span>
                    <span className="font-label text-[10px]" style={{ color: G.parchDm }}>
                        {myScore.toLocaleString('fr-FR')} — {theyScore.toLocaleString('fr-FR')} pts
                    </span>
                </div>
                <span className="material-symbols-outlined text-[16px] transition-transform"
                      style={{ color: G.parchDm, transform: open ? 'rotate(180deg)' : '' }}>expand_more</span>
            </button>

            {open && (
                <div className="px-4 pb-3 pt-2 space-y-2" style={{ background: 'rgba(0,0,0,.2)' }}>
                    {round.actions.map(action => {
                        const cfg = action.tactic ? TACTIC_CONFIG[action.tactic] : null;
                        return (
                            <div key={action.id} className="flex items-start gap-2 py-1.5 border-b last:border-0"
                                 style={{ borderColor: 'rgba(201,147,60,.08)' }}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-headline font-bold text-[12px]" style={{ color: G.parch }}>
                                            {action.username ?? '—'}
                                        </span>
                                        {cfg && (
                                            <span className="flex items-center gap-1 font-label text-[9px] px-1.5 py-0.5 rounded-full"
                                                  style={{ background: `${cfg.color}15`, color: cfg.color }}>
                                                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                                                {cfg.label}
                                            </span>
                                        )}
                                    </div>
                                    {action.troops_lost && Object.keys(action.troops_lost).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {Object.entries(action.troops_lost).map(([tid, qty]) => (
                                                <span key={tid} className="font-label text-[8px] px-1.5 py-0.5 rounded-full"
                                                      style={{ background: 'rgba(139,26,26,.15)', color: G.crimBrt }}>
                                                    −{qty} {typeMap[tid]?.name ?? '?'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className="font-headline font-black text-[12px] shrink-0"
                                      style={{ color: action.clan_id === (isA ? war.clan_a_id : war.clan_b_id) ? G.gold : G.crimBrt }}>
                                    {(action.contribution_score ?? 0).toLocaleString('fr-FR')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─────────────── Déploiements (section existante) ─────────────── */
function TroopList({ troops, soldierTypes }) {
    if (!troops) return (
        <div className="flex items-center gap-2 text-[10px] font-label py-2 italic" style={{ color: G.parchDm }}>
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Troupes cachées — obtenez Sun Tzu pour espionner
        </div>
    );
    const typeMap = {};
    soldierTypes.forEach(t => { typeMap[t.id] = t; });
    const entries = Object.entries(troops).filter(([, qty]) => qty > 0);
    if (entries.length === 0) return <span className="font-label text-[10px] italic" style={{ color: G.parchDm }}>Aucune troupe</span>;
    return (
        <div className="flex flex-wrap gap-1.5">
            {entries.map(([typeId, qty]) => {
                const type = typeMap[typeId];
                const icon = SOLDIER_ICONS[type?.slug] ?? 'person';
                return (
                    <span key={typeId} className="flex items-center gap-1 px-2 py-0.5 rounded-full font-label text-[9px]"
                          style={{ background: 'rgba(201,147,60,.08)', border: `1px solid ${G.border}`, color: G.parchDm }}>
                        <span className="material-symbols-outlined text-[11px]"
                              style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                        {qty} {type?.name ?? '?'}
                    </span>
                );
            })}
        </div>
    );
}

function DeploymentRow({ dep, soldierTypes, isMine }) {
    const [open, setOpen] = useState(false);
    const cmdColor = RARITY_COLOR[dep.commander?.rarity] ?? G.parchDm;
    return (
        <div className="border-b last:border-b-0" style={{ borderColor: 'rgba(201,147,60,.08)' }}>
            <button onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                         style={{ background: isMine ? 'rgba(201,147,60,.1)' : 'rgba(139,26,26,.1)', border: `1px solid ${isMine ? G.border : 'rgba(139,26,26,.2)'}` }}>
                        <span className="material-symbols-outlined text-[15px]"
                              style={{ color: isMine ? G.gold : G.crimBrt, fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                    </div>
                    <div>
                        <span className="font-headline font-bold text-[13px]" style={{ color: G.parch }}>{dep.user?.username ?? '—'}</span>
                        <span className="font-label text-[9px] ml-2" style={{ color: G.parchDm }}>{RANK_LABEL[dep.user?.clan_rank] ?? ''}</span>
                        {dep.commander && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[10px]"
                                      style={{ color: cmdColor, fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                                <span className="font-label text-[9px]" style={{ color: cmdColor }}>{dep.commander.name}</span>
                            </div>
                        )}
                    </div>
                </div>
                <span className="material-symbols-outlined text-[16px] transition-transform"
                      style={{ color: G.parchDm, transform: open ? 'rotate(180deg)' : '' }}>expand_more</span>
            </button>
            {open && (
                <div className="px-4 pb-3" style={{ background: 'rgba(0,0,0,.2)' }}>
                    <span className="font-label text-[9px] uppercase tracking-wider block mb-1.5" style={{ color: G.parchDm }}>Pool de troupes</span>
                    <TroopList troops={dep.troops} soldierTypes={soldierTypes} />
                    {dep.commander?.description && (
                        <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${G.border}` }}>
                            <span className="font-label text-[9px] uppercase tracking-wider block mb-1" style={{ color: G.parchDm }}>Effet commandant</span>
                            <p className="font-label text-[10px] leading-relaxed" style={{ color: cmdColor }}>{dep.commander.description}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const STRATEGY_CONFIG = {
    assault:   { label: 'Assaut',     icon: 'swords',           desc: '+10% aux tactiques offensives (Charge, Frappe, Poussée)', color: '#C53030' },
    defense:   { label: 'Défense',    icon: 'shield',           desc: '+10% aux tactiques défensives (Échelon, Repli)',          color: '#4A90D9' },
    espionage: { label: 'Espionnage', icon: 'visibility',       desc: 'Révèle les actions ennemies en cours de round',           color: '#9B59B6' },
    pillage:   { label: 'Pillage',    icon: 'local_fire_department', desc: '+10% de ressources volées en cas de victoire',       color: '#F39C12' },
};

/* ─────────────── Conseil de guerre ─────────────── */
function WarCouncil({ war, myStrategy, theirStrategy, canSetStrategy, canSeeEnemy }) {
    const [submitting, setSubmitting] = useState(false);

    const handleSetStrategy = (strategy) => {
        setSubmitting(true);
        router.patch(`/wars/${war.id}/strategy`, { strategy }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="rounded-xl overflow-hidden mt-6" style={{ border: `1px solid rgba(201,147,60,0.25)` }}>
            <div className="px-4 py-3 flex items-center gap-2"
                 style={{ background: 'rgba(201,147,60,0.07)', borderBottom: 'solid 1px rgba(201,147,60,0.15)' }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>strategy</span>
                <span className="font-headline font-black text-[14px]" style={{ color: G.parch }}>Conseil de Guerre</span>
                {myStrategy && (
                    <span className="ml-auto px-2 py-0.5 rounded-full font-label text-[9px] font-black uppercase"
                          style={{
                              background: `${STRATEGY_CONFIG[myStrategy]?.color ?? G.gold}22`,
                              border: `1px solid ${STRATEGY_CONFIG[myStrategy]?.color ?? G.gold}55`,
                              color: STRATEGY_CONFIG[myStrategy]?.color ?? G.gold,
                          }}>
                        {STRATEGY_CONFIG[myStrategy]?.label}
                    </span>
                )}
            </div>

            <div className="p-4 space-y-4" style={{ background: 'linear-gradient(135deg,#1c1208,#140d06)' }}>
                {/* Stratégie ennemie (si espionnage actif) */}
                {canSeeEnemy && theirStrategy && (
                    <div className="rounded-lg px-3 py-2 flex items-center gap-2"
                         style={{ background: 'rgba(155,89,182,0.08)', border: '1px solid rgba(155,89,182,0.3)' }}>
                        <span className="material-symbols-outlined text-[14px]" style={{ color: G.epic, fontVariationSettings: "'FILL' 1" }}>visibility</span>
                        <span className="font-label text-[10px]" style={{ color: G.parchDm }}>
                            Stratégie ennemie : <span style={{ color: STRATEGY_CONFIG[theirStrategy]?.color ?? G.parchDm }}>
                                {STRATEGY_CONFIG[theirStrategy]?.label ?? theirStrategy}
                            </span>
                        </span>
                    </div>
                )}

                {canSetStrategy ? (
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(STRATEGY_CONFIG).map(([key, cfg]) => (
                            <button key={key}
                                    onClick={() => handleSetStrategy(key)}
                                    disabled={submitting}
                                    className="flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-all"
                                    style={{
                                        background: myStrategy === key ? `${cfg.color}15` : 'rgba(0,0,0,0.2)',
                                        border: `1px solid ${myStrategy === key ? cfg.color + '66' : 'rgba(201,147,60,0.1)'}`,
                                    }}>
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px]"
                                          style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                                    <span className="font-headline font-bold text-[12px]"
                                          style={{ color: myStrategy === key ? cfg.color : G.parch }}>{cfg.label}</span>
                                </div>
                                <span className="font-label text-[8px] leading-tight" style={{ color: G.parchDm }}>{cfg.desc}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {myStrategy ? (
                            <div className="rounded-lg px-3 py-2.5 flex items-center gap-2"
                                 style={{
                                     background: `${STRATEGY_CONFIG[myStrategy]?.color ?? G.gold}10`,
                                     border: `1px solid ${STRATEGY_CONFIG[myStrategy]?.color ?? G.gold}44`,
                                 }}>
                                <span className="material-symbols-outlined text-[16px]"
                                      style={{ color: STRATEGY_CONFIG[myStrategy]?.color ?? G.gold, fontVariationSettings: "'FILL' 1" }}>
                                    {STRATEGY_CONFIG[myStrategy]?.icon}
                                </span>
                                <div>
                                    <span className="font-headline font-bold text-[12px]"
                                          style={{ color: STRATEGY_CONFIG[myStrategy]?.color ?? G.gold }}>
                                        {STRATEGY_CONFIG[myStrategy]?.label}
                                    </span>
                                    <p className="font-label text-[9px]" style={{ color: G.parchDm }}>
                                        {STRATEGY_CONFIG[myStrategy]?.desc}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="font-label text-[10px] italic text-center py-2" style={{ color: G.parchDm }}>
                                Aucune stratégie définie — le chef ou un officier peut en choisir une.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────── Bouton Napoléon ─────────────── */
function NapoleonButton({ war }) {
    const [submitting, setSubmitting] = useState(false);

    const handleTrigger = () => {
        if (!confirm('Napoléon déclenche la Dernière Charge ! Un round supplémentaire sera ajouté. Confirmer ?')) return;
        setSubmitting(true);
        router.post(`/wars/${war.id}/napoleon-bonus`, {}, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="rounded-xl overflow-hidden mt-4"
             style={{ border: 'solid 1px rgba(243,156,18,0.4)', background: 'rgba(243,156,18,0.06)' }}>
            <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                         style={{ background: 'rgba(243,156,18,0.12)', border: '1px solid rgba(243,156,18,0.3)' }}>
                        <span className="material-symbols-outlined text-[20px]"
                              style={{ color: G.legendary, fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                    </div>
                    <div>
                        <p className="font-headline font-black text-[13px]" style={{ color: G.legendary }}>Dernière Charge — Napoléon</p>
                        <p className="font-label text-[9px]" style={{ color: G.parchDm }}>
                            Ajoute un round supplémentaire. Utilisable une fois, si votre clan est en déficit de score.
                        </p>
                    </div>
                </div>
                <button onClick={handleTrigger} disabled={submitting}
                        className="shrink-0 px-4 py-2 rounded-lg font-headline font-black text-[11px] uppercase tracking-wider transition-all hover:brightness-110"
                        style={{
                            background: submitting ? 'rgba(243,156,18,0.1)' : 'linear-gradient(135deg,rgba(243,156,18,0.3),rgba(243,156,18,0.15))',
                            border: '1px solid rgba(243,156,18,0.5)',
                            color: G.legendary,
                        }}>
                    {submitting ? '…' : 'Déclencher'}
                </button>
            </div>
        </div>
    );
}

/* ─────────────── Page principale ─────────────── */
export default function WarDetail({
    war, rounds, activeRound, userActionThisRound, availableTroops, hasDeployed,
    myDeployments, enemyDeployments, soldierTypes, scoreA, scoreB, hasSpy, canSeeEnemy,
    isA, myStrategy, theirStrategy, canSetStrategy, canNapoleon, moraleA, moraleB,
}) {
    const { auth } = usePage().props;
    const userClanId = auth?.user?.clan_id;

    const myClan    = isA ? war.clan_a : war.clan_b;
    const theyClan  = isA ? war.clan_b : war.clan_a;
    const myScore   = isA ? scoreA : scoreB;
    const theyScore = isA ? scoreB : scoreA;

    const statusLabel = {
        pending:  { label: 'En attente',   color: G.goldBrt },
        active:   { label: 'En cours',     color: G.forBrt  },
        finished: { label: 'Terminée',     color: G.parchDm },
    }[war.status] ?? { label: war.status, color: G.parchDm };

    const result = war.status === 'finished'
        ? (war.winner_id === userClanId ? 'won' : war.winner_id ? 'lost' : 'draw')
        : null;

    const finishedRounds = (rounds ?? []).filter(r => r.status === 'finished');
    const hasRounds      = (rounds ?? []).length > 0;

    return (
        <GameLayout activeTab="guerres">
            <Head title={`Guerre — ${myClan?.name} vs ${theyClan?.name}`} />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 font-label text-[10px] uppercase tracking-wider" style={{ color: G.parchDm }}>
                <Link href="/wars" style={{ color: G.gold }}>Guerres</Link>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <span>{myClan?.name} vs {theyClan?.name}</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="font-headline text-2xl font-black flex items-center gap-3" style={{ color: G.parch }}>
                        <span className="material-symbols-outlined text-2xl"
                              style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>swords</span>
                        {myClan?.name}
                        <span style={{ color: G.parchDm, fontSize: '.7em' }}>vs</span>
                        {theyClan?.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full font-label text-[9px] uppercase font-black"
                              style={{ background: `${statusLabel.color}15`, border: `1px solid ${statusLabel.color}44`, color: statusLabel.color }}>
                            {statusLabel.label}
                        </span>
                        {hasRounds && (
                            <span className="px-2 py-0.5 rounded-full font-label text-[9px] uppercase font-black"
                                  style={{ background: 'rgba(201,147,60,.08)', border: `1px solid ${G.border}`, color: G.gold }}>
                                Round {war.current_round}/{war.total_rounds}
                            </span>
                        )}
                        {result && (
                            <span className="px-2 py-0.5 rounded-full font-label text-[9px] uppercase font-black"
                                  style={{
                                      background: result === 'won' ? 'rgba(74,160,64,.15)' : result === 'lost' ? 'rgba(139,26,26,.15)' : 'rgba(255,255,255,.05)',
                                      border: `1px solid ${result === 'won' ? 'rgba(74,160,64,.4)' : result === 'lost' ? 'rgba(139,26,26,.4)' : 'rgba(255,255,255,.1)'}`,
                                      color: result === 'won' ? G.forBrt : result === 'lost' ? G.crimBrt : G.parchDm,
                                  }}>
                                {result === 'won' ? 'Victoire' : result === 'lost' ? 'Défaite' : 'Égalité'}
                            </span>
                        )}
                        {hasSpy && (
                            <span className="px-2 py-0.5 rounded-full font-label text-[9px] uppercase font-black"
                                  style={{ background: 'rgba(155,89,182,.15)', border: '1px solid rgba(155,89,182,.4)', color: G.epic }}>
                                <span className="material-symbols-outlined text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                                {' '}Sun Tzu actif
                            </span>
                        )}
                    </div>
                </div>
                {war.scheduled_at && (
                    <span className="font-label text-[9px]" style={{ color: G.parchDm }}>
                        {new Date(war.scheduled_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                )}
            </div>

            {/* Score total */}
            <ScoreBar scoreA={myScore} scoreB={theyScore} clanA={myClan} clanB={theyClan} isA={true} />

            {/* Moral des troupes (Idée 7) */}
            {war.status === 'active' && (
                <MoraleBar moraleA={moraleA ?? 100} moraleB={moraleB ?? 100} clanA={war.clan_a} clanB={war.clan_b} isA={isA} />
            )}

            {/* Timeline des rounds */}
            {hasRounds && (
                <>
                    <RoundTimeline rounds={rounds} war={war} isA={isA} />

                    {/* Conseil de guerre */}
                    <WarCouncil
                        war={war}
                        myStrategy={myStrategy}
                        theirStrategy={theirStrategy}
                        canSetStrategy={canSetStrategy}
                        canSeeEnemy={canSeeEnemy}
                    />

                    {/* Bouton Napoléon */}
                    {canNapoleon && <NapoleonButton war={war} />}

                    {/* Formulaire d'action si round actif */}
                    {war.status === 'active' && activeRound && (
                        <>
                            {!hasDeployed ? (
                                <div className="mt-4 rounded-xl p-4 text-center"
                                     style={{ background: 'rgba(201,147,60,.05)', border: `1px solid ${G.border}` }}>
                                    <p className="font-label text-[11px]" style={{ color: G.parchDm }}>
                                        Vous devez d'abord déployer vos troupes depuis{' '}
                                        <Link href="/troops" style={{ color: G.gold }}>Mon Armée</Link>.
                                    </p>
                                </div>
                            ) : (
                                <RoundActionForm
                                    war={war}
                                    activeRound={activeRound}
                                    availableTroops={availableTroops}
                                    soldierTypes={soldierTypes}
                                    userActionThisRound={userActionThisRound}
                                />
                            )}
                            <CounterInfo />
                        </>
                    )}

                    {/* Résultats des rounds terminés */}
                    {finishedRounds.length > 0 && (
                        <div className="mt-6 space-y-2">
                            <h3 className="font-headline font-black text-[15px] mb-3" style={{ color: G.parch }}>
                                Résultats des rounds
                            </h3>
                            {finishedRounds.map(round => (
                                <RoundResultCard key={round.id} round={round} war={war} isA={isA} soldierTypes={soldierTypes} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Déploiements (pool initial) */}
            <div className="mt-8 space-y-4">
                <h3 className="font-headline font-black text-[15px]" style={{ color: G.parch }}>Armées déployées</h3>
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                    <div className="px-4 py-3 flex items-center justify-between"
                         style={{ background: 'rgba(201,147,60,.07)', borderBottom: `1px solid ${G.border}` }}>
                        <span className="font-headline font-black text-[14px]" style={{ color: G.parch }}>
                            {myClan?.name} — Mon clan
                        </span>
                        <span className="font-label text-[9px]" style={{ color: G.parchDm }}>{myDeployments.length} joueur(s)</span>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg,#1c1208,#140d06)' }}>
                        {myDeployments.length === 0
                            ? <div className="px-4 py-6 text-center font-label text-[10px] italic" style={{ color: G.parchDm }}>Aucun déploiement.</div>
                            : myDeployments.map(dep => <DeploymentRow key={dep.id} dep={dep} soldierTypes={soldierTypes} isMine={true} />)
                        }
                    </div>
                </div>

                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                    <div className="px-4 py-3 flex items-center justify-between"
                         style={{ background: 'rgba(139,26,26,.07)', borderBottom: `1px solid ${G.border}` }}>
                        <span className="font-headline font-black text-[14px]" style={{ color: G.parch }}>
                            {theyClan?.name} — Adversaires
                        </span>
                        <span className="font-label text-[9px]" style={{ color: G.parchDm }}>{enemyDeployments.length} joueur(s)</span>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg,#1c1208,#140d06)' }}>
                        {enemyDeployments.length === 0
                            ? <div className="px-4 py-6 text-center font-label text-[10px] italic" style={{ color: G.parchDm }}>Aucun déploiement.</div>
                            : enemyDeployments.map(dep => <DeploymentRow key={dep.id} dep={dep} soldierTypes={soldierTypes} isMine={false} />)
                        }
                    </div>
                </div>
            </div>
        </GameLayout>
    );
}
