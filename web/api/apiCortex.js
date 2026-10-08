import axios from 'axios'

// VITE_API_URL deve apontar para a raiz da API (ex.: http://localhost:5000/api).
// Por compatibilidade, se vier no formato antigo (com /eleicao/... no final), o sufixo é removido.
const resolveApiRoot = (url) => {
  const raw = (url || 'http://localhost:5000/api').trim()
  return raw.replace(/\/eleicao(\/.*)?$/i, '').replace(/\/+$/, '')
}

const API_ROOT = resolveApiRoot(import.meta.env.VITE_API_URL)

const apiCortex = axios.create({
  baseURL: API_ROOT,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000
})

const eleicaoPath = ({ ano, turno }) => `/eleicao/${ano}/presidente/${turno}`

// [{ ano, turno, cargo, titulo }]
const listEleicoes = async () => {
  const { data } = await apiCortex.get('/eleicoes')
  return Array.isArray(data) ? data : []
}

// { ano, turno, cargo, titulo, partidos: [{ label, color }] }
const getMeta = async (eleicao) => {
  const { data } = await apiCortex.get(`${eleicaoPath(eleicao)}/meta`)
  return data
}

// GeoJSON de estados (sem uf) ou de municípios da uf informada (sigla)
const getGeo = async (eleicao, uf) => {
  const base = `${eleicaoPath(eleicao)}/estados`
  const { data } = await apiCortex.get(uf ? `${base}/${uf}/municipios` : base)
  return data
}

export { API_ROOT, listEleicoes, getMeta, getGeo }
export default apiCortex
