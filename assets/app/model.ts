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

  get last(): DateCount {
    return this.cases[this.cases.length - 1]
  }

  get lastWeekCount(): number {
    return this.last[1] - this.previous[1]
  }

  get previous(): DateCount {
    return (this.cases.length > 7) ? this.cases[this.cases.length - 8] : ['', 0]
  }
}
