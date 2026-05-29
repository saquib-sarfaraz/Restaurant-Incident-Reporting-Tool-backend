# Restaurant Incident Management System (Backend)

Production-ready Node.js + Express + MongoDB backend for incident reporting and management.

## Run locally

1. `cd server`
2. `cp .env.example .env` and fill `MONGODB_URI` and `GROQ_API_KEY`
3. Install deps: `npm install`
4. Start dev server: `npm run dev`

## Mock roles (no JWT)

Send these headers to simulate users:

- `x-user-role`: `staff` or `manager`
- `x-user-name`: any string (used for `reportedBy` and "view own incidents")

Defaults if not provided:

- role: `staff`
- name: `anonymous`

# Restaurant-Incident-Reporting-Tool-backend
