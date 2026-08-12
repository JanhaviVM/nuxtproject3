import { FilterMatchMode } from '@primevue/core/api'

const getValue = (filter: any) => {
  const value = filter.constraints?.[0]?.value ?? filter.value
  if (value == null || value === '') return null
  if (Array.isArray(value) && value.length === 0) return null
  return value
}

const getMatchMode = (filter: any) =>
  filter.constraints?.[0]?.matchMode ?? filter.matchMode ?? FilterMatchMode.IN

export const buildHasuraWhere = (filters: Record<string, any>, globalSearch: string | null = null) => {
  const where: Record<string, any> = {}

  if (globalSearch) {
    const term = `%${globalSearch}%`
    where._or = [
      { title: { _ilike: term } },
      { details: { _ilike: term } },
      { statuses: { name: { _ilike: term } } },
    ]
  }

  for (const [field, filter] of Object.entries(filters)) {
    const value = getValue(filter)
    if (value == null) continue

    if (field === 'custom_days') {
      where.custom_days = { _overlap: value }
      continue
    }

    const matchMode = getMatchMode(filter)

    if (matchMode === FilterMatchMode.EQUALS) {
      where[field] = { _eq: value }
    } else if (matchMode === FilterMatchMode.NOT_EQUALS) {
      where[field] = { _nin: Array.isArray(value) ? value : [value] }
    } else if (matchMode === FilterMatchMode.CONTAINS) {
      where[field] = { _ilike: `%${value}%` }
    } else {
      where[field] = { _in: Array.isArray(value) ? value : [value] }
    }
  }

  return where
}
