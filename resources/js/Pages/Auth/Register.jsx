import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

const G = {
    gold:    '#C9933C',
    parch:   '#F2E4C4',
    parchDm: 'rgba(242,228,196,0.50)',
    forge:   '#0A0705',
    card:    '#1A0E06',
    cardLt:  '#241508',
    border:  'rgba(201,147,60,0.25)',
    borderA: 'rgba(201,147,60,0.55)',
    crimson: '#8B1A1A',
};

const FEATURES = [
    { icon: 'public',         text: 'Conquiers des zones sur une carte vivante' },
    { icon: 'groups',         text: 'Forge un clan, recrute des alliés' },
    { icon: 'military_tech',  text: 'Déploie des armées et des commandants légendaires' },
    { icon: 'castle',         text: 'Bâtis ton village, mine tes ressources' },
    { icon: 'swords',         text: 'Affronte d\'autres clans en guerres par rounds' },
    { icon: 'extension',      text: 'Mini-jeux quotidiens, marché, artisanat' },
];

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div style={{ minHeight: '100vh', background: G.forge, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <Head title="Rejoindre les Chroniques" />

            <div style={{ width: '100%', maxWidth: 860, display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>

                {/* Colonne narrative */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="material-symbols-outlined" style={{ color: G.gold, fontSize: 36, fontVariationSettings: "'FILL' 1" }}>shield</span>
                        <span style={{ fontFamily: 'serif', fontSize: '1.75rem', fontWeight: 900, color: G.parch, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            Jeu de Clans
                        </span>
                    </div>

                    <p style={{ fontFamily: 'serif', fontSize: '1.6rem', fontWeight: 700, color: G.gold, lineHeight: 1.25, marginBottom: '1rem' }}>
                        Les royaumes anciens<br />sont en cendres.
                    </p>

                    <p style={{ color: G.parchDm, fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: 380 }}>
                        Des chefs émergent des ruines, rassemblent des guerriers et s'affrontent pour le contrôle des terres oubliées.
                        Forge ton clan, déploie tes armées, conquiers la carte — et grave ton nom dans les Chroniques.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {FEATURES.map(({ icon, text }) => (
                            <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <span className="material-symbols-outlined" style={{ color: G.gold, fontSize: 18, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>
                                    {icon}
                                </span>
                                <span style={{ color: G.parchDm, fontSize: '0.82rem' }}>{text}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: '2rem',
                        padding: '0.85rem 1rem',
                        borderRadius: 10,
                        border: `1px solid ${G.borderA}`,
                        background: 'rgba(201,147,60,0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                    }}>
                        <span className="material-symbols-outlined" style={{ color: '#d4a84b', fontSize: 26, fontVariationSettings: "'FILL' 1" }}>cardboard_box</span>
                        <div>
                            <div style={{ color: G.parch, fontWeight: 700, fontSize: '0.85rem' }}>Coffre Rare offert à l'inscription</div>
                            <div style={{ color: G.parchDm, fontSize: '0.75rem' }}>Ressources, or et cristaux pour bien débuter.</div>
                        </div>
                    </div>
                </div>

                {/* Colonne formulaire */}
                <div style={{
                    width: 320,
                    flexShrink: 0,
                    background: G.card,
                    border: `1px solid ${G.border}`,
                    borderRadius: 16,
                    padding: '2rem',
                }}>
                    <h2 style={{ color: G.parch, fontFamily: 'serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
                        Rejoindre les Chroniques
                    </h2>

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', color: G.parchDm, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                Nom de guerre
                            </label>
                            <input
                                type="text"
                                value={data.username}
                                onChange={e => setData('username', e.target.value)}
                                autoFocus
                                required
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: G.cardLt, border: `1px solid ${G.border}`,
                                    borderRadius: 8, padding: '0.6rem 0.75rem',
                                    color: G.parch, fontSize: '0.9rem', outline: 'none',
                                }}
                            />
                            <InputError message={errors.username} className="mt-1" />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: G.parchDm, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                required
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: G.cardLt, border: `1px solid ${G.border}`,
                                    borderRadius: 8, padding: '0.6rem 0.75rem',
                                    color: G.parch, fontSize: '0.9rem', outline: 'none',
                                }}
                            />
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: G.parchDm, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                Confirmer le mot de passe
                            </label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={e => setData('password_confirmation', e.target.value)}
                                required
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: G.cardLt, border: `1px solid ${G.border}`,
                                    borderRadius: 8, padding: '0.6rem 0.75rem',
                                    color: G.parch, fontSize: '0.9rem', outline: 'none',
                                }}
                            />
                            <InputError message={errors.password_confirmation} className="mt-1" />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                marginTop: '0.5rem',
                                width: '100%',
                                padding: '0.75rem',
                                background: processing ? 'rgba(201,147,60,0.4)' : 'linear-gradient(135deg, #C9933C, #8B6914)',
                                border: 'none',
                                borderRadius: 10,
                                color: '#0A0705',
                                fontWeight: 900,
                                fontSize: '0.85rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                transition: 'opacity 0.15s',
                            }}
                        >
                            {processing ? 'En cours…' : 'Entrer dans les Chroniques'}
                        </button>

                        <p style={{ textAlign: 'center', color: G.parchDm, fontSize: '0.78rem', marginTop: '0.25rem' }}>
                            Déjà inscrit ?{' '}
                            <Link href={route('login')} style={{ color: G.gold, textDecoration: 'underline' }}>
                                Se connecter
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
