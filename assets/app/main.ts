import {observe} from 'selector-observer'
import {on} from 'delegated-events'

import {Country, Province, County} from './locations'
import {SelectionStore} from './selection-store'
import {render} from './render'

type LocationData = {
  countries: Country[]
}

interface Named {
  name: string
}

const selectionStore = new SelectionStore()

const NULL_COUNTRY = 'choose country'
const NULL_PROVINCE = 'all provinces'
const NULL_COUNTY = 'all counties'

observe('.locations', locationDiv => {
  locationDataPromise.then(locationData => {
    let [countryName, provinceName, countyName] = selectionStore.getPlace()

    const countrySel = locationDiv.querySelector('.js-country') as HTMLSelectElement
    const provinceSel = locationDiv.querySelector('.js-province') as HTMLSelectElement
    const countySel = locationDiv.querySelector('.js-county') as HTMLSelectElement

    let country = null
    let province = null
    let county = null
    country = buildLocationOptions<Country>(countrySel, locationData.countries, NULL_COUNTRY, countryName)
    if (country && country.provinces) {
      province = buildLocationOptions<Province>(provinceSel, country.provinces, NULL_PROVINCE, provinceName)
      if (province && province.counties) {
        county = buildLocationOptions<County>(countySel, province.counties, NULL_COUNTY, countyName)
      } else {
        countySel.hidden = true
      }
    } else {
      provinceSel.hidden = true
      countySel.hidden = true
    }
    render(country, province, county)
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
    selectionStore.setPlace([country?.name])

    if (!country) return

    if (country.provinces) {
      buildLocationOptions<Province>(provinceSel, country.provinces, NULL_PROVINCE, null)
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
    selectionStore.setPlace([country!.name, province?.name])

    if (!province) return

    if (province.counties) {
      buildLocationOptions<County>(countySel, province.counties, NULL_COUNTY, null)
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
    selectionStore.setPlace([country!.name, province!.name, county?.name])
  })
})

function findLocation<T extends Named>(locations: T[], name: string): T | null {
  if (name === '') return null
  return locations[parseInt(name)]
}

function buildLocationOptions<T extends Named>(sel: HTMLSelectElement, locations: T[], label: string, chosen: string | null | undefined): T | null {
  const opts = [`<option value="">--${label}--</option>`]
  let ret: T | null = null
  for (let i = 0; i < locations.length; i++) {
    if (chosen === locations[i].name) {
      ret = locations[i]
      opts.push(`<option value="${i}" selected>${locations[i].name}</option>`)
    } else {
      opts.push(`<option value="${i}">${locations[i].name}</option>`)
    }
  }
  sel.innerHTML = opts.join('')
  return ret
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
