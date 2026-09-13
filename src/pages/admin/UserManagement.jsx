import React, { useState } from 'react'
import {
  Users, Search, Plus, Edit2, Trash2, Shield, User,
  Building2, Filter, CheckCircle2, XCircle, X, UserCheck, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, getRoleLabel, getRoleColor, formatDate } from '@/lib/utils'
import { ROLES } from '@/lib/constants'
import useDataStore from '@/store/dataStore'
import { useTranslation } from '@/lib/i18n'

const ROLE_ICON = { [ROLES.CONSUMER]: User, [ROLES.MANUFACTURER]: Building2, [ROLES.ADMIN]: Shield }

export default function UserManagement() {
  const { t } = useTranslation()
  const { users, addUser, updateUser, toggleUserStatus, deleteUser, syncWithDb, isDbSyncing, lastSyncedAt } = useDataStore()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: ROLES.CONSUMER,
    org: '',
    status: 'active',
  })

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.org && u.org.toLowerCase().includes(q))) &&
      (!roleFilter || u.role === roleFilter)
    )
  })

  const handleToggleStatus = (id) => {
    toggleUserStatus(id)
    toast.success('User status updated in real-time database')
  }

  const handleDeleteUser = (id) => {
    deleteUser(id)
    toast.success('User deleted from real-time database')
  }

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error('Name and email are required')
      return
    }

    addUser({
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      org: newUser.org.trim() || '-',
      status: newUser.status,
    })

    toast.success(`User ${newUser.name} registered and saved to database!`)
    setShowCreate(false)
    setNewUser({ name: '', email: '', role: ROLES.CONSUMER, org: '', status: 'active' })
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editUser.name.trim() || !editUser.email.trim()) {
      toast.error('Name and email are required')
      return
    }

    updateUser(editUser.id, {
      name: editUser.name.trim(),
      email: editUser.email.trim(),
      role: editUser.role,
      org: editUser.org?.trim() || '-',
      status: editUser.status,
    })

    toast.success(`User ${editUser.name} updated in database!`)
    setEditUser(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">{t('User Management', 'User Management')}</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live DB Synced (5s)
            </span>
            <button
              onClick={() => syncWithDb()}
              disabled={isDbSyncing}
              title="Force sync now"
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDbSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            {users.length} {t('total registered users across all roles (Real-Time Database)', 'total registered users across all roles (Real-Time Database)')}
            {lastSyncedAt && <span className="ml-2 text-xs">· Synced {new Date(lastSyncedAt).toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gov bg-red-600 hover:bg-red-700 text-sm">
          <Plus className="w-4 h-4" /> {t('Add User', 'Add User')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search by name, email, or organization...', 'Search by name, email, or organization...')}
            className="input-gov pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-gov w-full sm:w-48"
        >
          <option value="">{t('All Roles', 'All Roles')}</option>
          <option value={ROLES.CONSUMER}>{t('Consumer', 'Consumer')}</option>
          <option value={ROLES.MANUFACTURER}>{t('Manufacturer', 'Manufacturer')}</option>
          <option value={ROLES.ADMIN}>{t('Admin', 'Admin')}</option>
        </select>
      </div>

      {/* Users table */}
      <div className="card-gov overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-bg-secondary border-b border-gray-100 dark:border-dark-border">
              <tr>
                {[
                  { key: 'User', label: t('User', 'User') },
                  { key: 'Role', label: t('Role', 'Role') },
                  { key: 'Organization', label: t('Organization', 'Organization') },
                  { key: 'Joined', label: t('Joined', 'Joined') },
                  { key: 'Status', label: t('Status', 'Status') },
                  { key: 'Actions', label: t('Actions', 'Actions') }
                ].map((h) => (
                  <th key={h.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {filtered.map((user) => {
                const Icon = ROLE_ICON[user.role] || User
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400 shrink-0">
                          {user.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-dark-text">{user.name}</div>
                          <div className="text-xs text-gray-400 dark:text-dark-text-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge-gov px-2 py-0.5 text-xs flex items-center gap-1 w-fit', getRoleColor(user.role))}>
                        <Icon className="w-3 h-3" />
                        {t(user.role, user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-dark-text-muted">{user.org || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-dark-text-muted">{formatDate(user.created)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge-gov px-2 py-0.5 text-xs', user.status === 'active' ? 'status-active' : 'status-rejected')}>
                        {t(user.status, user.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-bg-card transition-colors"
                          title={user.status === 'active' ? t('Deactivate', 'Deactivate') : t('Activate', 'Activate')}
                        >
                          {user.status === 'active'
                            ? <XCircle className="w-4 h-4 text-red-400 hover:text-red-500" />
                            : <CheckCircle2 className="w-4 h-4 text-green-500 hover:text-green-600" />
                          }
                        </button>
                        <button
                          onClick={() => setEditUser(user)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-bg-card transition-colors text-gray-400 hover:text-bis-navy dark:hover:text-blue-300"
                          title={t('Edit User Details', 'Edit user')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-400 hover:text-red-500"
                          title={t('Delete User', 'Delete user')}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-border text-xs text-gray-400 dark:text-dark-text-muted flex justify-between items-center">
          <span>{t('Showing', 'Showing')} {filtered.length} {t('of', 'of')} {users.length} {t('users', 'users')}</span>
          <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">● {t('Real-time sync active', 'Real-time sync active')}</span>
        </div>
      </div>

      {/* ── Add User Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white font-heading">{t('Add New Portal User', 'Add New Portal User')}</h3>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Full Name', 'Full Name')} *</label>
                <input
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="input-gov"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Email Address', 'Email Address')} *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. ramesh@example.com"
                  className="input-gov"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Portal Role', 'Portal Role')}</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="input-gov"
                  >
                    <option value={ROLES.CONSUMER}>{t('Consumer', 'Consumer')}</option>
                    <option value={ROLES.MANUFACTURER}>{t('Manufacturer', 'Manufacturer')}</option>
                    <option value={ROLES.ADMIN}>{t('Admin', 'Admin')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Status', 'Status')}</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                    className="input-gov"
                  >
                    <option value="active">{t('Active', 'Active')}</option>
                    <option value="inactive">{t('Inactive', 'Inactive')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Organization (Optional)', 'Organization (Optional)')}</label>
                <input
                  value={newUser.org}
                  onChange={(e) => setNewUser({ ...newUser, org: e.target.value })}
                  placeholder="e.g. Patel Engineering Ltd"
                  className="input-gov"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-gov-outline text-xs py-2"
                >
                  {t('Cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-gov bg-red-600 hover:bg-red-700 text-xs py-2"
                >
                  {t('Create User', 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white font-heading">{t('Edit User Details', 'Edit User Details')}</h3>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Full Name', 'Full Name')} *</label>
                <input
                  required
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="input-gov"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Email Address', 'Email Address')} *</label>
                <input
                  type="email"
                  required
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="input-gov"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Portal Role', 'Portal Role')}</label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    className="input-gov"
                  >
                    <option value={ROLES.CONSUMER}>{t('Consumer', 'Consumer')}</option>
                    <option value={ROLES.MANUFACTURER}>{t('Manufacturer', 'Manufacturer')}</option>
                    <option value={ROLES.ADMIN}>{t('Admin', 'Admin')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Status', 'Status')}</label>
                  <select
                    value={editUser.status}
                    onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                    className="input-gov"
                  >
                    <option value="active">{t('Active', 'Active')}</option>
                    <option value="inactive">{t('Inactive', 'Inactive')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Organization', 'Organization')}</label>
                <input
                  value={editUser.org || ''}
                  onChange={(e) => setEditUser({ ...editUser, org: e.target.value })}
                  className="input-gov"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="btn-gov-outline text-xs py-2"
                >
                  {t('Cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-gov text-xs py-2"
                >
                  {t('Save Changes', 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete User Confirmation Dialog ── */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                  {t('Delete User Account?', 'Delete User Account?')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                  {t('Permanent removal from database', 'Permanent removal from database')}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-text-muted mb-5 leading-relaxed">
              {t('Are you sure you want to delete', 'Are you sure you want to delete')} <strong className="text-gray-900 dark:text-white">&ldquo;{userToDelete.name}&rdquo;</strong> ({userToDelete.email})? {t('This action will remove their profile and revoke access immediately.', 'This action will remove their profile and revoke access immediately.')}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                {t('Cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteUser(userToDelete.id)
                  setUserToDelete(null)
                }}
                className="btn-gov bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3"
              >
                {t('Delete User', 'Delete User')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
