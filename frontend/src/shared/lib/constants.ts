export const EDUCATION_FORMS = ['FULL_TIME', 'PART_TIME'] as const

export const EDUCATION_FORM_LABELS: Record<string, string> = {
  FULL_TIME: 'Очная',
  PART_TIME: 'Заочная',
}

export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  BACHELOR: 'Бакалавриат',
  MASTER: 'Магистратура',
}

export const VKR_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  UNASSIGNED: { label: 'Не распределена', color: 'default' },
  ASSIGNED: { label: 'Закреплена', color: 'blue' },
  ON_APPROVAL: { label: 'На утверждении', color: 'orange' },
  APPROVED: { label: 'Утверждена', color: 'green' },
  REJECTED: { label: 'Отклонена', color: 'red' },
}

export const DEGREE_LABELS: Record<string, string> = {
  CANDIDATE_TECHNICAL: 'Кандидат технических наук',
  CANDIDATE_ECONOMIC: 'Кандидат экономических наук',
  CANDIDATE_PHYSICS_MATH: 'Кандидат физико-математических наук',
  DOCTOR_TECHNICAL: 'Доктор технических наук',
  DOCTOR_ECONOMIC: 'Доктор экономических наук',
  DOCTOR_PHYSICS_MATH: 'Доктор физико-математических наук',
}

export const POSITION_LABELS: Record<string, string> = {
  ASSOCIATE_PROFESSOR: 'Доцент',
  PROFESSOR: 'Профессор',
  SENIOR_LECTURER: 'Старший преподаватель',
}

export const ROLE_OPTIONS = [
  { value: 'PRACTICE_SUPERVISOR', label: 'Руководитель практики' },
  { value: 'THESIS_SUPERVISOR', label: 'Руководитель ВКР' },
  { value: 'HEAD_OF_DEPARTMENT', label: 'Заведующий кафедрой' },
]

export const getCourseByForm = (educationForm: string, educationLevel: string): number => {
  if (educationLevel === 'MASTER') return 2
  if (educationForm === 'PART_TIME') return 5
  return 4
}
