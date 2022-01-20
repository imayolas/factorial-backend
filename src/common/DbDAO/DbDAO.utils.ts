export const isDateString = (dateString: string): boolean => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.valueOf())
}

export const dateToClickhouseDateString = (date: string | Date): string => {
  if (typeof date === "string") {
    date = new Date(date)
  }
  return date.toISOString().substring(0, 19).replace("T", " ")
}
