import { create } from 'zustand'
import { ROLES } from '@/lib/constants'

// Initial seed data
const INITIAL_USERS = [
  { id: 1, name: 'Priya Sharma',  email: 'consumer@bis.gov.in', role: ROLES.CONSUMER,     status: 'active',   created: '2024-01-15', org: '-' },
  { id: 2, name: 'Rajesh Kumar',  email: 'msme@bis.gov.in',     role: ROLES.MANUFACTURER, status: 'active',   created: '2024-02-20', org: 'RK Industries Ltd' },
  { id: 3, name: 'Vikram Singh',  email: 'vikram@example.com',  role: ROLES.CONSUMER,     status: 'inactive', created: '2024-05-01', org: '-' },
  { id: 4, name: 'Admin Officer', email: 'admin@bis.gov.in',    role: ROLES.ADMIN,        status: 'active',   created: '2023-11-01', org: 'BIS HQ Delhi' },
  { id: 5, name: 'Sunita Patel',  email: 'sunita@mfg.com',      role: ROLES.MANUFACTURER, status: 'active',   created: '2024-06-15', org: 'Patel Electronics' },
]

const INITIAL_LOGS = [
  { id: 1, user: 'admin@bis.gov.in',    action: 'UPLOAD',   resource: 'IS 302 Standard PDF',            ip: '10.0.0.1', time: new Date(Date.now() - 1e4).toISOString() },
  { id: 2, user: 'consumer@bis.gov.in', action: 'QUERY',    resource: 'Chat query: IS 1417 Hallmarking', ip: '10.0.0.2', time: new Date(Date.now() - 5e4).toISOString() },
  { id: 3, user: 'msme@bis.gov.in',     action: 'APPLY',    resource: 'Certification #CM/L-7012345',     ip: '10.0.0.3', time: new Date(Date.now() - 1e5).toISOString() },
  { id: 4, user: 'admin@bis.gov.in',    action: 'PUBLISH',  resource: 'BIS Circular 15/2024',           ip: '10.0.0.1', time: new Date(Date.now() - 2e5).toISOString() },
  { id: 5, user: 'consumer@bis.gov.in', action: 'COMPLAINT', resource: 'Filed Complaint #COMP-2024-001',ip: '10.0.0.4', time: new Date(Date.now() - 3e5).toISOString() },
  { id: 6, user: 'admin@bis.gov.in',    action: 'LOGIN',    resource: 'Admin Portal Access',             ip: '10.0.0.1', time: new Date(Date.now() - 5e5).toISOString() },
]

const INITIAL_DOCS = [
  { id: 1, title: 'IS 302 - Safety of Household Appliances', category: 'Standard',     version: '3.1', size: 2400000, status: 'published', uploaded: '2024-06-10', chunks: 142 },
  { id: 2, title: 'BIS Hallmarking Scheme Circular 2024',    category: 'Circular',     version: '1.0', size: 540000,  status: 'published', uploaded: '2024-07-01', chunks: 36 },
  { id: 3, title: 'QCO Electronics Sector - Full Gazette',   category: 'Notification', version: '2.0', size: 1800000, status: 'review',    uploaded: '2024-08-15', chunks: 88 },
  { id: 4, title: 'NABL Lab List 2024 - Electrotechnical',   category: 'Reference',    version: '1.5', size: 320000,  status: 'published', uploaded: '2024-09-01', chunks: 24 },
]

const INITIAL_COMPLAINTS = [
  { id: 'COMP-2024-001', subject: 'Substandard electrical wiring', product: 'Electrical Wire', location: 'Delhi Retail Store', description: 'Wire insulation melts below rated current, violating IS 694 standards.', status: 'resolved',   date: '2024-08-10' },
  { id: 'COMP-2024-002', subject: 'No ISI mark on helmet',         product: 'Safety Helmet',  location: 'Mumbai E-Commerce', description: 'Rider safety helmet sold without ISI certification mark under IS 4151.', status: 'in_progress', date: '2024-09-01' },
]

const INITIAL_CERTS = [
  { id: 'CM/L-7012345', product: 'Electric Fan (IS 374)',   standard: 'IS 374',   category: 'Electrotechnical', lab: 'NABL Accredited Lab, Pune',  status: 'approved',    applied: '2024-03-10', updated: '2024-06-15', validity: '2026-08-15' },
  { id: 'CM/L-7012346', product: 'LED Bulb (IS 16102-1-2)', standard: 'IS 16102', category: 'Electrotechnical', lab: 'BIS Regional Testing Lab',  status: 'pending',     applied: '2024-07-01', updated: '2024-08-01', validity: 'Under Review' },
  { id: 'CM/L-7012347', product: 'Steel Wire (IS 307)',     standard: 'IS 307',   category: 'Metallurgical',    lab: 'National Metallurgical Lab', status: 'under_review',applied: '2024-09-01', updated: '2024-09-03', validity: 'Under Review' },
]

