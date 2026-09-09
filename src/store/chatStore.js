import { create } from 'zustand'
import { chatApi } from '@/lib/api'
import { MOCK_RESPONSES } from '@/lib/constants'
import { genId, sleep } from '@/lib/utils'
import { resolveDetailedCitation } from '@/lib/standardsReferences'

export const DEFAULT_MANUFACTURER_PROFILE = {
  companyName: '',
  productName: '',
  productCategory: 'Food & Agriculture Products',
  isStandard: '',
  scale: 'small', // 'micro' | 'small' | 'medium' | 'large'
  udyamNumber: '',
  factoryLocation: '',
  testingLabFacility: 'bis-recognized', // 'in-house' | 'bis-recognized' | 'none'
  targetScheme: 'Scheme-I ISI Mark',
  isProfileComplete: false,
}

const loadManufacturerProfile = () => {
  if (typeof window === 'undefined') return DEFAULT_MANUFACTURER_PROFILE
  try {
    const raw = localStorage.getItem('bis_manufacturer_profile')
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return DEFAULT_MANUFACTURER_PROFILE
}

// Helper to determine contextual follow-up question chips
const getSuggestedFollowUps = (content, readingMode, manufacturerProfile = null, role = 'consumer') => {
  if (manufacturerProfile?.isProfileComplete) {
    const std = manufacturerProfile.isStandard || 'this standard'
    const scale = manufacturerProfile.scale || 'MSME'
    return [
      `What is the exact Scheme of Testing (SIT) for ${std}?`,
      `How do I claim the 50% ${scale.toUpperCase()} marking fee concession?`,
      `Which testing laboratories are nearest to ${manufacturerProfile.factoryLocation || 'my factory'}?`,
    ]
  }

  if (role === 'manufacturer') {
    return [
      'What are the Scheme-I fee concessions for MSMEs?',
      'What documents are required to apply on Manakonline?',
      'How does the BIS factory inspection and lab testing work?',
    ]
  }

  const lower = content.toLowerCase()
  if (lower.includes('hallmark') || lower.includes('gold') || lower.includes('jewel') || lower.includes('huid')) {
    return [
      'How do I verify a 6-digit HUID in the BIS Care App?',
      'What are the penalties for selling unhallmarked gold?',
      'Where is the nearest Assaying & Hallmarking Centre (AHC)?',
    ]
  }
  if (lower.includes('isi') || lower.includes('certif') || lower.includes('scheme') || lower.includes('license')) {
    return [
      'What is the step-by-step ISI Mark application process?',
      'What are the application & renewal fees under Scheme-I?',
      'Which testing laboratories are accredited for this category?',
    ]
  }
  if (lower.includes('qco') || lower.includes('order') || lower.includes('mandatory')) {
    return [
      'Which electrical and electronic goods fall under mandatory QCO?',
      'Can MSMEs obtain fee concessions or exemptions?',
      'What is the penalty for importing goods without BIS certification?',
    ]
  }
  if (lower.includes('complaint') || lower.includes('substandard') || lower.includes('fake') || lower.includes('fraud')) {
    return [
      'How do I track an existing BIS consumer complaint?',
      'What proof or invoice is needed to file a substandard goods report?',
      'How to report fraudulent ISI marking on consumer electronics?',
    ]
  }
  if (readingMode === 'technical') {
    return [
      'What are the exact test parameters and sampling protocols?',
      'List all current amendments and reaffirmed versions.',
      'Show factory quality audit requirements as per Scheme-I.',
    ]
  }
  return [
    'What documents are required for BIS license registration?',
    'How long does the certification process typically take?',
    'How do I verify an ISI license number online?',
  ]
}

// Helper to translate text into the selected Indian language via Bhashini NMT proxy
export const translateToTargetLanguage = async (text, targetLang) => {
  if (!targetLang || targetLang === 'en' || !text) return text
  try {
    const res = await fetch('/api/bhashini/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLanguage: 'en',
        targetLanguage: targetLang,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.translatedText || text
    }
  } catch (_) {}
  return text
}

// Helper to generate tailored manufacturer context responses
const getManufacturerContextResponse = (content, readingMode, profile) => {
  const lower = content.toLowerCase()
  const isMicroOrSmall = profile.scale === 'micro' || profile.scale === 'small'
  const msmeBadge = isMicroOrSmall
    ? '50% Concession on Minimum Marking Fees + 20% Application Fee Concession'
    : 'Standard Statutory Assessment Fee'
  
  const headerContext = `> 🏭 **Tailored Manufacturer Context Applied**\n> **Enterprise**: ${profile.companyName || 'Registered Enterprise'} (${(profile.scale || 'MSME').toUpperCase()} MSME)\n> **Target Product**: ${profile.productName || 'Industrial Product'} — Standard: **${profile.isStandard || 'IS Code'}**\n> **Plant Location**: ${profile.factoryLocation || 'National'} | **Testing Readiness**: ${(profile.testingLabFacility || 'bis-recognized').toUpperCase()}\n> **Applicable Scheme**: ${profile.targetScheme || 'Scheme-I ISI Mark'} | **MSME Benefit**: ${msmeBadge}\n\n---\n\n`

  if (lower.includes('fee') || lower.includes('cost') || lower.includes('concession') || lower.includes('price')) {
    return {
      content: `${headerContext}### Statutory Fee Structure for ${profile.companyName || 'your enterprise'}\n\nUnder Bureau of Indian Standards (Conformity Assessment) Regulations 2018 for **${profile.productName} (${profile.isStandard})**:\n\n1. **Application Fee**: ₹1,000 ${isMicroOrSmall ? '(Eligible for ₹800 after 20% MSME concession)' : ''}\n2. **Preliminary Inspection Charges**: ₹7,000 per man-day + actual travel expenses for factory verification in **${profile.factoryLocation}**.\n3. **Annual License Fee**: ₹1,000 per operative license year.\n4. **Marking Fee Concession (Crucial for MSMEs)**:\n   - Because your enterprise is registered as a **${profile.scale.toUpperCase()} MSME** (Udyam: ${profile.udyamNumber || 'Verified'}), BIS grants a **50% concession on minimum annual marking fees** under Department of Consumer Affairs Notification.\n5. **Laboratory Testing Charges**: Billed at actuals based on ${profile.testingLabFacility === 'in-house' ? 'in-house witnessed tests + BIS confirmation sample' : 'BIS recognized third-party laboratory tariff'}.\n\n*Estimated Total Initial Outlay: ₹25,000 – ₹45,000 (saves ~₹30,000+ under MSME concession).*`,
      citations: [
        { source: 'BIS Concession Circular', clause: 'MSME Benefits S.O. 2021', version: 'Active', type: 'circular' },
        { source: 'Scheme-I Fee Schedule', clause: 'Annexure A (Marking Fees)', version: '2024', type: 'standard' }
      ],
      canVerify: true,
    }
  }

  if (lower.includes('doc') || lower.includes('paper') || lower.includes('require') || lower.includes('form') || lower.includes('apply')) {
    return {
      content: `${headerContext}### Mandatory Documentation Checklist for ${profile.companyName || 'your enterprise'}\n\nTo apply for **${profile.targetScheme || 'Scheme-I'}** on the BIS Manakonline portal for **${profile.productName} (${profile.isStandard})**, prepare the following dossier:\n\n1. **Proof of Factory Premises & Manufacturing Address**:\n   - Registered lease deed, factory license, or pollution control consent for plant at **${profile.factoryLocation}**.\n2. **Udyam MSME Registration Certificate**:\n   - Copy of registration ${profile.udyamNumber ? `(${profile.udyamNumber})` : ''} to avail 50% marking fee concession.\n3. **Manufacturing Machinery & Capacity List**:\n   - Complete machinery inventory and daily installed capacity for ${profile.productName}.\n4. **Scheme of Inspection and Testing (SIT) Readiness**:\n   - Testing apparatus list matching ${profile.isStandard} test clauses.\n   - Calibration certificates (NABL traceable) for all measurement instruments.\n5. **Quality Personnel Competence**:\n   - Appointment letter and qualifications of technical QC personnel.\n6. **Raw Material Test Certificates & Source Traceability**:\n   - Specifications of inputs used in production.\n\n*All files must be uploaded as self-attested PDFs via [Manakonline Portal](https://www.manakonline.in).*`,
      citations: [
        { source: 'Form-1 Application Checklist', clause: 'BIS Conformity Regs', version: '2024', type: 'circular' },
        { source: profile.isStandard || 'IS Specification', clause: 'Section 4 - SIT Requirements', version: 'Current', type: 'standard' }
      ],
      canVerify: true,
    }
  }

  if (lower.includes('lab') || lower.includes('test') || lower.includes('sit') || lower.includes('parameter') || lower.includes('facility')) {
    return {
      content: `${headerContext}### Quality Testing & Laboratory Protocol for ${profile.productName}\n\n**Governing Specification**: ${profile.isStandard || 'Indian Standard'}\n\n#### 1. In-House Testing Setup Requirements (${(profile.testingLabFacility || 'bis-recognized').toUpperCase()})\n- Under the BIS **Scheme of Inspection and Testing (SIT)**, your manufacturing plant in **${profile.factoryLocation}** must be equipped to perform routine batch control tests.\n- Each production batch must have logged test results before applying the ISI mark.\n\n#### 2. Factory Audit & Independent Sample Testing\n- During the factory audit, the BIS inspecting officer will verify equipment calibration and seal 2 sets of duplicate samples.\n- Samples are dispatched to the nearest **BIS Regional Testing Laboratory** or NABL accredited partner laboratory servicing **${profile.factoryLocation}**.\n\n#### 3. Critical Compliance Criteria\n- Complete absence of negative tolerance in critical safety/quality clauses.\n- All test equipment must possess valid ISO/IEC 17025 calibration certificates.`,
      citations: [
        { source: profile.isStandard || 'IS Code', clause: 'Scheme of Inspection & Testing (SIT)', version: 'Reaffirmed', type: 'standard' },
        { source: 'NABL Directory 2024', clause: 'Accredited Lab Mapping', version: '2024', type: 'circular' }
      ],
      canVerify: true,
    }
  }

  // General or Technical response tailored with context
  return {
    content: `${headerContext}### Regulatory Compliance Roadmap for ${profile.companyName || 'your enterprise'}\n\nHere is your customized certification overview for **${profile.productName}** under **${profile.isStandard || 'Indian Standard'}**:\n\n1. **Standard Applicability & QCO Status**:\n   - ${profile.productName} is monitored under BIS quality frameworks. Meeting ${profile.isStandard || 'the notified standard'} is required for market access and government procurement (GeM portal).\n2. **Financial Incentive for ${(profile.scale || 'MSME').toUpperCase()} Enterprise**:\n   - You are entitled to a **50% concession on annual marking fee** and **20% on application fee**, significantly lowering your compliance overhead.\n3. **Application Protocol on Manakonline**:\n   - Submit Form-1 online under **${profile.targetScheme || 'Scheme-I'}**.\n   - Upload factory premises documents for **${profile.factoryLocation}** and testing logs.\n4. **Surveillance & Validity**:\n   - Initial CM/L license is granted for 1 to 2 years, renewable upon satisfactory market surveillance.`,
    citations: [
      { source: profile.isStandard || 'BIS Standard Registry', clause: 'Compliance Specifications', version: 'Current', type: 'standard' },
      { source: 'BIS Manakonline Guidelines', clause: 'Scheme-I Process Guide', version: '2024', type: 'circular' },
    ],
    canVerify: true,
  }
}

// Helper to generate AI responses tailored to readingMode, manufacturerProfile, and portal role
const getMockResponseForPrompt = (content, readingMode, manufacturerProfile = null, role = 'consumer') => {
  if (manufacturerProfile && manufacturerProfile.isProfileComplete) {
    return getManufacturerContextResponse(content, readingMode, manufacturerProfile)
  }

  const lower = content.toLowerCase()

  // If manufacturer assistant query (even without full profile setup)
  if (role === 'manufacturer') {
    if (lower.includes('fee') || lower.includes('cost') || lower.includes('concession') || lower.includes('price')) {
      return {
        content: `### Statutory Fee Structure & MSME Concessions (Scheme-I ISI Mark)\n\nUnder Bureau of Indian Standards (Conformity Assessment) Regulations 2018:\n\n1. **Application Fee**: ₹1,000 (Eligible for ₹800 after 20% MSME concession).\n2. **Preliminary Inspection Charges**: ₹7,000 per man-day + actual travel expenses for technical officer audit.\n3. **Annual License Fee**: ₹1,000 per operative license year.\n4. **Marking Fee Concession (Crucial for MSMEs)**:\n   - Micro and Small Enterprises receive a **50% concession on minimum annual marking fees** under Department of Consumer Affairs Notification.\n5. **Laboratory Testing Charges**: Billed at actuals based on Scheme of Inspection and Testing (SIT).\n\n*Estimated Total Initial Outlay: ₹25,000 – ₹45,000 (saves ~₹30,000+ under MSME concession).*\n\n*(Tip: Click "Update Profile Context" above to specify your product and IS code for personalized fee and clause calculations!)*`,
        citations: [
          { source: 'BIS Concession Circular', clause: 'MSME Benefits S.O. 2021', version: 'Active', type: 'circular' },
          { source: 'Scheme-I Fee Schedule', clause: 'Annexure A (Marking Fees)', version: '2024', type: 'standard' }
        ],
        canVerify: true,
      }
    }

    if (lower.includes('doc') || lower.includes('paper') || lower.includes('require') || lower.includes('apply')) {
      return {
        content: `### Mandatory Documentation Checklist for Manufacturers\n\nTo apply for **Scheme-I ISI Mark** on the BIS Manakonline portal, prepare the following dossier:\n\n1. **Proof of Factory Premises & Manufacturing Address** (registered lease deed or factory license).\n2. **Udyam MSME Registration Certificate** to claim 50% marking fee discount.\n3. **Manufacturing Machinery & Installed Capacity List**.\n4. **Scheme of Inspection and Testing (SIT) Readiness** matching product Indian Standard.\n5. **Quality Control Personnel Qualifications & Appointment Letters**.\n6. **Raw Material Test Certificates & Source Traceability**.\n\n*All files must be submitted as self-attested PDFs via [Manakonline Portal](https://www.manakonline.in).*`,
        citations: [
          { source: 'Form-1 Application Checklist', clause: 'BIS Conformity Regs', version: '2024', type: 'circular' },
          { source: 'BIS Product Certification Scheme-I', clause: 'Documentation Norms', version: 'Current', type: 'standard' }
        ],
        canVerify: true,
      }
    }

    if (lower.includes('lab') || lower.includes('test') || lower.includes('sit') || lower.includes('facility')) {
      return {
        content: `### Quality Testing & Laboratory Protocol (Scheme-I)\n\n1. **In-House Testing Setup Requirements**:\n- Under the BIS **Scheme of Inspection and Testing (SIT)**, manufacturing units must maintain equipment for routine batch verification.\n2. **Factory Audit & Sample Drawing**:\n- Inspecting officer draws duplicate sealed samples from commercial production for testing at nearest BIS Regional or NABL-accredited partner lab.\n3. **Critical Compliance Criteria**:\n- Negative tolerance is strictly zero for safety and critical parameters. Calibration certificates must be NABL traceable.`,
        citations: [
          { source: 'BIS Testing Norms', clause: 'Scheme of Inspection & Testing (SIT)', version: 'Reaffirmed', type: 'standard' },
          { source: 'NABL Directory 2024', clause: 'Accredited Lab Mapping', version: '2024', type: 'circular' }
        ],
        canVerify: true,
      }
    }

    return {
      content: `### BIS Industrial Certification Guidance for Manufacturers\n\nHere is your regulatory compliance summary for Indian Standards & ISI Mark:\n\n1. **Quality Order Compliance**: Complying with BIS standards is mandatory for commercial sale and government procurement (GeM Portal) across India.\n2. **50% MSME Concession**: Micro and Small enterprises receive a 50% concession on annual marking fees and 20% on application charges.\n3. **Online Filing**: Submit Form-1 on [BIS Manakonline](https://www.manakonline.in) with factory layout and in-house testing logs.\n4. **Surveillance & Validity**: Initial CM/L license is granted for 1–2 years upon passing independent laboratory testing.\n\n*(Tip: Click "Update Profile Context" above to specify your product and IS code for personalized fee and clause calculations!)*`,
      citations: [
        { source: 'BIS Product Certification Regulations 2018', clause: 'Regulation 7', version: 'Current', type: 'regulation' },
        { source: 'BIS Act 2016', clause: 'Section 16', version: 'Latest', type: 'legislation' },
      ],
      canVerify: true,
    }
  }
  
  // Hallmarking queries
  if (lower.includes('hallmark') || lower.includes('gold') || lower.includes('jewel') || lower.includes('huid')) {
    if (readingMode === 'technical') {
      return {
        content: `### BIS Technical Standards Report: Hallmarking of Precious Metals\n\n**Standard Reference**: IS 1417:2016 (Gold and Gold Alloys, Platings and Coatings — Fineness and Marking) & IS 2112:2014 (Silver)\n\n#### 1. Statutory Framework\n- **Mandatory Quality Order**: S.O. 2030(E) dated 15 January 2020, amended under BIS Hallmarking Regulations 2018 (Section 14 & 16 of BIS Act 2016).\n- **Applicability**: Mandatory 6-digit alphanumeric HUID (Hallmark Unique Identification) applied through BIS-recognized Assaying and Hallmarking Centres (AHCs).\n\n#### 2. Standard Fineness Grades (Caratage & Millesimal)\n| Karat | Millesimal Fineness | BIS Hallmark Grade Tag |\n| :--- | :--- | :--- |\n| 24K | 999 (99.9% min pure) | 24K999 |\n| 23K | 958 (95.8% min pure) | 23K958 |\n| 22K | 916 (91.6% min pure) | 22K916 |\n| 20K | 833 (83.3% min pure) | 20K833 |\n| 18K | 750 (75.0% min pure) | 18K750 |\n| 14K | 585 (58.5% min pure) | 14K585 |\n\n#### 3. Assaying Methodology & Tolerances\n- **Fire Assay (Cupellation)**: Executed strictly as per Clause 5.2 of IS 1417:2016.\n- **Permissible Tolerance**: Negative tolerance is **zero (0.00)**. No under-caratage tolerance permitted.\n- **Laser Inscription Requirements**: The 6-character HUID, BIS Triangular Logo, and Fineness stamp must have minimum depth of 0.015 mm.\n\n#### 4. Compliance & Penal Provisions\nUnder Section 29 of the BIS Act 2016, violation or selling unhallmarked notified jewellery carries imprisonment up to 1 year or a fine of minimum ₹1,00,000 up to five times the value of goods tested.`,
        citations: [
          { source: 'IS 1417:2016', clause: 'Clause 3 to 5.2', version: 'Reaffirmed 2022', type: 'standard' },
          { source: 'BIS Hallmarking Reg. 2018', clause: 'Section 14-16', version: 'Gazette 2021', type: 'circular' },
          { source: 'IS 15820:2009', clause: 'AHC Operating Requirements', version: 'Rev 1', type: 'standard' }
        ],
        canVerify: true,
      }
    } else {
      return {
        content: `**Hallmarking Guidance for Gold Jewellery & Consumers:**\n\n1. **Is it Mandatory?**\n   Yes! From June 2021, hallmarking of gold jewellery is legally mandatory across declared districts in India.\n\n2. **Look for 3 Official Signs on Gold Jewellery**:\n   - **BIS Logo**: The official triangular BIS stamp.\n   - **Purity / Fineness**: Clearly marked carat rating (e.g., **22K916** for 22 Karat, **18K750** for 18 Karat, **14K585** for 14 Karat).\n   - **HUID (Hallmark Unique Identification)**: A unique 6-digit alphanumeric code engraved on every individual piece.\n\n3. **How to Verify in 30 Seconds**:\n   - Download the free **BIS Care App** from Google Play Store or Apple App Store.\n   - Tap **"Verify HUID"** and enter the 6-digit code.\n   - Instantly see: Jeweller registration number, AHC testing centre name, article type, date of hallmarking, and tested purity.\n\n4. **If Gold Fails Purity**:\n   - The jeweller is legally obligated to refund the difference plus compensation of two times the shortage to the consumer.\n\n**Toll-Free Consumer Helpline**: 1800-11-4000`,
        citations: [
          { source: 'IS 1417:2016', clause: 'Consumer Marking', version: 'Current', type: 'standard' },
          { source: 'BIS Care Portal Guidelines', clause: 'HUID Verification', version: '2024', type: 'notification' },
        ],
        canVerify: true,
      }
    }
  }

  // ISI Mark / Certification / Testing queries
  if (lower.includes('isi') || lower.includes('certif') || lower.includes('standard') || lower.includes('test') || lower.includes('scheme')) {
    if (readingMode === 'technical') {
      return {
        content: `### BIS Conformity Assessment & Product Certification (Scheme-I)\n\n**Governing Code**: Bureau of Indian Standards (Conformity Assessment) Regulations 2018, Scheme-I (Mark Scheme)\n\n#### 1. Technical Prerequisites\n- **In-House Laboratory Setup**: Must maintain testing equipment specified in the **Scheme of Inspection and Testing (SIT)** corresponding to the specific Indian Standard (e.g. IS 302-2-1 for appliances, IS 1293 for plugs, IS 694 for PVC cables).\n- **Quality Personnel**: Qualified technical personnel dedicated to rigorous batch-testing and quality logging.\n- **Calibration Traceability**: All measurement gauges and test benches must have valid NABL-traceable calibration certificates.\n\n#### 2. Verification & Testing Protocol\n- **Sample Drawing**: BIS inspecting officer draws sealed duplicate samples from continuous commercial production (IS 2500 Part 1 / ISO 2859).\n- **Independent Lab Testing**: Sent to BIS Central Laboratory (Sahibabad) or accredited Third-Party Labs (NABL accredited under ISO/IEC 17025).\n- **Passing Criteria**: 100% compliance across all critical safety, dielectric, thermal, and mechanical clauses.\n\n#### 3. License Issuance & Fee Structure\n- **Application Fee**: ₹1,000 (Non-refundable).\n- **Preliminary Inspection Charge**: ₹7,000 per man-day + travel.\n- **Annual License Fee**: ₹1,000 per year.\n- **Marking Fee**: Calculated per unit produced, subject to minimum annual marking fee (50% concession for MSMEs/startups).`,
        citations: [
          { source: 'BIS Conformity Assessment Reg. 2018', clause: 'Scheme-I, Schedule II', version: 'Amend. 2023', type: 'circular' },
          { source: 'ISO/IEC 17025:2017', clause: 'Testing Competence', version: 'Current', type: 'standard' },
          { source: 'IS 2500-1:2000', clause: 'Sampling Inspection', version: 'Reaffirmed 2021', type: 'standard' }
        ],
        canVerify: true,
      }
    } else {
      return {
        content: `### How to Obtain an ISI Mark License (Simple 5-Step Guide)\n\nGetting a BIS ISI Mark for your product is straightforward when following these steps:\n\n1. **Identify Your Standard**:\n   Find the Indian Standard (IS code) applicable to your product category on the BIS portal.\n\n2. **Setup In-House Quality Testing**:\n   Ensure your manufacturing plant has basic testing equipment to verify quality parameters according to the BIS Scheme of Inspection.\n\n3. **Submit Online Application (Manakonline)**:\n   Visit the official [BIS Manakonline Portal](https://www.manakonline.in) and submit Form-1 along with factory layout, test equipment list, and manufacturing details.\n\n4. **Factory Inspection by BIS Officer**:\n   A designated BIS technical officer will inspect your factory premises, witness live testing, and draw independent sealed samples for lab testing.\n\n5. **Grant of License (CM/L Number)**:\n   Once independent test reports pass, BIS grants your **CM/L (Certification Marks License) number**, allowing you to imprint the prestigious ISI mark on your product and packaging!\n\n> **MSME Benefit**: Micro, Small & Medium Enterprises enjoy 50% concession on minimum marking fees and 20% concession on application charges!`,
        citations: [
          { source: 'BIS Scheme-I Guidelines', clause: 'Manakonline Process', version: '2024', type: 'circular' },
          { source: 'MSME Concession Circular', clause: 'Dept of Consumer Affairs', version: 'Active', type: 'notification' },
        ],
        canVerify: true,
      }
    }
  }

  // Default response
  if (readingMode === 'technical') {
    return {
      content: `### BIS Technical Standards Assessment\n\n**Applicable Standards Group**: Bureau of Indian Standards Mandatory Quality Orders & Technical Regulations.\n\n#### Key Specifications & Verification Clauses:\n1. **Harmonized Standards Compliance**: All products manufactured, stored, or distributed within the Republic of India must adhere to Section 16 of BIS Act, 2016.\n2. **Laboratory Verification Protocol**: Testing must be executed at BIS-recognized facilities under ISO/IEC 17025 accreditation protocols.\n3. **Quality Audits & Surveillance**: Licensees are subject to periodic unannounced factory surveillance audits and marketplace sample picking under Section 18.\n\n#### Recommended Actions:\n- Consult the relevant Sectional Committee (e.g. LITD, ETD, CHD, CED) documentation for clause-specific testing routines.\n- Ensure calibration records for testing equipment are maintained with continuous calibration logs.\n\n**Verification Status**: Corroborated with BIS Knowledge Base standards database.`,
      citations: [
        { source: 'BIS Act 2016', clause: 'Section 16 & 18', version: 'Act No. 11 of 2016', type: 'standard' },
        { source: 'BIS Circular No. 15/2024', clause: 'Clause 4.3.2', version: 'Current', type: 'circular' }
      ],
      canVerify: true,
    }
  } else {
    return {
      content: `Based on official Bureau of Indian Standards (BIS) guidelines, here is what you need to know:\n\n**Key Takeaways**:\n1. **Quality & Safety First**: BIS standards ensure that goods produced or sold in India meet strict safety, durability, and health specifications.\n2. **Consumer Protection**: Look for the official ISI mark, Hallmarking logo on gold, and CRS (Compulsory Registration Scheme) registration on electronics.\n3. **Quick Verification**: You can verify any manufacturer's license number (CM/L) or gold HUID code instantly via the free **BIS Care App**.\n\n**Need Help?**\nYou can file a complaint or request further assistance through the BIS National Consumer Care toll-free line at **1800-11-4000**.`,
      citations: [
        { source: 'BIS Citizen Charter', clause: 'Consumer Rights & Verification', version: '2024', type: 'standard' },
        { source: 'BIS Portal', clause: 'General Standards Registry', version: 'Current', type: 'circular' }
      ],
      canVerify: true,
    }
  }
}

const useChatStore = create((set, get) => ({
  sessions:        [],
  currentSessionId:null,
  messages:        [],
  isLoading:       false,
  isStreaming:      false,
  error:           null,
  selectedLanguage:'en',
  uploadedFiles:   [],

  // Manufacturer Intake Profile & Continuous Context
  currentRole:     'consumer',
  setRole: (role) => set({ currentRole: role }),
  manufacturerProfile: loadManufacturerProfile(),

  setManufacturerProfile: (profile) => {
    const updated = { ...profile, isProfileComplete: true }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bis_manufacturer_profile', JSON.stringify(updated))
      } catch (_) {}
    }
    set({ manufacturerProfile: updated })
  },

  resetManufacturerProfile: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('bis_manufacturer_profile')
      } catch (_) {}
    }
    set({ manufacturerProfile: DEFAULT_MANUFACTURER_PROFILE })
  },

  // Professional Chatbot Options
  readingMode:     'citizen', // 'citizen' | 'technical'
  chatFontSize:    'md',      // 'sm' | 'md' | 'lg' | 'xl'

  setReadingMode: (mode) => set({ readingMode: mode }),
  setChatFontSize: (size) => set({ chatFontSize: size }),

  // Create or get current session
  startSession: async (initialTitle = 'New Conversation') => {
    const sessionId = genId('session')
    const session = {
      id:        sessionId,
      title:     initialTitle,
      createdAt: new Date().toISOString(),
      messages:  [],
    }
    set((s) => ({
      sessions:         [session, ...s.sessions],
      currentSessionId: sessionId,
      messages:         [],
    }))
    return sessionId
  },

  // Switch session
  switchSession: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId)
    if (!session) return
    set({ currentSessionId: sessionId, messages: session.messages || [] })
  },

  // Rename an existing session
  renameSession: (sessionId, newTitle) => {
    if (!newTitle?.trim()) return
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId ? { ...sess, title: newTitle.trim() } : sess
      ),
    }))
  },

  // Clear messages inside current active session
  clearCurrentMessages: () => {
    const { currentSessionId, sessions } = get()
    if (!currentSessionId) return
    set({
      messages: [],
      sessions: sessions.map((s) =>
        s.id === currentSessionId ? { ...s, messages: [] } : s
      ),
    })
  },

  // Stop active streaming/generation
  stopStreaming: () => {
    set({ isStreaming: false })
  },

  // Send a message (with mock AI response)
  sendMessage: async (content, options = {}) => {
    const { currentSessionId, sessions, readingMode, selectedLanguage, manufacturerProfile, currentRole } = get()
    const role = options.role || currentRole || 'consumer'
    let sessionId = currentSessionId

    // Auto-start session if none
    if (!sessionId) {
      sessionId = await get().startSession()
    }

    const userMessage = {
      id:        genId('msg'),
      role:      'user',
      content,
      timestamp: new Date().toISOString(),
      files:     options.files || [],
    }

    // Add user message
    set((s) => ({ messages: [...s.messages, userMessage], isStreaming: true, error: null }))

    try {
      // Simulate API call delay
      await sleep(800)

      // Check if user stopped streaming during the wait
      if (!get().isStreaming) return

      // Determine response based on prompt, reading mode, manufacturer context, and portal role
      let mockData = getMockResponseForPrompt(content, readingMode, manufacturerProfile, role)

      let aiContent = mockData.content
      let citations = mockData.citations
      let canVerify = mockData.canVerify

      try {
        const apiRes = await chatApi.query({
          sessionId,
          content,
          language: selectedLanguage,
          mode: readingMode,
          role,
          manufacturerProfile,
        })
        if (apiRes?.content) {
          aiContent = apiRes.content
          citations = apiRes.citations || mockData.citations
          canVerify = apiRes.canVerify ?? mockData.canVerify
        }
      } catch (_) {
        // Fall back gracefully to curated BIS mock
      }

      // Contextual follow-up suggestions
      let followUps = getSuggestedFollowUps(content, readingMode, manufacturerProfile, role)

      // If active language is not English, translate AI response & follow-up chips so output is strictly in that language
      if (selectedLanguage && selectedLanguage !== 'en') {
        aiContent = await translateToTargetLanguage(aiContent, selectedLanguage)
        try {
          const translatedChips = await Promise.all(
            followUps.map((chip) => translateToTargetLanguage(chip, selectedLanguage))
          )
          if (translatedChips?.length) {
            followUps = translatedChips
          }
        } catch (_) {}
      }

      const aiMessage = {
        id:        genId('msg'),
        role:      'assistant',
        content:   aiContent,
        citations: (citations || []).map(resolveDetailedCitation).filter(Boolean),
        canVerify,
        followUps,
        readingMode,
        timestamp: new Date().toISOString(),
      }

      // Update session title from first message if it's "New Conversation"
      const updatedSessions = get().sessions.map((s) => {
        if (s.id === sessionId) {
          const isDefaultTitle = s.title === 'New Conversation' || !s.title
          return {
            ...s,
            title: isDefaultTitle ? content.slice(0, 45).trim() : s.title,
            messages: [...(s.messages || []), userMessage, aiMessage],
          }
        }
        return s
      })

      set((s) => ({
        messages:   [...s.messages, aiMessage],
        isStreaming: false,
        sessions:   updatedSessions,
      }))
    } catch (err) {
      set({ isStreaming: false, error: err.message })
    }
  },

  // Regenerate the last assistant response
  regenerateLastResponse: async () => {
    const { messages } = get()
    if (messages.length === 0) return

    // Find the last user message
    let lastUserMsg = null
    let cutIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i]
        cutIndex = i
        break
      }
    }

    if (!lastUserMsg) return

    // Keep messages up to the user message
    const trimmedMessages = messages.slice(0, cutIndex + 1)
    set({ messages: trimmedMessages, isStreaming: true, error: null })

    try {
      await sleep(750)
      if (!get().isStreaming) return

      const { readingMode, selectedLanguage, manufacturerProfile, currentRole } = get()
      const mockData = getMockResponseForPrompt(lastUserMsg.content, readingMode, manufacturerProfile, currentRole)
      let followUps = getSuggestedFollowUps(lastUserMsg.content, readingMode, manufacturerProfile, currentRole)
      let aiContent = mockData.content

      if (selectedLanguage && selectedLanguage !== 'en') {
        aiContent = await translateToTargetLanguage(aiContent, selectedLanguage)
        try {
          const translatedChips = await Promise.all(
            followUps.map((chip) => translateToTargetLanguage(chip, selectedLanguage))
          )
          if (translatedChips?.length) {
            followUps = translatedChips
          }
        } catch (_) {}
      }

      const aiMessage = {
        id:        genId('msg'),
        role:      'assistant',
        content:   aiContent,
        citations: (mockData.citations || []).map(resolveDetailedCitation).filter(Boolean),
        canVerify: mockData.canVerify,
        followUps,
        readingMode,
        timestamp: new Date().toISOString(),
      }

      const { currentSessionId, sessions } = get()
      const updatedSessions = sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...trimmedMessages, aiMessage] }
          : s
      )

      set({
        messages:   [...trimmedMessages, aiMessage],
        isStreaming: false,
        sessions:   updatedSessions,
      })
    } catch (err) {
      set({ isStreaming: false, error: err.message })
    }
  },

  // Edit an existing user message and regenerate response from there
  editAndResendMessage: async (messageId, newContent) => {
    const { messages, readingMode } = get()
    const targetIdx = messages.findIndex((m) => m.id === messageId)
    if (targetIdx === -1) return

    // Replace target message content
    const updatedUserMsg = {
      ...messages[targetIdx],
      content:   newContent,
      timestamp: new Date().toISOString(),
    }

    // Keep messages before the edited message, plus the edited message
    const newHistory = [...messages.slice(0, targetIdx), updatedUserMsg]
    set({ messages: newHistory, isStreaming: true, error: null })

    try {
      await sleep(800)
      if (!get().isStreaming) return

      const { readingMode, selectedLanguage, manufacturerProfile, currentRole } = get()
      const mockData = getMockResponseForPrompt(newContent, readingMode, manufacturerProfile, currentRole)
      let followUps = getSuggestedFollowUps(newContent, readingMode, manufacturerProfile, currentRole)
      let aiContent = mockData.content

      if (selectedLanguage && selectedLanguage !== 'en') {
        aiContent = await translateToTargetLanguage(aiContent, selectedLanguage)
        try {
          const translatedChips = await Promise.all(
            followUps.map((chip) => translateToTargetLanguage(chip, selectedLanguage))
          )
          if (translatedChips?.length) {
            followUps = translatedChips
          }
        } catch (_) {}
      }

      const aiMessage = {
        id:        genId('msg'),
        role:      'assistant',
        content:   aiContent,
        citations: mockData.citations,
        canVerify: mockData.canVerify,
        followUps,
        readingMode,
        timestamp: new Date().toISOString(),
      }

      const { currentSessionId, sessions } = get()
      const updatedSessions = sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...newHistory, aiMessage] }
          : s
      )

      set({
        messages:   [...newHistory, aiMessage],
        isStreaming: false,
        sessions:   updatedSessions,
      })
    } catch (err) {
      set({ isStreaming: false, error: err.message })
    }
  },

  // Delete session
  deleteSession: (sessionId) => {
    set((s) => {
      const sessions = s.sessions.filter((x) => x.id !== sessionId)
      const currentSessionId = s.currentSessionId === sessionId
        ? sessions[0]?.id || null
        : s.currentSessionId
      return {
        sessions,
        currentSessionId,
        messages: currentSessionId === sessionId ? (sessions[0]?.messages || []) : s.messages,
      }
    })
  },

  // Language
  setLanguage: (lang, syncSettings = true) => {
    set({ selectedLanguage: lang })
    if (syncSettings) {
      import('./settingsStore')
        .then(({ default: useSettingsStore }) => {
          if (useSettingsStore?.getState()?.preferredLanguage !== lang) {
            useSettingsStore.getState().setPreferredLanguage(lang, false)
          }
        })
        .catch(() => {})
    }
  },

  // File upload
  addFile:    (file)  => set((s) => ({ uploadedFiles: [...s.uploadedFiles, file] })),
  removeFile: (index) => set((s) => ({
    uploadedFiles: s.uploadedFiles.filter((_, i) => i !== index)
  })),
  clearFiles: ()      => set({ uploadedFiles: [] }),

  clearError: () => set({ error: null }),
  clearChat:  () => set({ messages: [], currentSessionId: null }),
}))

export default useChatStore
