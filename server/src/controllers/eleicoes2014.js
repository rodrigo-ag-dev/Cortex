import '../loadEnv.js'
import fs from 'node:fs'
import redis from 'redis'
import { ufList } from '../../../common/lists.mjs'
import {
  fetchZipGeoJson,
  findFeatureByCandidates,
  geometryCenter,
  getMunicipiosZipUrl,
  getUfZipUrl,
  normalizeText
} from '../api/ibge.js'
import databaseCheck from './databaseCheck.js'

const MALHA_ANO = 2025
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

var database = null

const runWithConcurrency = async (items, limit, worker) => {
  const queue = [...items]
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift()
      await worker(item)
    }
  })
  await Promise.all(runners)
}

const redisClient = redis
  .createClient({ url: REDIS_URL })
  .on('error', (err) => { console.log(err.stack) })

redisClient.connect()
  .then(
    async () => {
      try {
        console.log('Redis start')
        await redisClient.ping()
        console.log('Redis connected')

        database = await databaseCheck({ redisClient, database })

        if (!database || !database.length == 0 || !database[0].dateCache) {
          fs.readFile('./server/src/controllers/data.json', 'utf8', async (err, data) => {
            if (!err) {
              database = JSON.parse(data)
              database = [{ dateCache: new Date() }, ...database]

              redisClient.set('database', JSON.stringify(database))

              const array = []
              await runWithConcurrency(ufList, 4, async (u) => {
                console.log('Atualizando estado', u.label)
                const seen = new Set()
                await getGeoJSon(array, u, 'estados', u.label, u.label, { reset: true, seen })
                for (const e of database) {
                  if (e[5] && e[5] == u.label) {
                    await getGeoJSon(array, e, 'municipios', e[1], u.label, { seen })
                  }
                }
              })

              console.log('Updated States')
            } else {
              console.error('error:', err)
              return
            }
          })
        }
      } catch (error) {
        console.log('Redis error', error)
      }
    }
  )
  .catch(() => {})

const getSigla = (uf) => {
  let sigla = uf.toUpperCase()
  ufList.forEach(e => {
    if (e.label == sigla || String(e.value) == sigla) {
      sigla = e.label
    }
  })
  return sigla
}

const buildCollectionKey = (rota, ufSigla) => `${rota}-${MALHA_ANO}-${String(ufSigla).toUpperCase()}`
const buildFeatureKey = (rota, id, ufSigla) => `${rota}-${MALHA_ANO}-${String(ufSigla).toUpperCase()}-${normalizeText(id)}`

const loadCollection = async (rota, ufSigla, reset = false) => {
  const collectionKey = buildCollectionKey(rota, ufSigla)

  if (reset) {
    await redisClient.del(collectionKey)
  }

  const cached = await redisClient.get(collectionKey)
  if (cached) {
    return JSON.parse(cached)
  }

  const url = rota === 'estados'
    ? getUfZipUrl(ufSigla)
    : getMunicipiosZipUrl(ufSigla)

  const collection = await fetchZipGeoJson(url)
  await redisClient.set(collectionKey, JSON.stringify(collection))
  return collection
}

const buildResponseGeoJson = (feature, rota, id, ufSigla) => {
  const geoJson = {
    type: 'FeatureCollection',
    features: [feature]
  }

  if (rota === 'estados') {
    geoJson.metaData = {
      id,
      centroide: geometryCenter(feature?.geometry),
      dimensao: null
    }
  }

  return geoJson
}

const getGeoJSon = async (obj, element, rota, id, ufSigla, options = {}) => {
  const { reset = false, seen = new Set() } = options
  const key = buildFeatureKey(rota, id, ufSigla)

  if (reset) {
    await redisClient.del(key)
    await redisClient.del(buildCollectionKey(rota, ufSigla))
  }

  if (seen.has(key)) {
    return
  }
  seen.add(key)

  let dataGeoJSon = {}
  try {
    const cached = await redisClient.get(key)
    if (cached) {
      dataGeoJSon = JSON.parse(cached)
    } else {
      const collection = await loadCollection(rota, ufSigla, reset)
      const candidates = rota === 'estados'
        ? [id, ufSigla]
        : [id]
      const feature = findFeatureByCandidates(collection, candidates) ?? collection?.features?.[0] ?? null

      if (feature) {
        dataGeoJSon = buildResponseGeoJson(feature, rota, id, ufSigla)
        await redisClient.set(key, JSON.stringify(dataGeoJSon))
      }
    }
  } catch (error) {
    console.log('getGeoJSon', key, error?.response?.status, error?.response?.statusText ?? error?.message)
  } finally {
    const local = {}
    local.dados = []
    local.dados.push(element)
    local.GeoJSon = dataGeoJSon
    obj.push(local)
  }
}

export default {
  uf: async (req, res) => {
    try {
      const data = []
      const seen = new Set()
      if (!req.params.uf) {
        if (database) {
          for (const e of database) {
            if (e[0] == 'UF') {
              for (const uf of ufList) {
                if (e[1] == uf.label) {
                  await getGeoJSon(data, e, 'estados', uf.label, uf.label, { seen })
                }
              }
            }
          }
        }
      } else if (req.params.uf) {
        if (database) {
          const sigla = getSigla(req.params.uf)
          for (const e of database) {
            if (e[1] == sigla) {
              await getGeoJSon(data, e, 'estados', sigla, sigla, { seen })
            }
          }
        }
      }

      if (data && data.length > 0) {
        return res.json(data)
      }

      return res.status(404).json({ mensagem: 'Not found' })
    } catch (error) {
      console.error('eleicoes2014 handler error', error)
      return res.status(500).json({ mensagem: 'Internal error' })
    }
  },

  municipios: async (req, res) => {
    try {
      const data = []
      if (req.params.uf) {
        if (database) {
          const sigla = getSigla(req.params.uf)
          const seen = new Set()
          for (const e of database) {
            if (e[5] && e[5] == sigla) {
              await getGeoJSon(data, e, 'municipios', e[1], sigla, { seen })
            }
          }
        }
      }

      if (data && data.length > 0) {
        return res.json(data)
      }

      return res.status(404).json({ mensagem: 'Not found' })
    } catch (error) {
      console.error('eleicoes2014 handler error', error)
      return res.status(500).json({ mensagem: 'Internal error' })
    }
  }
}
