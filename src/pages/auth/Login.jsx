import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye, EyeOff, LogIn, Shield, Copy, CheckCircle,
  User, Building2, Briefcase, AlertCircle, ChevronRight, Home
} from 'lucide-react'
import { toast } from 'sonner'
import useAuthStore from '@/store/authStore'
import { DEMO_CREDENTIALS, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Icons per role
const ROLE_ICON = {
  consumer:     User,
  manufacturer: Building2,
  admin:        Shield,
}

// These are rendered on the DARK NAVY left panel — all glassmorphism white
const PANEL_CARD = {
  consumer:     'border-blue-400/40 bg-blue-500/10 hover:bg-blue-400/20',
  manufacturer: 'border-orange-400/40 bg-orange-500/10 hover:bg-orange-400/20',
  admin:        'border-red-400/40 bg-red-500/10 hover:bg-red-400/20',
}

const ROLE_BADGE = {
  consumer:     'bg-blue-500/20 text-blue-200',
  manufacturer: 'bg-orange-500/20 text-orange-200',
  admin:        'bg-red-500/20 text-red-200',
}

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login, isLoading, error, clearError } = useAuthStore()
  const from = location.state?.from?.pathname || null

  const [showPass, setShowPass] = useState(false)
  const [copied,   setCopied]   = useState(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (location.state?.prefill) {
      setValue('email',    location.state.prefill.email)
      setValue('password', location.state.prefill.password)
    }
  }, [location.state, setValue])

  useEffect(() => { clearError() }, [])

  const onSubmit = async (data) => {
    try {
      const { user } = await login(data)
      toast.success(`Welcome back, ${user.name}!`)
      // Direct access to AI Chat Interface
      const chatRoute = {
        consumer:     ROUTES.CONSUMER_CHAT,
        manufacturer: ROUTES.MANUFACTURER_CHAT,
        admin:        ROUTES.ADMIN_DASHBOARD,
      }[user.role] || ROUTES.CONSUMER_CHAT
      navigate(from || chatRoute, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Login failed')
    }
  }

  const prefillDemo = (cred) => {
    setValue('email',    cred.email)
    setValue('password', cred.password)
    toast.info(`${cred.label} credentials filled — click Sign In`)
  }

  const copyCredentials = (e, cred) => {
    e.stopPropagation()
    navigator.clipboard.writeText(`${cred.email}\n${cred.password}`)
    setCopied(cred.role)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Credentials copied!')
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-slate-100 dark:bg-dark-bg py-6 sm:py-10 px-3 sm:px-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-[420px_1fr] shadow-gov-lg rounded-gov-xl overflow-hidden border border-gray-200 dark:border-dark-border">

        {/* ── LEFT PANEL: always dark navy gradient ── */}
        <div className="hidden lg:flex flex-col bg-[linear-gradient(145deg,#00265D_0%,#003580_60%,#1650A1_100%)] p-8 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-bis-saffron/10" />

          {/* Logo + brand: clickable to Home */}
          <Link to="/" className="relative flex items-center gap-3 mb-8 group hover:opacity-90 transition-opacity" title="Return to Home">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md p-1 shrink-0 group-hover:scale-105 transition-transform">
              <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-tight">BIS Saarthi</div>
              <div className="text-blue-200 text-xs">AI-Powered Standards Assistant</div>
            </div>
          </Link>

          {/* Heading */}
          <h2 className="relative text-2xl font-bold text-white font-heading mb-1">Demo Accounts</h2>
          <p className="relative text-blue-200/80 text-sm mb-6">Click any role to auto-fill credentials</p>

          {/* Role cards — white/transparent on dark bg */}
          <div className="relative space-y-3 flex-1">
            {DEMO_CREDENTIALS.map((cred) => {
              const Icon = ROLE_ICON[cred.role]
              return (
                <div
                  key={cred.role}
                  onClick={() => prefillDemo(cred)}
                  className={cn(
                    'rounded-gov-lg px-4 py-3 border cursor-pointer transition-all group',
                    PANEL_CARD[cred.role]
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-white" />
                      <span className="font-semibold text-sm text-white">{cred.label}</span>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', ROLE_BADGE[cred.role])}>
                        {cred.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => copyCredentials(e, cred)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition-all"
                      >
                        {copied === cred.role
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-300" />
                          : <Copy className="w-3.5 h-3.5 text-white/60" />
                        }
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                  <div className="text-xs text-blue-100/70 space-y-0.5 font-mono">
                    <div>{cred.email}</div>
                    <div>{cred.password}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <div className="relative mt-6 pt-5 border-t border-white/10 flex items-start gap-2 text-xs text-blue-200/60">
            <Shield className="w-4 h-4 mt-0.5 shrink-0 text-white/30" />
            <span>Demo accounts are pre-seeded for testing. Register with your own credentials for production use.</span>
          </div>
        </div>

        {/* ── RIGHT PANEL: login form ── */}
        <div className="bg-white dark:bg-dark-bg-card p-5 sm:p-8 md:p-10 flex flex-col justify-center">

          {/* Mobile logo and home row */}
          <div className="flex lg:hidden items-center justify-between gap-2 mb-6">
            <Link to="/" className="flex items-center gap-2" title="Return to Home">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-0.5 shrink-0">
                <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-bold text-bis-navy dark:text-blue-300">BIS Saarthi</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-bis-navy dark:text-blue-300 bg-slate-100 dark:bg-dark-bg-secondary hover:bg-slate-200 dark:hover:bg-dark-bg px-2.5 py-1.5 rounded-gov transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
          </div>

          {/* Heading with Desktop Home Button */}
          <div className="flex items-start justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-heading">Welcome Back</h1>
              <p className="text-gray-500 dark:text-dark-text-muted text-xs sm:text-sm mt-1">
                Sign in to your BIS Saarthi portal
              </p>
            </div>
            <Link
              to="/"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-bis-navy dark:text-blue-300 bg-slate-100 dark:bg-dark-bg-secondary hover:bg-slate-200 dark:hover:bg-dark-bg px-3 py-1.5 rounded-gov transition-colors shadow-xs"
              title="Return to Home"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
          </div>

          {/* Server error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-gov mb-5 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="your.email@example.com"
                autoComplete="email"
                className={cn('input-gov', errors.email && 'border-red-400 focus:ring-red-400/30 focus:border-red-400')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn('input-gov pr-10', errors.password && 'border-red-400 focus:ring-red-400/30 focus:border-red-400')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-300 dark:border-dark-border text-bis-navy accent-bis-navy"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 dark:text-dark-text-muted select-none">
                Remember me for 7 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn('btn-gov w-full py-3 text-base', isLoading && 'opacity-70 cursor-not-allowed')}
            >
              {isLoading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : (
                <><LogIn className="w-5 h-5" /> Sign In to BIS Saarthi</>
              )}
            </button>
          </form>

          {/* Mobile demo hint */}
          <div className="lg:hidden mt-5 p-4 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border">
            <p className="text-xs font-semibold text-gray-700 dark:text-dark-text mb-2">Quick Demo Login:</p>
            <div className="space-y-1.5">
              {DEMO_CREDENTIALS.map(cred => (
                <button
                  key={cred.role}
                  onClick={() => prefillDemo(cred)}
                  className="w-full text-left text-xs text-bis-navy dark:text-blue-400 hover:underline"
                >
                  {cred.label}: {cred.email}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 text-sm text-gray-500 dark:text-dark-text-muted mt-6 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 dark:text-dark-text-muted hover:text-bis-navy dark:hover:text-blue-400 font-medium transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Return to Home</span>
            </Link>
            <p>
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER} className="text-bis-navy dark:text-blue-400 font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
