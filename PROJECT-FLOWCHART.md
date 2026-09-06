# Doptor Tech — Simple Project Flowchart

Ei file e **puro project er simple flowchart** ache.  
Mermaid renderer na thakleo ASCII diagram pora jabe.

---

## A. Pura System — Ek Nojore

```
                    ┌─────────────────────┐
                    │   node server.js    │
                    │   Port: 3000        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Browser: /main     │
                    │  LOGIN PAGE         │
                    └──────────┬──────────┘
                               │
              Email + Password + Profile select
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌────────────┐      ┌────────────┐      ┌────────────┐
    │  COMPANY   │      │     PM     │      │   SALES    │
    │  Admin     │      │  Manager   │      │  Seller    │
    │comapani.html│     │  / Lead    │      │Seller.html │
    └────────────┘      └────────────┘      └────────────┘
                               │
                               ▼
                        ┌────────────┐
                        │    DEV     │
                        │ Developer  │
                        │  / Free    │
                        │  Dev.html  │
                        └────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  database/ folder   │
                    │  store.json         │
                    │  auth.json          │
                    └─────────────────────┘
```

**Simple meaning:**
1. Server chalabe
2. Login korbe
3. Role onujayi 4 ta portal er ekta khulbe
4. Data `database/` folder e save hobe

---

## B. Login Flow (Step by Step)

```
  START
    │
    ▼
[1] http://localhost:3000/main kholo
    │
    ▼
[2] Upor e profile pick koro
      □ Company   → Admin
      □ PM        → Project Manager / Team Lead
      □ Sales     → Seller
      □ Dev       → Developer / Freelancer
    │
    ▼
[3] Email + Password dao → Sign in
    │
    ▼
[4] System check kore:
      Password thik? ──NO──► Error message
         │
        YES
         │
         ▼
[5] User er ROLE dekhe thik portal e pathay
    │
    ▼
[6] Dashboard dekhabe
```

### Ke kon page e jabe?

```
  Role                Portal file
  ─────────────────   ──────────────────────
  Admin            →  comapani.html
  Project Manager  →  Project manager.html
  Team Lead        →  Project manager.html
  Sales            →  Seller.html
  Developer        →  Dev.html
  Freelancer       →  Dev.html
```

---

## C. Main Business Flow (Sabche Important)

**Ei ta project er heart.** Client theke project delivery porjonto:

```
  ┌──────────────┐
  │   SALES      │  Notun client paise
  │   Seller     │
  └──────┬───────┘
         │
         ▼
  [ New Client Entry ]
  Form fill → Save
         │
         ▼
  status = PENDING  (waiting...)
         │
         ▼
  ┌──────────────┐
  │ ADMIN / PM   │  Review kore
  └──────┬───────┘
         │
         ├──────────── APPROVE ────────────┐
         │                                 │
         └──────────── REJECT ───► Sales   │
                           edit kore       │
                           abar pathay     │
                                           ▼
                                  ┌────────────────┐
                                  │   PROJECT      │
                                  │   create hoy   │
                                  │ All Projects e │
                                  └────────┬───────┘
                                           │
                                           ▼
                                  ┌────────────────┐
                                  │  DEVELOPER     │
                                  │  kaaj kore     │
                                  │  stage update  │
                                  │  daily update  │
                                  └────────┬───────┘
                                           │
                                           ▼
                                  ┌────────────────┐
                                  │  COMPLETED /   │
                                  │  DELIVERED     │
                                  └────────────────┘
```

### Status meaning (3 ta):

| Status | Meaning | Next step |
|--------|---------|-----------|
| **pending** | Sales pathiyece, wait | Admin/PM review |
| **rejected** | Reject hoyece | Sales edit → abar pending |
| **approved** | Project banano hoyece | Dev kaaj shuru |

---

## D. 4 Portal e Ki Ki Menu Ache?

### 1) Company (Admin) — `comapani.html`

```
  Dashboard
  New Client Approval     ← Sales er request approve/reject
  All Projects
  Clients
  Daily Updates
  Client Notes
  Users                   ← team list
  User Manage             ← password / login manage
  Profile Settings
  System Management       ← status, stage, target
```

### 2) Project Manager — `Project manager.html`

```
  Dashboard
  New Client Approval     ← PM approve korte pare (Team Lead nay)
  All Projects
  Clients
  Daily Updates
  Client Notes
  Profile Settings
```

### 3) Sales — `Seller.html`

```
  Dashboard
  My Project              ← nijer project
  All Projects
  New Client Entry        ← NOTUN CLIENT ENTRY (main kaaj)
  Clients
  Daily Updates
  Client Notes
  Profile Settings
```

### 4) Dev — `Dev.html`

```
  Dashboard
  Projects                ← je gula assign kora
  Clients
  Daily Updates
  Client Notes
  Profile Settings
```

---

## E. Project Status Flow (Kaaj Cholte Cholte)

```
  Not Started
       │
       ▼
  In Progress ◄──── On Hold
       │                ▲
       ├────────────────┘
       │
       ├──► Waiting on Client ──► abar In Progress
       │
       ▼
  In Review
       │
       ▼
  Completed / Delivered
```

**Developing stage (Dev update kore):**

```
  Discovery → Design → Development → QA → Delivered
```

---

## F. Data Kothay Save Hoy?

```
  Browser (HTML pages)
         │
         │  save / load
         ▼
  local-backend.js   (Firebase-er moto API)
         │
         ▼
  server.js  (/api/db/...)
         │
         ▼
  database/
    ├── store.json   ← projects, users, clients, updates...
    ├── auth.json    ← email + password
    └── meta.json    ← system flags
```

**Simple:** browser e ja change korun → server → JSON file e save.

---

## G. Full Story (Ek Line Flow)

```
  Server start
      → Login
          → Role onujayi portal
              → Sales: client entry (pending)
                  → Admin/PM: approve
                      → Project create
                          → Dev: stage + daily update
                              → Completed
```

---

## H. Ke Ki Kore? (Short)

```
  ┌─────────┬──────────────────────────────────────────┐
  │ Role    │ Kaaj                                      │
  ├─────────┼──────────────────────────────────────────┤
  │ Sales   │ Client entry dey, nijer project dekhe    │
  │ Admin   │ Approve, sob manage, user/password       │
  │ PM      │ Approve, project assign/track            │
  │ TeamLead│ Team er project track                    │
  │ Dev     │ Assign project e kaaj + update           │
  │ Free    │ Same as Dev (budget dekhte pay na)       │
  └─────────┴──────────────────────────────────────────┘
```

---

## I. Start Korar Flow

```
  1. Terminal e:  node server.js
  2. Browser e:   http://localhost:3000/main
  3. Profile select
  4. Email + password
  5. Sign in → Dashboard
```

---

**Bujhar tips:**  
- Section **C** = sabche important business flow  
- Section **D** = kon portal e ki menu  
- Section **G** = pura story 1 line e  

Jodi kono ekta part aro simple chai (sudhu Sales, sudhu Admin, ba sudhu Dev), bolun — oi part alada kore aro clear kore dibo.
