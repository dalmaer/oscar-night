import nominationsData from '../../data/nominations-2026.json'
import type { NominationsData } from '@/types'

export const nominations = nominationsData as NominationsData

export function getCategoryById(categoryName: string) {
  return nominations.categories.find(c => c.name === categoryName)
}

export function getNomineeId(categoryName: string, nominee: Record<string, string | undefined>): string {
  // Create a unique ID from category + primary identifier
  const primary = nominee.name || nominee.film || nominee.song || ''
  return `${categoryName}::${primary}`.toLowerCase().replace(/\s+/g, '-')
}

export function getNomineeDisplayName(nominee: Record<string, string | undefined>): string {
  // For acting categories, show person name
  if (nominee.name) return nominee.name
  // For most other categories, show film
  if (nominee.film) return nominee.film
  // For songs
  if (nominee.song) return nominee.song
  return 'Unknown'
}

export function getNomineeSecondaryInfo(nominee: Record<string, string | undefined>): string | null {
  // For acting categories, show film
  if (nominee.name && nominee.film) return nominee.film
  // For technical categories, show the person
  if (nominee.director) return nominee.director
  if (nominee.cinematographer) return nominee.cinematographer
  if (nominee.composer) return nominee.composer
  if (nominee.writers) return nominee.writers
  if (nominee.producers) return nominee.producers
  if (nominee.creators) return nominee.creators
  if (nominee.country) return nominee.country
  if (nominee.credits) return nominee.credits
  return null
}
