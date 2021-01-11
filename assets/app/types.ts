export type Cases = {
  name: string
  population?: number | null
  cases: DateCount[]
}

export type Deaths = {
  name: string
  population?: number | null
  deaths: DateCount[]
}

export type DateCount = [string, number]
