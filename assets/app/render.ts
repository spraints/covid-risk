import {Country, Province, County} from './locations'
import {DateCount, Model} from './model'

type Cases = {
  name: string
  population?: number | null
  cases: DateCount[]
}

export async function render(country: Country | null, province: Province | null, county: County | null) {
  const graph = document.querySelector('.graph') as HTMLDivElement

  if (!country) {
    graph.innerText = ''
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
    graph.innerHTML =
      factRow('Population', data.population) +
      factRow('Cases', `${model.last[1]} as of ${model.last[0]}`) +
      factRow('Last week', `${model.lastWeekCount} since ${model.previous[0]}`) +
      '<br>' +
      factRow(m('P<sub>1</sub>'), fmtPct(model.p(1))) +
      factRow(m('P<sub>10</sub>'), fmtPct(model.p(10))) +
      factRow(m('P<sub>100</sub>'), fmtPct(model.p(100))) +
      factRow(m('P<sub>1000</sub>'), fmtPct(model.p(1000))) +
      factRow(`${m('n')}, when ${m('P<sub>n</sub>')} < ${pn}%`, Math.round(model.n(pn/100.0)))
  } else {
    const model = new Model(data.cases, 0)

    graph.innerHTML =
      `<h4>${data.name}</h4>` +
      `<p>Population: not available</p>` +
      `<p>Cases: ${model.last[1]} as of ${model.last[0]}</p>` +
      `<p>Last week: ${model.lastWeekCount} since ${model.previous[0]}</p>`
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

function factRow(label: string, data: any): string {
  return '<div class="row">' +
    `<div class="col-sm-2"><b>${label}</b></div>` +
    `<div class="col-sm-6">${data}</div>` +
  '</div>'
}

function m(expr: string): string {
  return `<span class="math">${expr}</span>`
}

function fmtPct(p: number): string {
  return `${(100.0 * p).toFixed(2)} %`
}
