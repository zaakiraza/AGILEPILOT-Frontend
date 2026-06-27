# AgilePilot Frontend

React + TypeScript + Vite UI connected to the AgilePilot REST API.

## Setup

```bash
cd Frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`

## Environment

```env
# Local backend
VITE_API_URL=http://localhost:8080

# Production
# VITE_API_URL=https://agilepilot-backend.vercel.app
```

## Pages & API mapping

| Page | API |
|------|-----|
| Login | `POST /api/auth/login` |
| Verify Email | `POST /api/auth/verify-email`, `resend-otp` |
| Organization setup | `POST /api/organizations` |
| Users (admin) | `POST/GET /api/users` |
| Dashboard | `GET /api/projects`, tasks |
| Projects | `GET/POST /api/projects` |
| Project detail | milestones, tasks, members, estimate, budget, reports |
| Task Board | tasks kanban |
| Estimation | `GET/PUT /api/projects/:id/estimate` |
| Budget Analytics | `GET /api/projects/:id/budget/analysis` |
| Reports | `GET/POST /api/projects/:id/reports`, export PDF/Excel |
| Settings | `GET /api/auth/me`, organization |

## Test flow

1. Start backend: `cd Backend && npm start`
2. Start frontend: `cd Frontend && npm run dev`
3. Login as superAdmin → create admin → verify OTP → admin creates org → users → project

Public registration is disabled; admins create accounts (OTP required).
