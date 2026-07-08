# ⚽ Football Stats Tracker

A full-stack app that tracks football league standings, results, fixtures, and team details.
Built with **Spring Boot** (backend) and **React + Bootstrap** (frontend), pulling data from
the free [football-data.org](https://www.football-data.org) API with server-side caching,
user accounts (JWT), favorite teams, scheduled data sync, and email reminders.

## ✨ Features

- **Bang xep hang** 6 giai hang dau (PL, La Liga, Bundesliga, Serie A, Ligue 1, Champions League)
- **Lich thi dau & ket qua** gan day cho tung giai
- **Trang chi tiet doi bong** (san nha, HLV, nam thanh lap, doi hinh)
- **Dang ky / dang nhap** bang JWT (mat khau ma hoa BCrypt)
- **Theo doi doi yeu thich** — luu vao SQL Server theo tung tai khoan
- **Job @Scheduled** tu dong dong bo tran dau vao DB moi 30 phut
- **Email nhac nho** khi doi yeu thich sap thi dau (trong 24h toi)
- **Swagger UI** de test API truc tiep

## 🧱 Architecture

```
React + Bootstrap (5173)  ──►  Spring Boot API (8080)  ──►  cache 5' / DB  ──►  football-data.org
                                        │
                                        ├─►  SQL Server (users, favorites, matches)
                                        └─►  @Scheduled: sync tran + gui email nhac
```

Frontend khong bao gio goi thang football-data.org. Backend giu API key, cache phan hoi
(Caffeine, TTL 5 phut) → luon nam duoi gioi han 10 request/phut cua goi mien phi.

## 🛠️ Tech Stack

| Layer | Cong nghe |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.3, Spring Security (JWT), Spring Data JPA, Caffeine cache |
| Database | SQL Server |
| Frontend | React 18, Vite, Bootstrap 5 |
| API doc | springdoc-openapi (Swagger UI) |
| Email | Spring Mail (SMTP) |

## 🚀 Getting Started

### Yeu cau
- **JDK 21+**
- **Node.js 18+**
- **SQL Server** (dang chay, cho phep SQL Authentication)

### 0. Lay API key mien phi
1. Dang ky tai https://www.football-data.org/client/register
2. Copy API token tu email xac nhan.

### 1. Chuan bi database
Chi can tao database TRONG (chua co bang) — **Flyway se tu tao cac bang** khi app chay lan dau.

```bash
sqlcmd -S localhost -U sa -P your_sa_password -Q "IF DB_ID('football_tracker') IS NULL CREATE DATABASE football_tracker"
```

> Luoc do bang duoc quan ly boi Flyway trong `backend/src/main/resources/db/migration/`.
> Moi lan doi schema, them 1 file `V2__mo_ta.sql`, `V3__...` — Flyway tu chay theo thu tu.

### 2. Chay backend (Spring Boot)
Dat cac bien moi truong roi chay. Vi du tren **Windows CMD**:

```cmd
set FOOTBALL_DATA_API_KEY=your_api_key
set DB_USERNAME=sa
set DB_PASSWORD=your_sa_password
set JWT_SECRET=chuoi_ngau_nhien_toi_thieu_32_ky_tu
mvn -f backend/pom.xml spring-boot:run
```

| Bien | Bat buoc | Y nghia |
|------|----------|---------|
| `FOOTBALL_DATA_API_KEY` | ✅ | API key football-data.org |
| `DB_USERNAME` | ✅ | User SQL Server (mac dinh `sa`) |
| `DB_PASSWORD` | ✅ | Mat khau SQL Server |
| `JWT_SECRET` | ✅ | Chuoi bi mat ky JWT (>= 32 ky tu) |
| `MAIL_USERNAME` | ⬜ | Email gui thong bao (Gmail App Password) |
| `MAIL_PASSWORD` | ⬜ | Mat khau ung dung cua email tren |

> Neu khong dat `MAIL_*`, app van chay binh thuong — chi ghi log thay vi gui email that.

Kiem tra: mo http://localhost:8080/swagger-ui/index.html → thay danh sach API.

### 3. Chay frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Mo http://localhost:5173 → chon giai → xem bang xep hang, lich, ket qua, dang nhap, theo doi doi.

## 📡 API Endpoints

| Method | Endpoint | Mo ta | Can dang nhap |
|--------|----------|-------|:---:|
| GET | `/api/standings/{code}` | Bang xep hang | |
| GET | `/api/matches/{code}/upcoming` | Lich 14 ngay toi | |
| GET | `/api/matches/{code}/results` | Ket qua 14 ngay qua | |
| GET | `/api/teams/{id}` | Chi tiet doi bong | |
| POST | `/api/auth/register` | Dang ky | |
| POST | `/api/auth/login` | Dang nhap (tra JWT) | |
| GET | `/api/favorites` | Danh sach doi yeu thich | ✅ |
| POST | `/api/favorites` | Theo doi 1 doi | ✅ |
| DELETE | `/api/favorites/{teamId}` | Bo theo doi | ✅ |

## 📚 League codes

| Code | League |
|------|--------|
| PL | Premier League |
| PD | La Liga |
| BL1 | Bundesliga |
| SA | Serie A |
| FL1 | Ligue 1 |
| CL | Champions League |

## 🗄️ Database

4 bang (xem chi tiet + comment trong `backend/src/main/resources/db/migration/V1__init.sql`):

| Bang | Vai tro |
|------|---------|
| `app_user` | Tai khoan nguoi dung |
| `favorite_team` | Doi bong moi user theo doi (FK → app_user) |
| `match_fixture` | Tran dau dong bo tu football-data.org |
| `sent_notification` | Danh dau email da gui (chong trung) |

## 🗺️ Roadmap

- [x] Bang xep hang 6 giai
- [x] Lich thi dau & ket qua gan day
- [x] Trang chi tiet doi bong
- [x] Dang nhap (JWT) + follow doi yeu thich
- [x] Luu du lieu vao SQL Server + job `@Scheduled` tu lam moi
- [x] Email thong bao khi doi yeu thich sap thi dau
- [x] Swagger/OpenAPI cho tai lieu API
- [x] Chuyen schema sang Flyway migration
