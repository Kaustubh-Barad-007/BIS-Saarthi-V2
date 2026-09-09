import React from 'react'
import { MessageSquare, Globe, TrendingUp, Briefcase, ArrowRight, FileText, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import StatCard from '@/components/dashboard/StatCard'
import { ROUTES } from '@/lib/constants'

export default function ProfessionalDashboard() {
  const { user } = useAuthStore()
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-gov-xl p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading mb-1">Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-purple-200 text-sm">{user?.organization || 'Professional / Exporter Portal'}</p>
        </div>
        <Link to={ROUTES.PROFESSIONAL_CHAT} className="bg-white dark:bg-dark-bg-card text-purple-600 font-semibold text-sm px-4 py-2.5 rounded-gov hover:bg-purple-50 transition-colors hidden sm:flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> AI Assistant
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Queries This Month" value={34}  delta="+8"  color="blue"   icon={MessageSquare} />
        <StatCard label="Standards Reviewed"  value={12}  delta="+4"  color="purple" icon={FileText}      />
        <StatCard label="Export Enquiries"    value={5}   delta="+2"  color="green"  icon={Globe}         />
        <StatCard label="Saved References"    value={28}  delta="+10" color="orange" icon={CheckCircle2}  />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'BIS Saarthi AI',   href: ROUTES.PROFESSIONAL_CHAT, icon: MessageSquare, desc: 'Expert-level queries', color: 'text-blue-500'   },
          { label: 'Export Guidance',  href: ROUTES.PROFESSIONAL_EXPORT, icon: Globe,        desc: 'International standards',  color: 'text-green-500'  },
          { label: 'QCO Lookup',       href: ROUTES.PROFESSIONAL_CHAT, icon: TrendingUp,    desc: 'Quality Control Orders', color: 'text-purple-500' },
        ].map(({ label, href, icon: Icon, desc, color }) => (
          <Link key={label} to={href} className="card-gov p-5 hover:shadow-gov-md group transition-all">
            <Icon className={`w-6 h-6 ${color} mb-3`} />
            <div className="font-semibold text-gray-800 dark:text-dark-text group-hover:text-bis-navy dark:group-hover:text-blue-300 transition-colors">{label}</div>
            <div className="text-xs text-gray-400 dark:text-dark-text-muted mt-0.5">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
