# NutriPixel

A food, weight, and fitness tracker. Next.js 16 + Prisma + SQLite.

## Features

- 🍰 **Food log** — searchable database, per-meal tracking, macros per entry
- 🏃 **Exercise log** — MET-based calorie burn for common activities
- ⚖️ **Weight tracking** — history, trend line, lbs-to-goal
- ⭐ **Goals** — calorie + macro targets, lose/maintain/gain modes, TDEE-driven presets
- 📊 **Stats** — 7-day / 30-day averages, deficit analysis, projected weight loss, on-target day counts
- 📖 **Recipes** — save and log custom recipes as single entries
- 💭 **Mood** — daily tags and notes

## Install

```bash
git clone https://github.com/talv1sota/tracker.git
cd tracker
npm install
```

## Setup

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./prisma/dev.db"
```

Run the migrations and seed the database:

```bash
npx prisma migrate dev
npm run seed
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- **Next.js 16** (App Router) + React 19
- **Prisma 6** + SQLite
- **Tailwind CSS 4**
- **TypeScript 5**

## Project layout

```
src/
  app/            # pages and API routes
  components/     # shared UI (Nav, Window, MacroRing, ...)
  lib/            # db client and helpers
  generated/      # Prisma client output
prisma/
  schema.prisma   # data model
  migrations/     # migration history
  seed.ts         # initial food database
```
