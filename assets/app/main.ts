import {observe} from 'selector-observer'
import {on} from 'delegated-events'

import {Country, Province, County} from './locations'
import {render} from './render'

type LocationData = {
  countries: Country[]
}

interface Named {
  name: string
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

async function getLocations(url: string) : Promise<LocationData> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('error getting ' + url)
  return await response.json()
}

const locationDataPromise = getLocations("/data/locations.json")
