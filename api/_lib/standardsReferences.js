// src/lib/standardsReferences.js — Comprehensive Bureau of Indian Standards (BIS) Regulatory Reference Registry

export const STANDARDS_REGISTRY = {
  'IS 1417:2016': {
    source: 'IS 1417:2016',
    title: 'Gold and Gold Alloys, Platings and Coatings — Fineness and Marking',
    clause: 'Clause 3.1 (Permitted Caratages) & Clause 5.2 (Fire Assay Method)',
    version: 'Fourth Revision (Reaffirmed 2022)',
    type: 'standard',
    authority: 'Bureau of Indian Standards (Ministry of Consumer Affairs, Govt. of India)',
    committee: 'MTD 10 — Precious Metals Sectional Committee',
    status: 'Mandatory in Declared Districts under Gazette S.O. 2030(E)',
    actReference: 'Sections 14, 15 & 16 of BIS Act, 2016',
    summary: 'Establishes the definitive national standard for gold purity grades, fineness tolerances, and official hallmark stamping protocols. Under this specification, sale of declared gold jewellery without the triangular BIS emblem, millesimal fineness stamp, and 6-digit alphanumeric HUID is illegal.',
    keyPoints: [
      'Strictly zero negative tolerance allowed on declared millesimal fineness (24K999, 23K958, 22K916, 20K833, 18K750, 14K585)',
      'Mandates destructive cupellation (fire assay) verification as the reference legal test method',
      'Requires laser-engraved 6-digit HUID traceable via national central portal and BIS Care App',
      'Violations subject to minimum ₹1 Lakh fine or up to 1 year imprisonment under Section 29'
    ],
    url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails',
    portalName: 'BIS Know Your Standards Portal',
  },

  'IS 2112:2014': {
    source: 'IS 2112:2014',
    title: 'Silver and Silver Alloys, Fineness and Marking — Specification',
    clause: 'Clause 4 (Purity Classes) & Clause 6 (Hallmark Application)',
    version: 'Third Revision (Reaffirmed 2020)',
    type: 'standard',
    authority: 'Bureau of Indian Standards',
    committee: 'MTD 10 — Precious Metals Sectional Committee',
    status: 'Voluntary & Certified Hallmarking Scheme',
    actReference: 'BIS (Hallmarking) Regulations 2018',
    summary: 'Specifies requirements for 6 grades of fine silver and silver alloys (999, 970, 925, 900, 835, 800) used in silverware and decorative jewellery, including chemical composition and assay testing.',
    keyPoints: [
      'Standard silver (Sterling Silver) defined strictly at 925 parts per thousand purity',
      'Assayed via gravimetric precipitation or potentiometric titration methods',
      'Laser-marked with BIS logo, purity fineness, and registered assay centre mark'
    ],
    url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails',
    portalName: 'BIS Know Your Standards Portal',
  },

  'IS 15820:2009': {
    source: 'IS 15820:2009',
    title: 'General Requirements for Competence of Assaying and Hallmarking Centres',
    clause: 'Clause 4.2 (Technical Infrastructure) & Clause 7 (Security & Traceability)',
    version: 'First Edition (Reaffirmed 2021)',
    type: 'standard',
    authority: 'Bureau of Indian Standards',
    committee: 'MTD 10 — Precious Metals Sectional Committee',
    status: 'Statutory Pre-requisite for AHC Recognition',
    actReference: 'BIS Act 2016, Regulation 5',
    summary: 'Lays down strict criteria for operating an authorized Assaying and Hallmarking Centre (AHC), ensuring tamper-proof sample receipt, fire assay laboratory competence, laser inscription security, and automatic HUID upload to the BIS server.',
    keyPoints: [
      'High-precision microbalances with readability down to 0.001 mg required',
      'Direct integration with central BIS server for instantaneous HUID generation',
      'Quarterly surveillance audit and mandatory proficiency testing round participation'
    ],
    url: 'https://www.services.bis.gov.in',
    portalName: 'BIS Manakonline AHC Portal',
  },

  'IS 14543:2016': {
    source: 'IS 14543:2016',
    title: 'Packaged Drinking Water (Other than Packaged Natural Mineral Water) — Specification',
    clause: 'Clause 3 (Hygienic Practices), Clause 4 (Microbiological) & Clause 5 (Packaging)',
    version: 'Third Revision (Amendments 1 to 4)',
    type: 'standard',
    authority: 'Bureau of Indian Standards & Food Safety and Standards Authority of India (FSSAI)',
    committee: 'FAD 14 — Drinks and Drinking Water Sectional Committee',
    status: 'Mandatory under FSSAI Regulations & BIS Act 2016',
    actReference: 'Prevention of Food Adulteration / FSS Act 2006 & BIS Act 2016',
    summary: 'Governs physical, chemical, and microbiological quality of packaged drinking water. Zero commercial distribution or sale is permitted in the territory of India without the mandatory ISI Mark CM/L license.',
    keyPoints: [
      'Mandates complete absence of coliform bacteria, E. coli, and pathogenic spores in 250 ml samples',
      'Permissible limits for total dissolved solids (TDS): 75 to 500 mg/L',
      'Batch-wise ozonation and microbiological laboratory logs must be retained for 2 years',
      'Food-grade tamper-evident packaging conforming to IS 15410 or IS 9833'
    ],
    url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails',
    portalName: 'BIS Standards Portal',
  },

  'IS 13428:2005': {
    source: 'IS 13428:2005',
    title: 'Packaged Natural Mineral Water — Specification',
    clause: 'Clause 4 (Hydrogeological Assessment) & Clause 5 (Mineral Composition)',
    version: 'Second Revision (Reaffirmed 2020)',
    type: 'standard',
    authority: 'Bureau of Indian Standards & FSSAI',
    committee: 'FAD 14 — Drinks and Drinking Water Sectional Committee',
    status: 'Mandatory ISI Certification Scheme',
    actReference: 'Gazette of India Extraordinary No. 34',
    summary: 'Specifies stringent requirements for natural mineral water obtained directly from underground sources, bottled at source under hygienic conditions with zero chemical alteration of original minerals.',
    keyPoints: [
      'Prohibits any chemical disinfection or mineral reconstitution treatments',
      'Mandates source protection radius and geological hydro-testing certification',
      'ISI Mark and FSSAI dual verification required on primary container'
    ],
    url: 'https://www.services.bis.gov.in',
    portalName: 'BIS Standards Portal',
  },

  'IS 4151:2020': {
    source: 'IS 4151:2020',
    title: 'Protective Helmets for Two-Wheeler Riders — Specification',
    clause: 'Clause 4 (Shock Absorption) & Clause 6 (Retention System Strength)',
    version: 'Fifth Revision (Amendments 1 & 2)',
    type: 'standard',
    authority: 'Bureau of Indian Standards & Ministry of Road Transport and Highways (MoRTH)',
    committee: 'TED 22 — Transport Engineering Division',
    status: 'Mandatory QCO Enforced Pan-India',
    actReference: 'Central Motor Vehicles Rules (CMVR) & BIS Act 2016',
    summary: 'Defines safety specifications, dynamic impact absorption thresholds, and chin-strap retention strength for protective helmets. Non-ISI certified two-wheeler helmets are contraband and subject to seizure.',
    keyPoints: [
      'Maximum helmet weight capped at 1.2 kg to prevent cervical spine fatigue',
      'High and low-temperature conditioning impact drop tests required',
      'Mandatory peripheral vision angle minimum 105 degrees on each side',
      'Sale of non-ISI helmets penal under Motor Vehicles Act & BIS Act'
    ],
    url: 'https://www.services.bis.gov.in',
    portalName: 'BIS Standards Portal',
  },

  'IS 9873 (Part 1):2019': {
    source: 'IS 9873 (Part 1):2019',
    title: 'Safety of Toys — Part 1: Safety Aspects Related to Mechanical and Physical Properties',
    clause: 'Clause 4 (Drop & Torque Tests) & Clause 5 (Small Parts Warning)',
    version: 'Third Revision',
    type: 'standard',
    authority: 'Bureau of Indian Standards & DPIIT',
    committee: 'PCD 12 — Toys Sectional Committee',
    status: 'Mandatory under Toys (Quality Control) Order 2020',
    actReference: 'Toys QCO 2020 via Section 16 BIS Act 2016',
    summary: 'Establishes mechanical safety parameters to protect children under 14 years from choking hazards, sharp edges, pointed wires, and projectile injuries from toys sold in India.',
    keyPoints: [
      'Small parts cylinder test: Zero small components permitted in toys meant for under 36 months',
      'Rigorous tensile, drop, and compression durability cycles before granting license',
      'Mandatory Scheme-I ISI Mark on every toy packaging unit'
    ],
    url: 'https://www.services.bis.gov.in',
    portalName: 'BIS Standards Portal',
  },

  'IS 302-2-1:2019': {
    source: 'IS 302-2-1:2019',
    title: 'Safety of Household and Similar Electrical Appliances — General Requirements',
    clause: 'Clause 8 (Electric Shock Protection) & Clause 19 (Abnormal Operation)',
    version: 'Fifth Revision',
    type: 'standard',
    authority: 'Bureau of Indian Standards',
    committee: 'ETD 02 — Electrical Appliances Sectional Committee',
    status: 'Mandatory Quality Control Order',
    actReference: 'Electrical Appliances (QCO) Order 2023',
    summary: 'Governs electrical, thermal, and mechanical safety for domestic electric appliances (heaters, irons, mixers, ovens) preventing fire risks and electrocution.',
    keyPoints: [
      'High-voltage dielectric test: Must withstand 1250V AC for 1 minute without breakdown',
      'Creepage distance and clearance gap limits strictly verified on printed circuit boards',
      'Scheme-I ISI Mark license requires comprehensive in-house safety test bench'
    ],
    url: 'https://www.services.bis.gov.in',
    portalName: 'BIS Standards Portal',
  },

  'BIS Act 2016': {
    source: 'BIS Act 2016',
    title: 'Bureau of Indian Standards Act, 2016 (Act No. 11 of 2016)',
    clause: 'Section 16 (Mandatory Standards) & Section 29 (Penal Provisions)',
    version: 'Enacted by Parliament of India',
    type: 'legislation',
    authority: 'Parliament of India / Ministry of Consumer Affairs',
    committee: 'Central Government Legislative Statute',
    status: 'Statutory Act of Parliament (Primary Legislation)',
    actReference: 'The Gazette of India Extraordinary Part II—Section 1',
    summary: 'The primary legislative act establishing BIS as the National Standards Body of India. Empowers the Central Government to notify mandatory Indian Standards through Quality Control Orders (QCOs) and prescribe severe penalties for deceptive marking.',
    keyPoints: [
      'Section 16: Central Government may mandate conformity assessment marks for health, safety, or environment',
      'Section 29: Imprisonment up to 2 years or fine not less than ₹5 Lakh for unauthorized use of BIS standard mark',
      'Section 18: Empowers inspecting officers to enter premises, search records, and seize counterfeit goods',
      'Section 31: Provides statutory power for consumer compensation in case of certified substandard goods'
    ],
    url: 'https://www.bis.gov.in/the-bureau/bis-act-rules-and-regulations/',
    portalName: 'BIS Legislative Portal',
  },

  'BIS Conformity Reg. 2018': {
    source: 'BIS Conformity Reg. 2018',
    title: 'Bureau of Indian Standards (Conformity Assessment) Regulations, 2018',
    clause: 'Regulation 7 (Scheme-I: ISI Mark) & Schedule II (Grant & Surveillance)',
    version: 'Amended 2023',
    type: 'regulation',
    authority: 'Bureau of Indian Standards',
    committee: 'Conformity Assessment Division',
    status: 'Statutory Subordinate Legislation',
    actReference: 'Section 39 of BIS Act 2016',
    summary: 'Defines the operational rules and procedures for certification schemes including Scheme-I (ISI Mark for domestic and foreign units), Scheme-II (Compulsory Registration Scheme for electronics), and surveillance audit mechanisms.',
    keyPoints: [
      'Prescribes Scheme of Inspection and Testing (SIT) to be signed and maintained by every licensee',
      'Specifies validity of license (initial 1 to 2 years, renewable up to 5 years)',
      'Establishes factory preliminary inspection procedures and testing fee formulas'
    ],
    url: 'https://www.manakonline.in',
    portalName: 'BIS Manakonline Portal',
  },

  'MSME Concession Circular': {
    source: 'MSME Concession Circular',
    title: 'Department of Consumer Affairs Circular on Concessions for MSME & Women Entrepreneurs',
    clause: 'Clause 2 (50% Minimum Marking Fee Concession) & Clause 3 (Application Fee Relief)',
    version: 'Gazette S.O. 2021 (Active)',
    type: 'circular',
    authority: 'Ministry of Consumer Affairs, Food & Public Distribution',
    committee: 'MSME Development & Ease of Doing Business Cell',
    status: 'Active Statutory Relief Policy',
    actReference: 'MSMED Act 2006 & BIS Act 2016',
    summary: 'A landmark affirmative policy reducing regulatory compliance costs for Indian micro and small manufacturing units to accelerate Make in India quality standards.',
    keyPoints: [
      '50% concession on minimum annual marking fees for Micro and Small Enterprises holding valid Udyam Registration',
      '20% concession on initial application fee and renewal documentation charges',
      'Special 10% additional concession for enterprises owned by women entrepreneurs',
      'Applicable across all Scheme-I product categories'
    ],
    url: 'https://www.services.bis.gov.in',
    portalName: 'BIS Manakonline Portal',
  },

  'BIS Citizen Charter 2024': {
    source: 'BIS Citizen Charter 2024',
    title: 'Citizen Charter of the Bureau of Indian Standards',
    clause: 'Section 3 (Standards Redressal) & Section 5 (Service Level Agreement Timelines)',
    version: '2024 Edition',
    type: 'guidelines',
    authority: 'Bureau of Indian Standards (Central Office, New Delhi)',
    committee: 'Public Grievances & Consumer Affairs Wing',
    status: 'Public Service Commitment (SLA Mandated)',
    actReference: 'Right to Public Services & BIS Act 2016',
    summary: 'Details citizen entitlements, testing standards transparency, and mandatory Service Level Agreement (SLA) timelines for consumer complaints regarding substandard products or spurious ISI markings.',
    keyPoints: [
      'Grievance Redressal SLA: Initial investigation within 15 working days; resolution within 45 days',
      'Right to testing: Citizens can submit suspected samples for subsidized testing at BIS laboratories',
      'Consumer compensation mechanism for verified hallmarking under-caratage or ISI defects'
    ],
    url: 'https://www.bis.gov.in',
    portalName: 'BIS Official Portal',
  },

  'Scheme of Inspection & Testing (SIT)': {
    source: 'Scheme of Inspection & Testing (SIT)',
    title: 'BIS Scheme of Inspection and Testing (SIT) Standard Template',
    clause: 'Clause 2 (Levels of Control), Clause 3 (Frequency) & Clause 4 (Batch Traceability)',
    version: 'Standard Edition (Current)',
    type: 'guidelines',
    authority: 'Bureau of Indian Standards — Certification Department',
    committee: 'Sectional Technical Committees',
    status: 'Binding Contractual Schedule of License',
    actReference: 'Regulation 7 of BIS Conformity Assessment Regulations 2018',
    summary: 'The technical document detailing required in-house quality control procedures, test frequencies, and rejection thresholds that a manufacturer must execute to legally imprint the ISI mark.',
    keyPoints: [
      'Defines exact batch size, sample frequency, and critical vs non-critical failure limits',
      'Requires calibration logs, raw material test certificates, and daily laboratory records',
      'Signed agreement between licensee and BIS; violations result in stop-marking orders'
    ],
    url: 'https://www.manakonline.in',
    portalName: 'Manakonline SIT Registry',
  },
}

