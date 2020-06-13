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
    const model = new Model(data.cases, data.population)

    graph.innerHTML =
      factRow('Population', data.population) +
      factRow('Cases', model.last[1]) +
      factRow('Last week', model.lastWeekCount) +
      factRow('', `${model.previous[0]} - ${model.last[0]}`) +
      '<br>' +
      factRow(m('P<sub>10</sub>'), fmtPct(model.p(10))) +
      factRow(m('P<sub>100</sub>'), fmtPct(model.p(100))) +
      factRow(m('P<sub>1000</sub>'), fmtPct(model.p(1000))) +
      factRow(`${m('n')}, when ${m('P<sub>n</sub>')} < 5%`, Math.round(model.n(0.05)))
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

function factRow(label: string, data: any): string {
  return '<div class="row">' +
    `<div class="col-2">${label}</div>` +
    `<div class="col-4">${data}</div>` +
  '</div>'
}

function m(expr: string): string {
  return `<span class="math">${expr}</span>`
}

function fmtPct(p: number): string {
  return `${(100.0 * p).toFixed(2)} %`
}
