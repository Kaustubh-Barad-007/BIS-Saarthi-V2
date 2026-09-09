import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuthStore()
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to their own dashboard
    const dashRoute = {
      consumer:     ROUTES.CONSUMER_DASHBOARD,
      manufacturer: ROUTES.MANUFACTURER_DASHBOARD,
      professional: ROUTES.PROFESSIONAL_DASHBOARD,
      admin:        ROUTES.ADMIN_DASHBOARD,
    }[user.role] || ROUTES.HOME
    return <Navigate to={dashRoute} replace />
  }

  return children
}
