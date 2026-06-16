# SAP BTP Service Request Portal

A multi-step service request form replicating SAP BTP's internal Service Request Portal — built as part of an internship project to study configurable form UIs and SAP Fiori design patterns.

## What this is

A wizard-style form for raising SAP BTP infrastructure/access requests, with:

- Login and signup, backed by a real database (Node.js + Express + SQLite)
- A persistent left-side step tracker (matches SAP Fiori's object-page wizard pattern)
- Six steps: Request Details, Service Configuration, Financial Assessment, Impact Analysis, Attachments, Review & Submit
- Field-level validation before advancing between steps
- A review summary on the final step, pulled from all previous steps' inputs

## Project structure

```
.
├── index.html          # form structure (login, header, step tracker, all 6 steps)
├── style.css            # all styling
├── script.js             # step navigation, validation, auth calls, review summary
└── backend/
    ├── server.js          # Express server — /signup and /login endpoints
    ├── package.json
    └── README.md          # backend-specific setup instructions
```

## Running it locally

**1. Start the backend** (handles signup/login, stores users in SQLite):
```
cd backend
npm install
node server.js
```
Leave this running — it serves the API at `http://localhost:4000`.

**2. Open the frontend:**
Open `index.html` with a local server (e.g. VS Code's Live Server extension). Opening it directly as a file won't work correctly with the backend calls.

## Status

This is an active work-in-progress, built incrementally and presented in stages:

- [x] Static multi-step form UI (steps 1–2)
- [x] Step navigation with validation
- [x] Login/signup UI
- [x] Remaining form steps (3–6)
- [x] Backend authentication (Express + SQLite)
- [ ] Dashboard landing page (request counts: drafts, pending, approved, rejected)
- [ ] "My Requests" tab with status filters
- [ ] Backend storage for submitted requests
- [ ] File upload persistence

## Notes

This project is for internal study/demonstration purposes, recreating SAP BTP's Service Request Portal UI patterns as a learning exercise — not affiliated with or endorsed by SAP.
