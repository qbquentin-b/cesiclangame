import React, { useState } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, router, usePage } from '@inertiajs/react';

const G = {
    gold:   '#C9933C',
    parch:  '#F2E4C4',
    forge:  '#0A0705',
    card:   '#1E1208',
    cardLt: '#291A0C',
    crimBrt:'#C53030',
    forBrt: '#4A9040',
    border: 'rgba(201,147,60,0.18)',
    borderA:'rgba(201,147,60,0.35)',
};

function Section({ title, icon, children, accent = G.gold }) {
    return (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}`, background: G.card }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ background: G.cardLt, borderBottom: `1px solid ${G.border}` }}>
                <span className="material-symbols-outlined text-lg" style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                <h3 className="font-headline font-bold text-sm uppercase tracking-wider" style={{ color: G.parch }}>{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest" style={{ color: 'rgba(242,228,196,0.45)' }}>{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full px-3 py-2 rounded-lg text-sm font-label outline-none focus:ring-1 focus:ring-[#C9933C]";
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,147,60,0.25)', color: '#F2E4C4' };
const btnPrimary = "px-4 py-2 rounded-lg font-headline font-bold text-xs uppercase tracking-wider transition-all hover:brightness-125 active:scale-95";

export default function AdminPanel({ users = [], clans = [], events = [], wars = [], quizzes = [] }) {
    const flash = usePage().props.flash || {};
    const errors = usePage().props.errors || {};

    // Credit player form
    const [creditForm, setCreditForm]   = useState({ user_id: '', resource: 'crystals', amount: '' });
    // Kick form
    const [kickUserId, setKickUserId]   = useState('');
    // Reset form
    const [resetUserId, setResetUserId] = useState('');
    // Credit clan form
    const [clanCredit, setClanCredit]   = useState({ clan_id: '', amount: '' });
    // Dissolve clan
    const [dissolveId, setDissolveId]   = useState('');
    // Drop form
    const [dropForm, setDropForm]       = useState({ title: '', type: 'crystals', value: '', max_claims: '', expires_in: '60', flash: false });
    // War form
    const [warForm, setWarForm]         = useState({ clan_a_id: '', clan_b_id: '', blitz: false });
    // Event form
    const [eventForm, setEventForm]     = useState({ title: '', options: 'Option A, Option B' });
    // Quiz form
    const [quizForm, setQuizForm]       = useState({ title: '', content: '', reward_per_correct: 10 });
    // Chest form
    const [chestForm, setChestForm]         = useState({ user_id: '', chest_type: 'common' });
    // Legendary war form
    const [legWarClans, setLegWarClans]     = useState(['', '', '']);

    const post  = (url, data) => router.post(url, data, { preserveScroll: true });
    const patch = (url, data) => router.patch(url, data, { preserveScroll: true });
    const del   = (url)       => router.delete(url, { preserveScroll: true });

    return (
        <GameLayout activeTab="admin">
            <Head title="Admin" />

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

            <h1 className="font-headline text-2xl font-black mb-6" style={{ color: G.gold }}>
                Panneau Admin
            </h1>

            <div className="grid grid-cols-2 gap-6">

                {/* ── Joueurs ── */}
                <Section title="Créditer un joueur" icon="payments" accent={G.gold}>
                    <div className="space-y-3">
                        <Field label="Joueur">
                            <select className={inputCls} style={inputStyle}
                                    value={creditForm.user_id} onChange={e => setCreditForm(f => ({ ...f, user_id: e.target.value }))}>
                                <option value="">— Choisir —</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.username} {u.clan ? `[${u.clan.name}]` : ''}</option>)}
                            </select>
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Ressource">
                                <select className={inputCls} style={inputStyle}
                                        value={creditForm.resource} onChange={e => setCreditForm(f => ({ ...f, resource: e.target.value }))}>
                                    {['crystals','war_points','wood','metal','food','gold'].map(r =>
                                        <option key={r} value={r}>{r}</option>)}
                                </select>
                            </Field>
                            <Field label="Montant">
                                <input type="number" min="1" className={inputCls} style={inputStyle}
                                       value={creditForm.amount} onChange={e => setCreditForm(f => ({ ...f, amount: e.target.value }))} />
                            </Field>
                        </div>
                        <button className={btnPrimary} style={{ background: G.gold, color: G.forge }}
                                onClick={() => post(route('admin.players.credit'), creditForm)}>
                            Créditer
                        </button>
                    </div>
                </Section>

                <Section title="Gestion des joueurs" icon="manage_accounts" accent={G.crimBrt}>
                    <div className="space-y-3">
                        <Field label="Expulser du clan">
                            <div className="flex gap-2">
                                <select className={inputCls} style={inputStyle}
                                        value={kickUserId} onChange={e => setKickUserId(e.target.value)}>
                                    <option value="">— Choisir —</option>
                                    {users.filter(u => u.clan_id).map(u => <option key={u.id} value={u.id}>{u.username} [{u.clan?.name}]</option>)}
                                </select>
                                <button className={btnPrimary} style={{ background: G.crimBrt, color: '#fff' }}
                                        onClick={() => { if(kickUserId && confirm('Expulser ce joueur ?')) post(route('admin.players.kick'), { user_id: kickUserId }); }}>
                                    Kick
                                </button>
                            </div>
                        </Field>
                        <Field label="Remettre à zéro les ressources">
                            <div className="flex gap-2">
                                <select className={inputCls} style={inputStyle}
                                        value={resetUserId} onChange={e => setResetUserId(e.target.value)}>
                                    <option value="">— Choisir —</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                                <button className={btnPrimary} style={{ background: 'rgba(139,26,26,0.4)', border: '1px solid rgba(197,48,48,0.4)', color: G.crimBrt }}
                                        onClick={() => { if(resetUserId && confirm('Remettre à zéro ?')) post(route('admin.players.reset'), { user_id: resetUserId }); }}>
                                    Reset
                                </button>
                            </div>
                        </Field>
                    </div>
                </Section>

                {/* ── Clans ── */}
                <Section title="Trésorerie des clans" icon="account_balance" accent={G.gold}>
                    <div className="space-y-3">
                        <Field label="Clan">
                            <select className={inputCls} style={inputStyle}
                                    value={clanCredit.clan_id} onChange={e => setClanCredit(f => ({ ...f, clan_id: e.target.value }))}>
                                <option value="">— Choisir —</option>
                                {clans.map(c => <option key={c.id} value={c.id}>{c.name} ({c.members_count} membres)</option>)}
                            </select>
                        </Field>
                        <Field label="Cristaux à ajouter">
                            <input type="number" min="1" className={inputCls} style={inputStyle}
                                   value={clanCredit.amount} onChange={e => setClanCredit(f => ({ ...f, amount: e.target.value }))} />
                        </Field>
                        <button className={btnPrimary} style={{ background: G.gold, color: G.forge }}
                                onClick={() => post(route('admin.clans.credit'), clanCredit)}>
                            Ajouter à la trésorerie
                        </button>
                    </div>
                </Section>

                <Section title="Dissoudre un clan" icon="delete_forever" accent={G.crimBrt}>
                    <div className="space-y-3">
                        <Field label="Clan à dissoudre">
                            <select className={inputCls} style={inputStyle}
                                    value={dissolveId} onChange={e => setDissolveId(e.target.value)}>
                                <option value="">— Choisir —</option>
                                {clans.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </Field>
                        <button className={btnPrimary} style={{ background: 'rgba(139,26,26,0.4)', border: '1px solid rgba(197,48,48,0.4)', color: G.crimBrt }}
                                onClick={() => { if(dissolveId && confirm('Dissoudre ce clan ? Action irréversible.')) del(route('admin.clans.dissolve', dissolveId)); }}>
                            Dissoudre
                        </button>
                    </div>
                </Section>

                {/* ── Drops ── */}
                <Section title="Créer un drop" icon="redeem" accent="#7B1FA2">
                    <div className="space-y-3">
                        <Field label="Titre">
                            <input type="text" className={inputCls} style={inputStyle}
                                   value={dropForm.title} onChange={e => setDropForm(f => ({ ...f, title: e.target.value }))} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Type">
                                <select className={inputCls} style={inputStyle}
                                        value={dropForm.type} onChange={e => setDropForm(f => ({ ...f, type: e.target.value }))}>
                                    {['crystals','resource','weapon_plan','boost','commander'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Field>
                            <Field label="Valeur">
                                <input type="number" min="1" className={inputCls} style={inputStyle}
                                       value={dropForm.value} onChange={e => setDropForm(f => ({ ...f, value: e.target.value }))} />
                            </Field>
                            <Field label="Max réclamations">
                                <input type="number" min="1" className={inputCls} style={inputStyle}
                                       value={dropForm.max_claims} onChange={e => setDropForm(f => ({ ...f, max_claims: e.target.value }))} />
                            </Field>
                            <Field label="Expire dans (min)">
                                <input type="number" min="1" className={inputCls} style={inputStyle}
                                       value={dropForm.expires_in} onChange={e => setDropForm(f => ({ ...f, expires_in: e.target.value }))} />
                            </Field>
                        </div>
                        <div className="flex gap-2">
                            <button className={btnPrimary} style={{ background: G.gold, color: G.forge }}
                                    onClick={() => post(route('admin.drops.create'), dropForm)}>
                                Créer
                            </button>
                            <button className={btnPrimary} style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid rgba(197,48,48,0.4)', color: G.crimBrt }}
                                    onClick={() => post(route('admin.drops.flash'), dropForm)}>
                                ⚡ Flash (5 min)
                            </button>
                        </div>
                    </div>
                </Section>

                {/* ── Guerres ── */}
                <Section title="Déclencher une guerre" icon="swords" accent={G.crimBrt}>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Clan A">
                                <select className={inputCls} style={inputStyle}
                                        value={warForm.clan_a_id} onChange={e => setWarForm(f => ({ ...f, clan_a_id: e.target.value }))}>
                                    <option value="">— Choisir —</option>
                                    {clans.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Clan B">
                                <select className={inputCls} style={inputStyle}
                                        value={warForm.clan_b_id} onChange={e => setWarForm(f => ({ ...f, clan_b_id: e.target.value }))}>
                                    <option value="">— Choisir —</option>
                                    {clans.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </Field>
                        </div>
                        <div className="flex gap-2">
                            <button className={btnPrimary} style={{ background: G.crimBrt, color: '#fff' }}
                                    onClick={() => post(route('admin.wars.trigger'), warForm)}>
                                Déclarer
                            </button>
                            <button className={btnPrimary} style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid rgba(197,48,48,0.4)', color: G.crimBrt }}
                                    onClick={() => post(route('admin.wars.blitz'), warForm)}>
                                ⚡ Blitz (auto)
                            </button>
                        </div>
                    </div>
                </Section>

                {/* ── Bataille Légendaire (Idée 8) ── */}
                <Section title="Déclencher une bataille légendaire" icon="military_tech" accent="#9B59B6">
                    <div className="space-y-3">
                        <p className="font-label text-[9px]" style={{ color: 'rgba(242,228,196,.4)' }}>
                            Sélectionnez 3 à 6 clans. Le dernier classé est éliminé à chaque round.
                        </p>
                        {legWarClans.map((cId, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="font-label text-[9px] w-12" style={{ color: 'rgba(242,228,196,.5)' }}>Clan {idx + 1}</span>
                                <select className={inputCls} style={inputStyle}
                                        value={cId} onChange={e => {
                                            const next = [...legWarClans];
                                            next[idx] = e.target.value;
                                            setLegWarClans(next);
                                        }}>
                                    <option value="">— Choisir —</option>
                                    {clans.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        ))}
                        <div className="flex gap-2">
                            {legWarClans.length < 6 && (
                                <button className={btnPrimary} style={{ background: 'rgba(155,89,182,.2)', border: '1px solid rgba(155,89,182,.4)', color: '#9B59B6' }}
                                        onClick={() => setLegWarClans(c => [...c, ''])}>
                                    + Ajouter clan
                                </button>
                            )}
                            <button className={btnPrimary} style={{ background: '#9B59B6', color: '#fff' }}
                                    onClick={() => {
                                        const ids = legWarClans.filter(Boolean);
                                        post(route('admin.legendary-wars.trigger'), { clan_ids: ids });
                                    }}>
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                                {' '}Lancer la bataille
                            </button>
                        </div>
                    </div>
                </Section>

                {/* ── Événements paris ── */}
                <Section title="Événements de paris" icon="casino" accent={G.forBrt}>
                    <div className="space-y-3">
                        <Field label="Titre">
                            <input type="text" className={inputCls} style={inputStyle}
                                   value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} />
                        </Field>
                        <Field label="Options (séparées par virgule)">
                            <input type="text" className={inputCls} style={inputStyle}
                                   value={eventForm.options} onChange={e => setEventForm(f => ({ ...f, options: e.target.value }))} />
                        </Field>
                        <button className={btnPrimary} style={{ background: G.forBrt, color: '#fff' }}
                                onClick={() => post(route('admin.events.store'), { title: eventForm.title, options: eventForm.options.split(',').map(s => s.trim()) })}>
                            Créer l'événement
                        </button>
                        <div className="space-y-1 mt-2">
                            {events.map(ev => (
                                <div key={ev.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                                     style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}` }}>
                                    <div>
                                        <div className="font-headline text-sm font-bold" style={{ color: G.parch }}>{ev.title}</div>
                                        <div className="font-label text-[10px]" style={{ color: 'rgba(242,228,196,0.4)' }}>{ev.options?.join(' vs ')} · {ev.status}</div>
                                    </div>
                                    <button onClick={() => del(route('admin.events.destroy', ev.id))}
                                            className="text-xs px-2 py-1 rounded" style={{ color: G.crimBrt }}>
                                        <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* ── Guerres actives ── */}
                <Section title="Guerres récentes" icon="military_tech" accent={G.gold}>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                        {wars.length === 0 && <p className="font-label text-sm italic" style={{ color: 'rgba(242,228,196,0.35)' }}>Aucune guerre.</p>}
                        {wars.map(w => (
                            <div key={w.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                                 style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}` }}>
                                <div>
                                    <div className="font-headline text-sm font-bold" style={{ color: G.parch }}>
                                        {w.clan_a?.name ?? '?'} vs {w.clan_b?.name ?? '?'}
                                    </div>
                                    <div className="font-label text-[10px]" style={{ color: 'rgba(242,228,196,0.4)' }}>
                                        {w.score_a} – {w.score_b} · {w.status}
                                    </div>
                                </div>
                                {w.status === 'active' && (
                                    <div className="flex gap-1">
                                        <button className="text-[10px] px-2 py-1 rounded font-bold"
                                                style={{ background: 'rgba(74,160,64,0.2)', color: G.forBrt }}
                                                onClick={() => patch(route('admin.wars.resolve', w.id), { winner_id: w.clan_a_id, score_a: 1, score_b: 0 })}>
                                            A gagne
                                        </button>
                                        <button className="text-[10px] px-2 py-1 rounded font-bold"
                                                style={{ background: 'rgba(139,26,26,0.2)', color: G.crimBrt }}
                                                onClick={() => patch(route('admin.wars.resolve', w.id), { winner_id: w.clan_b_id, score_a: 0, score_b: 1 })}>
                                            B gagne
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>

            </div>

            {/* ── Quiz ── */}
            <div className="mt-6">
                <Section title="Quiz — Créer / Gérer" icon="quiz" accent={G.gold}>
                    <div className="grid grid-cols-2 gap-6">

                        {/* Formulaire de création */}
                        <div className="space-y-3">
                            <p className="font-label text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(242,228,196,0.45)' }}>
                                Nouveau quiz
                            </p>
                            <Field label="Titre">
                                <input className={inputCls} style={inputStyle} placeholder="Ex : Culture Générale #1"
                                       value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))} />
                            </Field>
                            <Field label={`Récompense par bonne réponse (💎)`}>
                                <input type="number" min="1" max="100" className={inputCls} style={inputStyle}
                                       value={quizForm.reward_per_correct}
                                       onChange={e => setQuizForm(f => ({ ...f, reward_per_correct: e.target.value }))} />
                            </Field>
                            <Field label="Questions (format Markdown)">
                                <textarea
                                    rows={14}
                                    className={inputCls + ' resize-y font-mono text-xs leading-relaxed'}
                                    style={{ ...inputStyle, whiteSpace: 'pre' }}
                                    placeholder={`### Quelle est la capitale de la France ?\n- [x] Paris\n- [ ] Lyon\n- [ ] Marseille\n- [ ] Bordeaux\n\n### Combien de côtés a un hexagone ?\n- [ ] 5\n- [x] 6\n- [ ] 7\n- [ ] 8`}
                                    value={quizForm.content}
                                    onChange={e => setQuizForm(f => ({ ...f, content: e.target.value }))}
                                />
                            </Field>
                            <div className="rounded-lg p-3 text-[10px] font-label leading-relaxed"
                                 style={{ background: 'rgba(201,147,60,0.06)', border: `1px solid ${G.border}`, color: 'rgba(242,228,196,0.5)' }}>
                                <strong style={{ color: G.gold }}>Format :</strong><br/>
                                <code style={{ color: 'rgba(242,228,196,0.7)' }}>{'### Question ?'}</code> → nouvelle question<br/>
                                <code style={{ color: G.forBrt }}>{'- [x] Réponse'}</code> → bonne réponse<br/>
                                <code style={{ color: 'rgba(242,228,196,0.5)' }}>{'- [ ] Réponse'}</code> → mauvaise réponse
                            </div>
                            <button
                                onClick={() => {
                                    post(route('admin.quizzes.store'), quizForm);
                                    setQuizForm({ title: '', content: '', reward_per_correct: 10 });
                                }}
                                disabled={!quizForm.title || !quizForm.content}
                                className={btnPrimary + ' w-full disabled:opacity-40'}
                                style={{ background: G.gold, color: G.forge }}>
                                Créer le Quiz
                            </button>
                        </div>

                        {/* Liste des quiz existants */}
                        <div>
                            <p className="font-label text-[10px] uppercase tracking-widest mb-3" style={{ color: 'rgba(242,228,196,0.45)' }}>
                                Quiz existants ({quizzes.length})
                            </p>
                            {quizzes.length === 0 && (
                                <p className="font-label text-sm italic" style={{ color: 'rgba(242,228,196,0.3)' }}>Aucun quiz créé.</p>
                            )}
                            <div className="space-y-2 max-h-[460px] overflow-y-auto">
                                {quizzes.map(q => {
                                    const active = q.status === 'active';
                                    return (
                                        <div key={q.id} className="rounded-lg p-3 flex items-start justify-between gap-3"
                                             style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${active ? G.border : 'rgba(139,26,26,0.3)'}` }}>
                                            <div className="min-w-0">
                                                <div className="font-headline font-bold text-sm truncate" style={{ color: G.parch }}>
                                                    {q.title}
                                                </div>
                                                <div className="font-label text-[10px] mt-0.5" style={{ color: 'rgba(242,228,196,0.4)' }}>
                                                    {q.reward_per_correct} 💎/réponse · <span style={{ color: active ? G.forBrt : G.crimBrt }}>{active ? 'Actif' : 'Archivé'}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button title={active ? 'Archiver' : 'Activer'}
                                                        onClick={() => patch(route('admin.quizzes.archive', q.id), {})}
                                                        className="px-2 py-1 rounded text-[10px] font-bold transition-all hover:brightness-125"
                                                        style={{ background: active ? 'rgba(139,26,26,0.2)' : 'rgba(74,160,64,0.2)', color: active ? G.crimBrt : G.forBrt }}>
                                                    {active ? '⏸' : '▶'}
                                                </button>
                                                <button title="Supprimer"
                                                        onClick={() => confirm('Supprimer ce quiz ?') && del(route('admin.quizzes.destroy', q.id))}
                                                        className="px-2 py-1 rounded text-[10px] font-bold transition-all hover:brightness-125"
                                                        style={{ background: 'rgba(139,26,26,0.2)', color: G.crimBrt }}>
                                                    🗑
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* ── Coffres ── */}
                <Section title="Donner un coffre" icon="redeem" accent="#9B59B6">
                    <div className="space-y-3">
                        <Field label="Joueur">
                            <select className={inputCls} style={inputStyle}
                                    value={chestForm.user_id} onChange={e => setChestForm(f => ({ ...f, user_id: e.target.value }))}>
                                <option value="">— Choisir —</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.username} {u.clan ? `[${u.clan.name}]` : ''}</option>)}
                            </select>
                        </Field>
                        <Field label="Type de coffre">
                            <select className={inputCls} style={inputStyle}
                                    value={chestForm.chest_type} onChange={e => setChestForm(f => ({ ...f, chest_type: e.target.value }))}>
                                <option value="common">📦 Commun</option>
                                <option value="rare">💜 Rare</option>
                                <option value="legendary">✨ Légendaire</option>
                            </select>
                        </Field>
                        <button className={btnPrimary}
                                style={{ background: '#9B59B6', color: '#fff' }}
                                disabled={!chestForm.user_id}
                                onClick={() => { post(route('admin.chests.give'), chestForm); setChestForm({ user_id: '', chest_type: 'common' }); }}>
                            Offrir le coffre
                        </button>
                    </div>
                </Section>
            </div>

            {/* ── Liste des joueurs ── */}
            <div className="mt-6">
                <Section title="Tous les joueurs" icon="group">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm font-label">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${G.border}`, color: 'rgba(242,228,196,0.45)' }}>
                                    {['Joueur','Niveau','Clan','Cristaux','WP','Bois','Fer','Nourriture','Or'].map(h => (
                                        <th key={h} className="text-left py-2 px-2 text-[10px] uppercase tracking-wider font-bold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: `1px solid rgba(201,147,60,0.06)` }}>
                                        <td className="py-2 px-2 font-bold" style={{ color: G.parch }}>{u.username}</td>
                                        <td className="py-2 px-2" style={{ color: 'rgba(242,228,196,0.6)' }}>{u.level ?? 1}</td>
                                        <td className="py-2 px-2" style={{ color: u.clan ? G.gold : 'rgba(242,228,196,0.3)' }}>
                                            {u.clan?.name ?? '—'}
                                        </td>
                                        {[u.crystals, u.war_points, u.wood, u.metal, u.food, u.gold].map((v, i) => (
                                            <td key={i} className="py-2 px-2" style={{ color: 'rgba(242,228,196,0.6)' }}>
                                                {(v ?? 0).toLocaleString('fr-FR')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            </div>
        </GameLayout>
    );
}
