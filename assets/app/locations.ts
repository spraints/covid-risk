export type Country = {
  name: string
  provinces?: Province[]
}

export type Province = {
  name: string
  counties?: County[]
}

export type County = {
  name: string
}
