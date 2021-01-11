import {Cases, DateCount, Deaths} from './types'
import {Country, Province, County} from './locations'
import {Model} from './model'
import {renderRGraph} from './render-r-graph'
import {renderPGraph} from './render-p-graph'
import {renderHistPGraph} from './render-hist-p-graph'

let lastFetch: AbortController | null = null

const INITIAL_SUMMARY_POPULATION_SIZE = 20

export async function render(country: Country | null, province: Province | null, county: County | null, version: String | null) {
  const report = document.querySelector('.report') as HTMLDivElement
  const summary = document.querySelector('.summary') as HTMLDivElement

  if (!country) {
    report.innerText = ''
    return
  }

  lastFetch?.abort()
  const {signal} = (lastFetch = new AbortController())

  const casesReq = fetchData('cases', country, province, county, version, signal)
  const deathsReq = fetchData('deaths', country, province, county, version, signal)

  const cases = await casesReq
  if (signal.aborted) return // but maybe it will already have thrown?
  if (!cases.ok) throw new Error('error getting cases')
  const casesData: Cases = await cases.json()

  const deaths = await deathsReq
  if (signal.aborted) return // but maybe it will already have thrown?

  renderRGraph(document.querySelector('.r-graph') as HTMLElement, casesData)

  if (casesData.population) {
    const model = new Model(casesData.cases, casesData.population, {c: getC()})

    const pn = getPn()
    report.innerHTML =
      factRow('Population', casesData.population) +
      factRow('Cases, cumulative', model.last[1], `${pct(model.last[1] / casesData.population)} of population; as of ${model.last[0]}`) +
      factRow('Cases, last week', model.lastWeekCount, `${pct(model.lastWeekCount / model.last[1])} of cases; since ${model.previous[0]}`) +
      await summarizeDeaths(deaths, model) +
      '<br>' +
      pctRow(m('P<sub>1</sub>'), model.p(1)) +
      pctRow(m('P<sub>10</sub>'), model.p(10)) +
      pctRow(m('P<sub>100</sub>'), model.p(100)) +
      pctRow(m('P<sub>1000</sub>'), model.p(1000)) +
      '<br>' +
      factRow(`${m('n')} when ${m('P<sub>n</sub>')} < ${pn}%`, Math.round(model.n(pn/100.0)))

    if (model.p(1) == 0) {
      hidePGraph()
      hideHistPGraph()
      hideSummary(summary)
    } else {
      renderPGraph(document.querySelector('.p-graph') as HTMLElement, casesData, model)
      renderHistPGraph(document.querySelector('.hist-p-graph') as HTMLElement, casesData, model, getSummaryCount())
      renderSummary(summary, county || province || country, model)
    }
  } else {
    const model = new Model(casesData.cases, 0)

    report.innerHTML =
      factRow('Population', 'not available') +
      factRow('Cases, cumulative', model.last[1], `as of ${model.last[0]}`) +
      factRow('Cases, last week', model.lastWeekCount, `${pct(model.lastWeekCount / model.last[1])} of cases; since ${model.previous[0]}`)
      await summarizeDeaths(deaths, model) +

    hidePGraph()
    hideHistPGraph()
    hideSummary(summary)
  }
}

async function summarizeDeaths(deaths: Response, model: Model) {
  if (!deaths.ok) {
    return ''
  }
  const deathsData: Deaths = await deaths.json()
  const totalDeaths = deathsData.deaths[deathsData.deaths.length - 1][1]
  const totalCases = model.last[1]
  if (deathsData.population) {
    return factRow('Deaths, cumulative', totalDeaths, `${pct(totalDeaths / totalCases)} of cases; ${(100000 * totalDeaths / deathsData.population).toFixed(2)} per 100k people`)
  } else {
    return factRow('Deaths, cumulative', totalDeaths, `${pct(totalDeaths / totalCases)} of cases`)
  }
}

async function fetchData(dataType: String, country: Country, province: Province | null, county: County | null, version: String | null, signal: AbortSignal) {
  let url = `/data/${dataType}/${country.name}`
  if (province) {
    url = url + '/' + province.name
    if (county) {
      url = url + '/' + county.name
    }
  }
  // refresh up to once an hour
  url = url + '.json?_='
  if (version) {
    url = url + version
  } else {
    url = url + Date.now()
  }
  return fetch(url, {signal})
}

function hidePGraph() {
  const el = document.querySelector('.p-graph') as HTMLElement
  if (el) el.hidden = true
}

function hideHistPGraph() {
  const el = document.querySelector('.hist-p-graph') as HTMLElement
  if (el) el.hidden = true
}

function hideSummary(el: HTMLDivElement | null) {
  if (el) el.hidden = true
}

function renderSummary(el: HTMLDivElement | null, place: Country | Province | County, model: Model) {
  if (!el) return

  let count = getSummaryCount()

  function setText(selector: string , text: string) {
    if (el) {
      const child = el.querySelector(selector) as HTMLElement
      child.innerText = text
    }
  }

  setText('.summary-location', place.name)
  setText('.summary-count', `${count}`)
  setText('.summary-percent', pct(model.p(count)))

  el.hidden = false
}

function getC(): number {
  const el = document.querySelector('.js-c') as HTMLInputElement
  if (el) return parseFloat(el.value)
  return 5
}

function getPn(): number {
  const el = document.querySelector('.js-pn') as HTMLInputElement
  if (el) return parseFloat(el.value)
  return 50
}

function getSummaryCount(): number {
  const el = document.querySelector('.summary-count') as HTMLElement
  if (el) {
    const count = parseInt(el.dataset['count'] || '')
    if (!isNaN(count)) return count
  }
  return INITIAL_SUMMARY_POPULATION_SIZE
}

function factRow(label: string, data: any, note?: string): string {
  return '<div class="row fact">' +
    `<div class="col-sm-2 fact-name">${label}</div>` +
    `<div class="col-sm-2 fact-value">${data}</div>` +
    (note ? `<div class="col-sm-8 fact-note">${note}</div>` : '') +
  '</div>'
}

function pctRow(label: string, p: number): string {
  return factRow(label, pct(p))
}

function pct(p: number): string {
  return `${(100.0 * p).toFixed(2)} %`
}

function m(expr: string): string {
  return `<span class="math">${expr}</span>`
}
