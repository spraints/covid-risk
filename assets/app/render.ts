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
      `<h4>${data.name}</h4>` +
      `<p>Population: ${data.population}</p>` +
      `<p>Cases: ${model.last[1]} as of ${model.last[0]}</p>` +
      `<p>Last week: ${model.lastWeekCount} since ${model.previous[0]}</p>` +
      `<ul>` +
      `<li>P<sub>10</sub> = ${fmtPct(model.p(10))}</li>` +
      `<li>P<sub>100</sub> = ${fmtPct(model.p(100))}</li>` +
      `<li>P<sub>1000</sub> = ${fmtPct(model.p(1000))}</li>` +
      `</ul>` +
      `<p>when P<sub>n</sub> < 5%, n = ${model.n(0.05)}</p>`
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

function fmtPct(p: number): string {
  return `${100.0 * p} %`
}
