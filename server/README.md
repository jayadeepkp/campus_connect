## Campus Connect – Auth & Recovery API

This prototype implements two user stories:
1) **Authentication** — Users can register and log in (JWT).
2) **Account Recovery** — Users can request a password reset and set a new password using a time-limited token.

## Tech
- Node.js + Express (ESM)
- MongoDB Atlas + Mongoose
- JWT auth
- Prototype recovery tokens (returned in API response & logged)

## Setup
1. Copy `.env.example` → `.env` and fill values (URL-encode password chars like `@` → `%40`).
2. Install & run:
   ```bash
   cd server
   npm install
   npm run dev

### Setup
1. Copy `.env.example` to `.env` and set:
   - PORT=5050
   - MONGO_URI=mongodb+srv://<user>:<pass-encoded>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority&appName=<app>
   - JWT_SECRET=change-me
   - JWT_EXPIRES=7d
   - RESET_TOKEN_TTL_MIN=30
2. Install & run:
   npm install
   npm run dev

### Endpoints
- GET / -> health
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot
- POST /api/auth/reset

Commit checking.