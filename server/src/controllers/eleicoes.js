import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ufList } from '../../../common/lists.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GENERATED_DIR = path.join(__dirname, '../data/generated')
const DIR_PATTERN = /^(\d{4})-(\d)$/

const CACHE_CONTROL = 'public, max-age=604800, immutable'
const CACHE_CONTROL_SHORT = 'public, max-age=300'

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

// Carrega em memória todas as eleições geradas em generated/{ano}-{turno}/
const eleicoes = new Map()
for (const dir of fs.readdirSync(GENERATED_DIR, { withFileTypes: true })) {
  const match = dir.isDirectory() && DIR_PATTERN.exec(dir.name)
  if (!match) continue

  const base = path.join(GENERATED_DIR, dir.name)
  const metaPath = path.join(base, 'meta.json')
  const estadosPath = path.join(base, 'estados.json')
  if (!fs.existsSync(metaPath) || !fs.existsSync(estadosPath)) {
    console.warn(`[eleicoes] ${dir.name} ignorado: meta.json ou estados.json ausente`)
    continue
  }

  const meta = readJson(metaPath)
  const estadosFC = readJson(estadosPath)
  const estadosByUF = new Map(estadosFC.features.map((f) => [f.properties.dados.id, f]))
  const municipiosByUF = new Map()
  for (const uf of ufList) {
    const filePath = path.join(base, 'municipios', `${uf.label}.json`)
    if (fs.existsSync(filePath)) municipiosByUF.set(uf.label, readJson(filePath))
  }

  eleicoes.set(dir.name, { meta, estadosFC, estadosByUF, municipiosByUF })
}

const lista = [...eleicoes.values()]
  .map(({ meta }) => ({ ano: meta.ano, turno: meta.turno, cargo: meta.cargo, titulo: meta.titulo }))
  .sort((a, b) => a.ano - b.ano || a.turno - b.turno)

console.log(`[eleicoes] carregadas: ${[...eleicoes.keys()].sort().join(', ') || 'nenhuma'}`)

const TURNOS = { '1': 1, 'primeiro-turno': 1, '2': 2, 'segundo-turno': 2 }

const notFound = (res, mensagem = 'Not found') => res.status(404).json({ mensagem })

const getSigla = (uf) => {
  const value = String(uf).toUpperCase()
  const match = ufList.find((e) => e.label === value || String(e.value) === value)
  return match ? match.label : null
}

// Resolve req.params.ano/turno (ou a eleição fixada pela rota legada) em req.eleicao
const resolveEleicao = (req, res, next) => {
  const { ano, turno } = req.params
  const turnoNum = TURNOS[String(turno).toLowerCase()]
  if (!/^\d{4}$/.test(String(ano)) || !turnoNum) {
    return notFound(res, 'Eleição inválida')
  }
  const eleicao = eleicoes.get(`${ano}-${turnoNum}`)
  if (!eleicao) return notFound(res, 'Eleição não encontrada')
  req.eleicao = eleicao
  return next()
}

const fixedEleicao = (key) => (req, res, next) => {
  const eleicao = eleicoes.get(key)
  if (!eleicao) return notFound(res, 'Eleição não encontrada')
  req.eleicao = eleicao
  return next()
}

export default {
  resolveEleicao,
  fixedEleicao,

  lista: (req, res) => {
    res.set('Cache-Control', CACHE_CONTROL_SHORT)
    return res.json(lista)
  },

  meta: (req, res) => {
    res.set('Cache-Control', CACHE_CONTROL_SHORT)
    return res.json(req.eleicao.meta)
  },

  uf: (req, res) => {
    const { estadosFC, estadosByUF } = req.eleicao

    if (!req.params.uf) {
      res.set('Cache-Control', CACHE_CONTROL)
      return res.json(estadosFC)
    }

    const sigla = getSigla(req.params.uf)
    const feature = sigla && estadosByUF.get(sigla)
    if (!feature) return notFound(res, 'UF não encontrada')

    res.set('Cache-Control', CACHE_CONTROL)
    return res.json({ type: 'FeatureCollection', features: [feature] })
  },

  municipios: (req, res) => {
    const sigla = getSigla(req.params.uf)
    const featureCollection = sigla && req.eleicao.municipiosByUF.get(sigla)
    if (!featureCollection) return notFound(res, 'UF não encontrada')

    res.set('Cache-Control', CACHE_CONTROL)
    return res.json(featureCollection)
  }
}
