// ============================================================
// BIS Saarthi — Application Constants
// ============================================================

// User Roles
export const ROLES = {
  CONSUMER:     'consumer',
  MANUFACTURER: 'manufacturer',
  ADMIN:        'admin',
}

// Demo Credentials
export const DEMO_CREDENTIALS = [
  {
    role:     ROLES.CONSUMER,
    label:    'Consumer (General Public)',
    email:    'consumer@bis.gov.in',
    password: 'Consumer@123',
    color:    'blue',
    icon:     'User',
  },
  {
    role:     ROLES.MANUFACTURER,
    label:    'MSME / Manufacturer',
    email:    'msme@bis.gov.in',
    password: 'Msme@123',
    color:    'orange',
    icon:     'Building2',
  },
  {
    role:     ROLES.ADMIN,
    label:    'BIS Admin (Official)',
    email:    'admin@bis.gov.in',
    password: 'Admin@123',
    color:    'red',
    icon:     'Shield',
  },
]

// Routes
export const ROUTES = {
  HOME:        '/',
  LOGIN:       '/login',
  REGISTER:    '/register',

  // Consumer
  CONSUMER_DASHBOARD:     '/consumer/dashboard',
  CONSUMER_CHAT:          '/consumer/chat',
  CONSUMER_STANDARDS:     '/consumer/standards',
  CONSUMER_HALLMARKING:   '/consumer/hallmarking',
  CONSUMER_COMPLAINTS:    '/consumer/complaints',
  CONSUMER_NOTIFICATIONS: '/consumer/notifications',

  // Manufacturer
  MANUFACTURER_DASHBOARD:      '/manufacturer/dashboard',
  MANUFACTURER_CHAT:           '/manufacturer/chat',
  MANUFACTURER_CERTIFICATION:  '/manufacturer/certification',
  MANUFACTURER_COMPLIANCE:     '/manufacturer/compliance-roadmap',
  MANUFACTURER_DOCUMENTS:      '/manufacturer/documents',
  MANUFACTURER_NOTIFICATIONS:  '/manufacturer/notifications',

  // Admin
  ADMIN_DASHBOARD:      '/admin/dashboard',
  ADMIN_NOTIFICATIONS:  '/admin/notifications',
  ADMIN_COMPLAINTS:     '/admin/complaints',
  ADMIN_CERTIFICATIONS: '/admin/certifications',
  ADMIN_USERS:          '/admin/users',
  ADMIN_KNOWLEDGE:      '/admin/knowledge-base',
  ADMIN_AUDIT:          '/admin/audit-log',
  ADMIN_ANALYTICS:      '/admin/analytics',

  // Common Settings Portal
  SETTINGS:           '/settings',
}

// Dashboard routes by role
export const DASHBOARD_BY_ROLE = {
  [ROLES.CONSUMER]:     ROUTES.CONSUMER_DASHBOARD,
  [ROLES.MANUFACTURER]: ROUTES.MANUFACTURER_DASHBOARD,
  [ROLES.ADMIN]:        ROUTES.ADMIN_DASHBOARD,
}

// Nav items by role
export const SIDEBAR_NAV = {
  [ROLES.CONSUMER]: [
    { label: 'Dashboard',     path: ROUTES.CONSUMER_DASHBOARD,     icon: 'LayoutDashboard' },
    { label: 'BIS Saarthi AI',path: ROUTES.CONSUMER_CHAT,          icon: 'MessageSquare' },
    { label: 'Standards',     path: ROUTES.CONSUMER_STANDARDS,     icon: 'BookOpen' },
    { label: 'Hallmarking',   path: ROUTES.CONSUMER_HALLMARKING,   icon: 'Award' },
    { label: 'Complaints',    path: ROUTES.CONSUMER_COMPLAINTS,    icon: 'AlertTriangle' },
    { label: 'Notifications', path: ROUTES.CONSUMER_NOTIFICATIONS, icon: 'Bell' },
  ],
  [ROLES.MANUFACTURER]: [
    { label: 'Dashboard',         path: ROUTES.MANUFACTURER_DASHBOARD,      icon: 'LayoutDashboard' },
    { label: 'BIS Saarthi AI',    path: ROUTES.MANUFACTURER_CHAT,           icon: 'MessageSquare' },
    { label: 'Certifications',    path: ROUTES.MANUFACTURER_CERTIFICATION,   icon: 'BadgeCheck' },
    { label: 'Compliance Roadmap',path: ROUTES.MANUFACTURER_COMPLIANCE,      icon: 'Map' },
    { label: 'Documents',         path: ROUTES.MANUFACTURER_DOCUMENTS,       icon: 'FileText' },
    { label: 'Notifications',     path: ROUTES.MANUFACTURER_NOTIFICATIONS,   icon: 'Bell' },
  ],
  [ROLES.ADMIN]: [
    { label: 'Dashboard',      path: ROUTES.ADMIN_DASHBOARD,      icon: 'LayoutDashboard' },
    { label: 'Broadcasts',     path: ROUTES.ADMIN_NOTIFICATIONS,  icon: 'Radio' },
    { label: 'Complaints',     path: ROUTES.ADMIN_COMPLAINTS,     icon: 'AlertTriangle' },
    { label: 'Certifications', path: ROUTES.ADMIN_CERTIFICATIONS, icon: 'BadgeCheck' },
    { label: 'User Management',path: ROUTES.ADMIN_USERS,          icon: 'Users' },
    { label: 'Knowledge Base', path: ROUTES.ADMIN_KNOWLEDGE,      icon: 'Database' },
    { label: 'Audit Log',      path: ROUTES.ADMIN_AUDIT,          icon: 'ClipboardList' },
    { label: 'Analytics',      path: ROUTES.ADMIN_ANALYTICS,      icon: 'BarChart3' },
  ],
}

