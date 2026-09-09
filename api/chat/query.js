// api/chat/query.js — AI chat query endpoint
import jwt from 'jsonwebtoken'
import { getDb } from '../_lib/db.js'
import { resolveDetailedCitation } from '../_lib/standardsReferences.js'

const JWT_SECRET = process.env.JWT_SECRET || 'bis-saarthi-dev-secret-2024'

// Mock AI response generator
function generateMockResponse(content, role, language = 'en', manufacturerProfile = null) {
  const lower = content.toLowerCase()

  // Manufacturer / MSME specific intelligence
  if (role === 'manufacturer' || manufacturerProfile?.isProfileComplete) {
    const profile = manufacturerProfile || {}
    const isMicroOrSmall = profile.scale === 'micro' || profile.scale === 'small'
    const company = profile.companyName || 'Your Enterprise'
    const product = profile.productName || 'Industrial Product'
    const std = profile.isStandard || 'Indian Standard'
    const loc = profile.factoryLocation || 'Manufacturing Unit'

    if (lower.includes('fee') || lower.includes('cost') || lower.includes('concession') || lower.includes('price')) {
      return {
        content: `### Statutory Fee Structure & MSME Benefits for ${company}\n\nUnder Bureau of Indian Standards (Conformity Assessment) Regulations 2018 for **${product} (${std})**:\n\n1. **Application Fee**: ₹1,000 ${isMicroOrSmall ? '(Eligible for ₹800 after 20% MSME concession)' : ''}\n2. **Preliminary Inspection Charges**: ₹7,000 per man-day + actual travel expenses for factory verification in **${loc}**.\n3. **Annual License Fee**: ₹1,000 per operative license year.\n4. **Marking Fee Concession (Crucial for MSMEs)**:\n   - Because your enterprise is registered as an MSME, BIS grants a **50% concession on minimum annual marking fees** under Department of Consumer Affairs Notification.\n5. **Laboratory Testing Charges**: Billed at actuals based on Scheme of Inspection and Testing (SIT).\n\n*Estimated Total Initial Outlay: ₹25,000 – ₹45,000 (saves ~₹30,000+ under MSME concession).*`,
        citations: [
          { source: 'BIS Concession Circular', clause: 'MSME Benefits S.O. 2021', version: 'Active', type: 'circular' },
          { source: 'Scheme-I Fee Schedule', clause: 'Annexure A (Marking Fees)', version: '2024', type: 'standard' }
        ],
        canVerify: true,
      }
    }

    if (lower.includes('doc') || lower.includes('paper') || lower.includes('require') || lower.includes('form') || lower.includes('apply')) {
      return {
        content: `### Mandatory Documentation Checklist for ${company}\n\nTo apply for **Scheme-I ISI Mark** on the BIS Manakonline portal for **${product} (${std})**, prepare the following dossier:\n\n1. **Proof of Factory Premises & Manufacturing Address** at **${loc}**.\n2. **Udyam MSME Registration Certificate** to claim 50% marking fee discount.\n3. **Manufacturing Machinery & Installed Capacity List** for ${product}.\n4. **Scheme of Inspection and Testing (SIT) Readiness** matching ${std} clauses.\n5. **Quality Control Personnel Qualifications & Appointment Letters**.\n6. **Raw Material Test Certificates & Source Traceability**.\n\n*All files must be submitted as self-attested PDFs via [Manakonline Portal](https://www.manakonline.in).*`,
        citations: [
          { source: 'Form-1 Application Checklist', clause: 'BIS Conformity Regs', version: '2024', type: 'circular' },
          { source: std, clause: 'Section 4 - SIT Requirements', version: 'Current', type: 'standard' }
        ],
        canVerify: true,
      }
    }

    if (lower.includes('lab') || lower.includes('test') || lower.includes('sit') || lower.includes('facility')) {
      return {
        content: `### Quality Testing & Laboratory Protocol for ${product}\n\n**Governing Specification**: ${std}\n\n1. **In-House Testing Setup Requirements**:\n- Under the BIS **Scheme of Inspection and Testing (SIT)**, your manufacturing unit in **${loc}** must maintain equipment for routine batch verification.\n2. **Factory Audit & Sample Drawing**:\n- Inspecting officer draws duplicate sealed samples from commercial production for testing at nearest BIS Regional or NABL-accredited partner lab.\n3. **Critical Compliance Criteria**:\n- Negative tolerance is strictly zero for safety and critical parameters. Calibration certificates must be NABL traceable.`,
        citations: [
          { source: std, clause: 'Scheme of Inspection & Testing (SIT)', version: 'Reaffirmed', type: 'standard' },
          { source: 'NABL Directory 2024', clause: 'Accredited Lab Mapping', version: '2024', type: 'circular' }
        ],
        canVerify: true,
      }
    }

    return {
      content: `### BIS Industrial Certification Guidance for ${company}\n\nHere is your regulatory compliance summary for **${product}** under standard **${std}**:\n\n1. **Quality Order Compliance**: Complying with BIS standards is mandatory for commercial sale and government procurement (GeM Portal) across India.\n2. **50% MSME Concession**: Micro and Small enterprises receive a 50% concession on annual marking fees and 20% on application charges.\n3. **Online Filing**: Submit Form-1 on [BIS Manakonline](https://www.manakonline.in) with factory layout in **${loc}** and in-house testing logs.\n4. **Surveillance & Validity**: Initial CM/L license is granted for 1–2 years upon passing independent laboratory testing.`,
      citations: [
        { source: 'BIS Product Certification Regulations 2018', clause: 'Regulation 7', version: 'Current', type: 'regulation' },
        { source: std, clause: 'General Requirements', version: 'Latest', type: 'standard' },
      ],
      canVerify: true,
    }
  }

  if (lower.includes('hallmark') || lower.includes('gold') || lower.includes('jewel') || lower.includes('huid')) {
    return {
      content: `**Hallmarking Guidance for Gold Jewellery (IS 1417):**\n\n✅ **Mandatory from June 2021** under the BIS (Hallmarking) Regulations, 2018.\n\n**Permitted Caratages:**\n- 24K → Fineness 999/995\n- 22K → Fineness 916\n- 18K → Fineness 750\n- 14K → Fineness 585\n\n**BIS Hallmark Components (4 marks):**\n1. **BIS Logo** (triangle) — Confirms BIS assaying\n2. **Purity/Fineness** — e.g., 916 for 22K\n3. **AHC Mark** — Assaying & Hallmarking Centre code\n4. **HUID** — 6-digit alphanumeric Hallmark Unique ID\n\n**Verification:** Use BIS Care App → "Verify Hallmark" → Enter HUID\n\n**Penalty for non-compliance:** ₹1 Lakh fine or 1 year imprisonment under BIS Act 2016, Section 29.`,
      citations: [
        { source: 'IS 1417:2016', clause: 'Clause 3.1', version: 'Reaffirmed 2022', type: 'standard' },
        { source: 'BIS Hallmarking Regulations 2018', clause: 'Regulation 4', version: 'Amended June 2021', type: 'notification' },
      ],
      canVerify: true,
    }
  }

  if (lower.includes('isi') || lower.includes('certification') || lower.includes('licence') || lower.includes('license')) {
    return {
      content: `**ISI Mark Certification Process (BIS Product Certification):**\n\n**Step-by-Step Guide:**\n\n1. **Identify Applicable Standard** — Check IS catalogue at bis.gov.in\n2. **Lab Testing** — Get product tested at NABL-accredited or BIS-recognized lab\n3. **Online Application** — Apply on BIS Connect (connect.bis.gov.in)\n4. **Document Submission:**\n   - Factory registration certificate\n   - Product specifications & drawings\n   - Lab test reports (not older than 1 year)\n   - Quality control manual\n5. **Factory Inspection** — BIS officer visits manufacturing unit\n6. **Grant of License (CM/L No.)** — Valid for 1 year, renewable\n7. **Annual Surveillance** — Mandatory periodic audits\n\n**Fee Structure:** Application fee ₹1,000 + marking fee (product-wise)\n\n**Timeline:** Approximately 60–90 working days from complete application.`,
      citations: [
        { source: 'BIS Product Certification Regulations 2018', clause: 'Regulation 7', version: 'Current', type: 'regulation' },
        { source: 'IS 302-2-1:2019', clause: 'General Requirements', version: 'Amendment 2', type: 'standard' },
      ],
      canVerify: true,
    }
  }

  if (lower.includes('export') || lower.includes('qco') || lower.includes('quality control order')) {
    return {
      content: `**Quality Control Orders (QCO) — Export Compliance:**\n\nQCOs mandate BIS certification for import/manufacture of specified products.\n\n**Key Active QCOs:**\n| Sector | QCO | Effective Date |\n|--------|-----|----------------|\n| Electronics | Electronics and IT QCO 2021 | Oct 2021 |\n| Toys | Toys (Quality Control) Order 2020 | Jan 2020 |\n| Footwear | Footwear QCO 2020 | Feb 2020 |\n| Chemicals | Fertilizer QCO 2021 | Apr 2021 |\n\n**For Export:** Indian goods exported abroad must meet destination country standards. BIS has MRAs with:\n- BSI (UK), DIN (Germany), SAI Global (Australia)\n- IECEE CB Scheme for electrical products\n\n**Contact:** exportcell@bis.gov.in for export-specific certification guidance.`,
      citations: [
        { source: 'Electronics QCO 2021', clause: 'Schedule I', version: 'October 2021', type: 'notification' },
        { source: 'BIS Act 2016', clause: 'Section 16', version: 'Current', type: 'legislation' },
      ],
      canVerify: true,
    }
  }

  // Default response
  return {
    content: `Based on the **BIS Knowledge Base**, here is relevant information for your query:\n\n> "${content}"\n\n**Summary:**\nBIS (Bureau of Indian Standards) is India's National Standards Body operating under the BIS Act 2016. It develops and publishes Indian Standards (IS), operates product certification schemes (ISI Mark), and regulates precious metals hallmarking.\n\n**Key Resources:**\n- 📚 Standards catalogue: bis.gov.in/standards\n- 🏭 BIS Connect (certification): connect.bis.gov.in\n- 📱 BIS Care App: Product verification & hallmark check\n- ☎️ Helpline: 1800-11-4000 (Toll Free)\n\nFor a more specific answer, please provide:\n1. Product name or IS standard number\n2. Your specific compliance requirement\n3. State/sector if applicable`,
    citations: [
      { source: 'BIS Act 2016', clause: 'Section 2', version: 'Current', type: 'legislation' },
      { source: 'bis.gov.in', clause: 'Official Website', version: 'Live', type: 'reference' },
    ],
    canVerify: true,
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { content, sessionId, language = 'en', role = 'consumer', manufacturerProfile } = req.body || {}
  if (!content) {
    return res.status(400).json({ error: 'Query content is required' })
  }

  // Verify JWT if provided; otherwise gracefully fallback to guest user
  let user = { id: 'guest', role }
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET)
      if (decoded) user = decoded
    } catch (_) {
      // Graceful fallback to guest role
    }
  }

  try {
    // Generate response
    const effectiveRole = user.role || role || 'consumer'
    const response = generateMockResponse(content, effectiveRole, language, manufacturerProfile)
    if (response.citations) {
      response.citations = response.citations.map(resolveDetailedCitation).filter(Boolean)
    }

    // Save to DB if available
    const sql = getDb()
    if (sql && sessionId && user.id !== 'guest') {
      try {
        await sql`
          INSERT INTO chat_messages (session_id, role, content, metadata)
          VALUES (${sessionId}, 'user', ${content}, ${JSON.stringify({ language })}::jsonb)
        `
        await sql`
          INSERT INTO chat_messages (session_id, role, content, metadata)
          VALUES (${sessionId}, 'assistant', ${response.content}, ${JSON.stringify({ citations: response.citations })}::jsonb)
        `
        await sql`
          INSERT INTO audit_logs (user_id, action, resource)
          VALUES (${user.id}, 'QUERY', ${`Chat session ${sessionId}`})
        `
      } catch (_) {}
    }

    return res.status(200).json(response)
  } catch (err) {
    console.error('Chat query error:', err)
    return res.status(500).json({ error: 'Query processing failed' })
  }
}
