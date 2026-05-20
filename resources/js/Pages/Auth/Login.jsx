import { Head, Link, useForm } from '@inertiajs/react';

const inputStyle = {
    width: '100%',
    background: 'rgba(80, 40, 5, 0.08)',
    border: '1px solid #9a7020',
    borderBottom: '2px solid #7a5510',
    borderRadius: '2px',
    padding: '0.6rem 0.9rem',
    color: '#2e1a03',
    fontFamily: '"Cinzel", "Palatino Linotype", serif',
    fontSize: '0.95rem',
    outline: 'none',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.12)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle = {
    fontFamily: '"Cinzel", serif',
    color: '#5a3008',
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '0.4rem',
};

function Corner({ pos }) {
    const base = { position: 'absolute', width: 22, height: 22 };
    const borders = {
        tl: { top: -1, left: -1, borderTop: '3px solid #c8961a', borderLeft: '3px solid #c8961a' },
        tr: { top: -1, right: -1, borderTop: '3px solid #c8961a', borderRight: '3px solid #c8961a' },
        bl: { bottom: -1, left: -1, borderBottom: '3px solid #c8961a', borderLeft: '3px solid #c8961a' },
        br: { bottom: -1, right: -1, borderBottom: '3px solid #c8961a', borderRight: '3px solid #c8961a' },
    };
    return <div style={{ ...base, ...borders[pos] }} />;
}

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <>
            <Head title="Connexion — Jeu de Clans">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at 50% -10%, #3d1f06 0%, #1a0c03 45%, #090402 100%)',
                position: 'relative',
                overflow: 'hidden',
                padding: '1.5rem',
            }}>

                {/* Pierre texture */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.07,
                    backgroundImage: `
                        repeating-linear-gradient(0deg, transparent, transparent 60px, #fff 60px, #fff 62px),
                        repeating-linear-gradient(90deg, transparent, transparent 80px, #fff 80px, #fff 82px)
                    `,
                }} />

                {/* Lueur torche gauche */}
                <div style={{
                    position: 'absolute', top: '-60px', left: '15%',
                    width: '200px', height: '300px', borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(249,115,22,0.35) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                    animation: 'flicker 3s ease-in-out infinite',
                }} />
                {/* Lueur torche droite */}
                <div style={{
                    position: 'absolute', top: '-60px', right: '15%',
                    width: '200px', height: '300px', borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(249,115,22,0.35) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                    animation: 'flicker 3s ease-in-out infinite 1.5s',
                }} />

                {/* Silhouette château */}
                <svg
                    viewBox="0 0 1200 300"
                    preserveAspectRatio="xMidYMax slice"
                    style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '280px', opacity: 0.18 }}
                    fill="#2a1508"
                >
                    <rect x="0" y="200" width="1200" height="100" />
                    {/* Tours et remparts */}
                    {[0,100,200,300,400,500,600,700,800,900,1000,1100].map(x => (
                        <rect key={x} x={x} y="180" width="80" height="20" />
                    ))}
                    {[0,100,200,300,400,500,600,700,800,900,1000,1100].map(x => (
                        <g key={`c${x}`}>
                            <rect x={x+10} y="160" width="18" height="22" />
                            <rect x={x+36} y="160" width="18" height="22" />
                            <rect x={x+62} y="160" width="18" height="22" />
                        </g>
                    ))}
                    {/* Grande tour centrale */}
                    <rect x="530" y="60" width="140" height="142" />
                    <rect x="510" y="100" width="180" height="20" />
                    <rect x="520" y="40" width="30" height="65" />
                    <rect x="570" y="40" width="30" height="65" />
                    <rect x="620" y="40" width="30" height="65" />
                    {/* Porte */}
                    <ellipse cx="600" cy="200" rx="30" ry="40" />
                    {/* Tours flanquantes */}
                    <rect x="420" y="110" width="100" height="100" />
                    <rect x="680" y="110" width="100" height="100" />
                    <rect x="415" y="95" width="30" height="20" /><rect x="450" y="95" width="30" height="20" /><rect x="485" y="95" width="20" height="20" />
                    <rect x="680" y="95" width="30" height="20" /><rect x="715" y="95" width="30" height="20" /><rect x="750" y="95" width="30" height="20" />
                </svg>

                {/* Carte principale */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '440px',
                    background: 'linear-gradient(160deg, #f7ecd2 0%, #edd9a8 35%, #f3e3bc 65%, #e8cf9a 100%)',
                    border: '1px solid #9a7418',
                    boxShadow: '0 0 80px rgba(160, 100, 10, 0.35), 0 30px 60px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.4)',
                }}>
                    {/* Coins décoratifs */}
                    <Corner pos="tl" /><Corner pos="tr" />
                    <Corner pos="bl" /><Corner pos="br" />

                    {/* Bande dorée haut */}
                    <div style={{ height: '5px', background: 'linear-gradient(90deg, transparent, #b8860b, #f5c842, #daa520, #f5c842, #b8860b, transparent)' }} />

                    <div style={{ padding: '2.5rem 2.75rem 2.25rem' }}>

                        {/* En-tête */}
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.6rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}>🛡️</div>
                            <h1 style={{
                                fontFamily: '"Cinzel Decorative", "Palatino Linotype", serif',
                                color: '#3d1f03',
                                fontSize: '1.55rem',
                                fontWeight: '700',
                                lineHeight: 1.2,
                                textShadow: '1px 1px 0 rgba(255,255,255,0.6)',
                                margin: 0,
                            }}>
                                Jeu de Clans
                            </h1>

                            {/* Séparateur */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.8rem 0 0.6rem' }}>
                                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #9a7020)' }} />
                                <span style={{ color: '#9a7020', fontSize: '0.9rem' }}>⚔</span>
                                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #9a7020, transparent)' }} />
                            </div>

                            <p style={{
                                fontFamily: '"Cinzel", serif',
                                color: '#7a4e15',
                                fontSize: '0.72rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                margin: 0,
                            }}>
                                Entrez dans le Château
                            </p>
                        </div>

                        {status && (
                            <div style={{ background: '#d4edda', border: '1px solid #6a9a6a', color: '#2d5a2d', borderRadius: '2px', padding: '0.5rem 0.75rem', fontSize: '0.82rem', marginBottom: '1rem', fontFamily: '"Cinzel", serif' }}>
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label htmlFor="username" style={labelStyle}>
                                    ⚔ Nom de Guerrier
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={data.username}
                                    autoComplete="username"
                                    autoFocus
                                    onChange={(e) => setData('username', e.target.value)}
                                    style={inputStyle}
                                />
                                {errors.username && (
                                    <p style={{ color: '#9b1c1c', fontSize: '0.75rem', marginTop: '0.3rem', fontFamily: '"Cinzel", serif' }}>
                                        {errors.username}
                                    </p>
                                )}
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label htmlFor="password" style={labelStyle}>
                                    🔑 Mot de Passe Secret
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    style={inputStyle}
                                />
                                {errors.password && (
                                    <p style={{ color: '#9b1c1c', fontSize: '0.75rem', marginTop: '0.3rem', fontFamily: '"Cinzel", serif' }}>
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Se souvenir */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    style={{ accentColor: '#8B6914', width: '15px', height: '15px' }}
                                />
                                <span style={{ fontFamily: '"Cinzel", serif', color: '#7a4e15', fontSize: '0.75rem' }}>
                                    Se souvenir de moi
                                </span>
                            </label>

                            {/* Bouton */}
                            <button
                                type="submit"
                                disabled={processing}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1.5rem',
                                    background: processing
                                        ? '#a08030'
                                        : 'linear-gradient(180deg, #d4a017 0%, #b8860b 50%, #9a6e08 100%)',
                                    border: '1px solid #7a5510',
                                    borderBottom: '3px solid #5a3d08',
                                    color: '#fff9e8',
                                    fontFamily: '"Cinzel", serif',
                                    fontWeight: '700',
                                    fontSize: '0.85rem',
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    borderRadius: '2px',
                                    boxShadow: processing ? 'none' : '0 4px 20px rgba(180,130,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                    transition: 'all 0.2s',
                                    opacity: processing ? 0.7 : 1,
                                }}
                            >
                                {processing ? '⏳ Vérification...' : '⚔️  Entrer au Combat'}
                            </button>
                        </form>

                        {/* Séparateur bas */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '1.75rem 0 1.25rem' }}>
                            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #b8860b)' }} />
                            <span style={{ color: '#b8860b', fontSize: '1.1rem' }}>⚜</span>
                            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #b8860b, transparent)' }} />
                        </div>

                        {/* Lien inscription */}
                        <div style={{ textAlign: 'center' }}>
                            <Link
                                href={route('register')}
                                style={{
                                    fontFamily: '"Cinzel", serif',
                                    color: '#6b4010',
                                    fontSize: '0.75rem',
                                    textDecoration: 'none',
                                    letterSpacing: '0.08em',
                                    borderBottom: '1px solid rgba(139, 105, 20, 0.5)',
                                    paddingBottom: '1px',
                                    transition: 'color 0.2s',
                                }}
                            >
                                Pas encore de Clan ? Rejoignez l'armée →
                            </Link>
                        </div>

                    </div>

                    {/* Bande dorée bas */}
                    <div style={{ height: '5px', background: 'linear-gradient(90deg, transparent, #b8860b, #f5c842, #daa520, #f5c842, #b8860b, transparent)' }} />
                </div>

            </div>

            <style>{`
                @keyframes flicker {
                    0%, 100% { opacity: 0.9; transform: scale(1); }
                    25% { opacity: 0.7; transform: scale(1.05); }
                    50% { opacity: 1; transform: scale(0.97); }
                    75% { opacity: 0.75; transform: scale(1.03); }
                }
                input:focus {
                    border-color: #b8860b !important;
                    box-shadow: inset 0 2px 6px rgba(0,0,0,0.12), 0 0 0 2px rgba(184,134,11,0.2) !important;
                }
                button[type="submit"]:not(:disabled):hover {
                    background: linear-gradient(180deg, #e0b020 0%, #c8950e 50%, #aa7e0a 100%) !important;
                    box-shadow: 0 6px 25px rgba(200,150,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2) !important;
                    transform: translateY(-1px);
                }
                button[type="submit"]:not(:disabled):active {
                    transform: translateY(1px);
                    border-bottom-width: 1px !important;
                }
            `}</style>
        </>
    );
}