// BIS Statistics for homepage
export const BIS_STATS = [
  { label: 'Indian Standards Published',  value: '22,000+', icon: 'BookOpen'    },
  { label: 'ISI Marked Products',          value: '1,000+',  icon: 'BadgeCheck'  },
  { label: 'BIS Licensed Manufacturers',  value: '35,000+', icon: 'Building2'   },
  { label: 'Hallmarked Jewellery Items',  value: '2 Crore+',icon: 'Award'       },
  { label: 'Lab & Testing Centres',       value: '35+',     icon: 'FlaskConical'},
  { label: 'BIS Offices Across India',    value: '25+',     icon: 'MapPin'      },
]

// News ticker items
export const NEWS_ITEMS = [
  'BIS launches new IS 17840 standard for Electric Vehicle Charging Infrastructure',
  'Mandatory BIS certification for 20 new product categories from April 2025',
  'BIS Hallmarking scheme now covers over 250 cities in India',
  'New QCO (Quality Control Order) for electronic goods under Scheme-I',
  'BIS Care App updated with enhanced complaint tracking features',
  'India\'s IS standards aligned with ISO 9001:2015 for Quality Management Systems',
]

// Indian Standards categories
export const STANDARD_CATEGORIES = [
  { id: 'electro',   label: 'Electrotechnical',    count: 3200 },
  { id: 'civil',     label: 'Civil Engineering',   count: 2800 },
  { id: 'chemical',  label: 'Chemical',            count: 1900 },
  { id: 'mech',      label: 'Mechanical',          count: 2100 },
  { id: 'textile',   label: 'Textile',             count: 1400 },
  { id: 'food',      label: 'Food & Agriculture',  count: 1600 },
  { id: 'it',        label: 'IT & Electronics',    count: 1100 },
  { id: 'health',    label: 'Medical & Health',    count: 900  },
]

// Certification Status
export const CERT_STATUS = {
  PENDING:    'pending',
  APPROVED:   'approved',
  REJECTED:   'rejected',
  EXPIRED:    'expired',
  UNDER_REVIEW: 'under_review',
}

// Bhashini-Supported National Indian Languages
export const LANGUAGES = [
  { code: 'en', label: 'English',   native: 'English',         voiceLang: 'en-IN' },
  { code: 'hi', label: 'Hindi',     native: 'हिन्दी',          voiceLang: 'hi-IN' },
  { code: 'mr', label: 'Marathi',   native: 'मराठी',          voiceLang: 'mr-IN' },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்',          voiceLang: 'ta-IN' },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు',         voiceLang: 'te-IN' },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা',           voiceLang: 'bn-IN' },
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી',        voiceLang: 'gu-IN' },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ',          voiceLang: 'kn-IN' },
  { code: 'pa', label: 'Punjabi',   native: 'ਪੰਜਾਬੀ',          voiceLang: 'pa-IN' },
  { code: 'or', label: 'Odia',      native: 'ଓଡ଼ିଆ',           voiceLang: 'or-IN' },
]

// AI Chat output options
export const CHAT_OUTPUT_OPTIONS = [
  { id: 'chat',          label: 'Chat Response',       icon: 'MessageSquare' },
  { id: 'roadmap',       label: 'Compliance Roadmap',  icon: 'Map'           },
  { id: 'lab',           label: 'Lab/Cert Lookup',     icon: 'FlaskConical'  },
  { id: 'hallmarking',   label: 'Hallmarking Guidance',icon: 'Award'         },
  { id: 'save',          label: 'Save to Dashboard',   icon: 'Bookmark'      },
  { id: 'export',        label: 'Export PDF',          icon: 'Download'      },
]

// Database-Driven System: Static mock responses have been permanently removed.

// Compliance steps for manufacturers
export const COMPLIANCE_STEPS = [
  { id: 1, title: 'Product Identification',  desc: 'Identify applicable BIS standards for your product', status: 'completed' },
  { id: 2, title: 'Lab Testing',             desc: 'Get product tested at BIS recognized laboratory',    status: 'completed' },
  { id: 3, title: 'Application Submission',  desc: 'Submit ISI Mark license application on BIS Connect', status: 'current'   },
  { id: 4, title: 'Factory Inspection',      desc: 'BIS inspector visits your manufacturing facility',   status: 'pending'   },
  { id: 5, title: 'License Grant',           desc: 'Receive ISI Mark license and CM/L number',           status: 'pending'   },
  { id: 6, title: 'Annual Surveillance',     desc: 'Maintain compliance with periodic BIS audits',       status: 'pending'   },
]

// Admin quick stats (mock)
export const ADMIN_STATS = [
  { label: 'Total Users',      value: 1284,  delta: '+12%',  color: 'blue',   icon: 'Users'         },
  { label: 'Active Sessions',  value: 247,   delta: '+5%',   color: 'green',  icon: 'Activity'      },
  { label: 'Queries Today',    value: 3892,  delta: '+18%',  color: 'purple', icon: 'MessageSquare' },
  { label: 'Documents in KB',  value: 4521,  delta: '+3%',   color: 'orange', icon: 'Database'      },
]
