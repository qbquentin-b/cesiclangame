import React, { useState, useEffect } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, router, usePage } from '@inertiajs/react';

function useCountdown(doneAt) {
    const [label, setLabel] = useState('');

    useEffect(() => {
        if (!doneAt) { setLabel(''); return; }
        const end = new Date(doneAt).getTime();

        const update = () => {
            const diff = end - Date.now();
            if (diff <= 0) { setLabel('Prêts !'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setLabel(h > 0 ? `${h}h ${String(m).padStart(2,'0')}m` : `${m}m ${String(s).padStart(2,'0')}s`);
        };

        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [doneAt]);

    return { label };
}

// Compatibilité avec l'ancien nom
function useTrainingCountdown(trainingDoneAt) { return useCountdown(trainingDoneAt); }

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
    rare:    '#4A90D9',
    epic:    '#9B59B6',
    legendary: '#F39C12',
};

const RARITY_META = {
    common:    { label: 'Commun',    color: G.parchDm, border: 'rgba(242,228,196,0.2)' },
    rare:      { label: 'Rare',      color: G.rare,    border: 'rgba(74,144,217,0.4)' },
    epic:      { label: 'Épique',    color: G.epic,    border: 'rgba(155,89,182,0.4)' },
    legendary: { label: 'Légendaire', color: G.legendary, border: 'rgba(243,156,18,0.5)' },
};

const SOLDIER_ICONS = {
    eclaireur:  'directions_run',
    fantassin:  'shield_person',
    archer:     'sports_martial_arts',
    cavalier:   'emoji_transportation',
    catapulte:  'hardware',
};

function ResourcePill({ icon, label, value, color = G.parchDm }) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
             style={{ background: 'rgba(201,147,60,0.06)', border: `1px solid ${G.border}` }}>
            <span className="material-symbols-outlined text-[14px]" style={{ color }}>{icon}</span>
            <span className="font-label text-[10px] uppercase tracking-wider" style={{ color: G.parchDm }}>{label}</span>
            <span className="font-headline font-black text-[13px]" style={{ color }}>{value.toLocaleString('fr-FR')}</span>
        </div>
    );
}

