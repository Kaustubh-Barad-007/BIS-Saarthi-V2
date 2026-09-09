BIS-Saarthi-V2/
├── api/                          ← Vercel serverless functions
│   ├── auth/
│   │   ├── login.js              ← POST /api/auth/login
│   │   ├── register.js           ← POST /api/auth/register
│   │   ├── logout.js             ← POST /api/auth/logout
│   │   └── me.js                 ← GET  /api/auth/me
│   ├── chat/
│   │   └── query.js              ← POST /api/chat/query
│   ├── admin/
│   │   └── users.js              ← GET/PUT/DELETE /api/admin/users
│   └── db.js                     ← NeonDB connection
├── public/
│   └── bis-logo.svg              ← BIS logo
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── chat/
│   │   │   └── ChatInterface.jsx ← Full AI chat with session sidebar
│   │   ├── common/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── dashboard/
│   │   │   └── StatCard.jsx
│   │   └── layout/
│   │       ├── TopBar.jsx        ← Gov accessibility bar
│   │       ├── Header.jsx        ← BIS header with nav
│   │       ├── Footer.jsx        ← 4-col gov footer
│   │       ├── Sidebar.jsx       ← Collapsible dashboard sidebar
│   │       └── DashboardLayout.jsx
│   ├── lib/
│   │   ├── api.js                ← Axios client
│   │   ├── constants.js          ← All app constants
│   │   └── utils.js              ← Utility functions
│   ├── pages/
│   │   ├── Home.jsx              ← Government homepage
│   │   ├── auth/
│   │   │   ├── Login.jsx         ← Login with demo panel
│   │   │   └── Register.jsx      ← Multi-step registration
│   │   ├── consumer/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Standards.jsx
│   │   │   ├── Hallmarking.jsx
│   │   │   └── Complaints.jsx
│   │   ├── manufacturer/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Certification.jsx
│   │   │   ├── ComplianceRoadmap.jsx
│   │   │   └── Documents.jsx
│   │   ├── professional/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── ExportGuidance.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── UserManagement.jsx
│   │       ├── KnowledgeBase.jsx
│   │       ├── AuditLog.jsx
│   │       └── Analytics.jsx
│   ├── store/
│   │   ├── authStore.js          ← Zustand auth state
│   │   └── chatStore.js          ← Zustand chat state
│   ├── styles/
│   │   └── globals.css           ← Tailwind + CSS variables
│   ├── App.jsx
│   ├── main.jsx
│   └── router.jsx
├── .env                          ← Environment variables
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── vercel.json
