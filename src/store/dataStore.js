import { create } from 'zustand'
import { ROLES } from '@/lib/constants'

const STORAGE_KEY = 'bis_realtime_db_v2'

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
  } catch (_) {}
}

// Dynamic database-backed state store (all mock datasets removed)
export const useDataStore = create((set, get) => ({
  users: [],
  auditLogs: [],
  knowledgeDocs: [],
  complaints: [],
  certifications: [],
  manufacturerDocs: [],
  queryCount: 0,
  notifications: [],
  isLoadingDb: false,

  // Synchronize state directly from Neon DB endpoints
  syncWithDb: async () => {
    set({ isLoadingDb: true })
    const token = typeof window !== 'undefined' ? localStorage.getItem('bis_token') : null
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      const [uRes, lRes, dRes, cRes, certRes, nRes, mDocRes] = await Promise.allSettled([
        fetch('/api/admin/users', { headers }),
        fetch('/api/data?type=audit-logs', { headers }),
        fetch('/api/data?type=documents', { headers }),
        fetch('/api/data?type=complaints', { headers }),
        fetch('/api/data?type=certifications', { headers }),
        fetch('/api/data?type=notifications', { headers }),
        fetch('/api/data?type=manufacturer-documents', { headers }),
      ])

      const updates = {}
      if (uRes.status === 'fulfilled' && uRes.value.ok) {
        const data = await uRes.value.json()
        if (data.users) updates.users = data.users
      }
      if (lRes.status === 'fulfilled' && lRes.value.ok) {
        const data = await lRes.value.json()
        if (data.logs) updates.auditLogs = data.logs
      }
      if (dRes.status === 'fulfilled' && dRes.value.ok) {
        const data = await dRes.value.json()
        if (data.documents) updates.knowledgeDocs = data.documents
      }
      if (cRes.status === 'fulfilled' && cRes.value.ok) {
        const data = await cRes.value.json()
        if (data.complaints) updates.complaints = data.complaints
      }
      if (certRes.status === 'fulfilled' && certRes.value.ok) {
        const data = await certRes.value.json()
        if (data.certifications) updates.certifications = data.certifications
      }
      if (nRes.status === 'fulfilled' && nRes.value.ok) {
        const data = await nRes.value.json()
        if (data.notifications) updates.notifications = data.notifications
      }
      if (mDocRes.status === 'fulfilled' && mDocRes.value.ok) {
        const data = await mDocRes.value.json()
        if (data.documents) updates.manufacturerDocs = data.documents
      }

      set({ ...updates, isLoadingDb: false })
    } catch (_) {
      set({ isLoadingDb: false })
    }
  },

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
  addManufacturerDoc: async (docData) => {
    const newDoc = {
      id: docData.id || `DOC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      name: docData.name,
      category: docData.category || 'Compliance Document',
      standardCode: docData.standardCode || 'IS 14543:2024',
      fileType: docData.fileType || 'PDF',
      size: docData.size || 1500000,
      version: docData.version || '1.0',
      uploaded: new Date().toISOString(),
      status: docData.status || 'pending',
      reviewNotes: docData.reviewNotes || 'Submitted for technical scrutiny',
      checksum: docData.checksum || `SHA256:${Math.random().toString(36).substring(2, 12)}`,
      validUntil: docData.validUntil || null,
    }
    set((s) => {
      const next = { ...s, manufacturerDocs: [newDoc, ...s.manufacturerDocs] }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'msme@bis.gov.in',
      action: 'DOC_UPLOAD',
      resource: `Uploaded manufacturer document: ${newDoc.name} (${newDoc.category})`,
    })
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bis_token') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/data?type=manufacturer-documents', {
        method: 'POST',
        headers,
        body: JSON.stringify(newDoc),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.document) {
          set((s) => {
            const next = {
              ...s,
              manufacturerDocs: s.manufacturerDocs.map((d) => (d.id === newDoc.id ? data.document : d)),
            }
            savePersistedData(next)
            return next
          })
        }
      }
    } catch (_) {}
    return newDoc
  },

  deleteManufacturerDoc: async (id) => {
    const targetDoc = get().manufacturerDocs.find((d) => d.id === id)
    set((s) => {
      const next = { ...s, manufacturerDocs: s.manufacturerDocs.filter((d) => d.id !== id) }
      savePersistedData(next)
      return next
    })
    get().logAction({
      user: 'msme@bis.gov.in',
      action: 'DOC_DELETE',
      resource: `Deleted manufacturer document: ${targetDoc?.name || id}`,
    })
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bis_token') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      await fetch(`/api/data?type=manufacturer-documents&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      })
    } catch (_) {}
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
          users: remote.users || [],
          auditLogs: remote.auditLogs || [],
          knowledgeDocs: remote.knowledgeDocs || [],
          complaints: remote.complaints || [],
          certifications: remote.certifications || [],
          manufacturerDocs: remote.manufacturerDocs || [],
          queryCount: remote.queryCount || 0,
          notifications: remote.notifications || [],
        })
      } catch (err) {
        console.error('Cross-tab sync error:', err)
      }
    }
  })
}

export default useDataStore
