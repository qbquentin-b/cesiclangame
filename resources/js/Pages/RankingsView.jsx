import React, { useState } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head } from '@inertiajs/react';

export default function RankingsView({ topClans = [], topPlayers = [] }) {
    const [activeTab, setActiveTab] = useState('clans');

    return (
        <GameLayout activeTab="top">
            <Head title="Classements" />

            <section className="relative overflow-hidden rounded-xl bg-surface-container-low border-4 border-inverse-surface shadow-2xl p-6 mb-8 text-center text-on-surface">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-bl-full blur-[40px]"></div>
                <h2 className="relative font-headline text-3xl font-extrabold uppercase tracking-wider text-secondary-fixed drop-shadow-md">Tableau d'Honneur</h2>
                <p className="relative font-label text-sm uppercase mt-2 opacity-80">Les légendes du Monde Périphérique</p>
                
                <div className="flex justify-center gap-4 mt-6 relative">
                    <button 
                        onClick={() => setActiveTab('clans')}
                        className={`px-6 py-2 uppercase font-bold text-sm rounded shadow transition-all ${activeTab === 'clans' ? 'bg-primary text-secondary-fixed shadow-[0_0_15px_rgba(173,43,31,0.5)]' : 'bg-surface border border-outline/30 text-on-surface hover:bg-surface-variant'}`}
                    >
                        Top Clans
                    </button>
                    <button 
                        onClick={() => setActiveTab('players')}
                        className={`px-6 py-2 uppercase font-bold text-sm rounded shadow transition-all ${activeTab === 'players' ? 'bg-primary text-secondary-fixed shadow-[0_0_15px_rgba(173,43,31,0.5)]' : 'bg-surface border border-outline/30 text-on-surface hover:bg-surface-variant'}`}
                    >
                        Top Joueurs
                    </button>
                </div>
            </section>

            <section className="relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-inverse-surface px-6 py-1 rounded-full border-2 border-secondary text-secondary-fixed font-headline font-bold uppercase tracking-widest text-xs shadow-lg">
                        {activeTab === 'clans' ? 'Puissance des Clans' : 'Richesse des Joueurs'}
                    </div>
                </div>
                
                <div className="bg-[#fff8f5] parchment-texture px-4 md:px-8 py-10 shadow-2xl border-x-4 border-[#765a19]/20 relative min-h-[500px]">
                    <div className="space-y-4">
                        {activeTab === 'clans' && topClans.map((clan, index) => (
                            <div key={clan.id} className="flex items-center gap-4 pb-4 border-b border-[#765a19]/20 shadow-sm transition-all hover:bg-[#765a19]/5 p-2 rounded">
                                <div className={`w-10 h-10 flex items-center justify-center font-black text-xl rounded-full border-2 ${index === 0 ? 'bg-[#FFD700] border-[#B8860B] text-[#fff]' : index === 1 ? 'bg-[#C0C0C0] border-[#808080] text-[#fff]' : index === 2 ? 'bg-[#cd7f32] border-[#8B4513] text-[#fff]' : 'bg-inverse-surface border-secondary text-secondary-fixed'}`}>
                                    {index + 1}
                                </div>
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center font-black text-lg shrink-0"
                                     style={{ background: clan.color || '#765a19', border: '1px solid rgba(118,90,25,0.4)' }}>
                                    {clan.crest_url
                                        ? <img src={clan.crest_url} alt="" className="w-full h-full object-cover" />
                                        : <span style={{ color: '#fff' }}>{clan.name[0]}</span>
                                    }
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-headline font-bold text-xl text-inverse-surface leading-none">{clan.name}</h4>
                                    <p className="text-xs text-on-surface-variant font-bold font-label uppercase mt-1">Lvl {clan.level} • {clan.tier}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg text-primary">{clan.power_score} ⚔️</div>
                                    <div className="text-xs text-secondary font-bold">{clan.crystals_pool} 💎</div>
                                </div>
                            </div>
                        ))}

                        {activeTab === 'players' && topPlayers.map((player, index) => (
                            <div key={player.id} className="flex items-center gap-4 pb-4 border-b border-[#765a19]/20 shadow-sm transition-all hover:bg-[#765a19]/5 p-2 rounded">
                                <div className={`w-10 h-10 flex items-center justify-center font-black text-xl rounded-full border-2 ${index === 0 ? 'bg-[#FFD700] border-[#B8860B] text-[#fff]' : index === 1 ? 'bg-[#C0C0C0] border-[#808080] text-[#fff]' : index === 2 ? 'bg-[#cd7f32] border-[#8B4513] text-[#fff]' : 'bg-surface-variant border-outline text-on-surface-variant'}`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-headline font-bold text-xl text-inverse-surface leading-none">{player.username}</h4>
                                    {player.clan ? (
                                        <p className="text-[11px] text-[#3c6704] font-bold font-label mt-1">[{player.clan.name}]</p>
                                    ) : (
                                        <p className="text-[11px] text-on-surface-variant/70 italic font-label mt-1">Sans clan</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg text-secondary inline-flex items-center gap-1">{player.crystals} <span className="text-sm">💎</span></div>
                                </div>
                            </div>
                        ))}

                        {(activeTab === 'clans' && topClans.length === 0) && (
                            <div className="text-center font-label italic text-on-surface-variant py-8">Aucun clan n'a été trouvé.</div>
                        )}
                        {(activeTab === 'players' && topPlayers.length === 0) && (
                            <div className="text-center font-label italic text-on-surface-variant py-8">Aucun joueur n'a été trouvé.</div>
                        )}
                    </div>
                </div>
            </section>
        </GameLayout>
    );
}
