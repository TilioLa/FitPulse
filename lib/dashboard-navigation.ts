export type DashboardSection =
  | 'feed'
  | 'session'
  | 'programs'
  | 'routines'
  | 'exercises'

export function viewToSection(view: string | null): DashboardSection | null {
  switch (view) {
    case 'feed':
      return 'feed'
    case 'recommendations':
      return 'programs'
    case 'session':
      return 'session'
    case 'programs':
      return 'programs'
    case 'routines':
      return 'routines'
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
