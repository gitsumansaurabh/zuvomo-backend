# Signal Tracker Server — Simple Overview

This is the **backend server** for the Zuvomo trading signal tracker. Think of it as the brain behind the app: it stores your trade ideas, checks live crypto prices, and tells you whether each trade is winning, losing, or still running.

---

## What is this server?

It is a small **API server** built with **Node.js** and **Express**. An API is just a set of URLs your frontend (or any app) can call to get or save data.

The server:

1. **Saves trading signals** in a **PostgreSQL** database  
2. **Fetches live prices** from **Binance** (public API, no API key needed)  
3. **Updates each signal’s status** automatically based on the current price and time  
4. **Returns JSON** so the React dashboard can show everything on screen  

It runs on **http://localhost:4000** by default (when you use `npm run dev`).

---

## What is a “signal”?

A **signal** is a planned trade. When you create one, you tell the server:

| Field | Meaning |
|-------|---------|
| **Symbol** | Which coin pair, e.g. `BTCUSDT` |
| **Direction** | `BUY` (bet price goes up) or `SELL` (bet price goes down) |
| **Entry price** | The price you entered or want to track from |
| **Target price** | Where you want to take profit |
| **Stop loss** | Where you cut the loss if price goes wrong |
| **Entry time** | When the trade started |
| **Expiry time** | When the signal should stop if nothing happened |

The server stores this and keeps watching it.

---

## What does the server actually do?

### When you add a signal

You send a `POST` request to `/api/signals`. The server checks the data is valid, saves it in the database, and marks it as **OPEN**.

### When you view signals

You call `GET /api/signals` (or get one by ID). For each open signal the server:

1. Gets the **current price** from Binance  
2. Compares it to your **target** and **stop loss**  
3. Decides the **status**  
4. Calculates **ROI** (return on investment — how much you’re up or down in %)  
5. Sends everything back as JSON  

This happens on every request, so the dashboard always shows **live** info.

### How status is decided

| Status | Meaning |
|--------|---------|
| **OPEN** | Trade is still active; price hasn’t hit target or stop, and it hasn’t expired |
| **TARGET_HIT** | Price reached your profit target — good outcome |
| **STOPLOSS_HIT** | Price hit your stop loss — loss is limited |
| **EXPIRED** | Time ran out before target or stop was hit |

Once a signal reaches **TARGET_HIT**, **STOPLOSS_HIT**, or **EXPIRED**, that result is **locked**. The server will not change it again.

**BUY example:** target is above entry, stop is below.  
**SELL example:** target is below entry, stop is above.

### When time runs out

If the **expiry time** passes and the signal is still **OPEN**, it becomes **EXPIRED**.

### When you delete a signal

`DELETE /api/signals/:id` removes it from the database.

---

## Main API endpoints (short list)

| Method | URL | What it does |
|--------|-----|----------------|
| `GET` | `/health` | “Is the server alive?” |
| `POST` | `/api/signals` | Create a new signal |
| `GET` | `/api/signals` | List all signals (with live prices & status) |
| `GET` | `/api/signals/:id` | Get one signal |
| `GET` | `/api/signals/:id/status` | Get just status, price, and ROI (lighter response) |
| `DELETE` | `/api/signals/:id` | Delete a signal |

---

## How the pieces fit together

```
Frontend (React)
       │
       │  HTTP requests (JSON)
       ▼
This server (Express)
       │
       ├── PostgreSQL  →  stores signals
       │
       └── Binance API   →  live crypto prices
```

**Routes** receive the HTTP request.  
**Controllers** read the request and send the response.  
**Services** contain the real logic (status checks, ROI, Binance calls).  
**Models** talk to the database.

---

## Quick start

```bash
cd backend
cp .env.example .env    # add your DATABASE_URL
npm install
npm run migrate         # create database tables
npm run dev             # start server on port 4000
```

Check it works: open **http://localhost:4000/health** — you should see `{"status":"ok",...}`.

---

## What this server is *not*

- It does **not** place real trades on Binance  
- It does **not** need a Binance API key (it only reads public prices)  
- It does **not** predict the market — it only **tracks** signals you create  

It is a **tracker and dashboard backend**, not a trading bot.

---

## More detail

For setup, database schema, and full technical docs, see:

- [Project README](../README.md) — full-stack quick start  
- [Backend complete guide](../docs/BACKEND_COMPLETE_GUIDE.md) — deep technical walkthrough  
