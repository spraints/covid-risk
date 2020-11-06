import {Cases, DateCount} from './types'
import {Country, Province, County} from './locations'
import {Model} from './model'
import {renderRGraph} from './render-r-graph'
import {renderPGraph} from './render-p-graph'

let lastFetch: AbortController | null = null

const INITIAL_SUMMARY_POPULATION_SIZE = 20

export async function render(country: Country | null, province: Province | null, county: County | null, version: String | null) {
  const report = document.querySelector('.report') as HTMLDivElement
  const summary = document.querySelector('.summary') as HTMLDivElement

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
  // refresh up to once an hour
  url = url + '.json?_='
  if (version) {
    url = url + version
  } else {
    url = url + Date.now()
  }

  lastFetch?.abort()
  const {signal} = (lastFetch = new AbortController())

  const response = await fetch(url, {signal})
  if (signal.aborted) return // but maybe it will already have thrown?
  if (!response.ok) throw new Error('error getting ' + url)
  const data: Cases = await response.json()

  renderRGraph(document.querySelector('.r-graph') as HTMLElement, data)

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

    if (model.p(1) == 0) {
      hidePGraph()
      hideSummary(summary)
    } else {
      renderPGraph(document.querySelector('.p-graph') as HTMLElement, data, model)
      renderSummary(summary, county || province || country, model)
    }
  } else {
    const model = new Model(data.cases, 0)

    report.innerHTML =
      factRow('Population', 'not available') +
      factRow('Cases', model.last[1], `as of ${model.last[0]}`) +
      factRow('Last week', model.lastWeekCount, `since ${model.previous[0]}`)

    hidePGraph()
    hideSummary(summary)
  }
}

function hidePGraph() {
  const el = document.querySelector('.p-graph') as HTMLElement
  if (el) el.hidden = true
}

function hideSummary(el: HTMLDivElement | null) {
  if (el) el.hidden = true
}

function renderSummary(el: HTMLDivElement | null, place: Country | Province | County, model: Model) {
  if (!el) return

  let count = INITIAL_SUMMARY_POPULATION_SIZE
  const countEl = el.querySelector('.summary-count') as HTMLElement
  if (countEl) {
    const countCount = parseInt(countEl.dataset['count'] || '')
    if (!isNaN(countCount)) count = countCount
  }

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
  return factRow(label, pct(p))
}

function pct(p: number): string {
  return `${(100.0 * p).toFixed(2)} %`
}

function m(expr: string): string {
  return `<span class="math">${expr}</span>`
}
