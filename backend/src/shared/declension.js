import { incline } from 'lvovich'

const WORKPLACE_GEN = {
  кафедра: 'кафедры',
  заведующая: 'заведующую',
  заведующий: 'заведующего',
  декан: 'декана',
  проректор: 'проректора',
  директор: 'директора',
  ректор: 'ректора',
  профессор: 'профессора',
  доцент: 'доцента',
}

export function declineWorkplace(workplace) {
  if (!workplace) return workplace
  const i = workplace.indexOf(' ')
  const first = i === -1 ? workplace : workplace.slice(0, i)
  const rest = i === -1 ? '' : workplace.slice(i)
  const declined = WORKPLACE_GEN[first.toLowerCase()]
  return declined ? declined + rest : workplace
}

export function toAccusative(lastName, firstName, middleName) {
  const declined = incline(
    { last: lastName, first: firstName, middle: middleName ?? undefined },
    'accusative',
  )
  return [
    (declined.last ?? lastName).toUpperCase(),
    declined.first ?? firstName,
    middleName ? (declined.middle ?? middleName) : null,
  ]
    .filter(Boolean)
    .join(' ')
}
