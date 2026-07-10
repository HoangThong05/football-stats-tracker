# ⚽ Football Stats Tracker

A full-stack app that tracks football league standings, results, fixtures, top scorers, and team details.
Built with **Spring Boot** (backend) and **React + Bootstrap** (frontend), pulling data from
the free [football-data.org](https://www.football-data.org) API with server-side caching,
user accounts (JWT + roles), favorite teams, scheduled data sync, and email reminders.

## ✨ Features

- **Standings** for 6 top leagues (PL, La Liga, Bundesliga, Serie A, Ligue 1, Champions League)
- **Fixtures & results** for the last/next 14 days per league
- **Top scorers** — goal-scoring leaderboard for each league
- **Score predictions** — predict upcoming match scores, auto-scored once the match finishes,
  with a public leaderboard of the best predictors and a personal prediction history
- **Head-to-head comparison** — put two teams side by side, best metric highlighted
- **Team search** right on the standings table (accent-insensitive: typing "munchen" matches "München")
- **Dark mode** — toggle between light/dark theme, remembered across visits
- **Team detail page** (venue, coach, founding year, squad)
- **Sign up / log in** with JWT (passwords hashed with BCrypt)
- **USER / ADMIN roles** — admins get a dashboard listing all registered users
- **Favorite teams** — saved to SQL Server per account
- **Scheduled sync job** — automatically refreshes match data into the DB every 30 minutes
- **Email reminders** when a favorite team's match is coming up (within 24h)
- **Swagger UI** for exploring/testing the API directly

## 🧱 Architecture

```
React + Bootstrap (5173)  ──►  Spring Boot API (8080)  ──►  cache 30' / DB  ──►  football-data.org
                                        │
                                        ├─►  SQL Server (users, favorites, matches, predictions)
                                        └─►  @Scheduled: sync matches + score predictions + send emails
```

The frontend never calls football-data.org directly. The backend holds the API key and caches
responses (Caffeine, 30-minute TTL) to stay comfortably under the free tier's 10 requests/minute limit.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.3, Spring Security (JWT), Spring Data JPA, Caffeine cache |
| Database | SQL Server, Flyway migrations |
| Frontend | React 18, Vite, Bootstrap 5 |
| API docs | springdoc-openapi (Swagger UI) |
| Email | Spring Mail (SMTP) |
| Testing | JUnit 5, Mockito, MockMvc (56 tests) |

## 🚀 Getting Started

### Requirements
- **JDK 21+**
- **Node.js 18+**
- **SQL Server** (running, with SQL Authentication enabled)

### 0. Get a free API key
1. Register at https://www.football-data.org/client/register
2. Copy the API token from the confirmation email.

### 1. Prepare the database
Just create an **empty** database — **Flyway creates the tables automatically** on first run.

```bash
sqlcmd -S localhost -U sa -P your_sa_password -Q "IF DB_ID('football_tracker') IS NULL CREATE DATABASE football_tracker"
```

> The schema is managed by Flyway under `backend/src/main/resources/db/migration/`.
> Whenever the schema changes, a new `V4__description.sql`, `V5__...` file is added — Flyway runs them in order automatically.

### 2. Run the backend (Spring Boot)
Set the environment variables, then run. Example on **Windows CMD**:

```cmd
set FOOTBALL_DATA_API_KEY=your_api_key
set DB_USERNAME=sa
set DB_PASSWORD=your_sa_password
set JWT_SECRET=a_random_string_at_least_32_characters_long
mvn -f backend/pom.xml spring-boot:run
```

| Variable | Required | Purpose |
|----------|:---:|---------|
| `FOOTBALL_DATA_API_KEY` | ✅ | football-data.org API key |
| `DB_USERNAME` | ✅ | SQL Server login (defaults to `sa`) |
| `DB_PASSWORD` | ✅ | SQL Server password |
| `JWT_SECRET` | ✅ | Secret used to sign JWTs (≥ 32 chars) |
| `MAIL_USERNAME` | ⬜ | Sender email for notifications (Gmail App Password) |
| `MAIL_PASSWORD` | ⬜ | App password for the email above |

> If `MAIL_*` is left unset, the app still runs fine — it just logs instead of sending real emails.

Check it worked: open http://localhost:8080/swagger-ui/index.html and you should see the API list.

### 3. Run the frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 → pick a league → browse standings, fixtures, results, top scorers;
log in to follow favorite teams and join **score predictions** (ADMIN accounts get an extra **Admin** button).

## 📡 API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|:---:|
| GET | `/api/standings/{code}` | League standings | public |
| GET | `/api/matches/{code}/upcoming` | Fixtures for the next 14 days | public |
| GET | `/api/matches/{code}/results` | Results from the last 14 days | public |
| GET | `/api/scorers/{code}` | Top scorers | public |
| GET | `/api/teams/{id}` | Team detail | public |
| POST | `/api/auth/register` | Sign up | public |
| POST | `/api/auth/login` | Log in (returns JWT + role) | public |
| GET | `/api/favorites` | List favorite teams | logged in |
| POST | `/api/favorites` | Follow a team | logged in |
| DELETE | `/api/favorites/{teamId}` | Unfollow a team | logged in |
| GET | `/api/admin/users` | List all users | **ADMIN** |
| GET | `/api/predictions/matches/{code}` | Upcoming matches with your current prediction (if logged in) | public |
| GET | `/api/predictions/leaderboard` | Top predictors leaderboard | public |
| POST | `/api/predictions` | Submit/update a score prediction (only before kickoff) | logged in |
| GET | `/api/predictions/mine` | Your prediction history (all leagues) | logged in |

## 🧪 Running tests

```bash
mvn -f backend/pom.xml test
```

56 tests (JUnit 5 + Mockito + MockMvc), **no DB or network required** — every external
dependency is mocked, so they run anywhere:

| Test file | What it checks |
|-----------|----------------|
| `JwtServiceTest` | Token generation/parsing, `role` claim, expired/tampered/mis-signed tokens |
| `AuthServiceTest` | Duplicate email → 409, wrong password → 401, returns correct `role` |
| `AdminSecurityTest` | USER hitting `/api/admin/**` → 403, ADMIN → 200, public API still open |
| `StandingsServiceTest` | Correct field mapping, only the `TOTAL` block is used |
| `MatchesServiceTest` | Filters `upcoming`/`results`, sorting, `null` score before kickoff |
| `ScorersServiceTest` | Rank numbering, keeps `assists = null` as-is |
| `FavoriteServiceTest` | Duplicate follow → 409, unfollow non-existent → 404 |
| `PredictionScoringServiceTest` | Scoring rules (3/1/0 points) across many scenarios |
| `PredictionServiceTest` | Match already started → 409, negative score → 400, update instead of duplicate |

## 📚 League codes

| Code | League |
|------|--------|
| PL | Premier League |
| PD | La Liga |
| BL1 | Bundesliga |
| SA | Serie A |
| FL1 | Ligue 1 |
| CL | Champions League |

## 👥 Roles

Every account has one of two roles, stored in `app_user.role`:

| Role | Access |
|------|--------|
| `USER` | Default on sign-up. Browse data, follow favorite teams, make predictions. |
| `ADMIN` | Everything USER can do, plus `/api/admin/**` and the Admin dashboard on the web. |

The role is embedded in the JWT at login time. **To create the first ADMIN**, sign up normally,
then promote the account directly in the DB:

```sql
UPDATE app_user SET role = 'ADMIN' WHERE email = 'your_email@example.com';
```

> After changing a role, you must **log out and back in** to get a fresh JWT — the old token
> keeps the old role until it expires (JWT is stateless and doesn't auto-refresh).

## 🎯 Score predictions

1. Go to the **"Predict"** tab, pick a league → enter a score prediction for upcoming matches
   (can be edited any number of times, as long as the match hasn't started).
2. The `PredictionScoringService` scheduled job automatically scores predictions once a match's
   status becomes `FINISHED`:
   - **3 points**: exact score match
   - **1 point**: correct outcome (win/draw/loss) but wrong exact score
   - **0 points**: wrong outcome
3. Check **"🏆 Leaderboard"** in the navbar to see who's on top — public, no login required.
4. Logged-in users can view **"📜 History"** in the navbar for their full prediction history
   (scored and pending), with a running point total.

> Predictions can only be made for matches already **synced** into the `match_fixture` table
> (via `MatchSyncService`), so during the off-season the list may be empty — that's expected
> behavior, not a bug.

## 🗄️ Database

5 tables (see full definitions + comments in `backend/src/main/resources/db/migration/`):

| Table | Purpose |
|-------|---------|
| `app_user` | User accounts (email, BCrypt password hash, `role`) |
| `favorite_team` | Teams each user follows (FK → app_user) |
| `match_fixture` | Matches synced from football-data.org |
| `sent_notification` | Tracks sent emails (prevents duplicates) |
| `prediction` | A user's score prediction for a match (FK → app_user, match_fixture); `points` is NULL until scored |

Flyway also creates a `flyway_schema_history` table to track which migrations have run.

## 🗺️ Roadmap

- [x] Standings for 6 leagues
- [x] Recent fixtures & results
- [x] Team detail page
- [x] JWT login + follow favorite teams
- [x] Persist data to SQL Server + scheduled `@Scheduled` refresh job
- [x] Email reminders for upcoming favorite-team matches
- [x] Swagger/OpenAPI documentation
- [x] Migrated schema management to Flyway
- [x] Top scorers
- [x] USER / ADMIN roles + admin dashboard
- [x] Team comparison, team search, dark mode
- [x] Performance: 30-min cache TTL, quota warnings, lazy-loaded images
- [x] Automated tests (JUnit) — 56 tests
- [x] Score predictions (gamification) — auto-scoring + leaderboard + personal history
