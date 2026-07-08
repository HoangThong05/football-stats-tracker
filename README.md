# ⚽ Football Stats Tracker

A full-stack app that tracks football league standings, results, and fixtures.
Built with **Spring Boot** (backend) and **React** (frontend), pulling data from
the free [football-data.org](https://www.football-data.org) API with server-side caching.

> **Day 1 milestone:** display a real league table (Premier League, La Liga, ...) inside your own app.

## 🧱 Architecture

```
React (5173)  ──►  Spring Boot API (8080)  ──►  [cache 5 min?]  ──►  football-data.org
                                                     │
                                                     └─ hit  ──► tra ve ngay, khong goi API
```

The frontend never calls football-data.org directly. The Spring Boot backend
holds the API key, caches responses (Caffeine, 5-minute TTL), and exposes a
clean API — so we stay under the free tier's 10 requests/minute limit.

## 🚀 Getting Started

### 0. Get a free API key
1. Register at https://www.football-data.org/client/register
2. Copy your API token from the confirmation email.

### 1. Run the backend (Spring Boot)

Requires **JDK 21+**.

```bash
cd backend

# Cach 1 (khuyen dung): dat API key qua bien moi truong
# Windows PowerShell:
$env:FOOTBALL_DATA_API_KEY="your_api_key_here"
# macOS/Linux:
export FOOTBALL_DATA_API_KEY="your_api_key_here"

# Chay
./mvnw spring-boot:run      # macOS/Linux
mvnw.cmd spring-boot:run    # Windows
```

> Neu chua co Maven wrapper, mo project trong IntelliJ/VS Code va chay
> `FootballTrackerApplication`, hoac cai Maven roi chay `mvn spring-boot:run`.
> Cach khac: mo `src/main/resources/application.properties` va thay
> `PUT_YOUR_API_KEY_HERE` bang API key cua ban.

Kiem tra: mo http://localhost:8080/api/standings/PL → phai thay JSON bang xep hang.

### 2. Run the frontend (React)

Requires **Node.js 18+**.

```bash
cd frontend
npm install
npm run dev
```

Mo http://localhost:5173 → chon giai dau → xem bang xep hang.

## 📚 League codes

| Code | League |
|------|--------|
| PL | Premier League |
| PD | La Liga |
| BL1 | Bundesliga |
| SA | Serie A |
| FL1 | Ligue 1 |
| CL | Champions League |

## 🗺️ Roadmap (next steps)

- [ ] Lich thi dau & ket qua gan day (endpoint `/competitions/{code}/matches`)
- [ ] Trang chi tiet doi bong
- [ ] Dang nhap (JWT) + follow doi yeu thich
- [ ] Luu du lieu vao SQL Server + job `@Scheduled` tu lam moi
- [ ] Email thong bao khi doi yeu thich sap thi dau
- [ ] Swagger/OpenAPI cho tai lieu API
```
