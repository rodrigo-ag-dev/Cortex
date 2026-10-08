import { getGeo } from '../../../api/apiCortex.js'

const cache = new Map()

// Retorna o GeoJSON (estados ou municípios da uf) da eleição; lança erro em caso de falha.
const getData = async ({ eleicao, uf }) => {
  const cacheKey = `${eleicao.ano}-${eleicao.turno}-${uf ? uf.value : ''}`

  if (cache.has(cacheKey))
    return cache.get(cacheKey)

  const data = await getGeo(eleicao, uf ? uf.label : null)
  if (!data || !data.features)
    throw new Error('Resposta inválida da API')

  cache.set(cacheKey, data)
  return data
}

export default getData
