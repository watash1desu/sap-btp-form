<<<<<<< HEAD
# SAP BTP Service Request Portal — Multi-Persona Workflow

A multi-persona approval workflow replicating SAP BTP's internal Service Request Portal — built as an internship project studying configurable workflow UIs and SAP Fiori design patterns.

## Approval Flow

```
Requestor → Assessor → [Financial Controller] → Technical Architect → BTPCOE Head → Admin
```

Cost-impact branching: the Assessor answers a Yes/No question about cost impact. If Yes, the request routes through the Financial Controller before reaching the Technical Architect. If No, it skips straight to Technical Architect.

---

## File Structure

```
sap-portal-fixed/
│
├── requestor.html              # Requestor login + 3-step request form
├── requestor.js
│
├── assessor.html               # Assessor queue + cost-impact decision
├── assessor.js
│
├── financial-controller.html   # FC queue + financial assessment form
├── financial-controller.js
│
├── technical-architect.html    # TA queue + security/operational/privacy assessment
├── technical-architect.js
│
├── btpcoe-head.html            # BTPCOE Head queue + review + delegate
├── btpcoe-head.js
│
├── admin.html                  # Admin queue + final execute/reject
├── admin.js
│
├── requests-store.js           # Shared data layer (localStorage) + shared render helpers
├── style.css                   # One shared stylesheet for all pages
├── persona-stub.js             # Unused scaffolding — kept as reference for adding new personas
│
├── assets/
│   └── itc-logo.svg
│
├── backend/
│   ├── server.js               # Express server — login/signup API + static file serving
│   ├── package.json
│   └── package-lock.json
│
└── README.md
```

---

## Running Locally

**1. Install and start the backend:**
```bash
cd backend
npm install
node server.js
```

**2. Open the app in your browser:**
```
http://localhost:4000/requestor.html
```

Open each persona in its own tab:
```
http://localhost:4000/assessor.html
http://localhost:4000/financial-controller.html
http://localhost:4000/technical-architect.html
http://localhost:4000/btpcoe-head.html
http://localhost:4000/admin.html
```

> ⚠️ **Always use `http://localhost:4000/...` — never open the HTML files directly by double-clicking them.**
> Opening via `file://` means each page gets its own isolated localStorage origin (especially in Chrome), so requests submitted on one page will not appear on the next. Serving from one localhost origin keeps all pages sharing the same data.

---

## Demo Flow

1. Open `requestor.html`, sign up or log in, submit a new request.
2. Open `assessor.html` — the request appears in My Queue. Choose Yes/No for cost impact and submit.
3. If Yes → open `financial-controller.html`, fill in the financial assessment and approve.
4. Open `technical-architect.html` — fill in Security, Operational, and Data Privacy impact, then approve.
5. Open `btpcoe-head.html` — add remarks, optionally delegate, and approve.
6. Open `admin.html` — review the full approval chain and execute (marks as Approved) or reject.

There are seeded mock requests in `requests-store.js` (`seedRequests()`) so every queue has something to click through before you submit anything yourself.

---

## Known Simplifications (by design, for the demo)

- Only the Requestor has real login (via the Express backend). All other personas are accessed directly — no auth gate.
- File uploads are mocked: selecting a file stores its name only, nothing is actually saved to disk.
- The Requestor's dashboard shows all requests in the store, not filtered to the logged-in user — no per-user ownership is wired up yet.
- **Status logic:** a request is *Pending* only while untouched with the Assessor. Once any approver acts on it, it becomes *In Progress* until Admin executes it (→ *Approved*) or someone rejects it (→ *Rejected*).

---

## Potential Next Steps

- [ ] Replace `requests-store.js` localStorage calls with real API calls once a CAP/backend exists — every other file only ever calls functions from this file, so the swap is contained to one place.
- [ ] Add per-user request ownership so the Requestor dashboard filters to their own requests.
- [ ] Real file upload and storage instead of the current name-only mock.
- [ ] Auth gate on persona pages (currently anyone can open `assessor.html` directly).

---
