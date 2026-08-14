import apiCortex from '../../../api/apiCortex.js'

const cache = new Map()

const getData = async ({ setGeoJSON, uf }) => {
  const cacheKey = uf ? uf.value : ''

  if (cache.has(cacheKey)) {
    setGeoJSON(cache.get(cacheKey))
    return
  }

  try {
    const { data } = await apiCortex.get(uf ? `/${uf.value}/municipios` : ``)
    if (data && data.features) {
      cache.set(cacheKey, data)
      setGeoJSON(data)
    }
  } catch (error) {
    console.log(error)
  }
}

export default getData
