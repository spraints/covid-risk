export type DateCount = [string, number]

export class Model {
  cases: DateCount[]
  population: number

  constructor(cases: DateCount[], population: number) {
    this.cases = cases
    this.population = population
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
    return 2 * this.lastWeekCount / this.population
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
