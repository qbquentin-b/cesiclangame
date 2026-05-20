import React, { useState } from 'react';
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
    forBrt:  '#4A9040',
    border:  'rgba(201,147,60,0.18)',
    borderA: 'rgba(201,147,60,0.35)',
};

// ── Shared helpers ────────────────────────────────────────────────────────────

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

// ── Quiz Royal ────────────────────────────────────────────────────────────────

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function QuizSection({ quizzes = [] }) {
    const [state, setState]         = useState('select'); // select | loading | playing | done
    const [activeQuiz, setActive]   = useState(null);     // quiz metadata
    const [questions, setQs]        = useState([]);
    const [current, setCurrent]     = useState(0);
    const [score, setScore]         = useState(0);
    const [choices, setChoices]     = useState([]);
    const [selected, setSelected]   = useState(null);
    const [error, setError]         = useState('');
    const [submitted, setSubmitted] = useState(false);

    const startQuiz = async (quiz) => {
        setState('loading');
        setError('');
        try {
            const res  = await fetch(route('games.quiz.questions', quiz.id));
            const data = await res.json();
            if (!data.questions?.length) throw new Error('Aucune question trouvée dans ce quiz.');
            const parsed = data.questions.map(q => ({
                ...q,
                answers: shuffle(q.answers),
            }));
            setActive({ ...quiz, reward_per_correct: data.reward_per_correct });
            setQs(parsed);
            setChoices(parsed[0].answers);
            setCurrent(0);
            setScore(0);
            setSelected(null);
            setSubmitted(false);
            setState('playing');
        } catch (e) {
            setError(e.message || 'Impossible de charger ce quiz.');
            setState('select');
        }
    };

    const pick = (answer) => {
        if (selected !== null) return;
        setSelected(answer);
        if (answer === questions[current].correct) setScore(s => s + 1);
    };

    const next = () => {
        const nextIdx = current + 1;
        if (nextIdx >= questions.length) {
            setState('done');
        } else {
            setCurrent(nextIdx);
            setChoices(questions[nextIdx].answers);
            setSelected(null);
        }
    };

    const claimReward = () => {
        if (submitted) return;
        setSubmitted(true);
        router.post(route('games.quiz.complete'), {
            correct:            score,
            reward_per_correct: activeQuiz.reward_per_correct,
            total:              questions.length,
        }, { preserveScroll: true });
    };

    const reward = score * (activeQuiz?.reward_per_correct ?? 10);
    const total  = questions.length;

    // ── Select screen ──
    if (state === 'select' || state === 'loading') return (
        <SectionCard>
            <SectionTitle icon="quiz" title="Quiz Royal" badge={{ label: 'Cristaux', color: G.gold }} />
            {quizzes.length === 0 ? (
                <p className="font-label text-xs italic text-center py-6" style={{ color: G.parchDm }}>
                    Aucun quiz disponible. L'admin peut en créer depuis le panneau admin.
                </p>
            ) : (
                <div className="space-y-2">
                    {error && <p className="text-xs text-red-400 font-label mb-2">⚠️ {error}</p>}
                    {quizzes.map(q => (
                        <button key={q.id} onClick={() => startQuiz(q)}
                                disabled={state === 'loading'}
                                className="w-full text-left px-4 py-3 rounded-xl transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-between gap-3"
                                style={{ background: 'rgba(201,147,60,0.06)', border: `1px solid ${G.border}` }}>
                            <div>
                                <div className="font-headline font-bold text-sm" style={{ color: G.parch }}>{q.title}</div>
                                <div className="font-label text-[10px] mt-0.5" style={{ color: G.parchDm }}>
                                    {q.reward_per_correct} 💎 par bonne réponse
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-xl shrink-0" style={{ color: G.gold }}>
                                {state === 'loading' ? 'hourglass_empty' : 'play_arrow'}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </SectionCard>
    );

    // ── Result screen ──
    if (state === 'done') return (
        <SectionCard>
            <SectionTitle icon="quiz" title={activeQuiz.title} />
            <div className="text-center py-4">
                <div className="text-5xl mb-2">{score >= total * 0.8 ? '🏆' : score >= total * 0.5 ? '⚔️' : '🪨'}</div>
                <div className="font-headline text-3xl font-black" style={{ color: G.gold }}>{score}/{total}</div>
                <div className="font-label text-xs uppercase tracking-widest mt-1" style={{ color: G.parchDm }}>bonnes réponses</div>
                <div className="mt-4 font-headline text-lg font-black" style={{ color: G.goldBrt }}>+{reward} 💎</div>
            </div>
            <button onClick={claimReward} disabled={submitted}
                    className="w-full py-2.5 font-label text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 hover:brightness-125 disabled:opacity-40 mt-2"
                    style={{ background: G.gold, color: G.forge }}>
                {submitted ? 'Récompense réclamée ✓' : `Réclamer ${reward} 💎`}
            </button>
            <button onClick={() => setState('select')}
                    className="w-full py-2 mt-2 font-label text-xs font-black uppercase tracking-wider rounded-lg transition-all hover:brightness-125"
                    style={{ background: 'rgba(255,255,255,0.05)', color: G.parchDm }}>
                ← Choisir un autre quiz
            </button>
        </SectionCard>
    );

    // ── Playing screen ──
    const q = questions[current];
    return (
        <SectionCard>
            <div className="flex items-center justify-between mb-1">
                <span className="font-headline font-bold text-sm truncate" style={{ color: G.parch }}>{activeQuiz.title}</span>
                <span className="font-label text-xs font-bold shrink-0 ml-2" style={{ color: G.parchDm }}>{current + 1}/{total}</span>
            </div>
            <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${((current + 1) / total) * 100}%`, background: G.gold }} />
            </div>
            <p className="font-headline font-bold text-sm mb-4 leading-relaxed" style={{ color: G.parch }}>
                {q.question}
            </p>
            <div className="grid grid-cols-1 gap-2">
                {choices.map((ans) => {
                    const isCorrect  = ans === q.correct;
                    const isSelected = ans === selected;
                    let bg = 'rgba(255,255,255,0.04)', border = G.border, color = G.parch;
                    if (selected !== null) {
                        if (isCorrect)       { bg = 'rgba(74,160,64,0.2)';  border = 'rgba(74,160,64,0.6)';  color = '#a0e090'; }
                        else if (isSelected) { bg = 'rgba(197,48,48,0.2)';  border = 'rgba(197,48,48,0.6)';  color = '#ffaaaa'; }
                    }
                    return (
                        <button key={ans} onClick={() => pick(ans)}
                                className="text-left px-4 py-2.5 rounded-lg font-label text-xs font-bold transition-all hover:brightness-110"
                                style={{ background: bg, border: `1px solid ${border}`, color }}>
                            {ans}
                        </button>
                    );
                })}
            </div>
            {selected !== null && (
                <button onClick={next}
                        className="w-full py-2.5 mt-4 font-label text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 hover:brightness-125"
                        style={{ background: G.gold, color: G.forge }}>
                    {current + 1 < total ? 'Suivant →' : 'Voir résultat'}
                </button>
            )}
        </SectionCard>
    );
}

// ── Paris d'Honneur ───────────────────────────────────────────────────────────

function BettingSection({ events, userBets }) {
    const [amounts, setAmounts]     = useState({});
    const [predictions, setPreds]   = useState({});
    const alreadyBet = new Set(userBets);

    const handleBet = (eventId) => {
        const amount = parseInt(amounts[eventId] || 0);
        const prediction = predictions[eventId] || '';
        if (!amount || !prediction) return;
        router.post(route('games.bet'), { event_id: eventId, amount, prediction }, { preserveScroll: true });
    };

    return (
        <SectionCard>
            <SectionTitle icon="scale" title="Paris d'Honneur" badge={{ label: 'Cristaux', color: G.forBrt }} />

            {events.length === 0 ? (
                <p className="font-label text-xs italic text-center py-6" style={{ color: G.parchDm }}>
                    Aucun événement de pari ouvert pour l'instant.
                </p>
            ) : events.map(ev => {
                const bet = alreadyBet.has(ev.id);
                const options = ev.options ?? [];
                return (
                    <div key={ev.id} className="mb-5 last:mb-0 rounded-xl p-4"
                         style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${G.border}` }}>
                        <p className="font-headline font-bold text-sm mb-3" style={{ color: G.parch }}>{ev.title}</p>

                        {bet ? (
                            <div className="text-center py-3">
                                <span className="font-label text-xs font-bold uppercase" style={{ color: G.forBrt }}>
                                    ✓ Pari enregistré
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {options.map(opt => (
                                        <button key={opt} onClick={() => setPreds(p => ({ ...p, [ev.id]: opt }))}
                                                className="px-3 py-1.5 rounded-lg font-label text-xs font-bold transition-all"
                                                style={{
                                                    background: predictions[ev.id] === opt ? `${G.gold}22` : 'rgba(255,255,255,0.04)',
                                                    border: `1px solid ${predictions[ev.id] === opt ? G.gold : G.border}`,
                                                    color: predictions[ev.id] === opt ? G.gold : G.parchDm,
                                                }}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="number" min="1" placeholder="Mise 💎"
                                           value={amounts[ev.id] || ''}
                                           onChange={e => setAmounts(a => ({ ...a, [ev.id]: e.target.value }))}
                                           className="flex-1 px-3 py-2 rounded-lg text-xs font-bold outline-none"
                                           style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${G.border}`, color: G.parch }} />
                                    <button onClick={() => handleBet(ev.id)}
                                            disabled={!predictions[ev.id] || !amounts[ev.id]}
                                            className="px-4 py-2 rounded-lg font-label text-xs font-black uppercase tracking-wide transition-all hover:brightness-125 disabled:opacity-40"
                                            style={{ background: G.gold, color: G.forge }}>
                                        Miser
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </SectionCard>
    );
}

// ── Missions de Clan ──────────────────────────────────────────────────────────

function MissionsSection({ missions }) {
    const [proofs, setProofs] = useState({});

    const handleSubmit = (missionId) => {
        const proof = proofs[missionId] || '';
        if (!proof) return;
        router.post(route('games.missions.submit', missionId), { proof_url: proof }, { preserveScroll: true });
    };

    if (!missions || missions.length === 0) return (
        <SectionCard>
            <SectionTitle icon="swords" title="Missions de Clan" />
            <p className="font-label text-xs italic text-center py-6" style={{ color: G.parchDm }}>
                Aucune mission active pour votre clan.
            </p>
        </SectionCard>
    );

    return (
        <SectionCard style={{ gridColumn: '1 / -1' }}>
            <SectionTitle icon="swords" title="Missions de Clan" />
            <div className="space-y-4">
                {missions.map(m => {
                    const submitted = m.status === 'submitted';
                    return (
                        <div key={m.id} className="rounded-xl p-4"
                             style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${G.border}` }}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                    <p className="font-headline font-bold text-sm" style={{ color: G.parch }}>{m.title}</p>
                                    {m.description && (
                                        <p className="font-label text-[10px] mt-0.5 italic" style={{ color: G.parchDm }}>{m.description}</p>
                                    )}
                                </div>
                                <span className="font-label text-[10px] font-black shrink-0" style={{ color: G.gold }}>
                                    +{m.reward_crystals} 💎
                                </span>
                            </div>

                            {submitted ? (
                                <div className="text-xs font-label font-bold uppercase py-2 text-center rounded-lg"
                                     style={{ background: 'rgba(201,147,60,0.08)', color: G.gold }}>
                                    ⏳ En attente de validation
                                </div>
                            ) : (
                                <div className="flex gap-2 mt-3">
                                    <input type="url" placeholder="URL de la preuve (https://…)"
                                           value={proofs[m.id] || ''}
                                           onChange={e => setProofs(p => ({ ...p, [m.id]: e.target.value }))}
                                           className="flex-1 px-3 py-2 rounded-lg text-xs outline-none font-label"
                                           style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${G.border}`, color: G.parch }} />
                                    <button onClick={() => handleSubmit(m.id)}
                                            disabled={!proofs[m.id]}
                                            className="px-4 py-2 rounded-lg font-label text-xs font-black uppercase tracking-wide transition-all hover:brightness-125 disabled:opacity-40"
                                            style={{ background: G.gold, color: G.forge }}>
                                        Soumettre
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </SectionCard>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function GamesView({ bettingEvents = [], userBets = [], clanMissions = [], activeQuizzes = [] }) {
    const flash  = usePage().props.flash  || {};
    const errors = usePage().props.errors || {};

    return (
        <GameLayout activeTab="jeux">
            <Head title="Taverne des Jeux" />

            {/* Flash messages */}
            {(flash.message || flash.quizReward !== undefined) && (
                <div className="mb-4 px-4 py-3 bg-green-800/80 border border-green-500 rounded-xl text-green-200 text-sm font-label">
                    {flash.quizReward !== undefined
                        ? `✅ Quiz terminé ! +${flash.quizReward} 💎 ajoutés à votre compte.`
                        : `✅ ${flash.message}`}
                </div>
            )}
            {errors.message && (
                <div className="mb-4 px-4 py-3 bg-red-900/80 border border-red-500 rounded-xl text-red-200 text-sm font-label">
                    ⚠️ {errors.message}
                </div>
            )}

            {/* Header */}
            <div className="text-center py-2 mb-6">
                <div className="ornate-divider mb-3" style={{ fontSize: '9px' }}>Taverne des Jeux</div>
                <h2 className="font-headline text-3xl font-black leading-tight"
                    style={{ color: G.parch, textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
                    Défiez le Destin
                </h2>
                <p className="font-label text-[10px] uppercase tracking-[0.15em] mt-2" style={{ color: `${G.gold}88` }}>
                    Forgez votre gloire
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <QuizSection quizzes={activeQuizzes} />
                <BettingSection events={bettingEvents} userBets={userBets} />
                <MissionsSection missions={clanMissions} />
            </div>

            <div className="text-center py-4 opacity-25">
                <span className="material-symbols-outlined text-5xl" style={{ color: G.gold }}>casino</span>
            </div>
        </GameLayout>
    );
}
