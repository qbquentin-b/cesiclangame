import React, { useState, useMemo, useRef, useEffect } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Delaunay } from 'd3-delaunay';

const WIDTH = 1000;
const HEIGHT = 1000;

const TYPE_COLORS = {
    plains:   '#c8d89a',
    forest:   '#7a9d6a',
    mountain: '#a89880',
    desert:   '#d4c08a',
};

const RESOURCE_LABELS = {
    food:  '🌾 Nourriture',
    wood:  '🪵 Bois',
    metal: '⚙️ Fer',
    gold:  '🪙 Or',
};

// ── Side panel: Build on zone ─────────────────────────────────────────────────
function BuildPanel({ zone, buildingTypes, userResources, onClose }) {
    const slotsFull = (zone.zone_buildings?.length ?? 0) >= 2;

    const handleBuild = (type) => {
        if (confirm(`Construire ${buildingTypes[type].label} sur ${zone.name} ?`)) {
            router.post(route('zone.building.store', zone.id), { type }, { preserveScroll: true });
            onClose();
        }
    };

    const handleUpgrade = (building) => {
        if (confirm(`Améliorer ${buildingTypes[building.type]?.label} au niveau ${building.level + 1} ?`)) {
            router.patch(route('zone.building.upgrade', building.id), {}, { preserveScroll: true });
        }
    };

    const handleDestroy = (building) => {
        if (confirm(`Démolir ${buildingTypes[building.type]?.label} ?`)) {
            router.delete(route('zone.building.destroy', building.id), { preserveScroll: true });
        }
    };

    const existingTypes = (zone.zone_buildings ?? []).map(b => b.type);

    return (
        <div className="mt-4 border-t border-[#765a19]/30 pt-4">
            <h4 className="font-headline font-bold text-base text-[#2c1a0c] mb-3">🏗️ Bâtiments sur la zone</h4>

            {/* Existing buildings */}
            {(zone.zone_buildings ?? []).map(b => {
                const cfg = buildingTypes[b.type] || {};
                return (
                    <div key={b.id} className="flex items-center justify-between bg-white/50 rounded-xl p-2 mb-2 border border-[#765a19]/20">
                        <span className="text-sm font-bold">{cfg.icon} {cfg.label} <span className="text-xs opacity-60">Nv.{b.level}</span></span>
                        <div className="flex gap-1">
                            {b.level < 3 && (
                                <button onClick={() => handleUpgrade(b)}
                                        className="text-xs px-2 py-1 bg-[#3c6704] text-white rounded-lg hover:brightness-110">
                                    ⬆️
                                </button>
                            )}
                            <button onClick={() => handleDestroy(b)}
                                    className="text-xs px-2 py-1 bg-red-700 text-white rounded-lg hover:brightness-110">
                                🗑️
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* Build new */}
            {slotsFull ? (
                <p className="text-xs italic text-[#765a19]/60 text-center py-2">Slots pleins (2/2)</p>
            ) : (
                <>
                    <p className="text-xs text-[#2c1a0c]/60 font-label mb-2">Construire ({(zone.zone_buildings?.length ?? 0)}/2 slots) :</p>
                    <div className="grid grid-cols-1 gap-1.5">
                        {Object.entries(buildingTypes).filter(([t]) => !existingTypes.includes(t)).map(([type, cfg]) => (
                            <button key={type} onClick={() => handleBuild(type)}
                                    className="flex items-start gap-2 text-left px-3 py-2 bg-[#765a19]/10 hover:bg-[#765a19]/20 rounded-lg transition">
                                <span className="text-lg flex-shrink-0 mt-0.5">{cfg.icon}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-[#2c1a0c]">{cfg.label}</p>
                                    <p className="text-[10px] text-[#2c1a0c]/50 leading-relaxed whitespace-normal">{cfg.description}</p>
                                    {cfg.cost && (
                                        <p className="text-[9px] text-[#765a19] font-bold mt-1">
                                            Coût : {[
                                                cfg.cost[0] ? `🪵 ${cfg.cost[0]}` : null,
                                                cfg.cost[1] ? `⚙️ ${cfg.cost[1]}` : null,
                                                cfg.cost[2] ? `🌾 ${cfg.cost[2]}` : null,
                                                cfg.cost[3] ? `🪙 ${cfg.cost[3]}` : null,
                                            ].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function MapView({ zones = [], terrainCosts = {}, terrainDurations = {}, buildingTypes = {}, activeWarsByClan = {} }) {
    const { auth } = usePage().props;
    const flash  = usePage().props.flash || {};
    const errors = usePage().props.errors || {};
    const [selectedZone, setSelectedZone] = useState(null);
    const [showBuildPanel, setShowBuildPanel] = useState(false);
    const [renameValue, setRenameValue]   = useState('');
    const [isRenaming, setIsRenaming]     = useState(false);
    const [now, setNow] = useState(Date.now());
    const svgRef          = useRef(null);
    const clickTimer      = useRef(null);
    const reloadScheduled = useRef(new Set());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Auto-reload 3s after a conquest timer hits 0
    useEffect(() => {
        zones.forEach(zone => {
            if (!zone.conquering_clan_id || !zone.conquest_started_at) return;
            const remaining = getConquestRemainingSeconds(zone);
            if (remaining === 0 && !reloadScheduled.current.has(zone.id)) {
                reloadScheduled.current.add(zone.id);
                setTimeout(() => router.reload({ preserveScroll: true }), 3000);
            }
        });
    }, [now]);

    const getCost     = (type) => terrainCosts[type]     ?? 100;
    const getDuration = (type) => terrainDurations[type] ?? 10;

    const getConquestRemainingSeconds = (zone) => {
        if (!zone.conquest_started_at || !zone.conquering_clan_id) return null;
        const durationMs = getDuration(zone.type) * 60 * 1000;
        const startedAt  = new Date(zone.conquest_started_at).getTime();
        const endsAt     = startedAt + durationMs;
        return Math.max(0, Math.ceil((endsAt - now) / 1000));
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s.toString().padStart(2, '0')}s`;
    };

    const { polygons, cells } = useMemo(() => {
        if (!zones.length) return { polygons: [], cells: [] };
        const boundaryPoints = [
            [0, 0], [WIDTH/2, 0], [WIDTH, 0],
            [0, HEIGHT/2], [WIDTH, HEIGHT/2],
            [0, HEIGHT], [WIDTH/2, HEIGHT], [WIDTH, HEIGHT],
        ];
        const allPoints = zones.map(z => [z.x_coord, z.y_coord]);
        const delaunay  = Delaunay.from([...allPoints, ...boundaryPoints]);
        const voronoi   = delaunay.voronoi([0, 0, WIDTH, HEIGHT]);
        const polygons  = zones.map((_, i) => voronoi.cellPolygon(i));
        return { polygons, cells: zones };
    }, [zones]);

    // Single click → select, double-click → open build panel (only own zones)
    const handleClick = (zone) => {
        if (clickTimer.current) {
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
            // Double click
            if (zone.clan_id === auth.user.clan_id) {
                setSelectedZone(zone);
                setIsRenaming(false);
                setRenameValue(zone.name);
                setShowBuildPanel(true);
            }
        } else {
            clickTimer.current = setTimeout(() => {
                clickTimer.current = null;
                setSelectedZone(zone);
                setIsRenaming(false);
                setRenameValue(zone.name);
                setShowBuildPanel(false);
            }, 250);
        }
    };

    const handleClaim = () => {
        if (!selectedZone) return;
        if (!auth.user.clan_id) { alert("Vous devez être dans un clan !"); return; }
        if (auth.user.clan_rank !== 'leader' && auth.user.clan_rank !== 'officer') {
            alert("Seuls les leaders et officiers peuvent revendiquer des terres."); return;
        }
        const cost = getCost(selectedZone.type);
        if (confirm(`Assiéger "${selectedZone.name}" pour ${cost} cristaux de trésorerie ?`)) {
            router.post(route('map.claim', selectedZone.id), {}, { preserveScroll: true });
            setSelectedZone(null);
        }
    };

    const handleRename = (e) => {
        e.preventDefault();
        if (!selectedZone || !renameValue.trim()) return;
        router.patch(route('map.rename', selectedZone.id), { name: renameValue }, {
            preserveScroll: true,
            onSuccess: () => { setSelectedZone(prev => ({ ...prev, name: renameValue })); setIsRenaming(false); }
        });
    };

    const handleSetCapital = () => {
        if (!selectedZone) return;
        if (confirm(`Définir "${selectedZone.name}" comme Capitale ?`)) {
            router.post(route('map.setCapital', selectedZone.id), {}, { preserveScroll: true });
        }
    };

    const handleDeclareWar = () => {
        if (!selectedZone) return;
        if (!auth.user.clan_id) { alert("Vous devez être dans un clan !"); return; }
        if (auth.user.clan_rank !== 'leader' && auth.user.clan_rank !== 'officer') {
            alert("Seuls les chefs et officiers peuvent déclarer la guerre."); return;
        }
        const zoneName  = selectedZone.name;
        const clanName  = selectedZone.clan?.name ?? 'ce clan';
        if (confirm(`Déclarer la guerre à ${clanName} pour la zone « ${zoneName} » ?\n\nLe vainqueur remportera cette zone.`)) {
            router.post(route('map.declareWar', selectedZone.id), {}, { preserveScroll: false });
        }
    };

    const getPolygonPath = (polygon) => {
        if (!polygon || polygon.length < 3) return '';
        return 'M' + polygon.map(p => p.join(',')).join('L') + 'Z';
    };

    const isMyZone    = (zone) => !!auth.user.clan_id && zone.clan_id === auth.user.clan_id;
    const isEnemyZone = (zone) => !!zone.clan_id && !isMyZone(zone);

    const reservePct = (zone) => {
        if (!zone.reserve_max) return 0;
        return Math.round((zone.reserve_primary / zone.reserve_max) * 100);
    };

    return (
        <GameLayout activeTab="map">
            <Head title="Carte du Monde" />

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

            <section className="relative overflow-hidden rounded-xl bg-[#2c1a0c] border-4 border-[#765a19] shadow-2xl p-5 mb-4 text-center text-secondary-fixed">
                <div className="absolute top-0 left-0 w-40 h-40 bg-primary/10 rounded-br-full blur-3xl pointer-events-none" />
                <h2 className="font-headline text-3xl font-extrabold uppercase tracking-wider drop-shadow-md">Les Royaumes du Monde</h2>
                <p className="font-label text-xs uppercase mt-1 opacity-60">Clic = Sélectionner • Double-clic = Construire • Zone ennemie = Déclarer la Guerre</p>
            </section>

            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* SVG MAP */}
                <div className="flex-1 w-full overflow-hidden rounded-2xl border-8 border-[#3c2a1a] shadow-[0_8px_60px_rgba(0,0,0,0.6)] bg-[#c8b89a]"
                     style={{ minHeight: '60vw', maxHeight: '80vh' }}>
                    <svg ref={svgRef}
                         viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                         width="100%" height="100%"
                         preserveAspectRatio="xMidYMid meet"
                         style={{ backgroundImage: "url('/images/world_map.png')", backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }}>
                        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="rgba(40,20,10,0.15)" />

                        {polygons.map((polygon, i) => {
                            const zone    = cells[i];
                            if (!zone || !polygon) return null;
                            const path    = getPolygonPath(polygon);
                            const mine    = isMyZone(zone);
                            const isSieged  = !!zone.conquering_clan_id;
                            const isMyConq  = isSieged && zone.conquering_clan_id === auth.user.clan_id;
                            const selected  = selectedZone?.id === zone.id;
                            const hasBuildings = (zone.zone_buildings?.length ?? 0) > 0;

                            let fill        = TYPE_COLORS[zone.type] || TYPE_COLORS.plains;
                            let fillOpacity = 0.35;
                            let stroke      = 'rgba(40,20,10,0.35)';
                            let strokeWidth = 0.7;

                            if (zone.clan) {
                                fill        = zone.clan.color || '#ad2b1f';
                                fillOpacity = mine ? 0.65 : 0.50;
                                stroke      = mine ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)';
                                strokeWidth = mine ? 1.2 : 0.8;
                            } else if (isSieged) {
                                fill        = zone.conqueringClan?.color || '#e67e22';
                                fillOpacity = 0.35;
                                stroke      = isMyConq ? '#f39c12' : '#c0392b';
                                strokeWidth = 2;
                            }
                            if (selected) { stroke = '#ffffff'; strokeWidth = 3; }

                            return (
                                <g key={zone.id} onClick={() => handleClick(zone)} style={{ cursor: 'pointer' }}>
                                    <path d={path} fill={fill} fillOpacity={fillOpacity}
                                          stroke={stroke} strokeWidth={strokeWidth}
                                          style={{
                                              mixBlendMode: zone.clan ? 'multiply' : 'normal',
                                              transition: 'fill-opacity 0.2s',
                                              filter: selected ? 'drop-shadow(0 0 8px rgba(255,255,255,0.9))' : 'none',
                                              animation: isSieged ? 'siegePulse 1.5s ease-in-out infinite' : 'none',
                                          }} />
                                    {/* Capital crown */}
                                    {zone.is_capital && (
                                        <text x={zone.x_coord} y={zone.y_coord + 6}
                                              textAnchor="middle" fontSize="18"
                                              style={{ userSelect: 'none', pointerEvents: 'none' }}>👑</text>
                                    )}
                                    {/* Building indicator dot */}
                                    {hasBuildings && (
                                        <circle cx={zone.x_coord + 10} cy={zone.y_coord - 10} r="6"
                                                fill="#f39c12" stroke="white" strokeWidth="1.5"
                                                style={{ pointerEvents: 'none' }} />
                                    )}
                                    {/* Reserve depletion warning */}
                                    {zone.clan && zone.reserve_primary < zone.reserve_max * 0.2 && (
                                        <text x={zone.x_coord - 10} y={zone.y_coord - 8}
                                              textAnchor="middle" fontSize="12"
                                              style={{ userSelect: 'none', pointerEvents: 'none' }}>⚠️</text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Side Panel */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    {selectedZone ? (
                        <div className="bg-[#f4ead7] border-4 border-[#765a19]/60 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header banner */}
                            <div className="p-4 text-white font-headline text-xl font-bold uppercase tracking-wide shadow-md"
                                 style={{ backgroundColor: selectedZone.clan?.color || '#765a19' }}>
                                {isRenaming ? (
                                    <form onSubmit={handleRename} className="flex gap-2">
                                        <input autoFocus value={renameValue}
                                               onChange={e => setRenameValue(e.target.value)}
                                               maxLength={50}
                                               className="flex-1 px-2 py-1 rounded text-sm text-[#2c1a0c] font-label outline-none" />
                                        <button type="submit" className="bg-white/20 rounded px-2 text-sm hover:bg-white/30">✓</button>
                                        <button type="button" onClick={() => setIsRenaming(false)} className="bg-white/10 rounded px-2 text-sm">✕</button>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="truncate">{selectedZone.name}</span>
                                        {isMyZone(selectedZone) && (
                                            <button onClick={() => setIsRenaming(true)} className="text-base opacity-70 hover:opacity-100 ml-2 flex-shrink-0">✏️</button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 space-y-2.5 font-label text-sm text-[#2c1a0c]">
                                {/* Terrain & Sovereignty */}
                                <div className="flex justify-between border-b border-[#765a19]/15 pb-1.5">
                                    <span className="font-bold">Terrain</span>
                                    <span className="capitalize">{selectedZone.type}</span>
                                </div>
                                <div className="flex justify-between border-b border-[#765a19]/15 pb-1.5">
                                    <span className="font-bold">Souveraineté</span>
                                    <span className={selectedZone.clan ? 'font-bold' : 'italic opacity-50'}
                                          style={{ color: selectedZone.clan?.color || 'inherit' }}>
                                        {selectedZone.clan ? selectedZone.clan.name : 'Terres Inoccupées'}
                                    </span>
                                </div>

                                {/* Biome Resources */}
                                <div className="bg-black/5 rounded-xl p-3 space-y-2">
                                    <p className="text-[10px] uppercase font-bold text-[#765a19]/70 tracking-widest">Ressources du Biome</p>
                                    <div className="flex items-center justify-between">
                                        <span>{RESOURCE_LABELS[selectedZone.resource_primary] ?? selectedZone.resource_primary}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-black/10 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all"
                                                     style={{ width: `${reservePct(selectedZone)}%`, backgroundColor: reservePct(selectedZone) > 30 ? '#3c6704' : '#ad2b1f' }} />
                                            </div>
                                            <span className="text-xs font-mono">{reservePct(selectedZone)}%</span>
                                        </div>
                                    </div>
                                    {selectedZone.resource_secondary && (
                                        <div className="text-xs opacity-60">
                                            + {RESOURCE_LABELS[selectedZone.resource_secondary] ?? selectedZone.resource_secondary} (secondaire)
                                        </div>
                                    )}
                                    {reservePct(selectedZone) < 20 && (
                                        <p className="text-[10px] text-red-600 font-bold">⚠️ Réserves presque épuisées !</p>
                                    )}
                                </div>

                                {/* Siege countdown */}
                                {selectedZone.conquering_clan_id && (() => {
                                    const remaining   = getConquestRemainingSeconds(selectedZone);
                                    const isMyConquest = selectedZone.conquering_clan_id === auth.user.clan_id;
                                    return (
                                        <div className={`p-3 rounded-lg border text-center ${isMyConquest ? 'bg-orange-900/30 border-orange-500 text-orange-300' : 'bg-red-900/30 border-red-500 text-red-300'}`}>
                                            <p className="text-xs uppercase font-bold mb-1">
                                                {isMyConquest ? '⚡ Conquête en cours' : '💀 Siège Ennemi'}
                                            </p>
                                            <p className="text-xl font-mono font-bold">{remaining > 0 ? formatTime(remaining) : 'Finalisation...'}</p>
                                            {selectedZone.conqueringClan && <p className="text-xs mt-1 opacity-70">par {selectedZone.conqueringClan.name}</p>}
                                        </div>
                                    );
                                })()}

                                {selectedZone.is_capital && (
                                    <div className="flex justify-between text-yellow-700 font-bold border-b border-[#765a19]/15 pb-1.5">
                                        <span>Statut</span><span>👑 Capitale</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="px-4 pb-4 space-y-2">
                                {/* Claim / siege */}
                                {!selectedZone.clan_id && !selectedZone.conquering_clan_id && auth.user.clan_id && (
                                    <button onClick={handleClaim}
                                            className="w-full py-2.5 bg-[#3c6704] text-white uppercase font-bold text-sm tracking-wide rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all">
                                        ⚔️ Assiéger ({getCost(selectedZone.type)}💎 • {getDuration(selectedZone.type)}min)
                                    </button>
                                )}
                                {selectedZone.conquering_clan_id === auth.user.clan_id && (
                                    <div className="text-center py-2 rounded-xl text-xs font-bold text-orange-300 bg-orange-900/30 border border-orange-500 animate-pulse">
                                        ⏳ Conquête en cours...
                                    </div>
                                )}
                                {isMyZone(selectedZone) && !selectedZone.is_capital && (
                                    <button onClick={handleSetCapital}
                                            className="w-full py-2.5 bg-[#765a19] text-white uppercase font-bold text-xs tracking-wide rounded-xl hover:brightness-110 transition">
                                        👑 Définir comme Capitale
                                    </button>
                                )}
                                {isMyZone(selectedZone) && (
                                    <button onClick={() => setShowBuildPanel(p => !p)}
                                            className="w-full py-2.5 border-2 border-[#765a19] text-[#765a19] uppercase font-bold text-xs tracking-wide rounded-xl hover:bg-[#765a19]/10 transition">
                                        🏗️ {showBuildPanel ? 'Fermer' : 'Gérer les Bâtiments'}
                                    </button>
                                )}
                                {selectedZone.clan_id && !isMyZone(selectedZone) && (() => {
                                    const existingWarId = activeWarsByClan[selectedZone.clan_id];
                                    const canDeclare    = auth.user.clan_id &&
                                        (auth.user.clan_rank === 'leader' || auth.user.clan_rank === 'officer');
                                    if (existingWarId) {
                                        return (
                                            <Link href={route('wars.show', existingWarId)}
                                                  className="block w-full py-2.5 text-center text-white uppercase font-bold text-xs tracking-wide rounded-xl transition hover:brightness-110"
                                                  style={{ backgroundColor: '#7a1a1a' }}>
                                                ⚔️ Guerre en cours → Voir
                                            </Link>
                                        );
                                    }
                                    return (
                                        <button onClick={handleDeclareWar}
                                                disabled={!canDeclare}
                                                className="w-full py-2.5 text-white uppercase font-bold text-xs tracking-wide rounded-xl transition active:scale-95"
                                                style={{
                                                    backgroundColor: canDeclare ? '#ad2b1f' : '#6b3030',
                                                    opacity: canDeclare ? 1 : 0.5,
                                                    cursor: canDeclare ? 'pointer' : 'not-allowed',
                                                }}>
                                            ⚔️ Déclarer la Guerre
                                        </button>
                                    );
                                })()}
                                {isMyZone(selectedZone) && selectedZone.is_capital && (
                                    <div className="text-center py-2 rounded-xl text-xs font-bold text-yellow-700 bg-yellow-50 border border-yellow-300">
                                        ✅ Votre Capitale
                                    </div>
                                )}
                            </div>

                            {/* Build Panel */}
                            {showBuildPanel && isMyZone(selectedZone) && (
                                <div className="px-4 pb-4">
                                    <BuildPanel zone={selectedZone} buildingTypes={buildingTypes}
                                                userResources={{}} onClose={() => setShowBuildPanel(false)} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-[#f4ead7] border-4 border-dashed border-[#765a19]/30 rounded-2xl p-8 text-center text-[#765a19]/60 italic font-label">
                            <div className="text-5xl mb-4">🗺️</div>
                            <p>Cliquez sur une province pour l'inspecter.</p>
                            <p className="text-xs mt-2 opacity-60">Double-cliquez sur une zone à vous pour y construire.</p>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="mt-4 bg-[#f4ead7]/80 border-2 border-[#765a19]/30 rounded-xl p-4 font-label text-xs text-[#2c1a0c] space-y-1.5">
                        <p className="font-bold uppercase mb-2 text-[#765a19]">Légende</p>
                        {[['plains','🌿 Plaine','🌾 Nourriture + 🪵 Bois'], ['forest','🌲 Forêt','🪵 Bois + 🌾 Nourriture'], ['mountain','⛰️ Montagne','⚙️ Fer + 🪙 Or'], ['desert','🏜️ Désert','🪙 Or + 🌾 Nourriture']].map(([t, name, res]) => (
                            <div key={t} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm border border-black/20 flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[t] }} />
                                <span>{name}</span><span className="opacity-50 ml-auto">{res}</span>
                            </div>
                        ))}
                        <div className="pt-1 border-t border-[#765a19]/20 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#f39c12] border border-white" />
                            <span>Bâtiment construit</span>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes siegePulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.85; } }
            `}} />
        </GameLayout>
    );
}
