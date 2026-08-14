import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ufList } from '../../../common/lists.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GENERATED_DIR = path.join(__dirname, '../data/generated')

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const estadosFC = readJson(path.join(GENERATED_DIR, 'estados.json'))
const estadosByUF = new Map(estadosFC.features.map((feature) => [feature.properties.dados.id, feature]))

const municipiosByUF = new Map()
for (const uf of ufList) {
  const filePath = path.join(GENERATED_DIR, 'municipios', `${uf.label}.json`)
  if (fs.existsSync(filePath)) {
    municipiosByUF.set(uf.label, readJson(filePath))
  }
}

const getSigla = (uf) => {
  const value = String(uf).toUpperCase()
  const match = ufList.find((e) => e.label === value || String(e.value) === value)
  return match ? match.label : value
}

const CACHE_CONTROL = 'public, max-age=604800, immutable'

export default {
  uf: (req, res) => {
    res.set('Cache-Control', CACHE_CONTROL)

    if (!req.params.uf) {
      return res.json(estadosFC)
    }

    const sigla = getSigla(req.params.uf)
    const feature = estadosByUF.get(sigla)
    if (!feature) {
      return res.status(404).json({ mensagem: 'Not found' })
    }

    return res.json({ type: 'FeatureCollection', features: [feature] })
  },

  municipios: (req, res) => {
    if (!req.params.uf) {
      return res.status(404).json({ mensagem: 'Not found' })
    }

    const sigla = getSigla(req.params.uf)
    const featureCollection = municipiosByUF.get(sigla)
    if (!featureCollection) {
      return res.status(404).json({ mensagem: 'Not found' })
    }

    res.set('Cache-Control', CACHE_CONTROL)
    return res.json(featureCollection)
  }
}
