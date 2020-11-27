import {DateCount} from './types'

type Options = {
  c?: number
}

export class Model {
  cases: DateCount[]
  population: number
  c: number

  constructor(cases: DateCount[], population: number, {c = 2}: Options = {}) {
    this.cases = cases
    this.population = population
    this.c = c
  }

  p(n: number) {
    return 1 - Math.pow(1 - this.p1, n)
  }

  pDate(n: number, date: Date) {
    return 1 - Math.pow(1 - this.p1Date(date), n)
  }

  n(p: number) {
    // Pn = 1 - (1 - p)^n
    // 1 - Pn = (1 - p)^n
    // log(1 - Pn) = n * log(1 - p)
    // n = log(1 - Pn) / log(1 - p)
    return Math.log(1 - p) / Math.log(1 - this.p1)
  }

  get p1(): number {
    return this.c * this.lastWeekCount / this.population
  }

  p1Date(date: Date): number {
    return this.c * this.prevWeekCount(date) / this.population
  }

  get last(): DateCount {
    return this.cases[this.cases.length - 1]
  }

  get lastDate(): Date {
    const dateString = this.last[0]
    if (dateString) {
      const [y, m, d] = dateString.split("-")
      if (d) {
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
      }
    }
    return new Date()
  }

  get lastWeekCount(): number {
    return this.last[1] - this.previous[1]
  }

  prevWeekCount(date: Date): number {
    const dateStr = date.toISOString().split('T')[0]
    for (let n = this.cases.length - 1; n >= 0; n--) {
      const cases = this.cases[n]
      if (cases[0] > dateStr) continue
      if (n < 8) return cases[1]
      return cases[1] - this.cases[n - 8][1]
    }
    return 0
  }

  get previous(): DateCount {
    return (this.cases.length > 7) ? this.cases[this.cases.length - 8] : ['', 0]
  }
}
