export type DashboardSection =
  | 'feed'
  | 'history'
  | 'session'
  | 'programs'
  | 'routines'
  | 'settings'
  | 'exercises'

export function viewToSection(view: string | null): DashboardSection | null {
  switch (view) {
    case 'feed':
      return 'feed'
    case 'history':
      return 'history'
    case 'session':
      return 'session'
    case 'programs':
      return 'programs'
    case 'routines':
      return 'routines'
    case 'settings':
      return 'settings'
    case 'exercises':
      return 'exercises'
    default:
      return null
  }
}

export function sectionToView(section: DashboardSection): string {
  return section
}

export function hrefForDashboardSection(section: DashboardSection): string {
  if (section === 'exercises') return '/exercices'
  return `/dashboard?view=${sectionToView(section)}`
}
