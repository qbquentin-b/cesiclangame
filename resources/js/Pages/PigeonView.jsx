import React, { useState, useEffect, useRef } from 'react';
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

const RANK_LABELS = { leader: 'Chef', officer: 'Officier', veteran: 'Vétéran', member: 'Membre' };
const RANK_COLORS = {
    leader:  G.gold,
    officer: G.forBrt,
    veteran: '#7B9ED9',
    member:  G.parchDm,
};

function Avatar({ username, size = 8 }) {
    return (
        <div className={`w-${size} h-${size} rounded-full flex items-center justify-center font-headline font-black text-sm shrink-0`}
             style={{ background: 'rgba(201,147,60,0.15)', border: `1.5px solid ${G.border}`, color: G.gold }}>
            {(username || '?')[0].toUpperCase()}
        </div>
    );
}

function OnlineDot({ online }) {
    return (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: online ? '#4CAF50' : '#555', borderColor: G.card }} />
    );
}

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

// ── Friend row ─────────────────────────────────────────────────────────────

function FriendRow({ conv, active, onClick }) {
    const { friend, last, unread } = conv;
    return (
        <button onClick={onClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                style={{ background: active ? 'rgba(201,147,60,0.1)' : 'transparent',
                         borderLeft: active ? `3px solid ${G.gold}` : '3px solid transparent' }}>
            <div className="relative shrink-0">
                <Avatar username={friend.username} />
                <OnlineDot online={friend.is_online} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <span className="font-headline font-bold text-[13px] truncate" style={{ color: G.parch }}>
                        {friend.username}
                    </span>
                    {last && (
                        <span className="font-label text-[9px] shrink-0" style={{ color: G.parchDm }}>
                            {timeAgo(last.at)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-label text-[10px] truncate" style={{ color: G.parchDm }}>
                        {last ? last.body : 'Aucun message'}
                    </span>
                    {unread > 0 && (
                        <span className="ml-auto shrink-0 text-[9px] font-black px-1.5 rounded-full"
                              style={{ background: G.crimson, color: '#fff' }}>
                            {unread}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

// ── Private chat pane ──────────────────────────────────────────────────────

function ChatPane({ friend, myId, onRemove }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [sending, setSending]   = useState(false);
    const bottomRef               = useRef(null);
    const pollRef                 = useRef(null);

    const fetchThread = async () => {
        try {
            const res  = await fetch(`/api/messages/${friend.id}`);
            const data = await res.json();
            if (Array.isArray(data)) setMessages(data);
        } catch {}
    };

    useEffect(() => {
        setMessages([]);
        fetchThread();
        pollRef.current = setInterval(fetchThread, 5000);
        return () => clearInterval(pollRef.current);
    }, [friend.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        const body = input.trim();
        if (!body || sending) return;
        setSending(true);
        setInput('');
        try {
            const res = await fetch(`/api/messages/${friend.id}`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.content },
                body:    JSON.stringify({ body }),
            });
            const msg = await res.json();
            if (msg.id) setMessages(prev => [...prev, msg]);
        } catch {}
        setSending(false);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-5 py-3 shrink-0"
                 style={{ borderBottom: `1px solid ${G.border}`, background: G.cardLt }}>
                <div className="relative">
                    <Avatar username={friend.username} />
                    <OnlineDot online={friend.is_online} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-headline font-bold text-sm" style={{ color: G.parch }}>{friend.username}</div>
                    <div className="font-label text-[9px] uppercase tracking-wide" style={{ color: friend.is_online ? '#4CAF50' : G.parchDm }}>
                        {friend.is_online ? 'En ligne' : (friend.last_seen_at ? `Vu ${timeAgo(friend.last_seen_at)}` : 'Hors ligne')}
                    </div>
                </div>
                <button onClick={onRemove} title="Retirer cet ami"
                        className="text-[10px] px-2 py-1 rounded-lg font-label font-bold uppercase transition hover:brightness-125"
                        style={{ background: 'rgba(139,26,26,0.2)', color: G.crimBrt }}>
                    Retirer
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {messages.length === 0 && (
                    <p className="text-center font-label text-xs italic py-8" style={{ color: G.parchDm }}>
                        Envoyez votre premier pigeon à {friend.username} !
                    </p>
                )}
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%] px-3 py-2 rounded-2xl font-label text-sm leading-relaxed"
                             style={{
                                 background:   m.mine ? `rgba(201,147,60,0.2)` : 'rgba(255,255,255,0.06)',
                                 border:       `1px solid ${m.mine ? G.borderA : G.border}`,
                                 color:        G.parch,
                                 borderRadius: m.mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                             }}>
                            {m.body}
                            <div className="text-[8px] mt-1 text-right" style={{ color: G.parchDm }}>
                                {timeAgo(m.created_at)}
                                {m.mine && m.read_at && <span className="ml-1" title="Lu">✓✓</span>}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 shrink-0"
                  style={{ borderTop: `1px solid ${G.border}` }}>
                <input
                    type="text"
                    placeholder="Écrivez votre message…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-label text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${G.border}`, color: G.parch }}
                    autoFocus
                />
                <button type="submit" disabled={!input.trim() || sending}
                        className="px-4 py-2.5 rounded-xl font-label font-black text-xs uppercase tracking-wide transition-all hover:brightness-125 active:scale-95 disabled:opacity-40"
                        style={{ background: G.gold, color: G.forge }}>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
            </form>
        </div>
    );
}

// ── Clan chat pane ─────────────────────────────────────────────────────────

function ClanChatPane({ clan }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [sending, setSending]   = useState(false);
    const bottomRef               = useRef(null);
    const pollRef                 = useRef(null);

    const fetchMessages = async () => {
        try {
            const res  = await fetch('/api/clan/chat');
            const data = await res.json();
            if (Array.isArray(data)) setMessages(data);
        } catch {}
    };

    useEffect(() => {
        fetchMessages();
        pollRef.current = setInterval(fetchMessages, 5000);
        return () => clearInterval(pollRef.current);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        const body = input.trim();
        if (!body || sending) return;
        setSending(true);
        setInput('');
        try {
            const res = await fetch('/api/clan/chat', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.content },
                body:    JSON.stringify({ body }),
            });
            const msg = await res.json();
            if (msg.id) setMessages(prev => [...prev, msg]);
        } catch {}
        setSending(false);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 shrink-0"
                 style={{ borderBottom: `1px solid ${G.border}`, background: G.cardLt }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-headline font-black text-base shrink-0"
                     style={{ background: clan.color || '#765a19', border: `1.5px solid ${G.border}` }}>
                    {clan.crest_url
                        ? <img src={clan.crest_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        : <span style={{ color: '#fff' }}>{clan.name[0]}</span>
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-headline font-bold text-sm" style={{ color: G.parch }}>Chat — {clan.name}</div>
                    <div className="font-label text-[9px] uppercase tracking-wide" style={{ color: G.parchDm }}>
                        Canal du clan · visible par tous les membres
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {messages.length === 0 && (
                    <p className="text-center font-label text-xs italic py-8" style={{ color: G.parchDm }}>
                        Aucun message pour l'instant. Lancez la conversation !
                    </p>
                )}
                {messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'} gap-0.5`}>
                        {!m.mine && (
                            <div className="flex items-center gap-1.5 px-1">
                                <span className="font-headline font-bold text-[10px]" style={{ color: G.parch }}>
                                    {m.sender.username}
                                </span>
                                <span className="font-label text-[8px] font-black uppercase"
                                      style={{ color: RANK_COLORS[m.sender.clan_rank] || G.parchDm }}>
                                    {RANK_LABELS[m.sender.clan_rank] || m.sender.clan_rank}
                                </span>
                            </div>
                        )}
                        <div className="max-w-[70%] px-3 py-2 font-label text-sm leading-relaxed"
                             style={{
                                 background:   m.mine ? 'rgba(201,147,60,0.2)' : 'rgba(255,255,255,0.06)',
                                 border:       `1px solid ${m.mine ? G.borderA : G.border}`,
                                 color:        G.parch,
                                 borderRadius: m.mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                             }}>
                            {m.body}
                            <div className="text-[8px] mt-1 text-right" style={{ color: G.parchDm }}>
                                {timeAgo(m.created_at)}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 shrink-0"
                  style={{ borderTop: `1px solid ${G.border}` }}>
                <input
                    type="text"
                    placeholder="Message au clan…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-label text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${G.border}`, color: G.parch }}
                />
                <button type="submit" disabled={!input.trim() || sending}
                        className="px-4 py-2.5 rounded-xl font-label font-black text-xs uppercase tracking-wide transition-all hover:brightness-125 active:scale-95 disabled:opacity-40"
                        style={{ background: G.gold, color: G.forge }}>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
            </form>
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function PigeonView({ conversations = [], pendingRequests = [], clan = null }) {
    const flash  = usePage().props.flash  || {};
    const errors = usePage().props.errors || {};
    const { auth } = usePage().props;
    const myId = auth?.user?.id;

    const [openFriend, setOpenFriend] = useState(null);
    const [searchName, setSearchName] = useState('');
    const [tab, setTab]               = useState('friends'); // friends | requests | clan

    useEffect(() => {
        if (openFriend) {
            const updated = conversations.find(c => c.friend.id === openFriend.id);
            if (updated) setOpenFriend(updated.friend);
        }
    }, [conversations]);

    // Quand on clique sur l'onglet clan, ferme l'ami ouvert
    const switchTab = (t) => {
        setTab(t);
        if (t !== 'friends') setOpenFriend(null);
    };

    const handleAddFriend = (e) => {
        e.preventDefault();
        if (!searchName.trim()) return;
        router.post(route('friends.request'), { username: searchName.trim() }, {
            preserveScroll: true,
            onSuccess: () => setSearchName(''),
        });
    };

    const tabs = [
        { key: 'friends',  label: `Amis (${conversations.length})` },
        { key: 'requests', label: `Demandes${pendingRequests.length ? ` (${pendingRequests.length})` : ''}` },
        ...(clan ? [{ key: 'clan', label: clan.name }] : []),
    ];

    return (
        <GameLayout activeTab="messages">
            <Head title="Pigeonnier" />

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

            <div className="flex gap-0 rounded-2xl overflow-hidden"
                 style={{ border: `1px solid ${G.border}`, height: 'calc(100vh - 120px)', minHeight: '500px' }}>

                {/* ── Left panel ── */}
                <div className="w-72 shrink-0 flex flex-col" style={{ background: G.cardLt, borderRight: `1px solid ${G.border}` }}>

                    {/* Header */}
                    <div className="px-4 py-4 shrink-0" style={{ borderBottom: `1px solid ${G.border}` }}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-xl" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>
                                nest_eco_leaf
                            </span>
                            <h2 className="font-headline font-black text-base" style={{ color: G.parch }}>Pigeonnier</h2>
                        </div>
                        <form onSubmit={handleAddFriend} className="flex gap-1.5">
                            <input type="text" placeholder="Ajouter un ami…"
                                   value={searchName} onChange={e => setSearchName(e.target.value)}
                                   className="flex-1 px-3 py-2 rounded-lg text-xs font-label outline-none"
                                   style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${G.border}`, color: G.parch }} />
                            <button type="submit"
                                    className="px-2 py-2 rounded-lg transition hover:brightness-125"
                                    style={{ background: `rgba(201,147,60,0.15)`, color: G.gold }}>
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                            </button>
                        </form>
                    </div>

                    {/* Tabs */}
                    <div className="flex shrink-0 overflow-x-auto" style={{ borderBottom: `1px solid ${G.border}` }}>
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => switchTab(t.key)}
                                    className="flex-1 py-2.5 font-label text-[9px] font-black uppercase tracking-wider transition whitespace-nowrap px-2"
                                    style={{
                                        color: tab === t.key ? G.gold : G.parchDm,
                                        borderBottom: tab === t.key ? `2px solid ${G.gold}` : '2px solid transparent',
                                        background: 'transparent',
                                    }}>
                                {t.key === 'clan' && <span className="mr-1">🏰</span>}
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                        {tab === 'friends' && (
                            conversations.length === 0 ? (
                                <p className="text-center font-label text-xs italic py-8" style={{ color: G.parchDm }}>
                                    Ajoutez des amis pour commencer.
                                </p>
                            ) : conversations.map(conv => (
                                <FriendRow key={conv.friend.id} conv={conv}
                                           active={openFriend?.id === conv.friend.id}
                                           onClick={() => setOpenFriend(conv.friend)} />
                            ))
                        )}

                        {tab === 'requests' && (
                            pendingRequests.length === 0 ? (
                                <p className="text-center font-label text-xs italic py-8" style={{ color: G.parchDm }}>
                                    Aucune demande en attente.
                                </p>
                            ) : pendingRequests.map(req => (
                                <div key={req.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                     style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${G.border}` }}>
                                    <Avatar username={req.user.username} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-headline font-bold text-[12px] truncate" style={{ color: G.parch }}>
                                            {req.user.username}
                                        </div>
                                        <div className="font-label text-[9px]" style={{ color: G.parchDm }}>
                                            Nv.{req.user.level} {req.user.clan ? `· ${req.user.clan}` : ''}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => router.post(route('friends.accept', req.id), {}, { preserveScroll: true })}
                                                className="px-1.5 py-1 rounded-lg text-xs font-bold transition hover:brightness-125"
                                                style={{ background: 'rgba(74,160,64,0.2)', color: G.forBrt }}>
                                            ✓
                                        </button>
                                        <button onClick={() => router.post(route('friends.decline', req.id), {}, { preserveScroll: true })}
                                                className="px-1.5 py-1 rounded-lg text-xs font-bold transition hover:brightness-125"
                                                style={{ background: 'rgba(139,26,26,0.2)', color: G.crimBrt }}>
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {tab === 'clan' && clan && (
                            <div className="px-3 py-4 text-center">
                                <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center font-headline font-black text-xl"
                                     style={{ background: clan.color || '#765a19', border: `1.5px solid ${G.border}` }}>
                                    {clan.crest_url
                                        ? <img src={clan.crest_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                        : <span style={{ color: '#fff' }}>{clan.name[0]}</span>
                                    }
                                </div>
                                <div className="font-headline font-bold text-sm" style={{ color: G.parch }}>{clan.name}</div>
                                <div className="font-label text-[9px] mt-1" style={{ color: G.parchDm }}>
                                    Canal partagé du clan
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right panel ── */}
                <div className="flex-1 flex flex-col" style={{ background: G.card }}>
                    {tab === 'clan' && clan ? (
                        <ClanChatPane clan={clan} />
                    ) : openFriend ? (
                        <ChatPane
                            key={openFriend.id}
                            friend={openFriend}
                            myId={myId}
                            onRemove={() => {
                                router.delete(route('friends.remove', openFriend.id), { preserveScroll: true });
                                setOpenFriend(null);
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                            <span className="text-6xl">🕊️</span>
                            <p className="font-headline font-bold text-lg" style={{ color: G.parch }}>
                                {tab === 'clan' ? 'Sélectionnez le clan pour chatter' : 'Choisissez un ami pour envoyer un pigeon'}
                            </p>
                            <p className="font-label text-xs uppercase tracking-widest" style={{ color: G.parchDm }}>
                                Vos messages arrivent en vol plané
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </GameLayout>
    );
}
