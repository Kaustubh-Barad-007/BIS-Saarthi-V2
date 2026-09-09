# Security Policy for BIS Saarthi v2.0

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

---

## Reporting a Vulnerability

The BIS Saarthi team takes the security of government and regulatory systems very seriously. If you discover a vulnerability or security issue, please disclose it responsibly.

### How to Report

- **Email**: Send details directly to `kaustubhbarad007@gmail.com` with the subject line `[SECURITY VULNERABILITY] BIS Saarthi`.
- **Do NOT** file a public GitHub issue for sensitive security vulnerabilities.

Please include:
1. Description of the vulnerability.
2. Steps or proof-of-concept to reproduce the behavior.
3. Potential impact.
4. Suggested remediation if known.

We will acknowledge receipt within 48 hours and work diligently to resolve confirmed issues.

---

## Architectural Security Measures

- **Zero Client-Side Key Exposure**: Bhashini NLP/TTS/ASR endpoints and database connection strings are strictly guarded on serverless API proxy layers (`/api/*`). No client-side bundle receives upstream credentials.
- **Serverless TLS 1.3**: All communications with upstream AI clusters (MeitY Bhashini Cloud) and NeonDB serverless PostgreSQL enforce encrypted TLS connections.
- **Input Sanitization**: User chat and form queries undergo input filtering to prevent SQL injection, XSS, and prompt injection attacks.
