import {observe} from 'selector-observer'
import {on} from 'delegated-events'

async function render(country: Country | null, province: Province | null, county: County | null) {
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
  const data = await response.json()

  // TODO! d3!
  graph!.innerHTML = '<pre>' + JSON.stringify(data, null, ' ') + '</pre>'
}

observe('.locations', locationDiv => {
  locationDataPromise.then(locationData => {
    const countrySel = locationDiv.querySelector('.js-country') as HTMLSelectElement
    countrySel.innerHTML = buildLocationOptions<Country>(locationData.countries, 'choose country')
    const provinceSel = locationDiv.querySelector('.js-province') as HTMLSelectElement
    provinceSel.hidden = true
    const countySel = locationDiv.querySelector('.js-county') as HTMLSelectElement
    countySel.hidden = true
  })
})

on('change', '.js-country', (e) => {
  const countrySel = e.currentTarget as HTMLSelectElement
  locationDataPromise.then(locationData => {
    const provinceSel = document.querySelector('.js-province') as HTMLSelectElement
    const countySel = document.querySelector('.js-county') as HTMLSelectElement

    provinceSel.hidden = true
    countySel.hidden = true

    const country = findLocation<Country>(locationData.countries, countrySel.value)
    render(country, null, null)

    if (!country) return

    if (country.provinces) {
      provinceSel.innerHTML = buildLocationOptions<Province>(country.provinces, 'all provinces')
      provinceSel.hidden = false
    }
  })
})

on('change', '.js-province', (e) => {
  const provinceSel = e.currentTarget as HTMLSelectElement
  locationDataPromise.then(locationData => {
    const countrySel = document.querySelector('.js-country') as HTMLSelectElement
    const countySel = document.querySelector('.js-county') as HTMLSelectElement

    countySel.hidden = true

    const country = findLocation<Country>(locationData.countries, countrySel.value)
    const province = findLocation<Province>(country!.provinces!, provinceSel.value)
    render(country, province, null)

    if (!province) return

    if (province.counties) {
      countySel.innerHTML = buildLocationOptions<County>(province.counties, 'all counties')
      countySel.hidden = false
    }
  })
})

on('change', '.js-county', (e) => {
  const countySel = e.currentTarget as HTMLSelectElement
  locationDataPromise.then(locationData => {
    const countrySel = document.querySelector('.js-country') as HTMLSelectElement
    const provinceSel = document.querySelector('.js-province') as HTMLSelectElement

    const country = findLocation<Country>(locationData.countries, countrySel.value)
    const province = findLocation<Province>(country!.provinces!, provinceSel.value)
    const county = findLocation<County>(province!.counties!, countySel.value)
    render(country, province, county)
  })
})

interface Named {
  name: string
}

function findLocation<T extends Named>(locations: T[], name: string): T | null {
  if (name === '') return null
  return locations[parseInt(name)]
}

function buildLocationOptions<T extends Named>(locations: T[], label: string) {
  const opts = [`<option value="">--${label}--</option>`]
  for (let i = 0; i < locations.length; i++) {
    opts.push(`<option value="${i}">${locations[i].name}</option>`)
  }
  return opts.join('')
}

function showOpts(selSelector: string, optSelector: string) {
  const selEl = document.querySelector(selSelector) as HTMLSelectElement
  selEl!.value = ''
  const optEls = selEl.querySelectorAll(optSelector)
  if (optEls.length == 0) {
    selEl.hidden = true
    return
  }
  for (const el of selEl.querySelectorAll('.js-cond-opt')) {
    (el as HTMLElement).hidden = true
  }
  for (const el of optEls) {
    (el as HTMLElement).hidden = false
  }
}

type LocationData = {
  countries: Country[]
}

type Country = {
  name: string
  provinces?: Province[]
}

type Province = {
  name: string
  counties?: County[]
}

type County = {
  name: string
}

async function getLocations(url: string) : Promise<LocationData> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('error getting ' + url)
  return await response.json()
}

const locationDataPromise = getLocations("/data/locations.json")
