import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, router, usePage } from '@inertiajs/react';

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
    green:   '#4A9040',
    border:  'rgba(201,147,60,0.18)',
    borderA: 'rgba(201,147,60,0.35)',
};

const REGION_COLORS = [
    '#8B3A3A','#3A6B8B','#5A8B3A','#8B7A3A','#6B3A8B','#8B5A3A','#3A8B7A','#8B3A6B',
];

const CHEST_LABELS = { common: 'Commun', rare: 'Rare', legendary: 'Légendaire' };
const CHEST_COLORS = { common: '#A0A0A0', rare: '#7B68EE', legendary: '#FFD700' };

function fmtTime(secs) {
    if (secs == null) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function useStopwatch() {
    const [elapsed, setElapsed] = useState(0);
    const [running, setRunning] = useState(false);
    const ref = useRef(null);

    const start = useCallback(() => {
        if (running) return;
        setRunning(true);
    }, [running]);

    useEffect(() => {
        if (!running) return;
        ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(ref.current);
    }, [running]);

    const stop = useCallback(() => {
        clearInterval(ref.current);
        setRunning(false);
    }, []);

    return { elapsed, running, start, stop };
}

function Stopwatch({ elapsed, running }) {
    if (!running && elapsed === 0) return null;
    const color = elapsed < 60 ? G.green : elapsed < 180 ? G.gold : G.crimBrt;
    return (
        <div className="flex items-center gap-1.5 font-label text-[11px] font-black"
             style={{ color }}>
            <span className="material-symbols-outlined text-[13px]">timer</span>
            {fmtTime(elapsed)}
        </div>
    );
}

function StartScreen({ label, icon, onStart }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
            <span className="material-symbols-outlined text-5xl" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            <p className="font-label text-xs text-center" style={{ color: G.parchDm }}>
                Le chrono démarre dès que tu cliques. Le puzzle sera révélé en même temps.
            </p>
            <button onClick={onStart}
                    className="px-8 py-3 rounded-xl font-headline font-black text-sm transition-all active:scale-95 hover:brightness-125"
                    style={{ background: `linear-gradient(135deg,${G.gold},${G.goldBrt})`, color: G.forge }}>
                Commencer — {label}
            </button>
        </div>
    );
}

function SectionCard({ children, style = {} }) {
    return (
        <div className="corner-ornament forge-card rounded-xl p-5 relative"
             style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)', ...style }}>
            {children}
        </div>
    );
}

function SectionTitle({ icon, title, badge }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-2xl" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>
                {icon}
            </span>
            <h3 className="font-headline text-xl font-black" style={{ color: G.parch }}>{title}</h3>
            {badge && (
                <span className="ml-auto font-label text-[9px] font-black uppercase px-2 py-0.5 rounded"
                      style={{ background: `${badge.color}22`, border: `1px solid ${badge.color}44`, color: badge.color }}>
                    {badge.label}
                </span>
            )}
        </div>
    );
}

function CompletedBadge({ rank, duration_seconds }) {
    const isTop3 = rank && rank <= 3;
    return (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="text-5xl">{isTop3 ? '🏆' : '✅'}</div>
            <div className="font-headline text-xl font-black" style={{ color: G.gold }}>
                {isTop3 ? `Top ${rank} !` : 'Complété aujourd\'hui'}
            </div>
            {duration_seconds != null && (
                <div className="font-label text-sm font-black" style={{ color: G.parchDm }}>
                    Temps : {fmtTime(duration_seconds)}
                </div>
            )}
            <div className="font-label text-[10px] mt-1 text-center" style={{ color: G.parchDm }}>
                {isTop3 ? '🎁 Coffre attribué demain à 9h' : 'Les coffres top 3 sont attribués à 9h le lendemain.'}
            </div>
        </div>
    );
}

// ── Queens ────────────────────────────────────────────────────────────────────

