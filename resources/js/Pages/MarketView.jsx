import React, { useState } from 'react';
import GameLayout from '@/Layouts/GameLayout';
import { Head, router, usePage } from '@inertiajs/react';

export default function MarketView({ offers = [] }) {
    const { auth } = usePage().props;
    const [offerType, setOfferType] = useState('crystals');
    const [offerAmount, setOfferAmount] = useState('');
    const [wantedType, setWantedType] = useState('resource_metal');
    const [wantedAmount, setWantedAmount] = useState('');

    const handleCreateOffer = (e) => {
        e.preventDefault();
        router.post(route('market.store'), {
            offer_type: offerType,
            offer_amount: parseInt(offerAmount),
            wanted_type: wantedType,
            wanted_amount: parseInt(wantedAmount)
        }, { preserveScroll: true, onSuccess: () => {
            setOfferAmount('');
            setWantedAmount('');
        }});
    };

    const handleAcceptOffer = (offerId) => {
        router.post(route('market.accept', offerId), {}, { preserveScroll: true });
    };

    const getIcon = (type) => {
        if (type === 'crystals') return '💎';
        if (type.includes('metal')) return '⚙️';
        if (type.includes('wood')) return '🪵';
        if (type.includes('food')) return '🌾';
        if (type.includes('gold')) return '🪙';
        return '📦';
    };

    const getLabel = (type) => {
        if (type === 'crystals') return 'Cristaux';
        if (type === 'resource_metal') return 'Fer';
        if (type === 'resource_wood') return 'Bois';
        if (type === 'resource_food') return 'Nourriture';
        if (type === 'resource_gold') return 'Or';
        return type.replace('resource_', '');
    };

    return (
        <GameLayout activeTab="market">
            <Head title="Le Marché" />

            <section className="relative overflow-hidden rounded-xl bg-surface-container-low border-4 border-[#3c6704] shadow-2xl p-6 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-[#492811]/10 to-transparent"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1">
                        <h2 className="font-headline text-3xl font-extrabold uppercase tracking-wider text-[#3c6704] drop-shadow-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-4xl">storefront</span>
                            Le Marché Noir
                        </h2>
                        <p className="font-label text-sm uppercase mt-2 text-on-surface-variant">
                            Déposez vos offres d'échanges et trouvez les ressources manquantes.
                        </p>
                    </div>
                    
                    <div className="w-full md:w-auto bg-[#fff8f5] p-4 rounded border-2 border-outline/30 shadow-inner">
                        <h3 className="font-headline font-bold text-sm uppercase mb-2">Proposer une Annonce</h3>
                        <form onSubmit={handleCreateOffer} className="grid grid-cols-[1fr_auto_1fr] md:flex gap-2 items-center">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-on-surface-variant">Je donne :</label>
                                <div className="flex bg-surface border border-outline/30 rounded overflow-hidden">
                                    <input type="number" min="1" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} placeholder="0" className="w-16 p-1 border-none bg-transparent font-bold text-sm" required />
                                    <select value={offerType} onChange={e => setOfferType(e.target.value)} className="bg-surface-variant border-none text-xs p-1 font-bold">
                                        <option value="crystals">Cristaux</option>
                                        <option value="resource_wood">Bois</option>
                                        <option value="resource_metal">Fer</option>
                                        <option value="resource_food">Nourriture</option>
                                        <option value="resource_gold">Or</option>
                                    </select>
                                </div>
                            </div>
                            <div className="text-[#a47b19] font-black text-xl mt-4 material-symbols-outlined">sync_alt</div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-on-surface-variant">Je veux :</label>
                                <div className="flex bg-surface border border-outline/30 rounded overflow-hidden">
                                    <input type="number" min="1" value={wantedAmount} onChange={e => setWantedAmount(e.target.value)} placeholder="0" className="w-16 p-1 border-none bg-transparent font-bold text-sm" required />
                                    <select value={wantedType} onChange={e => setWantedType(e.target.value)} className="bg-surface-variant border-none text-xs p-1 font-bold">
                                        <option value="crystals">Cristaux</option>
                                        <option value="resource_wood">Bois</option>
                                        <option value="resource_metal">Fer</option>
                                        <option value="resource_food">Nourriture</option>
                                        <option value="resource_gold">Or</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="col-span-3 md:col-span-1 mt-4 md:mt-4 h-[34px] w-[34px] flex items-center justify-center bg-primary text-secondary-fixed rounded shadow active:scale-95 transition-all">
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <section className="bg-surface-container parchment-texture p-6 rounded-xl border-x-4 border-y border-[#765a19]/20 shadow-lg min-h-[400px]">
                <h3 className="font-headline text-xl font-bold mb-6 text-center border-b-2 border-outline/10 pb-4">Annonces Ouvertes</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {offers.length === 0 ? (
                        <p className="col-span-full text-center italic text-on-surface-variant font-label py-10">Le marché est bien calme aujourd'hui...</p>
                    ) : (
                        offers.map((offer) => (
                            <div key={offer.id} className="bg-[#fff8f5] overflow-hidden rounded relative border border-[#765a19]/30 shadow-md group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#3c6704]"></div>
                                <div className="p-3 bg-inverse-surface text-secondary-fixed flex justify-between items-center text-xs">
                                    <span className="font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">person</span>
                                        {offer.seller.username}
                                    </span>
                                    {offer.seller.clan && <span className="uppercase text-[#a47b19] font-black opacity-80">[{offer.seller.clan.name}]</span>}
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-center bg-surface p-2 rounded shadow-inner border border-outline/10">
                                        <div className="text-center w-5/12">
                                            <div className="text-xs uppercase font-label">Il donne</div>
                                            <div className="text-lg font-black text-primary">{offer.offer_amount} {getIcon(offer.offer_type)}</div>
                                            <div className="text-[10px] font-bold text-on-surface-variant">{getLabel(offer.offer_type)}</div>
                                        </div>
                                        <div className="text-center w-2/12">
                                            <span className="material-symbols-outlined text-[#765a19] text-xl">arrow_forward</span>
                                        </div>
                                        <div className="text-center w-5/12">
                                            <div className="text-xs uppercase font-label">Il veut</div>
                                            <div className="text-lg font-black text-secondary">{offer.wanted_amount} {getIcon(offer.wanted_type)}</div>
                                            <div className="text-[10px] font-bold text-on-surface-variant">{getLabel(offer.wanted_type)}</div>
                                        </div>
                                    </div>

                                    {auth.user.id !== offer.seller_id ? (
                                        <button 
                                            onClick={() => handleAcceptOffer(offer.id)}
                                            className="w-full bg-[#3c6704] text-secondary-fixed text-xs font-bold uppercase py-2 rounded shadow transition-all hover:brightness-110 active:scale-95"
                                        >
                                            Accepter l'offre
                                        </button>
                                    ) : (
                                        <button disabled className="w-full bg-surface-variant text-on-surface-variant text-xs font-bold uppercase py-2 rounded">
                                            Votre offre
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </GameLayout>
    );
}
