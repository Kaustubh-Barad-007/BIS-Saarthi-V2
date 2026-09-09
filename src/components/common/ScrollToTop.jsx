import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    // If there is an anchor hash (e.g. #about, #roles), scroll to that specific element
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }

    // Always reset window to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    // Also reset inner scrollable main containers
    const scrollContainers = document.querySelectorAll('#main-content, main, .overflow-y-auto')
    scrollContainers.forEach((el) => {
      if (el && typeof el.scrollTo === 'function') {
        el.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
    })
  }, [pathname, search, hash])

  return null
}
