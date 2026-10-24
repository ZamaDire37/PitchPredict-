# PitchPredict - Real Football Prediction Web Application

A modern, responsive football prediction web application built for web access. Users can view real football matches from Europe's top competitions, submit predictions across multiple markets before kickoff, and compete across two distinct game modes: **Basic Mode** and **Serious Mode**.

---

## 🏆 Key Features

### 1. Real Football Data & Live Fixtures
- Uses real European football fixtures (Premier League, UEFA Champions League, La Liga, Serie A, Bundesliga).
- Displays authentic team names, crests, kickoff date/times, and match status (`TIMED`, `IN_PLAY`, `FINISHED`).
- Real-time auto-synchronization and integration with **Football-Data.org API v4**.
- Built-in live API sync button and API token configuration drawer.
- Automatic result grading when matches finish.

### 2. Supported Prediction Markets
- **Exact Score**: Select common scorelines (e.g. `2-1`, `1-1`, `0-2`) or custom scores (+30 pts).
- **Match Winner (1X2)**: Straight win, draw, or lose (+10 to +15 pts).
- **Double Chance**: `1X` (Home/Draw), `12` (Home/Away), `X2` (Draw/Away) (+6 pts).
- **Goals (Over / Under)**: Over/Under 1.5, 2.5, 3.5 total goals (+8 to +12 pts).
- **Corners (Over / Under)**: Over/Under 8.5, 9.5, 10.5 corners (+12 pts).
- **Both Teams to Score (BTTS)**: `YES` or `NO` (+10 pts).
- **Toggle Deselection Behavior**: Every prediction button is selectable, and clicking the same selected option again deselects it.

### 3. Two Completely Separate Game Modes

#### **Basic Mode** (Risk-Free)
- Users can place multiple independent predictions.
- **Correct predictions** award full points based on market odds.
- **Incorrect predictions** award 0 points.
- **Zero negative point penalty** — bankroll is never deducted for misses.
- Separate `basic_points` balance, streak counter, and Basic Mode Leaderboard.

#### **Serious Mode** (High Stakes Multi-Sets)
- Predictions are grouped into sets using the **Serious Set Builder**.
- **All predictions in a set must win**: If every prediction in a set is correct, the user earns all points from the selections.
- **If at least one prediction in a set fails**: Deducts **10 points ONCE** for that entire set, regardless of how many predictions were wrong.
- If multiple sets fail, 10 points are deducted for each failed set.
- Basic Mode points and Serious Mode points remain **completely separate** and never transfer between each other.
- Separate `serious_points` balance, streak counter, and Serious Mode Leaderboard.

### 4. Kickoff Lock Protection
- Predictions are strictly locked once the match kickoff time has passed.
- Backend enforcement prevents submitting or modifying predictions for in-progress or finished matches.

### 5. Points Analytics & Complete Audit Ledger
- Interactive **Recharts Points Progression Chart** showing user's point trajectories over time (separate curves for Basic and Serious modes).
- Full **Points Transaction Ledger** documenting every point delta, balance change, timestamp, and match/set reference.

### 6. Interactive Match Simulator & Testbed
- A built-in tester drawer allowing evaluators to simulate match final scores and corners in real-time to test the backend grading engine live.

---

## 🛠️ Tech Stack & Architecture

- **Backend**:
  - Node.js (v24) + Express
  - TypeScript (strict mode)
  - SQLite database (`node:sqlite` DatabaseSync with WAL mode and foreign keys)
  - Authentication: JWT tokens + bcryptjs password hashing
  - Axios for Football-Data.org API integration
- **Frontend**:
  - React 19 + TypeScript + Vite
  - Tailwind CSS v4
  - Lucide React icons
  - Recharts (Points Progression Charts)
  - Canvas Confetti (celebration effects)
- **Database Schema**:
  - `users`: User credentials, `basic_points`, `serious_points`, streaks
  - `matches`: Real football fixtures, scores, corners, status, kickoff times
  - `serious_sets`: Multi-pick set groupings, status (`PENDING`, `WON`, `LOST`), points delta
  - `predictions`: Individual user predictions linked to matches and sets
  - `points_history`: Full immutable audit trail of every point transaction
  - `settings`: API token configurations

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# Install root, server, and client dependencies
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Start Development Server
```bash
# Starts both Express backend (:5000) and Vite frontend (:3000) concurrently
npm run dev
```

### 4. Build & Production Run
```bash
# Build both frontend and backend
npm run build

# Start production server (serves frontend at http://localhost:5000)
npm run start
```

### 5. Run Verification Tests
```bash
# Run unit & rule validation tests (Scoring, Kickoff lock, Point isolation)
cd server && npx tsx src/tests/testRules.ts

# Run end-to-end integration test
cd server && npx tsx src/tests/e2e.ts
```

---

## 🔒 Security & Fair Play Notice
PitchPredict is a skill-based prediction web app designed for football enthusiasts. It contains **no real-money betting, gambling, deposits, or cash withdrawals**. All points are purely virtual skill metrics.
