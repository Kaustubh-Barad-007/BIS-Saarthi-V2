import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to Indian locale
 */
export function formatDate(date, options = {}) {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

/**
 * Format datetime
 */
export function formatDateTime(date) {
  const d = new Date(date)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Truncate text
 */
export function truncate(str, maxLength = 100) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

/**
 * Get user initials for avatar
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/**
 * Get role badge color
 */
export function getRoleColor(role) {
  const colors = {
    consumer:     'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    manufacturer: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    professional: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    admin:        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }
  return colors[role] || 'bg-gray-100 text-gray-800 dark:text-white'
}

/**
 * Get role display name
 */
export function getRoleLabel(role) {
  const labels = {
    consumer:     'Consumer (General Public)',
    manufacturer: 'MSME / Manufacturer',
    professional: 'Professional / Exporter',
    admin:        'BIS Official (Admin)',
  }
  return labels[role] || role
}

/**
 * Get role icon name
 */
export function getRoleIcon(role) {
  const icons = {
    consumer:     'User',
    manufacturer: 'Building2',
    professional: 'Briefcase',
    admin:        'Shield',
  }
  return icons[role] || 'User'
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Sleep utility
 */
export const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * Generate random ID
 */
export function genId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Validate Indian mobile number
 */
export function isValidMobile(num) {
  return /^[6-9]\d{9}$/.test(num)
}

/**
 * Status badge class
 */
export function getStatusClass(status) {
  const map = {
    active:   'status-active',
    approved: 'status-approved',
    pending:  'status-pending',
    rejected: 'status-rejected',
    inactive: 'status-rejected',
  }
  return `badge-gov px-2 py-0.5 ${map[status] || 'bg-gray-100 text-gray-600'}`
}
