import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  UserPlus, User, Building2, Shield,
  ChevronRight, ChevronLeft, CheckCircle2, Home
} from 'lucide-react'
import { toast } from 'sonner'
import useAuthStore from '@/store/authStore'
import { ROUTES, ROLES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = [
  { value: ROLES.CONSUMER,     label: 'Consumer (General Public)',  icon: User,      desc: 'Product queries, hallmarking, complaints' },
  { value: ROLES.MANUFACTURER, label: 'MSME / Manufacturer',        icon: Building2, desc: 'Certification, compliance, lab testing'    },
  { value: ROLES.ADMIN,        label: 'BIS Government Official',    icon: Shield,    desc: 'Admin portal (requires verification)'      },
]

const stepSchemas = [
  z.object({
    name:  z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  }),
  z.object({
    role:         z.enum([ROLES.CONSUMER, ROLES.MANUFACTURER, ROLES.ADMIN]),
    organization: z.string().optional(),
  }),
]

const STEPS = ['Personal Info', 'Select Role']

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()

  const [step,     setStep]     = useState(0)
  const [formData, setFormData] = useState({ role: ROLES.CONSUMER })

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(stepSchemas[step]),
    defaultValues: formData,
  })

  const selectedRole = watch('role') || ROLES.CONSUMER

  const nextStep = async () => {
    const valid = await trigger()
    if (!valid) return
    const values = watch()
    setFormData((prev) => ({ ...prev, ...values }))
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const prevStep = () => setStep((s) => Math.max(s - 1, 0))

  const onSubmit = async (data) => {
    const payload = {
      ...formData,
      ...data,
      password: 'User@123', // Automatic default secure password
    }
    try {
      const { user } = await registerUser(payload)
      toast.success(`Account created! Welcome, ${user.name}!`)
      const dash = {
        consumer:     ROUTES.CONSUMER_CHAT, // Jump straight into AI Assistant!
        manufacturer: ROUTES.MANUFACTURER_CHAT,
        admin:        ROUTES.ADMIN_DASHBOARD,
      }[user.role] || ROUTES.CONSUMER_CHAT
      navigate(dash)
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-slate-100 dark:bg-dark-bg py-6 sm:py-10 px-3 sm:px-4">
      <div className="w-full max-w-xl">
        <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl shadow-gov-lg overflow-hidden border border-gray-200 dark:border-dark-border">
          {/* Header */}
          <div className="bg-[linear-gradient(135deg,#00265D_0%,#003580_100%)] text-white px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group hover:opacity-90 transition-opacity min-w-0" title="Return to Home">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm sm:text-base leading-tight truncate">BIS Saarthi Portal Registration</div>
                  <div className="text-[11px] sm:text-xs text-blue-200 truncate">Bureau of Indian Standards Portal</div>
                </div>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-gov transition-colors shadow-xs shrink-0"
                title="Return to Home"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
            </div>
            {/* Progress steps */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                      i < step   ? 'bg-amber-600 border-amber-600 text-white' :
                      i === step ? 'bg-white border-white text-bis-navy' :
                                   'bg-transparent border-white/40 text-white/60'
                    )}>
                      {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={cn('text-xs hidden sm:block', i === step ? 'text-white font-semibold' : 'text-white/60')}>
                      {s}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn('flex-1 h-px', i < step ? 'bg-amber-600' : 'bg-white/30')} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Form body */}
          <div className="p-5 sm:p-8">
            <form onSubmit={step === STEPS.length - 1 ? handleSubmit(onSubmit) : (e) => { e.preventDefault(); nextStep() }}>

              {/* Step 0 — Personal Info */}
              {step === 0 && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Personal Information</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-text-muted mb-4">No password needed — quick registration for portal access.</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Full Name *</label>
                    <input {...register('name')} placeholder="e.g. Rajesh Kumar" className={cn('input-gov', errors.name && 'border-red-400')} />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Email Address *</label>
                    <input {...register('email')} type="email" placeholder="e.g. rajesh@example.com" className={cn('input-gov', errors.email && 'border-red-400')} />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Mobile Number *</label>
                    <div className="flex gap-2">
                      <span className="input-gov w-16 text-center flex items-center justify-center bg-gray-50 dark:bg-dark-bg-secondary font-medium">+91</span>
                      <input {...register('phone')} placeholder="9876543210" className={cn('input-gov flex-1', errors.phone && 'border-red-400')} />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                  </div>
                </div>
              )}

              {/* Step 1 — Role Selection */}
              {step === 1 && (
                <div className="animate-fade-in">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Select Your Role</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-text-muted mb-5">Choose how you plan to use the BIS Saarthi AI portal.</p>
                  <div className="space-y-3">
                    {ROLE_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      const isSelected = selectedRole === opt.value
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            'flex items-center gap-4 p-4 border-2 rounded-gov-lg cursor-pointer transition-all',
                            isSelected
                              ? 'border-bis-navy bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-slate-600'
                          )}
                        >
                          <input
                            type="radio"
                            value={opt.value}
                            {...register('role')}
                            onChange={() => setValue('role', opt.value)}
                            className="sr-only"
                          />
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                            isSelected ? 'bg-bis-navy text-white' : 'bg-gray-100 dark:bg-dark-border text-gray-500 dark:text-dark-text-muted'
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</div>
                            <div className="text-xs text-gray-500 dark:text-dark-text-muted">{opt.desc}</div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-bis-navy dark:text-blue-400" />}
                        </label>
                      )
                    })}
                  </div>
                  {selectedRole === ROLES.MANUFACTURER && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Organization / Enterprise Name</label>
                      <input {...register('organization')} placeholder="e.g. RK Manufacturing Enterprises" className="input-gov" />
                    </div>
                  )}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8 pt-5 border-t border-gray-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={prevStep}
                  className={cn('btn-gov-outline', step === 0 && 'invisible')}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn('btn-gov', isLoading && 'opacity-70 cursor-not-allowed')}
                >
                  {isLoading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account...</>
                  ) : step === STEPS.length - 1 ? (
                    <><UserPlus className="w-4 h-4" /> Complete &amp; Launch AI Assistant</>
                  ) : (
                    <>Next <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-dark-border text-sm">
              <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 dark:text-dark-text-muted hover:text-bis-navy dark:hover:text-blue-400 font-medium transition-colors">
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </Link>
              <p className="text-gray-500 dark:text-dark-text-muted">
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="text-bis-navy dark:text-blue-400 font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
