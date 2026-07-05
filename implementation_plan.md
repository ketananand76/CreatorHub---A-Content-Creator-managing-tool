# CreatorHub - Premium SaaS MERN Stack Web Application

CreatorHub is an all-in-one management platform for content creators, influencers, freelancers, and agencies. This document outlines the technical design, application structure, and execution plan.

---

## User Review Required

> [!IMPORTANT]
> - **Dual Database Mode (MongoDB & JSON Fallback)**: Since this application needs to be run locally with zero-friction setup, the backend will implement a dual-mode database layer:
>   - By default, if a `MONGODB_URI` environment variable is defined, it will connect to **MongoDB** (using Mongoose).
>   - If not defined, it will automatically fall back to a **local JSON file-based database** (e.g., in `/backend/data/*.json`) to allow full CRUD operations, authentication, and state management out-of-the-box without requiring a running MongoDB service.
> - **UPI Subscription Workflow**: Payments will be processed through the UPI ID `9771735011@mbk`. Free users will see a Subscription Page showing a QR Code (or deep link) for this UPI ID. The user pays, enters the Transaction Reference Number (UTR) and uploads an optional payment proof (mock Cloudinary/local upload). The request goes to the Super Admin's Payment Logs queue, where the Admin can verify and approve it. Once approved, the user's status updates to `Premium` and features are unlocked.
> - **AI Features Fallback**: AI Caption/Script generation will utilize standard text completions (simulated locally using robust rules/templates, or integrated with Gemini API if a `GEMINI_API_KEY` is provided).

---

## Proposed Changes

We will build the application in two sub-directories within the workspace:
1. `backend/`: Node.js, Express, JSON-DB/MongoDB backend.
2. `frontend/`: React, Vite, Tailwind CSS, Framer Motion, and Chart.js (or Recharts) for premium analytics.

