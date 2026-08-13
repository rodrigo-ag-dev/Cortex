import axios from 'axios'
import * as shpjs from 'shpjs'

const shp = shpjs.default ?? shpjs

const http = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
})

const MALHAS_BASE = 'https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/UFs'

const normalizeText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toUpperCase()

const toFeatureCollection = (value) => {
  if (!value) {
    return { type: 'FeatureCollection', features: [] }
  }

  if (value.type === 'FeatureCollection') {
    return value
  }

  if (Array.isArray(value)) {
    const features = value.flatMap((item) => {
      if (!item) {
        return []
      }

      if (item.type === 'FeatureCollection' && Array.isArray(item.features)) {
        return item.features
      }

      if (item.type === 'Feature') {
        return [item]
      }

      if (Array.isArray(item.features)) {
        return item.features
      }

      return []
    })

    return { type: 'FeatureCollection', features }
  }

  if (value.type === 'Feature') {
    return { type: 'FeatureCollection', features: [value] }
  }

  return { type: 'FeatureCollection', features: [] }
}

const getUfZipUrl = (uf) => `${MALHAS_BASE}/${uf}/${uf}_UF_2025.zip`
const getMunicipiosZipUrl = (uf) => `${MALHAS_BASE}/${uf}/${uf}_Municipios_2025.zip`

const fetchZipGeoJson = async (url) => {
  const response = await http.get(url, { responseType: 'arraybuffer' })
  const parsed = await shp(response.data)
  return toFeatureCollection(parsed)
}

const findFeatureByCandidates = (collection, candidates = []) => {
  const normalizedCandidates = candidates
    .map(normalizeText)
    .filter(Boolean)

  return collection?.features?.find((feature) => {
    const properties = feature?.properties ?? {}
    return Object.values(properties).some((value) => normalizedCandidates.includes(normalizeText(value)))
  }) ?? null
}

const collectPositions = (value, positions) => {
  if (!Array.isArray(value)) {
    return
  }

  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
    positions.push([Number(value[0]), Number(value[1])])
    return
  }

  for (const item of value) {
    collectPositions(item, positions)
  }
}

const geometryCenter = (geometry) => {
  const positions = []
  collectPositions(geometry?.coordinates, positions)

  if (!positions.length) {
    return null
  }

  let minX = positions[0][0]
  let maxX = positions[0][0]
  let minY = positions[0][1]
  let maxY = positions[0][1]

  for (const [x, y] of positions) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  return [(minX + maxX) / 2, (minY + maxY) / 2]
}

export {
  fetchZipGeoJson,
  findFeatureByCandidates,
  geometryCenter,
  getMunicipiosZipUrl,
  getUfZipUrl,
  normalizeText,
  toFeatureCollection
}

export default http
