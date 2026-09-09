# Contributing to BIS Saarthi (बीआईएस सारथी) v2.0

Thank you for your interest in contributing to **BIS Saarthi**, the official next-generation AI Regulatory & Compliance Intelligence Copilot for the Bureau of Indian Standards (Govt. of India).

We welcome contributions from developers, researchers, standardization experts, and open-source advocates.

---

## 🏛️ Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment. All contributors and participants are expected to adhere to standard professional conduct and treat fellow collaborators with respect.

---

## 🛠️ Development Workflow

### 1. Fork & Clone
```bash
git clone https://github.com/Kaustubh-Barad-007/BIS-Saarthi-V2.git
cd BIS-Saarthi-V2
```

### 2. Install Dependencies
Ensure you have Node.js 18+ installed.
```bash
npm install
```

### 3. Environment Setup
Copy the sample environment file and configure local credentials:
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
npm run dev
```

The application will start locally at `http://localhost:5173`.

---

## 🌿 Branching Strategy & Git Guidelines

- **Branch Naming**:
  - `feat/feature-name` for new capabilities
  - `fix/bug-fix-name` for bug fixes
  - `docs/documentation-update` for documentation changes
  - `perf/optimization` for performance improvements

- **Commit Messages**:
  Follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:
  ```text
  feat: add cross-lingual voice synthesis support
  fix: correct unread notification badge pulsing color
  docs: update architecture schema diagram
  perf: split chart library into vendor chunk
  ```

---

## 🧪 Verification Before Submitting PR

Before pushing your branch or submitting a pull request, run:
```bash
# Verify production build compilation
npm run build
```

Ensure that:
- No hardcoded secrets, API tokens, or credentials are committed.
- Build completes with zero syntax or bundling errors.
- Any new features adhere to GIGW accessibility standards.

---

## 📬 Submitting a Pull Request (PR)

1. Push your changes to your fork.
2. Open a Pull Request against the `main` branch of `Kaustubh-Barad-007/BIS-Saarthi-V2`.
3. Provide a clear, descriptive title and description summarizing your changes and linking any relevant issue.
4. The CI pipeline will automatically build and verify your contribution.

---

Thank you for helping build India's premier standards and compliance AI assistant!