const INITIAL_MANUFACTURER_DOCS = [
  { id: 1, name: 'Factory_Layout_v2.pdf',     size: 2400000, type: 'Factory Layout',   uploaded: '2024-08-10', status: 'approved' },
  { id: 2, name: 'Lab_Test_Report_IS374.pdf',  size: 1800000, type: 'Lab Test Report', uploaded: '2024-08-15', status: 'pending' },
  { id: 3, name: 'QC_Manual_2024.docx',        size: 540000,  type: 'Quality Manual',  uploaded: '2024-09-01', status: 'approved' },
]

const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-2025-001',
    title: 'Mandatory BIS Hallmarking Extended to 18 Additional Districts',
    message: 'Ministry of Consumer Affairs and BIS have notified mandatory hallmarking in 18 new districts across India. All gold jewellers must ensure 6-digit HUID marking on 14k, 18k, 20k, 22k, 23k, and 24k articles.',
    targetRole: 'consumer',
    priority: 'urgent',
    category: 'Gazette Circular',
    created: new Date(Date.now() - 3600000 * 4).toISOString(),
    sender: 'BIS Hallmarking Directorate',
    readBy: [],
    actionUrl: '/consumer/hallmarking',
  },
  {
    id: 'NOTIF-2025-002',
    title: 'Quality Control Order (QCO) for Electric Vehicle Components (IS 17840)',
    message: 'Department for Promotion of Industry and Internal Trade (DPIIT) issues mandatory BIS certification for EV DC charging couplers and power converters. Testing facilities are operational in regional NABL labs.',
    targetRole: 'manufacturer',
    priority: 'urgent',
    category: 'Compliance Alert',
    created: new Date(Date.now() - 3600000 * 8).toISOString(),
    sender: 'Central Certification Dept',
    readBy: [],
    actionUrl: '/manufacturer/certification',
  },
  {
    id: 'NOTIF-2025-003',
    title: 'Public Quality Advisory: Beware of Substandard Packaged Drinking Water',
    message: 'Enforcement drives conducted in NCR identified uncertified bottling units falsely displaying ISI logos without valid CML numbers. Consumers are advised to verify packaging labels using the Verify ISI Mark tool.',
    targetRole: 'consumer',
    priority: 'warning',
    category: 'Quality Advisory',
    created: new Date(Date.now() - 3600000 * 24).toISOString(),
    sender: 'BIS Citizen Protection Cell',
    readBy: [],
    actionUrl: '/consumer/standards',
  },
  {
    id: 'NOTIF-2025-004',
    title: '50% Marking Fee Concession Active for Registered Micro & Small Enterprises',
    message: 'Eligible MSMEs holding valid Udyam certificates receive 50% concession on annual marking fees under Scheme-I. Ensure your Udyam registration is uploaded under manufacturer documents.',
    targetRole: 'manufacturer',
    priority: 'success',
    category: 'Standard Update',
    created: new Date(Date.now() - 3600000 * 48).toISOString(),
    sender: 'MSME Support Cell',
    readBy: [],
    actionUrl: '/manufacturer/documents',
  },
  {
    id: 'NOTIF-2025-005',
    title: 'National Standards Conclave & e-Governance Portal Upgrades',
    message: 'BIS Saarthi V2 system update introduces real-time complaint tracking, automated MSME lab allocation, and Bhashini multilingual voice integration for 10 Indian languages.',
    targetRole: 'all',
    priority: 'info',
    category: 'Portal Update',
    created: new Date(Date.now() - 3600000 * 72).toISOString(),
    sender: 'BIS Directorate General',
    readBy: [],
    actionUrl: '',
  },
]

// Storage persistence helper
const STORAGE_KEY = 'bis_realtime_db_v2'

const loadPersistedData = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to load persisted data:', err)
    return null
  }
}

const savePersistedData = (state) => {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      users: state.users,
      auditLogs: state.auditLogs,
      knowledgeDocs: state.knowledgeDocs,
      complaints: state.complaints,
      certifications: state.certifications,
      manufacturerDocs: state.manufacturerDocs,
      queryCount: state.queryCount,
      notifications: state.notifications,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.error('Failed to save persisted data:', err)
  }
}

const savedData = loadPersistedData()

