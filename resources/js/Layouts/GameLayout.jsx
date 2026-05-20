import React, { useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';

const NAV_TABS = [
    { id: 'hub',      name: 'Hub',       icon: 'castle',           link: '/dashboard' },
    { id: 'clan',     name: 'Clan',      icon: 'groups',            link: '/clan' },
    { id: 'map',      name: 'Carte',     icon: 'map',               link: '/map' },
    { id: 'village',  name: 'Village',   icon: 'location_city',     link: '/village' },
    { id: 'market',   name: 'Marché',    icon: 'storefront',        link: '/market' },
    { id: 'drops',    name: 'Drops',     icon: 'scrollable_header', link: '/drops' },
    { id: 'casino',   name: 'Casino',    icon: 'casino',            link: '/casino' },
    { id: 'guerres',  name: 'Guerres',   icon: 'swords',            link: '/wars' },
    { id: 'troupes',  name: 'Troupes',   icon: 'shield_person',     link: '/troops' },
    { id: 'jeux',     name: 'Jeux',      icon: 'casino',            link: '/games' },
    { id: 'daily',    name: 'Quotidiens',icon: 'mystery',           link: '/daily-games' },
    { id: 'top',      name: 'Top',       icon: 'leaderboard',       link: '/rankings' },
    { id: 'messages', name: 'Pigeonnier',icon: 'mail',              link: '/messages', badge: 'unread_messages' },
];

const G = {
    gold:   '#C9933C',
    parch:  '#F2E4C4',
    forge:  '#0A0705',
    card:   '#1E1208',
    border: 'rgba(201,147,60,0.18)',
    crimson:'#8B1A1A',
};

const RES = [
    { key: 'food',     icon: '🌾' },
    { key: 'wood',     icon: '🪵' },
    { key: 'metal',    icon: '⚙️' },
    { key: 'gold',     icon: '🪙' },
];

const Sidebar = ({ activeTab }) => {
    const { auth, unread_messages = 0, pending_friends = 0 } = usePage().props;
    const user = auth?.user;
    const resources = auth?.resources;
    const clan = user?.clan;
    const totalBadge = unread_messages + pending_friends;

    // Refresh shared props every 60s to keep resources up to date
    useEffect(() => {
        const id = setInterval(() => router.reload({ only: ['auth'] }), 60_000);
        return () => clearInterval(id);
    }, []);

    return (
        <aside
            className="fixed left-0 top-0 h-screen w-56 flex flex-col z-50 overflow-y-auto"
            style={{
                background: 'linear-gradient(180deg, #120c06 0%, #0A0705 100%)',
                borderRight: `1px solid ${G.border}`,
                boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
            }}
        >
            {/* Brand */}
            <div className="px-5 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${G.border}` }}>
                <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ color: G.gold, fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 0 6px rgba(201,147,60,0.5))' }}
                >
                    castle
                </span>
                <span
                    className="font-headline font-black uppercase tracking-[0.12em] text-[13px]"
                    style={{ color: G.gold }}
                >
                    Jeu de Clans
                </span>
            </div>

            {/* User info */}
            {user && (
                <div className="mx-3 mt-3 px-3 py-3 rounded-xl" style={{ background: 'rgba(201,147,60,0.06)', border: `1px solid ${G.border}` }}>
                    <div className="font-headline font-bold text-sm truncate" style={{ color: G.parch }}>
                        {user.username}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className="font-label text-[10px] uppercase tracking-wide truncate" style={{ color: 'rgba(201,147,60,0.55)' }}>
                            {clan ? clan.name : 'Sans clan'}{user.clan_rank ? ` · ${user.clan_rank}` : ''}
                        </span>
                        <span className="font-label text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 shrink-0"
                              style={{ background: 'rgba(201,147,60,0.15)', color: G.gold }}>
                            Nv.{user.level ?? 1}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="material-symbols-outlined text-[13px]" style={{ color: G.gold, fontVariationSettings: "'FILL' 1" }}>diamond</span>
                        <span className="font-headline text-xs font-black" style={{ color: G.gold }}>
                            {(user.crystals ?? 0).toLocaleString('fr-FR')}
                        </span>
                        <span className="material-symbols-outlined text-[13px] ml-2" style={{ color: '#E57373', fontVariationSettings: "'FILL' 1" }}>swords</span>
                        <span className="font-headline text-xs font-black" style={{ color: '#E57373' }}>
                            {(user.war_points ?? 0).toLocaleString('fr-FR')}
                        </span>
                    </div>
                    {resources && (
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-2 pt-2" style={{ borderTop: '1px solid rgba(201,147,60,0.12)' }}>
                            {RES.map(({ key, icon }) => (
                                <div key={key} className="flex items-center gap-1">
                                    <span className="text-[10px]">{icon}</span>
                                    <span className="font-headline text-[10px] font-black" style={{ color: 'rgba(242,228,196,0.6)' }}>
                                        {(resources[key] ?? 0).toLocaleString('fr-FR')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-0.5">
                {NAV_TABS.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                        <Link
                            key={tab.id}
                            href={tab.link}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative"
                            style={{
                                background: active ? 'rgba(201,147,60,0.1)' : 'transparent',
                                borderLeft: active ? `3px solid ${G.gold}` : '3px solid transparent',
                            }}
                        >
                            <span
                                className="material-symbols-outlined text-[20px]"
                                style={{
                                    color: active ? G.gold : 'rgba(242,228,196,0.28)',
                                    fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                                    filter: active ? 'drop-shadow(0 0 5px rgba(201,147,60,0.45))' : 'none',
                                }}
                            >
                                {tab.icon}
                            </span>
                            <span
                                className="font-headline text-[13px] font-bold"
                                style={{ color: active ? G.parch : 'rgba(242,228,196,0.38)' }}
                            >
                                {tab.name}
                            </span>
                            {tab.badge === 'unread_messages' && totalBadge > 0 && (
                                <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                      style={{ background: G.crimson, color: '#fff', minWidth: '18px', textAlign: 'center' }}>
                                    {totalBadge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Admin */}
            {user?.is_admin && (
                <div className="px-2 pb-2">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                        style={{ background: 'rgba(139,26,26,0.15)', border: '1px solid rgba(139,26,26,0.3)' }}
                    >
                        <span className="material-symbols-outlined text-[20px]" style={{ color: '#C53030' }}>admin_panel_settings</span>
                        <span className="font-headline text-[13px] font-bold" style={{ color: '#C53030' }}>Admin</span>
                    </Link>
                </div>
            )}

            {/* Logout */}
            <div className="px-2 pb-5 pt-2" style={{ borderTop: `1px solid ${G.border}` }}>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:brightness-125"
                    style={{ color: 'rgba(242,228,196,0.28)' }}
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span className="font-headline text-[13px] font-bold">Déconnexion</span>
                </Link>
            </div>
        </aside>
    );
};

const GameLayout = ({ children, activeTab }) => (
    <div className="min-h-screen flex" style={{ background: G.forge }}>
        <Sidebar activeTab={activeTab} />
        <main className="flex-1 ml-56 min-h-screen px-8 py-8">
            {children}
        </main>
    </div>
);

export default GameLayout;
export { Sidebar };
