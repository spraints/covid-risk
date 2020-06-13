export type Cases = {
  name: string
  population?: number | null
  cases: DateCount[]
}

export type DateCount = [string, number]
