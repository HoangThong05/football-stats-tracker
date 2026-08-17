# ⚽ Football Stats Tracker

A full-stack football statistics web app built with **Spring Boot** and **React**, tracking six top European competitions.

🌐 **Live demo:** https://football-stats-tracker-jet.vercel.app

---

## ✨ Features

### 📊 Football data
Premier League · La Liga · Bundesliga · Serie A · Ligue 1 · Champions League

- **Standings** — full table with form guide (last 5), qualification/relegation zones, and accent-insensitive search (type `munchen`, find `München`)
- **Season selector** — browse the current season or the two before it
- **Fixtures & Results** — next and past 14 days; open any match for half-time score, venue and referees
- **Live score ticker** — today's matches scroll across the top of the page
- **Top Scorers** — goals, assists and nationality per league
- **Team Detail** — coach, founded year, stadium, club colours, squad list
- **Head-to-Head** — recent meetings between two teams
- **Compare Teams** — side-by-side table plus a radar chart across five axes (attack, defence, win rate, form, goals), each scaled against the league's best
- **Season break card** — between seasons, shows a countdown to the opening fixture along with last season's champion and top scorer

### 🎯 Predictions
- Predict scorelines for upcoming matches
- Auto-scored after full time: **3 pts** exact score · **1 pt** correct outcome
- Public leaderboard, personal history, points-over-time and accuracy-by-league charts
- Achievement badges for prediction milestones

### 🏆 Mini League
- Create a private room with a 6-character invite code
- Friends join with the code and compete on a private leaderboard
- Owner can delete the room; members can leave

### 👤 Accounts
- Register / login with JWT (BCrypt hashing)
- **USER** and **ADMIN** roles; admin dashboard lists all users
- Follow favourite teams
- Light / dark theme, Vietnamese / English

### 🎨 Extras
- Interactive 3D CR7 statue in a drawer — floodlit turf stage, gold confetti and a celebration sound synthesised with the Web Audio API. Kept behind a button so its 8 MB model never loads unless asked for.
- Installable as a PWA (web app manifest + service worker)
- Every animation respects `prefers-reduced-motion`

---

## ⚙️ How it works

- **Caffeine cache** (30-min TTL) keeps the app under football-data.org's 10 requests/minute free-tier limit
- **`@Scheduled` job** syncs fixtures into PostgreSQL every 30 minutes, so the "Today" page and ticker read from the database rather than the upstream API
- **`@Scheduled` job** scores predictions once matches finish
- **Swagger UI** at `/swagger-ui/index.html`
- **91 tests** (JUnit 5 + Mockito + MockMvc — no database or network needed)
- **Dockerfile** for the backend

### ⚠️ Known limitation: squad data

Squads come from football-data.org, which returns them **only for Premier League, Bundesliga and Ligue 1** — La Liga and Serie A come back empty, and the app shows a notice instead. This source also carries no player photos or shirt numbers, so squad entries show name, position, nationality and age only.

An API-Football integration exists as a fallback but is **currently inactive**. `API_FOOTBALL_KEY` still has to be set for the app to start, though any non-empty value works.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.3 |
| Security | Spring Security + JWT |
| ORM | Hibernate / JPA |
| Database | PostgreSQL (Neon) |
| Cache | Caffeine |
| Data source | football-data.org (free tier) |
| Build | Maven + Docker |
| Frontend | React 18 + Vite |
| Styling | Bootstrap 5 + custom CSS variables |
| 3D | Three.js (lazy-loaded) |
| Deployment | Render (backend) · Vercel (frontend) · Neon (DB) |

---

## 📁 Project Structure

```
football-stats-tracker/
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/hoangthong/footballtracker/
│       ├── client/          # HTTP clients + upstream DTOs
│       ├── config/          # Security, CORS, cache, Swagger, RestClient
│       ├── controller/      # REST controllers
│       ├── dto/             # Request / response DTOs
│       ├── entity/          # JPA entities
│       ├── repository/      # Spring Data JPA repositories
│       ├── security/        # JWT filter + service
│       └── service/         # Business logic, scheduled jobs, prediction scoring
└── frontend/
    ├── public/              # PWA manifest, service worker, 3D model, audio
    └── src/
        ├── components/      # React components
        ├── App.jsx
        ├── api.js
        ├── i18n.js          # VI / EN strings
        └── useThreeScene.js # Shared Three.js setup (dynamic import)
```

---

## 🚀 Running locally

### Prerequisites
- JDK 21+
- Maven 3.9+
- Node.js 18+
- PostgreSQL, local or a free [Neon](https://neon.tech) database

### Backend

```bash
cd backend

# PowerShell
$env:FOOTBALL_DATA_API_KEY="your_key_here"
$env:API_FOOTBALL_KEY="any_non_empty_value"
$env:JWT_SECRET="your_secret_32_chars_min"
$env:DATABASE_URL="jdbc:postgresql://localhost:5432/football_tracker"
$env:DATABASE_USERNAME="postgres"
$env:DATABASE_PASSWORD="your_password"

mvn spring-boot:run
```

Runs at `http://localhost:8080` · Swagger UI at `/swagger-ui/index.html`

To verify a build the way Render does — this compiles tests too, which `mvn compile` skips:

```bash
mvn clean package -DskipTests
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`, expecting the backend at `localhost:8080`.

To point it at a deployed backend instead, create `frontend/.env.local`:

```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

---

## ☁️ Deployment

| Service | Role | Plan |
|---------|------|------|
| [Render](https://render.com) | Spring Boot backend (Docker) | Free |
| [Vercel](https://vercel.com) | React frontend | Free |
| [Neon](https://neon.tech) | PostgreSQL | Free |

### Environment variables on Render

| Key | Description |
|-----|-------------|
| `FOOTBALL_DATA_API_KEY` | API key from football-data.org |
| `API_FOOTBALL_KEY` | Required to boot; the integration is inactive, so any value works |
| `JWT_SECRET` | Random string, 32+ characters |
| `DATABASE_URL` | `jdbc:postgresql://...` from Neon |
| `DATABASE_USERNAME` | Neon username |
| `DATABASE_PASSWORD` | Neon password |
| `FRONTEND_URL` | Vercel URL, used for CORS |

---

## 📄 License

Built for educational purposes as part of a Software Engineering degree at **FPT University**.

Match data from [football-data.org](https://www.football-data.org).
