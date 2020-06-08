const placeKey = 'selectedPlace'

export class SelectionStore {
  setPlace(place: Array<string | undefined>) {
    const json = JSON.stringify(place)
    try {
      localStorage.setItem(placeKey, json)
    } catch (e) {
      // ignore it
    }
  }

  getPlace(): Array<string | undefined> {
    let json: string | null = null
    try {
      json = localStorage.getItem(placeKey)
    } catch (e) {
      // ignore it
    }
    if (!json) {
      return []
    }
    return JSON.parse(json)
  }
}
