export const DEGREE_GEN = {
  CANDIDATE_TECHNICAL: 'кандидата технических наук',
  CANDIDATE_ECONOMIC: 'кандидата экономических наук',
  CANDIDATE_PHYSICS_MATH: 'кандидата физико-математических наук',
  DOCTOR_TECHNICAL: 'доктора технических наук',
  DOCTOR_ECONOMIC: 'доктора экономических наук',
  DOCTOR_PHYSICS_MATH: 'доктора физико-математических наук',
}

export const POSITION_GEN = {
  ASSOCIATE_PROFESSOR: 'доцента',
  PROFESSOR: 'профессора',
  SENIOR_LECTURER: 'старшего преподавателя',
}

export const DEGREE_SHORT = {
  CANDIDATE_TECHNICAL: 'канд. техн. наук',
  CANDIDATE_ECONOMIC: 'канд. эконом. наук',
  CANDIDATE_PHYSICS_MATH: 'канд. физ.-мат. наук',
  DOCTOR_TECHNICAL: 'доктор техн. наук',
  DOCTOR_ECONOMIC: 'доктор эконом. наук',
  DOCTOR_PHYSICS_MATH: 'доктор физ.-мат. наук',
}

export const POSITION_NOM = {
  ASSOCIATE_PROFESSOR: 'доцент',
  PROFESSOR: 'профессор',
  SENIOR_LECTURER: 'старший преподаватель',
}

export const getCourse = (educationLevel, educationForm) => {
  if (educationLevel === 'MASTER') return 2
  if (educationForm === 'PART_TIME') return 5
  return 4
}
