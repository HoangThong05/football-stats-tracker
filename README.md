# ⚽ Football Stats Tracker

A full-stack football statistics web application built with **Spring Boot** (backend) and **React** (frontend), pulling live data from [football-data.org](https://www.football-data.org).

🌐 **Live demo:** https://football-stats-tracker-jet.vercel.app

---

## ✨ Features

### 📊 Football Data (6 leagues: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League)
- **Standings** — full league table with search (accent-insensitive: type "munchen" → finds "München")
- **Fixtures & Results** — upcoming and past 14 days, click any match for details (half-time score, venue, referee)
- **Top Scorers** — goals, assists, nationality per league
- **Team Detail** — squad, coach, founded year, home stadium
- **Compare Teams** — side-by-side stats, better stats highlighted in green

### 🎯 Predictions (Gamification)
- Predict the score of upcoming matches
- Auto-scoring: **3 pts** for exact score · **1 pt** for correct outcome
- Global leaderboard (public)
- Personal prediction history

### 🏆 Mini League
- Create a private room with a 6-character invite code
- Friends join with the code → compete on a private leaderboard
- Room owner can delete the room; members can leave

### 👤 Accounts & Personalisation
- Register / Login with JWT (BCrypt password hashing)
- Role-based access: **USER** and **ADMIN**
- ADMIN dashboard: view and manage all users
- Follow favourite teams → personalised fixture feed
- Email notification when a followed team plays within 24 hours
- Dark mode / Light mode toggle
- Vietnamese / English (i18n)

### ⚙️ Infrastructure & Tech
- **Caffeine cache** (30-minute TTL) to stay under football-data.org's 10 req/min free-tier limit
- **`@Scheduled` job** syncs match fixtures to PostgreSQL every 30 minutes
- **`@Scheduled` job** auto-scores predictions after matches finish
- **Swagger UI** available at `/swagger-ui/index.html`
- **56 unit tests** (JUnit 5 + Mockito + MockMvc, no DB or network required)
- **Dockerfile** for containerised deployment

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.3 |
| Security | Spring Security + JWT |
| ORM | Hibernate / JPA |
| Database | PostgreSQL (Neon — cloud) |
| Cache | Caffeine |
| Email | JavaMail (Gmail SMTP) |
| API source | football-data.org (free tier) |
| Build | Maven + Docker |
| Frontend | React 18 + Vite |
| Styling | Bootstrap 5 + custom CSS variables |
| Deployment | Render (backend) · Vercel (frontend) · Neon (DB) |

---

## 📁 Project Structure

```
football-stats-tracker/
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/hoangthong/footballtracker/
│       ├── client/          # football-data.org HTTP client + DTOs
│       ├── config/          # Security, CORS, Cache, Swagger, RestClient
│       ├── controller/      # REST controllers (14 components)
│       ├── dto/             # Request / Response DTOs
│       ├── entity/          # JPA entities
│       ├── repository/      # Spring Data JPA repositories
│       ├── security/        # JWT filter + service
│       └── service/         # Business logic + scheduled jobs
└── frontend/
    ├── src/
    │   ├── components/      # 14 React components
    │   ├── App.jsx
    │   ├── api.js
    │   └── i18n.js          # VI / EN translations
    └── vite.config.js
```

---

## 🚀 Getting Started (Local)

### Prerequisites
- JDK 21+
- Node.js 18+
- PostgreSQL (local) **or** a free [Neon](https://neon.tech) database

### 1. Backend

```bash
cd backend

# Set environment variables (PowerShell)
$env:FOOTBALL_DATA_API_KEY="your_key_here"
$env:JWT_SECRET="your_secret_32_chars_min"
$env:DATABASE_URL="jdbc:postgresql://localhost:5432/football_tracker"
$env:DATABASE_USERNAME="postgres"
$env:DATABASE_PASSWORD="your_password"

./mvnw spring-boot:run
```

Backend starts at `http://localhost:8080`.
Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at `http://localhost:5173`.

---

## ☁️ Deployment

| Service | Role | Plan |
|---------|------|------|
| [Render](https://render.com) | Spring Boot backend (Docker) | Free |
| [Vercel](https://vercel.com) | React frontend | Free |
| [Neon](https://neon.tech) | PostgreSQL database | Free forever |

### Environment variables required on Render

| Key | Description |
|-----|-------------|
| `FOOTBALL_DATA_API_KEY` | API key from football-data.org |
| `JWT_SECRET` | Random string, 32+ characters |
| `DATABASE_URL` | `jdbc:postgresql://...` from Neon |
| `DATABASE_USERNAME` | Neon username |
| `DATABASE_PASSWORD` | Neon password |
| `FRONTEND_URL` | Vercel deployment URL (for CORS) |

---

## 📄 License

This project was developed for educational purposes as part of a Software Engineering degree at **FPT University**.