<div align="center">

# 🏛️ BIS Saarthi (बीआईएस सारथी) v2.0
### Next-Generation AI Regulatory Copilot, Multilingual Assistance & Compliance Intelligence Engine
**Bureau of Indian Standards (BIS) • Ministry of Consumer Affairs, Food & Public Distribution • Government of India**

[![Production Status](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-success?style=for-the-badge&logo=vercel&logoColor=white)](https://bis-saarthi-v2.vercel.app)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-Neon%20Serverless%20PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Bhashini AI](https://img.shields.io/badge/AI%20Engine-Bhashini%20MeitY%20Cloud-FF9933?style=for-the-badge&logo=air-india&logoColor=white)](https://bhashini.gov.in/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![GIGW Compliant](https://img.shields.io/badge/Compliance-GIGW%203.0%20%7C%20WCAG%202.1%20AA-138808?style=for-the-badge)]()

**[🌐 Experience Live Production Portal](https://bis-saarthi-v2.vercel.app)** • **[📖 Project Documentation](PROJECT_STRUCTURE.md)** • **[🛡️ Security Policy](SECURITY.md)**

---

</div>

## 📌 Executive Summary

**BIS Saarthi (बीआईएस सारथी) v2.0** is an enterprise-grade, sovereign AI regulatory copilot developed to bridge the information gap between the **Bureau of Indian Standards (BIS)**, Indian consumers, and MSME manufacturers. 

By integrating **Bhashini (National Language Translation Mission, MeitY)**, BIS Saarthi delivers voice-first, multimodal, and multilingual regulatory guidance in **10 Indian languages**, democratizing access to quality standards, mandatory product certifications, ISI marks, and gold hallmarking.

---

## 🌟 Core Pillars & Capabilities

### 1. 🏛️ Citizen & Consumer Protection Suite
- **ISI Mark Authenticator**: Real-time validation of CM/L licence numbers, product categories, and manufacturer authenticity.
- **HUID Gold Hallmarking Verifier**: Validation of 6-character alphanumeric Hallmark Unique Identification (HUID) codes for 14K, 18K, 20K, 22K, 23K, and 24K gold jewellery.
- **Grievance Redressal Portal**: Seamless filing of complaints against substandard goods, counterfeit ISI marks, or hallmarking fraud with live tracking.
- **BIS Care App Integration**: Deep-linked resources and guidance mirroring official national consumer utilities.

### 2. 🏭 MSME & Manufacturer Copilot
- **Conformity Assessment Navigator**: Intelligent discovery of applicable Indian Standards (IS codes) by product type, HS code, or industry vertical.
- **Step-by-Step Certification Roadmap**: Automated compliance pathways covering Schemes I (ISI Mark), II (Compulsory Registration Scheme - CRS), and IV (Foreign Manufacturers Certification Scheme - FMCS).
- **Mandatory QCO Radar**: Real-time notifications on recently gazetted Quality Control Orders (QCOs) issued by line ministries.
- **Audit & Documentation Readiness Score**: Pre-audit checklists, factory surveillance guidance, and laboratory testing protocols.

### 3. 🛡️ Super Admin Regulation Command Center
- **Targeted Notification Broadcast Console**: Broadcast urgent circulars, regulatory advisories, and enforcement updates specifically targeted to **Consumers**, **Manufacturers**, or **All Users**.
- **Visual Alert System**: Red pulsating urgency badges (`bg-red-600 animate-pulse`) for critical statutory deadlines and compliance warnings.
- **Real-Time Request Redressal Engine**: Live review, status updating (Approved / In Review / Under Investigation / Rejected), and feedback loops for grievances and certification applications.
- **Audit Log Stream**: Tamper-evident activity monitoring for administrative actions and regulatory publications.

### 4. 🌐 Sovereign Multilingual Bhashini AI Engine (MeitY)
- **Zero Client-Side Secret Exposure**: Server-side protected proxy architecture connecting to Bhashini Dhruva AI clusters.
- **Supported Languages**: English (`en`), Hindi (`hi`), Marathi (`mr`), Tamil (`ta`), Telugu (`te`), Bengali (`bn`), Gujarati (`gu`), Kannada (`kn`), Punjabi (`pa`), and Odia (`or`).
- **Cross-Lingual ASR (Speech-to-Speech & Speech-to-Text)**: Speak in any regional language; queries are transcribed and normalized into domain-specific queries.
- **Neural Text-to-Speech (TTS)**: High-fidelity natural Indian voice synthesis with phonetic pronunciation normalization for BIS domain standards (e.g., "IS 15418", "HUID", "ISI Mark").
- **Domain-Specific Technical Glossary**: Preserves standard regulatory terminology across regional dialects.

### 5. ♿ GIGW 3.0 Accessibility & Sovereign Indian Aesthetics
- **Typography Scale Controller**: Dynamic font scaling (`A-`, `A`, `A+`) anchored at the top-right header for universal accessibility.
- **High Contrast & Theme Engine**: Fully compliant with Web Content Accessibility Guidelines (WCAG 2.1 AA) and Guidelines for Indian Government Websites (GIGW 3.0).
- **Bilingual Interface Switcher**: Synchronized full-portal translation preserving layout integrity.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client ["Client Layer (React 18 + Vite)"]
        UI["Modern Sovereign UI (Tailwind CSS)"]
        SpeechModule["Web Audio & Speech Capture"]
        VoiceSynth["Voice Playback Engine"]
        StateStore["Zustand Store (Cross-Tab Realtime Sync)"]
    end

    subgraph Gateway ["Serverless Edge API Gateway (Vercel Functions)"]
        AuthRoute["/api/auth/* (JWT + bcrypt)"]
        BhashiniProxy["/api/bhashini/* (Server-Side Secret Protected)"]
        AdminRoute["/api/admin/* (RBAC Middleware)"]
    end

    subgraph AICloud ["Government of India Sovereign AI Cloud"]
        BhashiniNMT["Bhashini Translation API (NMT)"]
        BhashiniTTS["Bhashini Neural TTS Engine"]
        BhashiniASR["Bhashini Speech Recognition (ASR)"]
    end

    subgraph Storage ["Persistent State Layer"]
        NeonDB[("Neon Serverless PostgreSQL")]
        RealtimeBus["Local Storage Realtime Sync Bus"]
    end

    UI -->|HTTP / REST| Gateway
    SpeechModule -->|Base64 Audio| BhashiniProxy
    BhashiniProxy -->|TLS 1.3 / ISO 27001| AICloud
    VoiceSynth <--|Audio Buffer / Stream| BhashiniProxy
    AuthRoute --> NeonDB
    AdminRoute --> NeonDB
    StateStore <--> RealtimeBus
```

---

## 💻 Tech Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 18.3](https://react.dev/) | Component architecture with concurrent features |
| **Build Tool** | [Vite 5.4](https://vitejs.dev/) | Instant HMR and optimized Rollup production bundler |
| **Styling & Design** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Custom Indian Government color palette & responsive typography |
| **Icons & Motion** | [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) | Official UI iconography and smooth fluid animations |
| **State Management** | [Zustand 4.5](https://github.com/pmndrs/zustand) | Lightweight, reactive state management with localStorage sync |
| **Data Visualization** | [Recharts 2.12](https://recharts.org/) | Analytics dashboards, audit charts, and compliance metrics |
| **Multilingual AI** | [Bhashini Cloud](https://bhashini.gov.in/) | MeitY sovereign AI: NMT, ASR, and TTS pipelines |
| **Backend / Serverless** | [Vercel Serverless Functions](https://vercel.com/) | Edge-deployed Node.js API handlers |
| **Database** | [Neon Serverless PostgreSQL](https://neon.tech/) | Cloud-native serverless SQL database with SSL pooling |
| **Authentication** | JWT (`jsonwebtoken`) & `bcryptjs` | Secure role-based access control (Admin, Manufacturer, Consumer) |

---

## 📁 Repository Structure

```text
BIS-Saarthi-V2/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI build & verification
├── api/                         # Vercel serverless API handlers
│   ├── auth/                    # Registration, login, session validation
│   ├── bhashini/                # Protected Bhashini AI endpoints (ASR, TTS, Translate, Status)
│   ├── admin/                   # Admin user & role management endpoints
│   └── db.js                    # NeonDB serverless PostgreSQL connector
├── public/                      # Static assets & official vector emblems
├── src/
│   ├── components/
│   │   ├── chat/                # Multimodal AI chat interfaces & voice controls
│   │   ├── common/              # Protected routes, modals, loaders
│   │   ├── dashboard/           # Role-based stat widgets & request managers
│   │   ├── layout/              # TopBar, Header, Footer, Collapsible Sidebar
│   │   └── notifications/       # Live notification center with targeted filtering
│   ├── lib/                     # Constants, i18n dictionary, API client, utils
│   ├── pages/
│   │   ├── admin/               # Dashboard, Complaints, Certifications, Broadcasts, Users
│   │   ├── auth/                # Sign In, Register, Role Selector
│   │   ├── consumer/            # Dashboard, Standards, Hallmarking, Complaints, Notifications
│   │   ├── manufacturer/        # Diagnostic Chat, Certification, QCO Roadmap, Notifications
│   │   └── Home.jsx             # Official national standards landing portal
│   ├── store/                   # Zustand stores (auth, chat, settings, data)
│   ├── styles/                  # Tailwind CSS variables & global typography
│   ├── App.jsx                  # Main application orchestrator
│   └── router.jsx               # Client-side routing configuration
├── .env.example                 # Sanitized environment variable reference
├── package.json                 # Project dependencies & scripts
├── tailwind.config.js           # Custom themes & Government color tokens
├── vercel.json                  # Vercel deployment & rewrite configuration
└── vite.config.js               # Bundler configuration & chunk splitting
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Installed and configured

### 1. Clone the Repository
```bash
git clone https://github.com/Kaustubh-Barad-007/BIS-Saarthi-V2.git
cd BIS-Saarthi-V2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create your local `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Configure the following variables:
```env
# NeonDB Serverless PostgreSQL Connection
DATABASE_URL=postgresql://user:password@ep-xxx.aws.neon.tech/bisdb?sslmode=require

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000

# Bhashini AI Cloud Credentials (Server-Side Protected)
BHASHINI_USER_ID=your-bhashini-user-id
BHASHINI_API_KEY=your-bhashini-api-key
BHASHINI_INFERENCE_KEY=your-bhashini-inference-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 🔐 Security & Data Governance

- **Zero Client Credential Leakage**: All upstream API keys (Bhashini, NeonDB, JWT) reside strictly in serverless runtime environments. No private keys are baked into client-side bundles.
- **Serverless SSL Enforced**: Full end-to-end TLS 1.3 encryption across all database transactions and AI pipeline calls.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions isolating Consumer, Manufacturer, and Super Admin access domains.
- **Masked Diagnostics**: System diagnostic endpoints automatically mask credentials (e.g., `138c••••••••••026`) to protect administrative observability.

---

## 👥 Role Profiles & Demo Credentials

| Role | Default Access | Features Available |
| :--- | :--- | :--- |
| **Citizen / Consumer** | Free Public Access | ISI verification, Hallmarking checks, Complaint filing, Targeted alerts |
| **MSME / Manufacturer** | Registered Entity | Diagnostic onboarding, Certification wizard, QCO roadmaps, Document vault |
| **Super Administrator** | Authorized Official | Broadcast dispatch console, Complaint redressal, User role management |

---

## 🤝 Contributing

Contributions are welcomed! Please review our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CONTRIBUTING.md#code-of-conduct) prior to submitting pull requests.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m "feat: Add AmazingFeature"`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License & Disclaimer

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

> **Disclaimer**: *BIS Saarthi v2.0 is an advanced digital technology prototype designed in alignment with the standards and public guidelines of the Bureau of Indian Standards (Govt. of India). For formal statutory certifications, refer to official gazettes on [bis.gov.in](https://www.bis.gov.in).*

---

<div align="center">
  <sub>Developed with pride for the Bureau of Indian Standards & the Citizens of India 🇮🇳</sub>
</div>