// Helper to resolve detailed citation from partial citation object or key
export function resolveDetailedCitation(cite) {
  if (!cite) return null
  const sourceKey = typeof cite === 'string' ? cite : cite.source
  
  // Look up in registry
  const match = Object.entries(STANDARDS_REGISTRY).find(([key]) => {
    return key.toLowerCase() === sourceKey?.toLowerCase() ||
      sourceKey?.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(sourceKey?.toLowerCase())
  })

  const base = match ? match[1] : {}
  
  return {
    source: cite.source || base.source || sourceKey || 'Indian Standard Reference',
    title: cite.title || base.title || 'Official Indian Standard / Statutory Regulatory Document',
    clause: cite.clause || base.clause || 'General Conformity & Safety Requirements',
    version: cite.version || base.version || 'Current Enforceable Edition',
    type: cite.type || base.type || 'standard',
    authority: cite.authority || base.authority || 'Bureau of Indian Standards (Central Office, New Delhi)',
    committee: cite.committee || base.committee || 'Sectional Technical Standardization Committee',
    status: cite.status || base.status || 'Active & Mandatory under Indian Law',
    actReference: cite.actReference || base.actReference || 'Bureau of Indian Standards Act, 2016',
    summary: cite.summary || base.summary || 'Statutory regulatory standard and conformity assessment specification establishing mandatory quality benchmarks, test methodologies, and verification parameters approved by the Bureau of Indian Standards.',
    keyPoints: cite.keyPoints || base.keyPoints || [
      'Certified under the Bureau of Indian Standards (Conformity Assessment) Framework',
      'Requires verified compliance and batch traceability under official inspection protocols',
      'Violations subject to legal enforcement under Section 29 of the BIS Act 2016'
    ],
    url: cite.url || base.url || 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails',
    portalName: cite.portalName || base.portalName || 'BIS Official Standards Portal',
  }
}
