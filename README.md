# 🎱 Ethiopian Bingo Hall — Full Stack App

**Stack:** Node.js + Express + Socket.IO + MongoDB | Next.js 14 + Tailwind CSS + Zustand

## Quick Start

```bash
# 1. Clone and install
cd backend && npm install
cd ../frontend && npm install

# 2. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Start MongoDB (or use Atlas URI in .env)
mongod --dbpath /data/db

# 4. Run backend
cd backend && npm run dev

# 5. Run frontend
cd frontend && npm run dev
```

Open http://localhost:3000 — or test with the mock HTML file.

## Architecture

```
bingo-app/
├── backend/           Node.js + Express + Socket.IO
│   └── src/
│       ├── config/    DB, encryption, JWT config
│       ├── models/    User, Card, Game, Transaction
│       ├── routes/    Auth, Wallet, Game, Admin
│       ├── controllers/
│       ├── services/  BingoService, WalletService, GameEngine
│       ├── middleware/ Auth, Encryption, RateLimit
│       └── utils/     CardGenerator, PayloadEncryptor
├── frontend/          Next.js 14 App Router + Tailwind
│   └── src/
│       ├── app/       Pages (Telegram Mini App)
│       ├── components/ Game, Wallet, Admin, UI
│       ├── hooks/     useWebSocket, useGame, useWallet
│       ├── store/     Zustand global state
│       └── lib/       API client, encryption, ws
└── mock/              Standalone HTML mock (no backend needed)
```

## Features
- 400 pre-generated bingo cards (unique)
- Real-time number broadcasting via WebSocket
- Card selection with instant lock/release
- Wallet: deposit, withdraw, transfer (Telebirr, CBE Birr, Awash)
- 50 ብር registration bonus
- Player online/offline presence
- Payload encryption (AES-256-GCM)
- JWT auth with refresh tokens
- Admin panel: game config, finance settings, player management
- Auto-reconnect on disconnect
- Ethiopian Birr (ብር) currency throughout
