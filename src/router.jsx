import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES, ROLES } from '@/lib/constants'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { PageLoader } from '@/components/common/LoadingSpinner'

// Public pages
import Home     from '@/pages/Home'
import Login    from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'

// Consumer pages
import ConsumerDashboard     from '@/pages/consumer/Dashboard'
import ConsumerChat          from '@/pages/consumer/Chat'
import ConsumerStandards     from '@/pages/consumer/Standards'
import ConsumerHallmarking   from '@/pages/consumer/Hallmarking'
import ConsumerComplaints    from '@/pages/consumer/Complaints'
import ConsumerNotifications from '@/pages/consumer/Notifications'

// Manufacturer pages
import ManufacturerDashboard     from '@/pages/manufacturer/Dashboard'
import ManufacturerChat          from '@/pages/manufacturer/Chat'
import ManufacturerCertification from '@/pages/manufacturer/Certification'
import ManufacturerCompliance    from '@/pages/manufacturer/ComplianceRoadmap'
import ManufacturerDocuments     from '@/pages/manufacturer/Documents'
import ManufacturerNotifications from '@/pages/manufacturer/Notifications'

// Admin pages
import AdminDashboard      from '@/pages/admin/Dashboard'
import AdminNotifications  from '@/pages/admin/Notifications'
import AdminComplaints     from '@/pages/admin/Complaints'
import AdminCertifications from '@/pages/admin/Certifications'
import AdminUsers          from '@/pages/admin/UserManagement'
import AdminKnowledge      from '@/pages/admin/KnowledgeBase'
import AdminAudit          from '@/pages/admin/AuditLog'
import AdminAnalytics      from '@/pages/admin/Analytics'
import Settings            from '@/pages/Settings'

import DashboardLayout from '@/components/layout/DashboardLayout'

function DashWrapper({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.HOME}     element={<Home />}     />
      <Route path={ROUTES.LOGIN}    element={<Login />}    />
      <Route path={ROUTES.REGISTER} element={<Register />} />

      {/* Consumer routes */}
      <Route path={ROUTES.CONSUMER_DASHBOARD}
        element={<ProtectedRoute roles={[ROLES.CONSUMER]}><DashWrapper><ConsumerDashboard /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.CONSUMER_CHAT}
        element={<ProtectedRoute roles={[ROLES.CONSUMER]}><DashWrapper><ConsumerChat /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.CONSUMER_STANDARDS}
        element={<ProtectedRoute roles={[ROLES.CONSUMER]}><DashWrapper><ConsumerStandards /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.CONSUMER_HALLMARKING}
        element={<ProtectedRoute roles={[ROLES.CONSUMER]}><DashWrapper><ConsumerHallmarking /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.CONSUMER_COMPLAINTS}
        element={<ProtectedRoute roles={[ROLES.CONSUMER]}><DashWrapper><ConsumerComplaints /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.CONSUMER_NOTIFICATIONS}
        element={<ProtectedRoute roles={[ROLES.CONSUMER]}><DashWrapper><ConsumerNotifications /></DashWrapper></ProtectedRoute>}
      />

      {/* Manufacturer routes */}
      <Route path={ROUTES.MANUFACTURER_DASHBOARD}
        element={<ProtectedRoute roles={[ROLES.MANUFACTURER]}><DashWrapper><ManufacturerDashboard /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.MANUFACTURER_CHAT}
        element={<ProtectedRoute roles={[ROLES.MANUFACTURER]}><DashWrapper><ManufacturerChat /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.MANUFACTURER_CERTIFICATION}
        element={<ProtectedRoute roles={[ROLES.MANUFACTURER]}><DashWrapper><ManufacturerCertification /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.MANUFACTURER_COMPLIANCE}
        element={<ProtectedRoute roles={[ROLES.MANUFACTURER]}><DashWrapper><ManufacturerCompliance /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.MANUFACTURER_DOCUMENTS}
        element={<ProtectedRoute roles={[ROLES.MANUFACTURER]}><DashWrapper><ManufacturerDocuments /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.MANUFACTURER_NOTIFICATIONS}
        element={<ProtectedRoute roles={[ROLES.MANUFACTURER]}><DashWrapper><ManufacturerNotifications /></DashWrapper></ProtectedRoute>}
      />

      {/* Professional routes redirected */}
      <Route path="/professional/*" element={<Navigate to={ROUTES.CONSUMER_DASHBOARD} replace />} />

      {/* Admin routes */}
      <Route path={ROUTES.ADMIN_DASHBOARD}
        element={<ProtectedRoute roles={[ROLES.ADMIN]}><DashWrapper><AdminDashboard /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.ADMIN_NOTIFICATIONS}
        element={<ProtectedRoute roles={[ROLES.ADMIN]}><DashWrapper><AdminNotifications /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.ADMIN_COMPLAINTS}
        element={<ProtectedRoute roles={[ROLES.ADMIN]}><DashWrapper><AdminComplaints /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.ADMIN_CERTIFICATIONS}
        element={<ProtectedRoute roles={[ROLES.ADMIN]}><DashWrapper><AdminCertifications /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.ADMIN_USERS}
        element={<ProtectedRoute roles={[ROLES.ADMIN]}><DashWrapper><AdminUsers /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.ADMIN_KNOWLEDGE}
        element={<ProtectedRoute roles={[ROLES.ADMIN]}><DashWrapper><AdminKnowledge /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.ADMIN_AUDIT}
        element={<ProtectedRoute roles={[ROLES.ADMIN]}><DashWrapper><AdminAudit /></DashWrapper></ProtectedRoute>}
      />
      <Route path={ROUTES.ADMIN_ANALYTICS}
        element={<ProtectedRoute roles={[ROLES.ADMIN]}><DashWrapper><AdminAnalytics /></DashWrapper></ProtectedRoute>}
      />

      {/* Unified Settings Portal Route */}
      <Route path={ROUTES.SETTINGS}
        element={<ProtectedRoute><DashWrapper><Settings /></DashWrapper></ProtectedRoute>}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}