function QueensGame({ puzzle, completed, rank, duration_seconds, onComplete }) {
    const { size, regions } = puzzle;
    const [started, setStarted] = useState(false);
    const [grid, setGrid] = useState(() => Array(size).fill(null).map(() => Array(size).fill(false)));
    const [error, setError] = useState('');
    const { elapsed, running, start, stop } = useStopwatch();

    const handleStart = () => { setStarted(true); start(); };

    const toggle = (r, c) => {
        setError('');
        setGrid(g => {
            const next = g.map(row => [...row]);
            next[r][c] = !next[r][c];
            return next;
        });
    };

    const validate = () => {
        const queens = [];
        for (let r = 0; r < size; r++)
            for (let c = 0; c < size; c++)
                if (grid[r][c]) queens.push([r, c]);

        if (queens.length !== size) { setError(`Placez exactement ${size} reines.`); return; }

        const rows = new Set(queens.map(([r]) => r));
        const cols = new Set(queens.map(([, c]) => c));
        const regs = new Set(queens.map(([r, c]) => regions[r][c]));

        if (rows.size !== size || cols.size !== size || regs.size !== size) {
            setError('Une reine par ligne, colonne et région.'); return;
        }
        for (let i = 0; i < queens.length; i++) {
            for (let j = i + 1; j < queens.length; j++) {
                const [r1, c1] = queens[i], [r2, c2] = queens[j];
                if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) {
                    setError('Deux reines ne peuvent pas être adjacentes.'); return;
                }
            }
        }
        stop();
        onComplete(queens.sort((a, b) => a[0] - b[0]), elapsed);
    };

    if (completed) return <CompletedBadge rank={rank} duration_seconds={duration_seconds} />;
    if (!started)  return <StartScreen label="Reines" icon="chess_queen" onStart={handleStart} />;

    const cellSize = Math.min(52, Math.floor(280 / size));

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="font-label text-[10px] italic" style={{ color: G.parchDm }}>
                    Placez 1 reine ♛ par région colorée, ligne et colonne. Pas d'adjacence (diagonales comprises).
                </p>
                <Stopwatch elapsed={elapsed} running={running} />
            </div>
            <div className="flex justify-center mb-4">
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cellSize}px)`, gap: 2 }}>
                    {grid.map((row, r) =>
                        row.map((hasQ, c) => {
                            const reg = regions[r][c];
                            return (
                                <button key={`${r}-${c}`} onClick={() => toggle(r, c)}
                                        style={{
                                            width: cellSize, height: cellSize,
                                            background: REGION_COLORS[reg % REGION_COLORS.length] + (hasQ ? 'ff' : '55'),
                                            border: `2px solid ${REGION_COLORS[reg % REGION_COLORS.length]}`,
                                            borderRadius: 4, fontSize: cellSize * 0.55,
                                            transition: 'all 0.15s',
                                        }}>
                                    {hasQ ? '♛' : ''}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
            {error && <p className="text-xs text-red-400 font-label mb-2 text-center">⚠️ {error}</p>}
            <button onClick={validate}
                    className="w-full py-2.5 font-label text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 hover:brightness-125"
                    style={{ background: G.gold, color: G.forge }}>
                Valider
            </button>
        </div>
    );
}

// ── Tango ─────────────────────────────────────────────────────────────────────

function TangoGame({ puzzle, completed, rank, duration_seconds, onComplete, serverError }) {
    const { size, constraints, presets = [], solution } = puzzle;

    // Construire le set des cases verrouillées
    const lockedSet = new Set(presets.map(([r, c]) => `${r},${c}`));
    const isLocked  = (r, c) => lockedSet.has(`${r},${c}`);

    const [started, setStarted] = useState(false);
    const [grid, setGrid] = useState(() => {
        const g = Array(size).fill(null).map(() => Array(size).fill(null));
        presets.forEach(([r, c, v]) => { g[r][c] = v; });
        return g;
    });
    const [error, setError] = useState('');
    const [hintCooldown, setHintCooldown] = useState(0);
    useEffect(() => { if (serverError) setError(serverError); }, [serverError]);
    const cooldownRef = useRef(null);
    const { elapsed, running, start, stop } = useStopwatch();

    const handleStart = () => { setStarted(true); start(); };

    useEffect(() => {
        return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
    }, []);

    const useHint = () => {
        if (hintCooldown > 0 || !solution) return;
        const wrongCells = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!isLocked(r, c) && grid[r][c] !== null && grid[r][c] !== solution[r][c]) {
                    wrongCells.push([r, c]);
                }
            }
        }
        if (wrongCells.length === 0) { setError('Aucune erreur détectée !'); return; }
        setError('');
        const [hr, hc] = wrongCells[Math.floor(Math.random() * wrongCells.length)];
        setGrid(g => { const n = g.map(row => [...row]); n[hr][hc] = null; return n; });
        setHintCooldown(10);
        cooldownRef.current = setInterval(() => {
            setHintCooldown(h => {
                if (h <= 1) { clearInterval(cooldownRef.current); cooldownRef.current = null; return 0; }
                return h - 1;
            });
        }, 1000);
    };

    const cycle = (r, c) => {
        if (isLocked(r, c)) return;
        setError('');
        setGrid(g => {
            const next = g.map(row => [...row]);
            next[r][c] = next[r][c] === null ? 0 : next[r][c] === 0 ? 1 : null;
            return next;
        });
    };

    const validate = () => {
        if (grid.some(row => row.some(v => v === null))) {
            setError('Remplis toutes les cases.'); return;
        }
        for (let r = 0; r < size; r++) {
            const suns = grid[r].filter(v => v === 0).length;
            if (suns !== size / 2) { setError('Chaque ligne doit avoir autant de ☀️ que de 🌙.'); return; }
        }
        for (let c = 0; c < size; c++) {
            const suns = grid.filter((_, r) => grid[r][c] === 0).length;
            if (suns !== size / 2) { setError('Chaque colonne doit avoir autant de ☀️ que de 🌙.'); return; }
        }
        // pas 3 consécutifs
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 2; c++) {
                if (grid[r][c] !== null && grid[r][c] === grid[r][c+1] && grid[r][c] === grid[r][c+2]) {
                    setError('Pas 3 symboles identiques consécutifs en ligne.'); return;
                }
            }
        }
        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - 2; r++) {
                if (grid[r][c] !== null && grid[r][c] === grid[r+1][c] && grid[r][c] === grid[r+2][c]) {
                    setError('Pas 3 symboles identiques consécutifs en colonne.'); return;
                }
            }
        }
        // contraintes
        for (const con of constraints) {
            const v1 = grid[con.r1][con.c1], v2 = grid[con.r2][con.c2];
            if (con.type === 'eq' && v1 !== v2) { setError('Une contrainte d\'égalité n\'est pas respectée.'); return; }
            if (con.type === 'diff' && v1 === v2) { setError('Une contrainte de différence n\'est pas respectée.'); return; }
        }
        stop();
        onComplete(grid, elapsed);
    };

    if (completed) return <CompletedBadge rank={rank} duration_seconds={duration_seconds} />;
    if (!started)  return <StartScreen label="Tango" icon="brightness_5" onStart={handleStart} />;

    const cellSize = Math.min(48, Math.floor(280 / size));

    const getConstraintBetween = (r1, c1, r2, c2) =>
        constraints.find(con =>
            (con.r1 === r1 && con.c1 === c1 && con.r2 === r2 && con.c2 === c2) ||
            (con.r1 === r2 && con.c1 === c2 && con.r2 === r1 && con.c2 === c1)
        );

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="font-label text-[10px] italic" style={{ color: G.parchDm }}>
                    Clique pour alterner ☀️/🌙. Équilibre lignes & colonnes. Pas 3 consécutifs.
                </p>
                <Stopwatch elapsed={elapsed} running={running} />
            </div>
            <div className="flex justify-center mb-4">
                <div style={{ position: 'relative' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cellSize}px)`, gap: 2 }}>
                        {grid.map((row, r) =>
                            row.map((val, c) => {
                                const rightCon = getConstraintBetween(r, c, r, c + 1);
                                const downCon  = getConstraintBetween(r, c, r + 1, c);
                                const locked   = isLocked(r, c);
                                return (
                                    <div key={`${r}-${c}`} style={{ position: 'relative' }}>
                                        <button onClick={() => cycle(r, c)}
                                                style={{
                                                    width: cellSize, height: cellSize,
                                                    background: locked
                                                        ? (val === 0 ? 'rgba(255,200,0,0.32)' : 'rgba(100,100,200,0.32)')
                                                        : (val === null ? 'rgba(255,255,255,0.04)' : val === 0 ? 'rgba(255,200,0,0.15)' : 'rgba(100,100,200,0.15)'),
                                                    border: locked
                                                        ? `2px solid ${val === 0 ? '#FFD700' : '#8888FF'}`
                                                        : `2px solid ${val === null ? G.border : val === 0 ? '#FFD700' : '#8888FF'}`,
                                                    borderRadius: 4, fontSize: cellSize * 0.55,
                                                    transition: 'all 0.15s',
                                                    cursor: locked ? 'default' : 'pointer',
                                                    boxShadow: locked ? `inset 0 0 0 1px ${val === 0 ? '#FFD70044' : '#8888FF44'}` : 'none',
                                                }}>
                                            {val === 0 ? '☀️' : val === 1 ? '🌙' : ''}
                                        </button>
                                        {rightCon && c < size - 1 && (
                                            <span style={{
                                                position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
                                                fontSize: 10, fontWeight: 'bold', color: G.gold, zIndex: 10,
                                                background: G.card, padding: '0 1px',
                                            }}>
                                                {rightCon.type === 'eq' ? '=' : '×'}
                                            </span>
                                        )}
                                        {downCon && r < size - 1 && (
                                            <span style={{
                                                position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
                                                fontSize: 10, fontWeight: 'bold', color: G.gold, zIndex: 10,
                                                background: G.card, padding: '0 1px',
                                            }}>
                                                {downCon.type === 'eq' ? '=' : '×'}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            {error && <p className="text-xs text-red-400 font-label mb-2 text-center">⚠️ {error}</p>}
            {solution && (
                <button onClick={useHint} disabled={hintCooldown > 0}
                        className="w-full py-2 font-label text-xs font-black uppercase tracking-wider rounded-lg transition-all mb-2"
                        style={{
                            background: hintCooldown > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(136,136,255,0.15)',
                            color: hintCooldown > 0 ? G.parchDm : '#9999FF',
                            border: `1px solid ${hintCooldown > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(136,136,255,0.4)'}`,
                            cursor: hintCooldown > 0 ? 'not-allowed' : 'pointer',
                        }}>
                    {hintCooldown > 0 ? `Indice disponible dans ${hintCooldown}s` : '💡 Indice — supprimer une erreur'}
                </button>
            )}
            <button onClick={validate}
                    className="w-full py-2.5 font-label text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 hover:brightness-125"
                    style={{ background: G.gold, color: G.forge }}>
                Valider
            </button>
        </div>
    );
}

// ── Zip ───────────────────────────────────────────────────────────────────────

function ZipGame({ puzzle, completed, rank, duration_seconds, onComplete }) {
    const { size, numbers } = puzzle;
    const numMap = {};
    numbers.forEach(([r, c, v]) => { numMap[`${r},${c}`] = v; });

    const [started, setStarted] = useState(false);
    const [path, setPath]       = useState([]);
    const [drawing, setDrawing] = useState(false);
    const [error, setError]     = useState('');
    const { elapsed, running, start, stop } = useStopwatch();

    const handleStart = () => { setStarted(true); start(); };

    const totalCells = size * size;

    const startDraw = (r, c) => {
        setPath([[r, c]]);
        setDrawing(true);
        setError('');
    };

    const extendPath = (r, c) => {
        if (!drawing) return;
        setPath(p => {
            if (p.length < 2) return [...p, [r, c]];
            const last = p[p.length - 1], prev = p[p.length - 2];
            if (last[0] === r && last[1] === c) return p;
            if (prev[0] === r && prev[1] === c) return p.slice(0, -1);
            const dr = Math.abs(r - last[0]), dc = Math.abs(c - last[1]);
            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                if (p.some(([pr, pc]) => pr === r && pc === c)) return p;
                return [...p, [r, c]];
            }
            return p;
        });
    };

    const endDraw = () => setDrawing(false);

    const validate = () => {
        if (path.length !== totalCells) {
            setError(`Le chemin doit passer par toutes les ${totalCells} cases.`); return;
        }
        const ordered = numbers.slice().sort((a, b) => a[2] - b[2]);
        let numIdx = 0;
        for (const [r, c] of path) {
            const key = `${r},${c}`;
            if (numMap[key] !== undefined) {
                if (numMap[key] !== ordered[numIdx]?.[2]) {
                    setError('Ordre des numéros incorrect.'); return;
                }
                numIdx++;
            }
        }
        if (numIdx !== ordered.length) { setError('Tous les numéros doivent être inclus dans l\'ordre.'); return; }
        stop();
        onComplete(path, elapsed);
    };

    if (completed) return <CompletedBadge rank={rank} duration_seconds={duration_seconds} />;
    if (!started)  return <StartScreen label="Zip" icon="route" onStart={handleStart} />;

    const cellSize = Math.min(56, Math.floor(290 / size));

    const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));
    const pathIndex = {};
    path.forEach(([r, c], i) => { pathIndex[`${r},${c}`] = i; });

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="font-label text-[10px] italic" style={{ color: G.parchDm }}>
                    Trace un chemin reliant les numéros dans l'ordre. Il doit passer par toutes les cases.
                </p>
                <Stopwatch elapsed={elapsed} running={running} />
            </div>
            <div className="flex justify-center mb-4"
                 onMouseLeave={endDraw} onMouseUp={endDraw}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cellSize}px)`, gap: 2, userSelect: 'none' }}>
                    {Array(size).fill(null).map((_, r) =>
                        Array(size).fill(null).map((__, c) => {
                            const key = `${r},${c}`;
                            const num = numMap[key];
                            const inPath = pathSet.has(key);
                            return (
                                <button key={key}
                                        onMouseDown={() => startDraw(r, c)}
                                        onMouseEnter={() => extendPath(r, c)}
                                        onMouseUp={endDraw}
                                        style={{
                                            width: cellSize, height: cellSize,
                                            background: inPath ? 'rgba(201,147,60,0.35)' : 'rgba(255,255,255,0.04)',
                                            border: `2px solid ${inPath ? G.gold : G.border}`,
                                            borderRadius: 6, fontSize: num ? 14 : 10,
                                            fontWeight: 'bold', color: num ? G.goldBrt : G.parchDm,
                                            transition: 'background 0.1s',
                                        }}>
                                    {num ?? (inPath ? '·' : '')}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
            <div className="flex gap-2 mb-2">
                <button onClick={() => { setPath([]); setError(''); }}
                        className="flex-1 py-2 font-label text-xs font-black uppercase tracking-wider rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.05)', color: G.parchDm }}>
                    Effacer
                </button>
                <button onClick={validate}
                        className="flex-1 py-2 font-label text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 hover:brightness-125"
                        style={{ background: G.gold, color: G.forge }}>
                    Valider ({path.length}/{totalCells})
                </button>
            </div>
            {error && <p className="text-xs text-red-400 font-label text-center">⚠️ {error}</p>}
        </div>
    );
}

// ── Patches ───────────────────────────────────────────────────────────────────

const PIECE_PALETTE = ['#8B3A3A','#3A6B8B','#5A8B3A','#8B7A3A','#6B3A8B','#8B5A3A','#3A8B7A','#8B3A6B'];

// Retourne la première cellule remplie (haut-gauche) d'une shape
function firstFilledCell(shape) {
    for (let dr = 0; dr < shape.length; dr++)
        for (let dc = 0; dc < shape[dr].length; dc++)
            if (shape[dr][dc]) return [dr, dc];
    return [0, 0];
}

// Calcule les cases qu'occuperait la pièce si on clique sur (clickR, clickC)
function computePlacementCells(shape, clickR, clickC, size) {
    const [firstDr, firstDc] = firstFilledCell(shape);
    const startR = clickR - firstDr;
    const startC = clickC - firstDc;
    const cells = [];
    let outOfBounds = false;
    for (let dr = 0; dr < shape.length; dr++) {
        for (let dc = 0; dc < shape[dr].length; dc++) {
            if (!shape[dr][dc]) continue;
            const r = startR + dr, c = startC + dc;
            if (r < 0 || r >= size || c < 0 || c >= size) { outOfBounds = true; continue; }
            cells.push([r, c]);
        }
    }
    return { cells, outOfBounds };
}

function PatchesGame({ puzzle, completed, rank, duration_seconds, onComplete }) {
    const { size, pieces } = puzzle;
    const cellSize = Math.min(60, Math.floor(290 / size));

    const [started, setStarted]   = useState(false);
    const [grid, setGrid]         = useState(() => Array(size).fill(null).map(() => Array(size).fill(-1)));
    const [selected, setSelected] = useState(0);
    const [placed, setPlaced]     = useState(new Set());
    const [hoverCell, setHoverCell] = useState(null);
    const [error, setError]       = useState('');
    const { elapsed, running, start, stop } = useStopwatch();

    const handleStart = () => { setStarted(true); start(); };

    // Cases survolées par la pièce sélectionnée (aperçu)
    const hoverCells = useCallback(() => {
        if (!hoverCell || placed.has(selected)) return { valid: [], invalid: [] };
        const shape = pieces[selected].shape;
        const { cells } = computePlacementCells(shape, hoverCell[0], hoverCell[1], size);
        const valid = [], invalid = [];
        cells.forEach(([r, c]) => {
            if (grid[r][c] !== -1) invalid.push(`${r},${c}`);
            else valid.push(`${r},${c}`);
        });
        // Si hors-grille → tout invalide
        const { outOfBounds } = computePlacementCells(shape, hoverCell[0], hoverCell[1], size);
        if (outOfBounds) return { valid: [], invalid: cells.map(([r,c]) => `${r},${c}`) };
        return { valid, invalid };
    }, [hoverCell, selected, placed, pieces, grid, size]);

    const { valid: hoverValid, invalid: hoverInvalid } = hoverCells();

    const placePiece = (clickR, clickC) => {
        if (placed.has(selected)) { setError('Pièce déjà placée.'); return; }
        const shape = pieces[selected].shape;
        const { cells, outOfBounds } = computePlacementCells(shape, clickR, clickC, size);

        if (outOfBounds || cells.some(([r, c]) => grid[r][c] !== -1)) {
            setError('Impossible de placer ici.'); return;
        }

        const next = grid.map(row => [...row]);
        cells.forEach(([r, c]) => { next[r][c] = selected; });
        setGrid(next);
        setPlaced(p => new Set([...p, selected]));
        setError('');

        // Auto-sélection de la prochaine pièce non placée
        const nextIdx = pieces.findIndex((_, i) => i !== selected && !placed.has(i));
        if (nextIdx !== -1) setSelected(nextIdx);
    };

    const removePiece = (pieceIdx) => {
        setGrid(g => g.map(row => row.map(v => v === pieceIdx ? -1 : v)));
        setPlaced(p => { const next = new Set(p); next.delete(pieceIdx); return next; });
        setSelected(pieceIdx);
        setError('');
    };

    const validate = () => {
        if (grid.some(row => row.some(v => v === -1))) {
            setError('La grille doit être entièrement remplie.'); return;
        }
        stop();
        onComplete(grid, elapsed);
    };

    if (completed) return <CompletedBadge rank={rank} duration_seconds={duration_seconds} />;
    if (!started)  return <StartScreen label="Patches" icon="dashboard" onStart={handleStart} />;

    const pieceColor = PIECE_PALETTE[selected % PIECE_PALETTE.length];

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="font-label text-[10px] italic" style={{ color: G.parchDm }}>
                    Sélectionne une pièce · clique sur la grille pour la poser · la cellule cliquée = 1ʳᵉ case de la pièce
                </p>
                <Stopwatch elapsed={elapsed} running={running} />
            </div>

            {/* Grille */}
            <div className="flex justify-center mb-3">
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cellSize}px)`, gap: 2 }}
                     onMouseLeave={() => setHoverCell(null)}>
                    {grid.map((row, r) =>
                        row.map((val, c) => {
                            const key = `${r},${c}`;
                            const isHoverValid   = hoverValid.includes(key);
                            const isHoverInvalid = hoverInvalid.includes(key);
                            let bg, border;
                            if (val !== -1) {
                                bg     = PIECE_PALETTE[val % PIECE_PALETTE.length] + '99';
                                border = PIECE_PALETTE[val % PIECE_PALETTE.length];
                            } else if (isHoverValid) {
                                bg     = pieceColor + '55';
                                border = pieceColor;
                            } else if (isHoverInvalid) {
                                bg     = 'rgba(197,48,48,0.35)';
                                border = G.crimBrt;
                            } else {
                                bg     = 'rgba(255,255,255,0.04)';
                                border = G.border;
                            }
                            return (
                                <button key={key}
                                        onClick={() => placePiece(r, c)}
                                        onMouseEnter={() => setHoverCell([r, c])}
                                        style={{
                                            width: cellSize, height: cellSize,
                                            background: bg,
                                            border: `2px solid ${border}`,
                                            borderRadius: 4, transition: 'background 0.08s, border-color 0.08s',
                                        }} />
                            );
                        })
                    )}
                </div>
            </div>

            {/* Palette de pièces */}
            <div className="flex flex-wrap gap-2 mb-3 justify-center">
                {pieces.map((piece, idx) => (
                    <button key={idx}
                            onClick={() => { if (placed.has(idx)) removePiece(idx); else setSelected(idx); }}
                            className="rounded-lg p-1.5 transition-all"
                            style={{
                                background: placed.has(idx) ? 'rgba(255,255,255,0.03)' : selected === idx ? `${PIECE_PALETTE[idx % PIECE_PALETTE.length]}33` : 'rgba(255,255,255,0.04)',
                                border: `2px solid ${selected === idx && !placed.has(idx) ? PIECE_PALETTE[idx % PIECE_PALETTE.length] : G.border}`,
                                opacity: placed.has(idx) ? 0.4 : 1,
                            }}>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${piece.shape[0].length}, 14px)`, gap: 1 }}>
                            {piece.shape.map((row, r) =>
                                row.map((cell, c) => (
                                    <div key={`${r}-${c}`} style={{
                                        width: 14, height: 14,
                                        background: cell ? PIECE_PALETTE[idx % PIECE_PALETTE.length] : 'transparent',
                                        borderRadius: 2,
                                    }} />
                                ))
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {error && <p className="text-xs text-red-400 font-label mb-2 text-center">⚠️ {error}</p>}
            <div className="flex gap-2">
                <button onClick={() => { setGrid(Array(size).fill(null).map(() => Array(size).fill(-1))); setPlaced(new Set()); setSelected(0); setError(''); setHoverCell(null); }}
                        className="flex-1 py-2 font-label text-xs font-black uppercase tracking-wider rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.05)', color: G.parchDm }}>
                    Effacer
                </button>
                <button onClick={validate}
                        className="flex-1 py-2 font-label text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 hover:brightness-125"
                        style={{ background: G.gold, color: G.forge }}>
                    Valider
                </button>
            </div>
        </div>
    );
}

// ── Wrapper commun ────────────────────────────────────────────────────────────

const GAME_META = {
    queens:  { icon: 'chess_queen',   label: 'Reines',   color: '#C53030' },
    tango:   { icon: 'brightness_5',  label: 'Tango',    color: '#FFD700' },
    zip:     { icon: 'route',         label: 'Zip',      color: '#4A90D9' },
    patches: { icon: 'dashboard',     label: 'Patches',  color: '#5A8B3A' },
};

function GameCard({ type, gameData, leaderboard, flash }) {
    const { puzzle, completed, rank, duration_seconds } = gameData;
    const meta = GAME_META[type];
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    const handleComplete = (solution, elapsedSeconds) => {
        if (submitting) return;
        setSubmitting(true);
        setServerError('');
        router.post(route('daily-games.complete', type), { solution, duration_seconds: elapsedSeconds }, {
            preserveScroll: true,
            preserveState: true,
            onError: (errors) => setServerError(errors.message || 'Solution invalide.'),
            onFinish: () => setSubmitting(false),
        });
    };

    const MEDALS = ['🥇', '🥈', '🥉'];

    return (
        <SectionCard>
            <div className="flex gap-4">
                {/* Jeu (col gauche) */}
                <div className="flex-1 min-w-0">
                    <SectionTitle icon={meta.icon} title={meta.label}
                                  badge={completed
                                      ? { label: rank <= 3 ? `Top ${rank} · ${fmtTime(duration_seconds)}` : `Terminé · ${fmtTime(duration_seconds)}`, color: rank <= 3 ? G.gold : G.green }
                                      : { label: 'Aujourd\'hui', color: meta.color }} />

                    {type === 'queens'  && <QueensGame  puzzle={puzzle} completed={completed} rank={rank} duration_seconds={duration_seconds} onComplete={handleComplete} />}
                    {type === 'tango'   && <TangoGame   puzzle={puzzle} completed={completed} rank={rank} duration_seconds={duration_seconds} onComplete={handleComplete} serverError={serverError} />}
                    {type === 'zip'     && <ZipGame     puzzle={puzzle} completed={completed} rank={rank} duration_seconds={duration_seconds} onComplete={handleComplete} />}
                    {type === 'patches' && <PatchesGame puzzle={puzzle} completed={completed} rank={rank} duration_seconds={duration_seconds} onComplete={handleComplete} />}
                </div>

                {/* Classement (col droite) */}
                <div className="w-44 shrink-0 border-l pl-4" style={{ borderColor: G.border }}>
                    <div className="font-label text-[9px] uppercase tracking-widest mb-3 flex items-center gap-1" style={{ color: G.parchDm }}>
                        <span className="material-symbols-outlined text-[11px]" style={{ color: G.gold }}>leaderboard</span>
                        Classement
                    </div>
                    {leaderboard?.length > 0 ? (
                        <div className="space-y-1.5">
                            {leaderboard.map((entry, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <span className="text-[13px] w-5">{i < 3 ? MEDALS[i] : `${i + 1}.`}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-label text-[9px] font-black truncate"
                                             style={{ color: i === 0 ? G.goldBrt : G.parch }}>
                                            {entry.name}
                                        </div>
                                        <div className="font-label text-[8px]" style={{ color: G.parchDm }}>
                                            {fmtTime(entry.duration_seconds)}
                                        </div>
                                    </div>
                                    {i < 3 && (
                                        <span className="material-symbols-outlined text-[10px]"
                                              style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>
                                            {entry.chest_awarded ? 'check_circle' : 'pending'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="font-label text-[9px] italic" style={{ color: 'rgba(242,228,196,.2)' }}>
                            Aucun joueur encore
                        </div>
                    )}
                    <div className="mt-3 pt-2 font-label text-[8px]" style={{ borderTop: `1px solid ${G.border}`, color: G.parchDm }}>
                        🎁 Coffres top 3 attribués à 9h
                    </div>
                </div>
            </div>
        </SectionCard>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DailyGamesView({ games = {}, leaderboard = {} }) {
    const flash  = usePage().props.flash  || {};
    const errors = usePage().props.errors || {};

    return (
        <GameLayout activeTab="daily">
            <Head title="Jeux Quotidiens" />

            {flash?.dailyGame && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm font-label"
                     style={{ background: 'rgba(74,144,64,.15)', border: '1px solid rgba(74,144,64,.4)', color: '#86efac' }}>
                    {flash.dailyGame.rank <= 3
                        ? `🏆 Top ${flash.dailyGame.rank} ! Coffre attribué demain à 9h.`
                        : `✅ Complété ! Rang ${flash.dailyGame.rank}`}
                </div>
            )}
            {errors.message && (
                <div className="mb-4 px-4 py-3 bg-red-900/80 border border-red-500 rounded-xl text-red-200 text-sm font-label">
                    ⚠️ {errors.message}
                </div>
            )}

            <div className="text-center py-2 mb-6">
                <div className="ornate-divider mb-3" style={{ fontSize: '9px' }}>Défis Quotidiens</div>
                <h2 className="font-headline text-3xl font-black leading-tight"
                    style={{ color: G.parch, textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
                    Jeux du Jour
                </h2>
                <p className="font-label text-[10px] uppercase tracking-[0.15em] mt-2" style={{ color: `${G.gold}88` }}>
                    Renouvelés chaque matin à 8h · Top 3 = Coffre
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {Object.entries(games).map(([type, gameData]) => (
                    <GameCard key={type} type={type} gameData={gameData}
                              leaderboard={leaderboard[type]}
                              flash={flash} />
                ))}
            </div>

            <div className="text-center py-4 opacity-25">
                <span className="material-symbols-outlined text-5xl" style={{ color: G.gold }}>mystery</span>
            </div>
        </GameLayout>
    );
}