function SoldierCard({ type, troop, onTrain }) {
    const [qty, setQty] = useState(1);
    const icon     = SOLDIER_ICONS[type.slug] ?? 'person';
    const available  = troop?.quantity ?? 0;
    const inTraining = troop?.in_training ?? 0;
    const wounded    = troop?.wounded ?? 0;
    const { label: trainingLabel } = useTrainingCountdown(troop?.training_done_at);
    const { label: healLabel }     = useCountdown(troop?.healed_at);
    const isReady  = trainingLabel === 'Prêts !';
    const isHealed = healLabel === 'Prêts !';

    const costs = [
        { key: 'cost_wood',  icon: 'forest',        label: 'Bois',        value: type.cost_wood  },
        { key: 'cost_metal', icon: 'hardware',       label: 'Fer',         value: type.cost_metal },
        { key: 'cost_food',  icon: 'grain',          label: 'Nourriture',  value: type.cost_food  },
        { key: 'cost_gold',  icon: 'paid',           label: 'Or',          value: type.cost_gold  },
    ].filter(c => c.value > 0);

    return (
        <div className="rounded-xl overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #1c1208 0%, #140d06 100%)', border: `1px solid ${G.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                             style={{ background: 'rgba(201,147,60,0.1)', border: `1px solid ${G.border}` }}>
                            <span className="material-symbols-outlined text-2xl"
                                  style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                        </div>
                        <div>
                            <h3 className="font-headline font-black text-[15px]" style={{ color: G.parch }}>{type.name}</h3>
                            <p className="font-label text-[9px] uppercase tracking-wider mt-0.5" style={{ color: G.parchDm }}>
                                {type.description}
                            </p>
                        </div>
                    </div>
                    <div className="text-right shrink-0 ml-2 space-y-1">
                        <div>
                            <div className="font-headline font-black text-xl" style={{ color: G.gold }}>{available}</div>
                            <div className="font-label text-[8px] uppercase tracking-wider" style={{ color: G.parchDm }}>Disponibles</div>
                        </div>
                        {wounded > 0 && (
                            <div>
                                <div className="font-headline font-black text-base" style={{ color: G.crimBrt }}>{wounded}</div>
                                <div className="font-label text-[8px] uppercase tracking-wider" style={{ color: G.crimBrt }}>Blessés</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                        { label: 'ATK', value: type.attack, color: G.crimBrt },
                        { label: 'DEF', value: type.defense, color: G.forBrt },
                        { label: 'HP',  value: type.hp,      color: G.rare },
                    ].map(s => (
                        <div key={s.label} className="text-center py-1.5 rounded-lg"
                             style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(255,255,255,0.05)` }}>
                            <div className="font-headline font-black text-[14px]" style={{ color: s.color }}>{s.value}</div>
                            <div className="font-label text-[8px] uppercase tracking-widest" style={{ color: G.parchDm }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Costs */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {costs.map(c => (
                        <span key={c.key} className="flex items-center gap-1 px-2 py-0.5 rounded-full font-label text-[9px]"
                              style={{ background: 'rgba(201,147,60,0.08)', border: `1px solid ${G.border}`, color: G.parchDm }}>
                            <span className="material-symbols-outlined text-[10px]" style={{ color: G.gold }}>{c.icon}</span>
                            {c.value * qty} {c.label}
                        </span>
                    ))}
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-label text-[9px]"
                          style={{ background: 'rgba(201,147,60,0.08)', border: `1px solid ${G.border}`, color: G.parchDm }}>
                        <span className="material-symbols-outlined text-[10px]" style={{ color: G.gold }}>timer</span>
                        {Math.ceil(type.training_time * qty / 60)} min
                    </span>
                </div>

                {/* In training */}
                {inTraining > 0 && (
                    <div className="rounded-lg px-3 py-2 mb-2 flex items-center justify-between"
                         style={{
                             background: isReady ? 'rgba(74,160,64,0.08)' : 'rgba(201,147,60,0.06)',
                             border: `1px solid ${isReady ? 'rgba(74,160,64,0.3)' : G.border}`,
                         }}>
                        <span className="font-label text-[10px] uppercase tracking-wider flex items-center gap-2" style={{ color: G.parchDm }}>
                            <span className="material-symbols-outlined text-[12px]"
                                  style={{ color: isReady ? G.forBrt : G.gold, fontVariationSettings: "'FILL' 1" }}>
                                {isReady ? 'check_circle' : 'timer'}
                            </span>
                            En entraînement : <strong style={{ color: isReady ? G.forBrt : G.gold }}>{inTraining}</strong>
                        </span>
                        <span className="font-label text-[10px] font-black tabular-nums"
                              style={{ color: isReady ? G.forBrt : G.parchDm }}>
                            {trainingLabel}
                        </span>
                    </div>
                )}

                {/* Blessés */}
                {wounded > 0 && (
                    <div className="rounded-lg px-3 py-2 mb-3 flex items-center justify-between"
                         style={{
                             background: isHealed ? 'rgba(74,160,64,0.08)' : 'rgba(139,26,26,0.08)',
                             border: `1px solid ${isHealed ? 'rgba(74,160,64,0.3)' : 'rgba(139,26,26,0.3)'}`,
                         }}>
                        <span className="font-label text-[10px] uppercase tracking-wider flex items-center gap-2" style={{ color: G.parchDm }}>
                            <span className="material-symbols-outlined text-[12px]"
                                  style={{ color: isHealed ? G.forBrt : G.crimBrt, fontVariationSettings: "'FILL' 1" }}>
                                {isHealed ? 'health_and_safety' : 'healing'}
                            </span>
                            Blessés : <strong style={{ color: isHealed ? G.forBrt : G.crimBrt }}>{wounded}</strong>
                        </span>
                        <span className="font-label text-[10px] font-black tabular-nums"
                              style={{ color: isHealed ? G.forBrt : G.parchDm }}>
                            {isHealed ? 'Guéris !' : healLabel}
                        </span>
                    </div>
                )}

                {/* Train controls */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <button onClick={() => setQty(q => Math.max(1, q - 5))}
                                className="w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                                style={{ background: 'rgba(201,147,60,0.1)', border: `1px solid ${G.border}`, color: G.gold }}>
                            -5
                        </button>
                        <button onClick={() => setQty(q => Math.max(1, q - 1))}
                                className="w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                                style={{ background: 'rgba(201,147,60,0.1)', border: `1px solid ${G.border}`, color: G.gold }}>
                            -
                        </button>
                        <input type="number" value={qty} min={1} max={500}
                               onChange={e => setQty(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                               className="w-12 text-center rounded-lg py-1 text-sm font-bold outline-none"
                               style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${G.border}`, color: G.parch }} />
                        <button onClick={() => setQty(q => Math.min(500, q + 1))}
                                className="w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                                style={{ background: 'rgba(201,147,60,0.1)', border: `1px solid ${G.border}`, color: G.gold }}>
                            +
                        </button>
                        <button onClick={() => setQty(q => Math.min(500, q + 5))}
                                className="w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                                style={{ background: 'rgba(201,147,60,0.1)', border: `1px solid ${G.border}`, color: G.gold }}>
                            +5
                        </button>
                    </div>
                    <button onClick={() => onTrain(type.id, qty)}
                            className="flex-1 py-2 rounded-lg font-headline font-black text-[12px] uppercase tracking-wider transition-all hover:brightness-110"
                            style={{ background: `linear-gradient(135deg, ${G.gold}33, ${G.gold}22)`, border: `1px solid ${G.gold}`, color: G.gold }}>
                        Entraîner
                    </button>
                </div>
            </div>
        </div>
    );
}

function CommanderCard({ userCommander, onActivate, onDeactivate }) {
    const cmd = userCommander.commander;
    const rarity = RARITY_META[cmd.rarity] ?? RARITY_META.common;
    const isActive = userCommander.is_active;

    return (
        <div className="rounded-xl overflow-hidden transition-all"
             style={{
                 background: `linear-gradient(135deg, #1c1208 0%, #140d06 100%)`,
                 border: `1px solid ${isActive ? rarity.border : G.border}`,
                 boxShadow: isActive ? `0 0 20px ${rarity.color}22` : 'none',
             }}>
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full font-label text-[8px] uppercase tracking-wider font-black"
                                  style={{ background: `${rarity.color}22`, border: `1px solid ${rarity.border}`, color: rarity.color }}>
                                {rarity.label}
                            </span>
                            {isActive && (
                                <span className="px-2 py-0.5 rounded-full font-label text-[8px] uppercase tracking-wider font-black"
                                      style={{ background: 'rgba(74,160,64,0.15)', border: '1px solid rgba(74,160,64,0.4)', color: G.forBrt }}>
                                    Actif
                                </span>
                            )}
                        </div>
                        <h3 className="font-headline font-black text-[15px]" style={{ color: G.parch }}>{cmd.name}</h3>
                        {cmd.title && (
                            <p className="font-label text-[9px] italic" style={{ color: rarity.color }}>{cmd.title}</p>
                        )}
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                         style={{ background: `${rarity.color}15`, border: `1px solid ${rarity.border}` }}>
                        <span className="material-symbols-outlined text-xl"
                              style={{ color: rarity.color, fontVariationSettings: "'FILL' 1" }}>
                            military_tech
                        </span>
                    </div>
                </div>

                <p className="font-label text-[10px] mb-3 leading-relaxed" style={{ color: G.parchDm }}>
                    {cmd.description}
                </p>

                {cmd.lore && (
                    <p className="font-label text-[9px] italic mb-3 px-2 py-1.5 rounded"
                       style={{ color: `${G.parchDm}`, background: 'rgba(0,0,0,0.2)', borderLeft: `2px solid ${rarity.color}44` }}>
                        {cmd.lore}
                    </p>
                )}

                <button
                    onClick={() => isActive ? onDeactivate() : onActivate(userCommander.id)}
                    className="w-full py-2 rounded-lg font-headline font-black text-[11px] uppercase tracking-wider transition-all hover:brightness-110"
                    style={{
                        background: isActive
                            ? 'rgba(139,26,26,0.15)'
                            : `linear-gradient(135deg, ${rarity.color}22, ${rarity.color}15)`,
                        border: `1px solid ${isActive ? 'rgba(139,26,26,0.4)' : rarity.border}`,
                        color: isActive ? G.crimBrt : rarity.color,
                    }}>
                    {isActive ? 'Désactiver' : 'Activer'}
                </button>
            </div>
        </div>
    );
}

function DeployPanel({ activeWar, troops, soldierTypes, activeCommander, alreadyDeployed, userClanId }) {
    const [deployQtys, setDeployQtys] = useState({});
    const isA = activeWar?.clan_a_id === userClanId;
    const ally = isA ? activeWar?.clan_a : activeWar?.clan_b;
    const enemy = isA ? activeWar?.clan_b : activeWar?.clan_a;

    const troopByType = {};
    troops.forEach(t => { troopByType[t.soldier_type_id] = t; });

    const handleDeploy = () => {
        router.post('/troops/deploy', { troops: deployQtys }, { preserveScroll: true });
    };

    const totalDeployed = Object.values(deployQtys).reduce((s, v) => s + (parseInt(v) || 0), 0);

    if (!activeWar) return null;

    return (
        <div className="rounded-xl overflow-hidden mt-6"
             style={{ border: `1px solid ${G.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
            <div className="px-4 py-3 flex items-center gap-2"
                 style={{ background: 'linear-gradient(135deg, rgba(201,147,60,0.1), rgba(201,147,60,0.05))', borderBottom: `1px solid ${G.border}` }}>
                <span className="material-symbols-outlined text-lg" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>swords</span>
                <span className="font-headline font-black text-[14px]" style={{ color: G.parch }}>
                    Déploiement — {ally?.name} vs {enemy?.name}
                </span>
            </div>

            <div className="p-4" style={{ background: 'linear-gradient(135deg, #1c1208, #140d06)' }}>
                {alreadyDeployed ? (
                    <div className="text-center py-4">
                        <span className="material-symbols-outlined text-4xl mb-2" style={{ color: G.forBrt, display: 'block' }}>check_circle</span>
                        <p className="font-headline font-bold text-[14px]" style={{ color: G.forBrt }}>Troupes déployées !</p>
                        <p className="font-label text-[10px] mt-1" style={{ color: G.parchDm }}>Vos troupes combattent pour le clan.</p>
                    </div>
                ) : (
                    <>
                        {activeCommander && (
                            <div className="rounded-lg px-3 py-2 mb-4 flex items-center gap-2"
                                 style={{ background: 'rgba(201,147,60,0.06)', border: `1px solid ${G.border}` }}>
                                <span className="material-symbols-outlined text-lg"
                                      style={{ color: RARITY_META[activeCommander.commander?.rarity]?.color ?? G.gold, fontVariationSettings: "'FILL' 1" }}>
                                    military_tech
                                </span>
                                <div>
                                    <span className="font-headline font-bold text-[12px]" style={{ color: G.parch }}>
                                        {activeCommander.commander?.name}
                                    </span>
                                    <span className="font-label text-[9px] ml-2" style={{ color: G.parchDm }}>actif</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 mb-4">
                            {soldierTypes.map(type => {
                                const troop = troopByType[type.id];
                                const available = troop?.quantity ?? 0;
                                return (
                                    <div key={type.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                             style={{ background: 'rgba(201,147,60,0.08)', border: `1px solid ${G.border}` }}>
                                            <span className="material-symbols-outlined text-[16px]"
                                                  style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>
                                                {SOLDIER_ICONS[type.slug] ?? 'person'}
                                            </span>
                                        </div>
                                        <span className="font-label text-[11px] flex-1" style={{ color: G.parch }}>{type.name}</span>
                                        <span className="font-label text-[10px] w-12 text-right" style={{ color: G.parchDm }}>
                                            /{available}
                                        </span>
                                        <input
                                            type="number" min={0} max={available}
                                            value={deployQtys[type.id] ?? 0}
                                            onChange={e => setDeployQtys(prev => ({
                                                ...prev,
                                                [type.id]: Math.min(available, Math.max(0, parseInt(e.target.value) || 0))
                                            }))}
                                            className="w-16 text-center rounded-lg py-1 text-sm font-bold outline-none"
                                            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${G.border}`, color: G.parch }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleDeploy}
                            disabled={totalDeployed === 0}
                            className="w-full py-2.5 rounded-lg font-headline font-black text-[13px] uppercase tracking-wider transition-all"
                            style={{
                                background: totalDeployed > 0
                                    ? `linear-gradient(135deg, ${G.crimson}, ${G.crimBrt}33)`
                                    : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${totalDeployed > 0 ? G.crimBrt : 'rgba(255,255,255,0.1)'}`,
                                color: totalDeployed > 0 ? G.parch : G.parchDm,
                                cursor: totalDeployed === 0 ? 'not-allowed' : 'pointer',
                            }}>
                            Déployer {totalDeployed > 0 ? `${totalDeployed} troupes` : '— choisissez des troupes'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function TroopsView({ soldierTypes, troops, commanders, activeCommander, activeWar, alreadyDeployed, userResources }) {
    const { auth } = usePage().props;
    const userClanId = auth?.user?.clan_id;
    const flash = usePage().props.flash ?? {};
    const errors = usePage().props.errors ?? {};

    const handleTrain = (soldierTypeId, quantity) => {
        router.post('/troops/train', { soldier_type_id: soldierTypeId, quantity }, { preserveScroll: true });
    };

    const handleCollect = () => {
        router.post('/troops/collect', {}, { preserveScroll: true });
    };

    const handleActivate = (userCommanderId) => {
        router.patch(`/commanders/${userCommanderId}/activate`, {}, { preserveScroll: true });
    };

    const handleDeactivate = () => {
        router.post('/commanders/deactivate', {}, { preserveScroll: true });
    };

    const hasTrainingReady = troops.some(t =>
        t.in_training > 0 && t.training_done_at && new Date(t.training_done_at) <= new Date()
    );

    const troopMap = {};
    troops.forEach(t => { troopMap[t.soldier_type_id] = t; });

    const totalTroops  = troops.reduce((s, t) => s + t.quantity, 0);
    const totalWounded = troops.reduce((s, t) => s + (t.wounded ?? 0), 0);
    const armyPower    = soldierTypes.reduce((sum, type) => {
        const qty = troopMap[type.id]?.quantity ?? 0;
        return sum + (type.attack + type.defense * 0.5) * qty;
    }, 0);

    return (
        <GameLayout activeTab="troupes">
            <Head title="Troupes" />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="font-headline text-3xl font-black flex items-center gap-3"
                    style={{ color: '#F2E4C4', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                    <span className="material-symbols-outlined text-3xl"
                          style={{ color: G.gold, filter: 'drop-shadow(0 0 8px rgba(201,147,60,0.5))', fontVariationSettings: "'FILL' 1" }}>
                        shield_person
                    </span>
                    Armée
                </h2>
                {hasTrainingReady && (
                    <button onClick={handleCollect}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg font-headline font-black text-[11px] uppercase tracking-wider transition-all hover:brightness-110"
                            style={{ background: 'rgba(74,160,64,0.15)', border: '1px solid rgba(74,160,64,0.4)', color: G.forBrt }}>
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Récupérer les troupes
                    </button>
                )}
            </div>

            {/* Flash messages */}
            {flash.message && (
                <div className="mb-4 px-4 py-3 rounded-lg font-label text-sm"
                     style={{ background: 'rgba(74,160,64,0.12)', border: '1px solid rgba(74,160,64,0.3)', color: G.forBrt }}>
                    {flash.message}
                </div>
            )}
            {errors.message && (
                <div className="mb-4 px-4 py-3 rounded-lg font-label text-sm"
                     style={{ background: 'rgba(139,26,26,0.12)', border: '1px solid rgba(139,26,26,0.3)', color: G.crimBrt }}>
                    {errors.message}
                </div>
            )}

            {(totalTroops > 0 || totalWounded > 0) && (
                <div className="flex gap-3 mb-4">
                    <div className="flex-1 rounded-xl px-4 py-3 flex flex-col items-center"
                         style={{ background: 'linear-gradient(135deg, rgba(201,147,60,0.08), rgba(201,147,60,0.04))', border: `1px solid ${G.border}` }}>
                        <span className="font-headline font-black text-2xl" style={{ color: G.gold }}>{totalTroops.toLocaleString('fr-FR')}</span>
                        <span className="font-label text-[8px] uppercase tracking-widest mt-0.5" style={{ color: G.parchDm }}>Soldats</span>
                    </div>
                    {totalWounded > 0 && (
                        <div className="flex-1 rounded-xl px-4 py-3 flex flex-col items-center"
                             style={{ background: 'linear-gradient(135deg, rgba(139,26,26,0.1), rgba(139,26,26,0.04))', border: 'solid 1px rgba(139,26,26,0.3)' }}>
                            <span className="font-headline font-black text-2xl" style={{ color: G.crimBrt }}>{totalWounded.toLocaleString('fr-FR')}</span>
                            <span className="font-label text-[8px] uppercase tracking-widest mt-0.5" style={{ color: G.parchDm }}>Blessés</span>
                        </div>
                    )}
                    <div className="flex-1 rounded-xl px-4 py-3 flex flex-col items-center"
                         style={{ background: 'linear-gradient(135deg, rgba(197,48,48,0.08), rgba(197,48,48,0.04))', border: `1px solid rgba(197,48,48,0.2)` }}>
                        <span className="font-headline font-black text-2xl" style={{ color: G.crimBrt }}>{Math.round(armyPower).toLocaleString('fr-FR')}</span>
                        <span className="font-label text-[8px] uppercase tracking-widest mt-0.5" style={{ color: G.parchDm }}>Puissance estimée</span>
                    </div>
                </div>
            )}

            {/* Resources */}
            <div className="flex flex-wrap gap-2 mb-6">
                <ResourcePill icon="forest"   label="Bois"       value={userResources.wood}  color={G.forBrt} />
                <ResourcePill icon="hardware" label="Fer"        value={userResources.metal} color={G.parchDm} />
                <ResourcePill icon="grain"    label="Nourriture" value={userResources.food}  color={G.goldBrt} />
                <ResourcePill icon="paid"     label="Or"         value={userResources.gold}  color={G.legendary} />
            </div>

            {/* Deploy panel if war active */}
            {activeWar && (
                <DeployPanel
                    activeWar={activeWar}
                    troops={troops}
                    soldierTypes={soldierTypes}
                    activeCommander={activeCommander}
                    alreadyDeployed={alreadyDeployed}
                    userClanId={userClanId}
                />
            )}

            {/* Soldiers */}
            <section className="mt-6">
                <h3 className="font-headline font-black text-[17px] mb-4 flex items-center gap-2" style={{ color: '#F2E4C4' }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>groups</span>
                    Recrutement
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    {soldierTypes.map(type => (
                        <SoldierCard key={type.id} type={type} troop={troopMap[type.id] ?? null} onTrain={handleTrain} />
                    ))}
                </div>
            </section>

            {/* Commanders */}
            <section className="mt-8">
                <h3 className="font-headline font-black text-[17px] mb-4 flex items-center gap-2" style={{ color: '#F2E4C4' }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                    Commandants
                    {activeCommander && (
                        <span className="font-label text-[10px] px-2 py-0.5 rounded-full ml-2"
                              style={{ background: 'rgba(74,160,64,0.12)', border: '1px solid rgba(74,160,64,0.3)', color: G.forBrt }}>
                            {activeCommander.commander?.name} actif
                        </span>
                    )}
                </h3>
                {commanders.length === 0 ? (
                    <div className="text-center py-10 rounded-xl"
                         style={{ border: `1px solid ${G.border}`, background: 'rgba(201,147,60,0.03)' }}>
                        <span className="material-symbols-outlined text-5xl mb-3" style={{ color: G.parchDm, display: 'block' }}>military_tech</span>
                        <p className="font-headline font-bold text-[14px]" style={{ color: G.parchDm }}>Aucun commandant</p>
                        <p className="font-label text-[10px] mt-1" style={{ color: G.parchDm }}>
                            Ouvrez des coffres dans la section Drops pour en obtenir.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {commanders.map(uc => (
                            <CommanderCard
                                key={uc.id}
                                userCommander={uc}
                                onActivate={handleActivate}
                                onDeactivate={handleDeactivate}
                            />
                        ))}
                    </div>
                )}
            </section>
        </GameLayout>
    );
}
