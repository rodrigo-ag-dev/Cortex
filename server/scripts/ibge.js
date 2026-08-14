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

const findFeatureByCandidates = (collection, candidates = [], fields = null) => {
  const normalizedCandidates = candidates
    .map(normalizeText)
    .filter(Boolean)

  return collection?.features?.find((feature) => {
    const properties = feature?.properties ?? {}
    const values = fields ? fields.map((field) => properties[field]) : Object.values(properties)
    return values.some((value) => normalizedCandidates.includes(normalizeText(value)))
  }) ?? null
}

export {
  fetchZipGeoJson,
  findFeatureByCandidates,
  getMunicipiosZipUrl,
  getUfZipUrl,
  normalizeText,
  toFeatureCollection
}

export default http