export const useDataStore = create((set, get) => ({
  users: savedData?.users || INITIAL_USERS,
  auditLogs: savedData?.auditLogs || INITIAL_LOGS,
  knowledgeDocs: savedData?.knowledgeDocs || INITIAL_DOCS,
  complaints: savedData?.complaints || INITIAL_COMPLAINTS,
  certifications: savedData?.certifications || INITIAL_CERTS,
  manufacturerDocs: savedData?.manufacturerDocs || INITIAL_MANUFACTURER_DOCS,
  queryCount: savedData?.queryCount || 3892,
  notifications: savedData?.notifications || INITIAL_NOTIFICATIONS,

  // ── AUDIT LOGGING ──
  logAction: ({ user = 'System', action = 'ACTION', resource = '', ip = '10.0.0.1' }) => {
    const newLog = {
      id: Date.now(),
      user: typeof user === 'string' ? user : user?.email || 'user@bis.gov.in',
      action: action.toUpperCase(),
      resource: resource || 'Resource accessed',
      ip: ip || '10.0.0.1',
      time: new Date().toISOString(),
    }
    set((s) => {
      const next = { ...s, auditLogs: [newLog, ...s.auditLogs.slice(0, 99)] }
      savePersistedData(next)
      return next
    })
    return newLog
  },

  // ── USER MANAGEMENT CRUD ──
  addUser: (userData) => {
    const newUser = {
      id: Date.now(),
      name: userData.name,
      email: userData.email,
      role: userData.role || ROLES.CONSUMER,
      org: userData.org || '-',
      status: userData.status || 'active',
      created: new Date().toISOString(),
    }
    set((s) => {
      const next = { ...s, users: [newUser, ...s.users] }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'admin@bis.gov.in',
      action: 'USER_CREATE',
      resource: `User account created: ${newUser.name} (${newUser.role})`,
    })
    return newUser
  },

  updateUser: (id, updates) => {
    set((s) => {
      const next = {
        ...s,
        users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      }
      savePersistedData(next)
      return next
    })
    const targetUser = get().users.find((u) => u.id === id)
    get().logAction({
      user: 'admin@bis.gov.in',
      action: 'USER_UPDATE',
      resource: `Updated user profile: ${targetUser?.name || id}`,
    })
  },

  toggleUserStatus: (id) => {
    let updatedStatus = 'active'
    let updatedName = ''
    set((s) => {
      const nextUsers = s.users.map((u) => {
        if (u.id === id) {
          updatedStatus = u.status === 'active' ? 'inactive' : 'active'
          updatedName = u.name
          return { ...u, status: updatedStatus }
        }
        return u
      })
      const next = { ...s, users: nextUsers }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'admin@bis.gov.in',
      action: updatedStatus === 'active' ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
      resource: `${updatedName || 'User'} marked as ${updatedStatus}`,
    })
  },

  deleteUser: (id) => {
    const targetUser = get().users.find((u) => u.id === id)
    set((s) => {
      const next = { ...s, users: s.users.filter((u) => u.id !== id) }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'admin@bis.gov.in',
      action: 'DELETE',
      resource: `Deleted user: ${targetUser?.name || id} (${targetUser?.email || ''})`,
    })
  },

  // ── KNOWLEDGE BASE CRUD ──
  addKnowledgeDoc: (docData) => {
    const newDoc = {
      id: Date.now(),
      title: docData.title,
      category: docData.category || 'Standard',
      version: docData.version || '1.0',
      size: docData.size || 1500000,
      status: docData.status || 'review',
      uploaded: new Date().toISOString(),
      chunks: Math.floor(30 + Math.random() * 80),
    }
    set((s) => {
      const next = { ...s, knowledgeDocs: [newDoc, ...s.knowledgeDocs] }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'admin@bis.gov.in',
      action: 'UPLOAD',
      resource: `Uploaded KB document: ${newDoc.title}`,
    })
    return newDoc
  },

  publishKnowledgeDoc: (id) => {
    let docTitle = ''
    set((s) => {
      const nextDocs = s.knowledgeDocs.map((d) => {
        if (d.id === id) {
          docTitle = d.title
          return { ...d, status: 'published' }
        }
        return d
      })
      const next = { ...s, knowledgeDocs: nextDocs }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'admin@bis.gov.in',
      action: 'PUBLISH',
      resource: `Published to AI Knowledge Layer: ${docTitle}`,
    })
  },

  deleteKnowledgeDoc: (id) => {
    const targetDoc = get().knowledgeDocs.find((d) => d.id === id)
    set((s) => {
      const next = { ...s, knowledgeDocs: s.knowledgeDocs.filter((d) => d.id !== id) }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'admin@bis.gov.in',
      action: 'DELETE',
      resource: `Removed KB document: ${targetDoc?.title || id}`,
    })
  },

  // ── COMPLAINTS CRUD ──
  fileComplaint: (complaintData) => {
    const compId = `COMP-2025-${Math.floor(100 + Math.random() * 900)}`
    const newComp = {
      id: compId,
      subject: complaintData.subject,
      product: complaintData.product,
      location: complaintData.location || 'Not specified',
      description: complaintData.description,
      status: 'pending',
      date: new Date().toISOString(),
    }
    set((s) => {
      const next = { ...s, complaints: [newComp, ...s.complaints] }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: complaintData.userEmail || 'consumer@bis.gov.in',
      action: 'COMPLAINT',
      resource: `Filed quality complaint ${compId} for ${complaintData.product}`,
    })
    return newComp
  },

  updateComplaintStatus: (id, status, remarks = '') => {
    set((s) => {
      const next = {
        ...s,
        complaints: s.complaints.map((c) =>
          c.id === id
            ? {
                ...c,
                status,
                remarks: remarks !== undefined && remarks !== '' ? remarks : c.remarks,
                updated: new Date().toISOString(),
              }
            : c
        ),
      }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'admin@bis.gov.in',
      action: 'COMPLAINT_STATUS',
      resource: `Complaint ${id} status updated to ${status}${remarks ? ` - Note: "${remarks}"` : ''}`,
    })
  },

  // ── CERTIFICATIONS CRUD ──
  applyCertification: (certData) => {
    const certId = `CM/L-70${Math.floor(10000 + Math.random() * 90000)}`
    const newCert = {
      id: certId,
      product: `${certData.product} (${certData.standard})`,
      standard: certData.standard,
      category: certData.category || 'Electrotechnical',
      lab: certData.lab || 'BIS Regional Testing Lab',
      status: 'pending',
      applied: new Date().toISOString(),
      updated: new Date().toISOString(),
      validity: 'Under Review',
    }
    set((s) => {
      const next = { ...s, certifications: [newCert, ...s.certifications] }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: certData.userEmail || 'msme@bis.gov.in',
      action: 'APPLY',
      resource: `Applied for certification ${certId}: ${certData.product}`,
    })
    return newCert
  },

  updateCertStatus: (id, status, remarks = '') => {
    set((s) => {
      const next = {
        ...s,
        certifications: s.certifications.map((c) =>
          c.id === id
            ? {
                ...c,
                status,
                remarks: remarks !== undefined && remarks !== '' ? remarks : c.remarks,
                updated: new Date().toISOString(),
              }
            : c
        ),
      }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'admin@bis.gov.in',
      action: 'CERT_STATUS',
      resource: `Certification ${id} status updated to ${status}${remarks ? ` - Note: "${remarks}"` : ''}`,
    })
  },

  // ── MANUFACTURER DOCUMENTS CRUD ──
  addManufacturerDoc: (file) => {
    const newDoc = {
      id: Date.now(),
      name: file.name,
      size: file.size || 1200000,
      type: file.type || 'Uploaded Document',
      uploaded: new Date().toISOString(),
      status: 'pending',
    }
    set((s) => {
      const next = { ...s, manufacturerDocs: [newDoc, ...s.manufacturerDocs] }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'msme@bis.gov.in',
      action: 'UPLOAD',
      resource: `Uploaded manufacturer document: ${newDoc.name}`,
    })
    return newDoc
  },

  deleteManufacturerDoc: (id) => {
    const targetDoc = get().manufacturerDocs.find((d) => d.id === id)
    set((s) => {
      const next = { ...s, manufacturerDocs: s.manufacturerDocs.filter((d) => d.id !== id) }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'msme@bis.gov.in',
      action: 'DELETE',
      resource: `Deleted manufacturer document: ${targetDoc?.name || id}`,
    })
  },

  incrementQueryCount: () => {
    set((s) => {
      const next = { ...s, queryCount: s.queryCount + 1 }
      savePersistedData(next)
      return next
    })
  },

  // ── NOTIFICATIONS & BROADCAST OPERATIONS ──
  broadcastNotification: (notifData) => {
    const id = `NOTIF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const newNotif = {
      id,
      title: notifData.title,
      message: notifData.message,
      targetRole: notifData.targetRole || 'all', // 'all' | 'consumer' | 'manufacturer'
      priority: notifData.priority || 'info',     // 'info' | 'warning' | 'urgent' | 'success'
      category: notifData.category || 'Gazette Circular',
      created: new Date().toISOString(),
      sender: notifData.sender || 'BIS Central Administration',
      readBy: [],
      actionUrl: notifData.actionUrl || '',
    }

    set((s) => {
      const next = {
        ...s,
        notifications: [newNotif, ...s.notifications],
      }
      savePersistedData(next)
      return next
    })

    get().logAction({
      user: 'admin@bis.gov.in',
      action: 'BROADCAST',
      resource: `Broadcast ${newNotif.id} (${newNotif.targetRole.toUpperCase()}): "${newNotif.title}"`,
    })

    return newNotif
  },

  markNotificationAsRead: (id, userEmail) => {
    if (!userEmail) return
    set((s) => {
      const next = {
        ...s,
        notifications: s.notifications.map((n) => {
          if (n.id !== id) return n
          const readBy = Array.isArray(n.readBy) ? n.readBy : []
          if (readBy.includes(userEmail)) return n
          return { ...n, readBy: [...readBy, userEmail] }
        }),
      }
      savePersistedData(next)
      return next
    })
  },

  markAllNotificationsAsRead: (role, userEmail) => {
    if (!userEmail) return
    set((s) => {
      const next = {
        ...s,
        notifications: s.notifications.map((n) => {
          if (role !== 'admin' && n.targetRole !== 'all' && n.targetRole !== role) return n
          const readBy = Array.isArray(n.readBy) ? n.readBy : []
          if (readBy.includes(userEmail)) return n
          return { ...n, readBy: [...readBy, userEmail] }
        }),
      }
      savePersistedData(next)
      return next
    })
  },

  deleteNotification: (id) => {
    const target = get().notifications.find((n) => n.id === id)
    set((s) => {
      const next = {
        ...s,
        notifications: s.notifications.filter((n) => n.id !== id),
      }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'admin@bis.gov.in',
      action: 'DELETE',
      resource: `Recalled broadcast notification: ${target?.title || id}`,
    })
  },

  getNotificationsForRole: (role) => {
    const { notifications } = get()
    if (!role || role === 'admin') return notifications
    return notifications.filter((n) => n.targetRole === 'all' || n.targetRole === role)
  },

  getUnreadNotificationsCount: (role, userEmail) => {
    const { notifications } = get()
    if (!userEmail) return 0
    return notifications.filter((n) => {
      const matchesRole = !role || role === 'admin' || n.targetRole === 'all' || n.targetRole === role
      if (!matchesRole) return false
      const readBy = Array.isArray(n.readBy) ? n.readBy : []
      return !readBy.includes(userEmail)
    }).length
  },

  // ── DYNAMIC METRIC COMPUTATIONS ──
  getAdminStats: () => {
    const { users, knowledgeDocs, queryCount } = get()
    const activeUsers = users.filter((u) => u.status === 'active').length
    return [
      { label: 'Total Users',     value: users.length,         delta: '+12%', color: 'blue',   icon: 'Users' },
      { label: 'Active Sessions', value: activeUsers,          delta: '+5%',  color: 'green',  icon: 'Activity' },
      { label: 'Queries Today',   value: queryCount,           delta: '+18%', color: 'purple', icon: 'MessageSquare' },
      { label: 'Documents in KB', value: knowledgeDocs.length, delta: '+3%',  color: 'orange', icon: 'Database' },
    ]
  },

  getRoleDistribution: () => {
    const { users } = get()
    const consumers = users.filter((u) => u.role === ROLES.CONSUMER).length
    const manufacturers = users.filter((u) => u.role === ROLES.MANUFACTURER).length
    const admins = users.filter((u) => u.role === ROLES.ADMIN).length
    return [
      { role: 'Consumer',     count: consumers },
      { role: 'Manufacturer', count: manufacturers },
      { role: 'Admin',        count: admins },
    ]
  },
}))

// Cross-tab real-time event listener
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const remote = JSON.parse(e.newValue)
        useDataStore.setState({
          users: remote.users || INITIAL_USERS,
          auditLogs: remote.auditLogs || INITIAL_LOGS,
          knowledgeDocs: remote.knowledgeDocs || INITIAL_DOCS,
          complaints: remote.complaints || INITIAL_COMPLAINTS,
          certifications: remote.certifications || INITIAL_CERTS,
          manufacturerDocs: remote.manufacturerDocs || INITIAL_MANUFACTURER_DOCS,
          queryCount: remote.queryCount || 3892,
          notifications: remote.notifications || INITIAL_NOTIFICATIONS,
        })
      } catch (err) {
        console.error('Cross-tab sync error:', err)
      }
    }
  })
}

export default useDataStore
