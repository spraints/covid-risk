import {Country, Province, County} from './locations'
import {DateCount, Model} from './model'

type Cases = {
  name: string
  population?: number | null
  cases: DateCount[]
}

export async function render(country: Country | null, province: Province | null, county: County | null) {
  const report = document.querySelector('.report') as HTMLDivElement

  if (!country) {
    report.innerText = ''
    return
  }

  let url = `/data/cases/${country.name}`
  if (province) {
    url = url + '/' + province.name
    if (county) {
      url = url + '/' + county.name
    }
  }
  //url = url + '.json?' + Math.floor(Date.now() / 3600 / 1000)
  url = url + '.json?' + Date.now()

  const response = await fetch(url)
  if (!response.ok) throw new Error('error getting ' + url)
  const data: Cases = await response.json()

  if (data.population) {
    const model = new Model(data.cases, data.population, {c: getC()})

    const pn = getPn()
    report.innerHTML =
      factRow('Population', data.population) +
      factRow('Cases', model.last[1], `as of ${model.last[0]}`) +
      factRow('Last week', model.lastWeekCount, `since ${model.previous[0]}`) +
      '<br>' +
      pctRow(m('P<sub>1</sub>'), model.p(1)) +
      pctRow(m('P<sub>10</sub>'), model.p(10)) +
      pctRow(m('P<sub>100</sub>'), model.p(100)) +
      pctRow(m('P<sub>1000</sub>'), model.p(1000)) +
      '<br>' +
      factRow(`${m('n')} when ${m('P<sub>n</sub>')} < ${pn}%`, Math.round(model.n(pn/100.0)))
  } else {
    const model = new Model(data.cases, 0)

    report.innerHTML =
      factRow('Population', 'not available') +
      factRow('Cases', model.last[1], `as of ${model.last[0]}`) +
      factRow('Last week', model.lastWeekCount, `since ${model.previous[0]}`)
  }

  // TODO! d3!
}

function getC(): number {
  const el = document.querySelector('.js-c') as HTMLInputElement
  if (el) return parseFloat(el.value)
  return 2
}

function getPn(): number {
  const el = document.querySelector('.js-pn') as HTMLInputElement
  if (el) return parseFloat(el.value)
  return 5
}

function factRow(label: string, data: any, note?: string): string {
  return '<div class="row fact">' +
    `<div class="col-sm-2 fact-name">${label}</div>` +
    `<div class="col-sm-2 fact-value">${data}</div>` +
    (note ? `<div class="col-sm-8 fact-note">${note}</div>` : '') +
  '</div>'
}

function pctRow(label: string, p: number): string {
  return factRow(label, `${(100.0 * p).toFixed(2)} %`)
}

function m(expr: string): string {
  return `<span class="math">${expr}</span>`
}