### Directory Layout
```
/creatorhub (Root)
├── backend/
│   ├── data/                 # JSON database files (fallback)
│   ├── config/               # Database, passport (OAuth), and Cloudinary configurations
│   ├── models/               # Mongoose & Schema interfaces
│   ├── controllers/          # Controllers for Auth, Calendar, CRM, Earnings, Team, AI, Admin
│   ├── routes/               # Express routes
│   ├── middleware/           # Auth, RBAC, Rate Limiting
│   ├── utils/                # Helpers (OTP, JWT, Mock-DB engine)
│   ├── server.js             # Entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/       # Common components (Sidebar, Kanban, Calendar, Charts, ThemeToggle)
    │   ├── context/          # AuthContext, ThemeContext, NotificationContext
    │   ├── pages/            # Dashboard, CRM, Calendar, Earnings, Team, SuperAdmin, Subscription, Auth
    │   ├── styles/           # Tailwind, custom animations
    │   ├── App.jsx           # Main routing
    │   └── main.jsx
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

### Component Specifications

#### [NEW] [backend/package.json](file:///c:/Users/hp/Desktop/my%20word/backend/package.json)
Contains all backend dependencies: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `express-rate-limit`, `nodemailer` (for email OTPs), and standard utilities.

#### [NEW] [backend/server.js](file:///c:/Users/hp/Desktop/my%20word/backend/server.js)
Express app setup, middleware mounting (CORS, JSON, rate limiter, session logs), and database connection initializer (MongoDB vs. JSON-DB fallback).

#### [NEW] [backend/utils/jsonDb.js](file:///c:/Users/hp/Desktop/my%20word/backend/utils/jsonDb.js)
A lightweight local JSON database engine mimicking Mongoose querying capabilities to enable seamless local execution.

#### [NEW] [backend/models/](file:///c:/Users/hp/Desktop/my%20word/backend/models/)
- `User.js`: Schema for users (roles, 2FA status, OTP verification status, premium status).
- `CalendarEvent.js`: Tasks/reminders and scheduling.
- `BrandDeal.js`: Brand CRM deals, pricing, stage tracking, and mock contract documents.
- `Transaction.js`: UPI transactions containing UPI Reference numbers, amounts, status, and request details.
- `TeamTask.js` & `Message.js`: Task assignment, chat, and deadlines.
- `SessionLog.js`: User login tracking, device detection, and suspension status.

#### [NEW] [backend/controllers/](file:///c:/Users/hp/Desktop/my%20word/backend/controllers/)
- `authController.js`: Full auth system, Google Login mock verification/integration, 2FA, OTP email, token refresh.
- `crmController.js`: BRAND CRM CRUD.
- `calendarController.js`: Event CRUD and drag-and-drop endpoint updates.
- `earningsController.js`: Revenue data, calculations, and monthly statements.
- `teamController.js`: Chat messages and task assignments.
- `aiController.js`: Mock AI endpoints (and Gemini key integration) for content tools.
- `adminController.js`: Super Admin tools for managing users, approving payments, resolving tickets, tracking devices, and bans.

#### [NEW] [frontend/package.json](file:///c:/Users/hp/Desktop/my%20word/frontend/package.json)
Tailwind CSS, Framer Motion for high-fidelity animations, Lucide React icons, and Recharts or Chart.js for sleek, interactive analytics dashboards.

#### [NEW] [frontend/src/context/AuthContext.jsx](file:///c:/Users/hp/Desktop/my%20word/frontend/src/context/AuthContext.jsx)
Manages token refreshes, login state, user roles, Google authentication hooks, and device tracking logs.

#### [NEW] [frontend/src/components/Sidebar.jsx](file:///c:/Users/hp/Desktop/my%20word/frontend/src/components/Sidebar.jsx)
A gorgeous, modern glassmorphic sidebar featuring role-based routes, smooth expand/collapse states, and premium transitions.

#### [NEW] [frontend/src/pages/Dashboard.jsx](file:///c:/Users/hp/Desktop/my%20word/frontend/src/pages/Dashboard.jsx)
Interactive home dashboard highlighting user metrics, tasks due, upcoming brand deals, current month's earnings chart, and quick links.

#### [NEW] [frontend/src/pages/CalendarPage.jsx](file:///c:/Users/hp/Desktop/my%20word/frontend/src/pages/CalendarPage.jsx)
A drag-and-drop monthly/weekly content calendar with status badges, reminders, and filters by content platform (YouTube, TikTok, Instagram).

#### [NEW] [frontend/src/pages/BrandCRM.jsx](file:///c:/Users/hp/Desktop/my%20word/frontend/src/pages/BrandCRM.jsx)
Kanban board for brand deals, tracking through phases (Lead, Pitching, Negotiating, Contract Signed, Payment Pending, Completed).

#### [NEW] [frontend/src/pages/Earnings.jsx](file:///c:/Users/hp/Desktop/my%20word/frontend/src/pages/Earnings.jsx)
Dynamic visual dashboard displaying income breakdown, expense tracking, monthly billing reports, and revenue forecasting (Premium lock).

#### [NEW] [frontend/src/pages/TeamHub.jsx](file:///c:/Users/hp/Desktop/my%20word/frontend/src/pages/TeamHub.jsx)
Central workspace displaying active team members, assigned tasks (with deadlines), and a live real-time-like channel chat.

#### [NEW] [frontend/src/pages/Subscription.jsx](file:///c:/Users/hp/Desktop/my%20word/frontend/src/pages/Subscription.jsx)
Pricing packages page showing standard vs. premium. Integrated with a dynamic UPI Payment Modal containing a QR code for UPI ID `9771735011@mbk` and a payment UTR transaction input form.

#### [NEW] [frontend/src/pages/SuperAdmin.jsx](file:///c:/Users/hp/Desktop/my%20word/frontend/src/pages/SuperAdmin.jsx)
Super Admin panel rendering advanced charts (earnings, signup metrics), user tables (ban, suspend, view history), transaction logs (approval buttons), and support tickets.

---

## Verification Plan

### Automated Tests
We will build a simple health check command script in both frontend and backend to verify they build and start correctly:
- Run `npm run build` in the frontend directory to ensure there are no bundling or syntax errors.
- Start the server and client to confirm standard operational flow.

### Manual Verification
1. Open the application in a browser window.
2. Sign up a new user, verify email OTP simulation, log in, configure mock 2FA.
3. Test regular features: Calendar add/edit, CRM Kanban dragging, Income/Expense tracking.
4. Try to access AI tools (AI Caption Generator, AI Script Generator), which will trigger a subscription overlay prompting payment.
5. In the subscription overlay, submit a mock UPI transaction reference number.
6. Log in as an Admin (or upgrade the current user to Super Admin using a backend override or register an admin account).
7. Navigate to the Admin Dashboard, view the pending transaction, and click **Approve**.
8. Go back to the creator's session, confirm that the account has been upgraded to Premium, and verify the AI content tools are fully functional.
