export function getCurrentGraduationYear() {
  const now = new Date()
  return now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear()
}
