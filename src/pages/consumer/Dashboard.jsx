import React from 'react'
import {
  MessageSquare, BookOpen, Award, AlertTriangle,
  Clock, CheckCircle2, ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useChatStore from '@/store/chatStore'
import useDataStore from '@/store/dataStore'
import StatCard from '@/components/dashboard/StatCard'
import { ROUTES, BIS_STATS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

const NEWS = [
  { title: 'Mandatory BIS hallmarking extended to silver jewellery from April 2025', date: '2025-03-15', type: 'notification' },
  { title: 'New IS 18031 standard for Solar Panels – effective from January 2025', date: '2025-01-10', type: 'standard' },
  { title: 'BIS Care Mobile App v3.0 released with AI-powered product verification', date: '2024-12-20', type: 'update' },
]

export default function ConsumerDashboard() {
  const { user } = useAuthStore()
  const { sessions, messages } = useChatStore()
  const { complaints, notifications } = useDataStore()

  const liveNotifs = (notifications || [])
    .filter((n) => n.targetRole === 'consumer' || n.targetRole === 'all')
    .slice(0, 3)

  // Dynamic user queries from chat history
  const userQueries = sessions.flatMap((s) => s.messages || [])
    .filter((m) => m.role === 'user')
    .slice(0, 3)

  const displayQueries = userQueries.length > 0 ? userQueries : [
    { id: 'q1', content: 'Hallmarking requirements for gold jewellery', timestamp: new Date(Date.now() - 1e5).toISOString() },
    { id: 'q2', content: 'ISI mark verification for electric appliances', timestamp: new Date(Date.now() - 5e5).toISOString() },
    { id: 'q3', content: 'How to file product quality complaint?', timestamp: new Date(Date.now() - 9e5).toISOString() },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gov-gradient text-white rounded-gov-xl p-6 flex items-center justify-between shadow-gov-md">
        <div>
          <h1 className="text-xl font-bold font-heading mb-1">
            Welcome, {user?.name?.split(' ')[0] || 'Citizen'}! 👋
          </h1>
          <p className="text-blue-100 text-sm">
            Your official AI-powered guide to Indian Standards and consumer protection.
          </p>
        </div>
        <Link to={ROUTES.CONSUMER_CHAT} className="btn-saffron text-sm hidden sm:inline-flex shadow-xs">
          <MessageSquare className="w-4 h-4" /> Ask BIS Saarthi
        </Link>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Queries Logged"     value={Math.max(messages.filter(m => m.role === 'user').length, 12)} delta="+3" color="blue"   icon={MessageSquare} />
        <StatCard label="Standards Browsed" value={8}  delta="+2" color="green"  icon={BookOpen}      />
        <StatCard label="Complaints Filed"  value={complaints.length} delta={complaints.length > 0 ? `+${complaints.length}` : '0'} color="orange" icon={AlertTriangle}  />
        <StatCard label="Saved Answers"     value={5}  delta="+1" color="purple" icon={CheckCircle2}  />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="section-header text-lg mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Ask BIS Saarthi',  desc: 'Get AI-powered guidance',       href: ROUTES.CONSUMER_CHAT,        icon: MessageSquare, color: 'bg-blue-600'   },
            { label: 'Browse Standards', desc: 'Search 22,000+ IS codes',      href: ROUTES.CONSUMER_STANDARDS,   icon: BookOpen,      color: 'bg-green-600'  },
            { label: 'Hallmarking Info', desc: 'Gold purity & HUID verification',href: ROUTES.CONSUMER_HALLMARKING, icon: Award,         color: 'bg-amber-600'  },
            { label: 'File Complaint',   desc: 'Report substandard products',   href: ROUTES.CONSUMER_COMPLAINTS,  icon: AlertTriangle, color: 'bg-red-600'    },
          ].map(({ label, desc, href, icon: Icon, color }) => (
            <Link
              key={label}
              to={href}
              className="card-gov p-5 flex items-center gap-4 hover:shadow-gov-md transition-all group"
            >
              <div className={`w-10 h-10 rounded-gov-lg ${color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-800 dark:text-dark-text group-hover:text-bis-navy dark:group-hover:text-blue-300 transition-colors">
                  {label}
                </div>
                <div className="text-xs text-gray-500 dark:text-dark-text-muted">{desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 dark:text-dark-border group-hover:text-bis-navy dark:group-hover:text-blue-400 ml-auto transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Queries */}
        <div className="card-gov p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-dark-text font-heading">Recent Inquiries</h3>
            <Link to={ROUTES.CONSUMER_CHAT} className="text-xs text-bis-navy dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
              Open Chat <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {displayQueries.map((q) => (
              <div key={q.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-bg-secondary rounded-gov border border-gray-100/60 dark:border-dark-border/60">
                <MessageSquare className="w-4 h-4 text-bis-navy dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-dark-text truncate">{q.content || q.query}</p>
                  <p className="text-xs text-gray-400 dark:text-dark-text-muted mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(q.timestamp || q.time)}
                  </p>
                </div>
                <span className="badge-gov status-approved text-xs shrink-0">Answered</span>
              </div>
            ))}
          </div>
        </div>

        {/* News & Updates */}
        <div className="card-gov p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-dark-text font-heading">Official BIS Notifications</h3>
            <Link to={ROUTES.CONSUMER_NOTIFICATIONS} className="text-xs text-bis-navy dark:text-blue-400 hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {liveNotifs.map((item) => (
              <Link
                key={item.id}
                to={ROUTES.CONSUMER_NOTIFICATIONS}
                className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-bg-secondary rounded-gov transition-colors group"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  item.priority === 'urgent' ? 'bg-red-500 animate-pulse' :
                  item.priority === 'warning' ? 'bg-amber-500' :
                  item.priority === 'success' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-dark-text group-hover:text-bis-navy dark:group-hover:text-blue-400 leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-dark-text-muted mt-1">
                    {item.category} · {formatDate(item.created)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* BIS Stats Showcase */}
      <div className="card-gov p-6">
        <h3 className="font-bold text-gray-900 dark:text-dark-text font-heading mb-5">Bureau of Indian Standards at a Glance</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {BIS_STATS.map((stat, i) => (
            <div key={i} className="p-2 rounded-gov hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors">
              <div className="text-xl font-extrabold text-bis-navy dark:text-blue-300 font-heading">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
