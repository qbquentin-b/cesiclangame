import React from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, Link, usePage } from '@inertiajs/react';

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
};

function ClanBanner({ side, clan, label }) {
    const color = side === 'left' ? G.gold : G.crimBrt;
    const name  = clan?.name ?? '—';
    const power = clan?.power_score ?? 0;

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className="relative rounded-t-2xl overflow-hidden flex flex-col items-center justify-center text-center px-3 py-4"
                style={{
                    width: 128, height: 170,
                    background: `linear-gradient(180deg, ${color}33 0%, ${color}18 100%)`,
                    border: `1px solid ${color}55`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${color}22`,
                }}
            >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,7,5,0.1) 0%, rgba(10,7,5,0.6) 100%)' }} />

                {clan?.crest_url ? (
                    <img src={clan.crest_url} alt={name}
                         className="w-16 h-16 mb-2 relative z-10 object-contain"
                         style={{ filter: `drop-shadow(0 0 8px ${color}55)` }} />
                ) : (
                    <div className="w-16 h-16 mb-2 relative z-10 rounded-full flex items-center justify-center text-3xl font-black"
                         style={{ background: `${color}22`, border: `2px solid ${color}55`, color }}>
                        {name[0]?.toUpperCase() ?? '?'}
                    </div>
                )}

                <span className="font-headline text-[11px] font-black uppercase relative z-10" style={{ color: G.parch }}>
                    {name}
                </span>
                <div className="mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black relative z-10"
                     style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}>
                    Nv.{clan?.level ?? 1}
                </div>

                <div className="absolute top-2 font-label text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                     style={{ [side === 'left' ? 'left' : 'right']: 6, background: 'rgba(0,0,0,0.5)', color, border: `1px solid ${color}33` }}>
                    {label}
                </div>
            </div>

            <div className="text-center">
                <div className="font-headline text-2xl font-black" style={{ color, textShadow: `0 0 14px ${color}66` }}>
                    {power.toLocaleString('fr-FR')}
                </div>
                <div className="flex items-center justify-center gap-1 font-label text-[9px] uppercase tracking-wider mt-0.5" style={{ color: G.parchDm }}>
                    <span className="material-symbols-outlined text-[11px]">swords</span>
                    Force
                </div>
            </div>
        </div>
    );
}

function ActiveWar({ war, userClanId, warScores }) {
    const isA          = war.clan_a_id === userClanId;
    const myClan       = isA ? war.clan_a : war.clan_b;
    const theyClan     = isA ? war.clan_b : war.clan_a;
    const myScore      = isA ? war.score_a : war.score_b;
    const theyScore    = isA ? war.score_b : war.score_a;
    const myDeploy     = warScores ? (isA ? warScores.score_a : warScores.score_b) : null;
    const theyDeploy   = warScores ? (isA ? warScores.score_b : warScores.score_a) : null;
    const totalDeploy  = (myDeploy ?? 0) + (theyDeploy ?? 0);
    const myPct        = totalDeploy > 0 ? Math.round((myDeploy / totalDeploy) * 100) : 50;

    return (
        <>
            <section className="relative pt-6">
                <div className="grid grid-cols-2 gap-2 items-end justify-items-center relative">
                    <ClanBanner side="left"  clan={myClan}   label="VOUS" />
                    <ClanBanner side="right" clan={theyClan} label="EUX"  />

                    <div className="absolute left-1/2 top-[70px] -translate-x-1/2 z-20">
                        <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center animate-pulse-gold"
                             style={{
                                 background: 'linear-gradient(135deg, #291A0C, #1E1208)',
                                 border: `2px solid ${G.gold}`,
                                 boxShadow: `0 0 24px rgba(201,147,60,0.4), inset 0 0 10px rgba(201,147,60,0.1)`,
                             }}>
                            <span className="font-headline text-xl font-black italic"
                                  style={{ color: G.goldBrt, textShadow: '0 0 12px rgba(240,192,96,0.5)' }}>
                                VS
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-xl overflow-hidden mt-4"
                     style={{ border: `1px solid ${G.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                <div className="grid grid-cols-2 divide-x divide-[rgba(201,147,60,0.12)]">
                    <div className="p-4 flex flex-col items-center"
                         style={{ background: 'linear-gradient(135deg, #1c1208 0%, #140d06 100%)' }}>
                        <span className="font-label text-[9px] uppercase tracking-widest mb-1" style={{ color: G.parchDm }}>Score</span>
                        <span className="font-headline font-black text-2xl" style={{ color: G.gold }}>{myScore}</span>
                    </div>
                    <div className="p-4 flex flex-col items-center"
                         style={{ background: 'linear-gradient(135deg, #1c1208 0%, #140d06 100%)' }}>
                        <span className="font-label text-[9px] uppercase tracking-widest mb-1" style={{ color: G.parchDm }}>Score</span>
                        <span className="font-headline font-black text-2xl" style={{ color: G.crimBrt }}>{theyScore}</span>
                    </div>
                </div>
            </section>

            <div className="rounded-xl p-3 mt-2 text-center font-label text-xs uppercase tracking-widest"
                 style={{ background: 'rgba(201,147,60,0.06)', border: `1px solid ${G.border}`, color: G.parchDm }}>
                Statut : <span className="font-bold" style={{ color: G.gold }}>{war.status === 'active' ? 'En cours' : 'En attente'}</span>
                {war.scheduled_at && (
                    <> · Planifiée le {new Date(war.scheduled_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</>
                )}
            </div>

            {/* Deployment power bar */}
            {myDeploy !== null && (
                <div className="rounded-xl overflow-hidden mt-3"
                     style={{ border: `1px solid ${G.border}` }}>
                    <div className="px-4 py-2 flex items-center justify-between"
                         style={{ background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid ${G.border}` }}>
                        <span className="font-label text-[9px] uppercase tracking-widest" style={{ color: G.parchDm }}>Puissance déployée</span>
                        <Link href="/troops"
                              className="font-label text-[9px] uppercase tracking-wider"
                              style={{ color: G.gold }}>
                            Déployer →
                        </Link>
                    </div>
                    <div className="p-3" style={{ background: 'linear-gradient(135deg, #1c1208, #140d06)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-headline font-black text-[13px]" style={{ color: G.gold }}>{myDeploy.toLocaleString('fr-FR')} pts</span>
                            <span className="font-headline font-black text-[13px]" style={{ color: G.crimBrt }}>{theyDeploy.toLocaleString('fr-FR')} pts</span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(139,26,26,0.3)' }}>
                            <div className="h-full rounded-full transition-all"
                                 style={{
                                     width: `${myPct}%`,
                                     background: `linear-gradient(90deg, ${G.gold}, ${G.goldBrt})`,
                                     boxShadow: `0 0 8px ${G.gold}55`,
                                 }} />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="font-label text-[8px]" style={{ color: G.parchDm }}>{myClan?.name}</span>
                            <span className="font-label text-[8px]" style={{ color: G.parchDm }}>{theyClan?.name}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function NoWar() {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-60">
            <span className="material-symbols-outlined text-6xl" style={{ color: G.gold }}>swords</span>
            <p className="font-headline font-bold text-xl" style={{ color: G.parch }}>Pas de guerre en cours</p>
            <p className="font-label text-[10px] uppercase tracking-widest text-center" style={{ color: G.parchDm }}>
                Les guerres ont lieu le lundi et le jeudi.<br/>Votre chef peut aussi en déclencher une manuellement.
            </p>
        </div>
    );
}

export default function WarView({ activeWar = null, warHistory = [], warScores = null, clanDeployments = [] }) {
    const { auth } = usePage().props;
    const userClanId = auth?.user?.clan_id;

    const getResult = (war) => {
        if (!war.winner_id) return null;
        return war.winner_id === userClanId ? 'won' : 'lost';
    };

    const getOpponent = (war) => {
        if (war.clan_a_id === userClanId) return war.clan_b?.name ?? '—';
        return war.clan_a?.name ?? '—';
    };

    return (
        <GameLayout activeTab="guerres">
            <Head title="Guerre" />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="font-headline text-3xl font-black flex items-center gap-3"
                    style={{ color: G.parch, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                    <span className="material-symbols-outlined text-3xl"
                          style={{ color: G.gold, filter: 'drop-shadow(0 0 8px rgba(201,147,60,0.5))' }}>
                        swords
                    </span>
                    Guerres de Clans
                </h2>
                <Link href="/troops"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg font-headline font-black text-[11px] uppercase tracking-wider transition-all hover:brightness-110"
                      style={{ background: 'rgba(201,147,60,0.08)', border: `1px solid ${G.border}`, color: G.gold }}>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                    Mon Armée
                </Link>
            </div>

            {/* Active war or empty state */}
            {activeWar ? <ActiveWar war={activeWar} userClanId={userClanId} warScores={warScores} /> : <NoWar />}

            {/* Clan deployments for active war */}
            {activeWar && clanDeployments.length > 0 && (
                <section className="mt-4">
                    <div className="flex items-center justify-between mb-2 px-0.5">
                        <h3 className="font-headline font-black text-[14px]" style={{ color: G.parch }}>
                            Déploiements de votre clan
                        </h3>
                        <Link href={`/wars/${activeWar.id}`}
                              className="font-label text-[9px] uppercase tracking-wider"
                              style={{ color: G.gold }}>
                            Détail complet →
                        </Link>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                        {clanDeployments.map((dep, idx) => (
                            <div key={dep.id} className="flex items-center justify-between px-4 py-2.5"
                                 style={{
                                     background: idx % 2 === 0 ? 'rgba(28,18,8,0.8)' : 'rgba(20,13,6,0.8)',
                                     borderTop: idx > 0 ? '1px solid rgba(201,147,60,0.06)' : 'none',
                                 }}>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]"
                                          style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                                    <span className="font-label text-[11px]" style={{ color: G.parch }}>{dep.user?.username}</span>
                                    {dep.commander && (
                                        <span className="font-label text-[9px] italic"
                                              style={{ color: G.epic }}>
                                            + {dep.commander.name}
                                        </span>
                                    )}
                                </div>
                                <span className="font-headline font-black text-[13px]" style={{ color: G.gold }}>
                                    {dep.contribution_score.toLocaleString('fr-FR')} pts
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* War History */}
            <section className="mt-8">
                <div className="flex items-center justify-between mb-4 px-0.5">
                    <h2 className="font-headline text-[17px] font-black section-title" style={{ color: G.parch }}>
                        Historique des Guerres
                    </h2>
                    {warHistory.length > 0 && (() => {
                        const wins = warHistory.filter(w => w.winner_id === userClanId).length;
                        const pct  = Math.round((wins / warHistory.length) * 100);
                        return (
                            <span className="font-label text-[10px] font-black uppercase px-2.5 py-1 rounded-full"
                                  style={{ background: 'rgba(74,160,64,0.12)', border: '1px solid rgba(74,160,64,0.3)', color: G.forBrt }}>
                                {pct}% Victoires
                            </span>
                        );
                    })()}
                </div>

                <div className="corner-ornament rounded-xl overflow-hidden"
                     style={{ border: `1px solid ${G.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>

                    {warHistory.length === 0 ? (
                        <div className="p-8 text-center font-label text-sm italic" style={{ color: G.parchDm }}>
                            Aucun historique pour l'instant.
                        </div>
                    ) : warHistory.map((war, idx) => {
                        const result   = getResult(war);
                        const opponent = getOpponent(war);
                        const won      = result === 'won';

                        return (
                            <div key={war.id} className="flex items-center justify-between p-4"
                                 style={{
                                     background: idx % 2 === 0
                                         ? 'linear-gradient(135deg, #1c1108 0%, #140d06 100%)'
                                         : 'linear-gradient(135deg, #180e06 0%, #110b05 100%)',
                                     borderTop: idx > 0 ? '1px solid rgba(201,147,60,0.08)' : 'none',
                                 }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                         style={{
                                             background: won ? 'rgba(45,90,39,0.15)' : 'rgba(139,26,26,0.12)',
                                             border: `1px solid ${won ? 'rgba(74,160,64,0.3)' : 'rgba(139,26,26,0.3)'}`,
                                         }}>
                                        <span className="material-symbols-outlined text-lg"
                                              style={{ color: won ? G.forBrt : G.crimBrt, fontVariationSettings: "'FILL' 1" }}>
                                            {won ? 'shield' : 'dangerous'}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-headline font-bold text-[14px]" style={{ color: G.parch }}>
                                            vs {opponent}
                                        </h4>
                                        <p className="font-label text-[9px] uppercase tracking-wide mt-0.5" style={{ color: G.parchDm }}>
                                            {new Date(war.scheduled_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            {' · '}{war.score_a} – {war.score_b}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right flex items-center gap-3">
                                    <div className="font-headline font-black text-base"
                                         style={{ color: won ? G.forBrt : G.crimBrt, textShadow: `0 0 8px ${won ? G.forBrt : G.crimBrt}55` }}>
                                        {result === null ? '—' : won ? 'GAGNÉ' : 'PERDU'}
                                    </div>
                                    <Link href={`/wars/${war.id}`}
                                          className="font-label text-[9px] uppercase tracking-wider px-2 py-1 rounded-lg transition-all hover:brightness-110"
                                          style={{ background: 'rgba(201,147,60,0.08)', border: `1px solid ${G.border}`, color: G.gold }}>
                                        Détail
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </GameLayout>
    );
}
