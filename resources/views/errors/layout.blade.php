<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('code') — Jeu de Clans</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(ellipse at 50% -10%, #3d1f06 0%, #1a0c03 45%, #090402 100%);
            font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
            color: #F2E4C4;
            padding: 2rem;
        }
        .card {
            max-width: 500px;
            width: 100%;
            background: #1E1208;
            border: 1px solid rgba(201,147,60,0.35);
            border-radius: 16px;
            padding: 3rem 2.5rem;
            text-align: center;
            box-shadow: 0 0 60px rgba(160,100,10,0.2), 0 30px 60px rgba(0,0,0,0.7);
        }
        .code {
            font-size: 5rem;
            font-weight: 900;
            color: #C9933C;
            line-height: 1;
            text-shadow: 0 0 40px rgba(201,147,60,0.4);
            letter-spacing: -0.02em;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(201,147,60,0.5), transparent);
            margin: 1.5rem 0;
        }
        .title {
            font-size: 1.3rem;
            font-weight: 700;
            color: #F2E4C4;
            margin-bottom: 0.75rem;
            letter-spacing: 0.04em;
        }
        .message {
            font-size: 0.9rem;
            color: rgba(242,228,196,0.55);
            line-height: 1.7;
            margin-bottom: 2rem;
        }
        .back {
            display: inline-block;
            padding: 0.7rem 2rem;
            background: linear-gradient(135deg, #C9933C, #8B6914);
            border-radius: 8px;
            color: #0A0705;
            font-weight: 900;
            font-size: 0.82rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            text-decoration: none;
            transition: opacity 0.15s;
        }
        .back:hover { opacity: 0.85; }
        .icon { font-size: 3rem; margin-bottom: 1rem; display: block; }
    </style>
</head>
<body>
    <div class="card">
        <span class="icon">@yield('icon', '⚔️')</span>
        <div class="code">@yield('code')</div>
        <div class="divider"></div>
        <div class="title">@yield('title')</div>
        <p class="message">@yield('message')</p>
        <a href="{{ url('/dashboard') }}" class="back">Retour au Château</a>
    </div>
</body>
</html>
