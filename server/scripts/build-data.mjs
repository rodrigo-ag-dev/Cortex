import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as mapshaperNS from 'mapshaper'
import { ufList } from '../../common/lists.mjs'
import {
  fetchZipGeoJson,
  findFeatureByCandidates,
  getMunicipiosZipUrl,
  getUfZipUrl
} from './ibge.js'

const mapshaper = mapshaperNS.default ?? mapshaperNS

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SERVER_ROOT = path.resolve(__dirname, '..')
const SOURCE_DATA_PATH = path.join(SERVER_ROOT, 'src/controllers/data.json')
const OUTPUT_DIR = path.join(SERVER_ROOT, 'src/data/generated')
const MUNICIPIOS_DIR = path.join(OUTPUT_DIR, 'municipios')

const SIMPLIFY_PCT = process.env.SIMPLIFY_PCT || '8%'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchZipGeoJsonWithRetry = async (url, retries = 4) => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fetchZipGeoJson(url)
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      const delay = 1000 * attempt
      console.warn(`  falha ao buscar ${url} (tentativa ${attempt}/${retries}: ${error.message}), retry em ${delay}ms`)
      await sleep(delay)
    }
  }
}

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

const simplify = async (featureCollection) => {
  if (!featureCollection.features.length) {
    return featureCollection
  }

  const input = { 'in.json': JSON.stringify(featureCollection) }
  const cmd = `-i in.json -simplify ${SIMPLIFY_PCT} weighted keep-shapes -clean -o out.json format=geojson`
  const output = await mapshaper.applyCommands(cmd, input)
  return JSON.parse(output['out.json'])
}

const buildVotes = (candidateRows) => {
  const votes = {}
  for (const row of candidateRows) {
    if (!Array.isArray(row)) {
      continue
    }
    const [partido, , quantidade] = row
    votes[partido] = quantidade
  }
  return votes
}

const UF_ONLY = process.env.UF_ONLY
  ? process.env.UF_ONLY.split(',').map((s) => s.trim().toUpperCase())
  : null

const main = async () => {
  const raw = JSON.parse(fs.readFileSync(SOURCE_DATA_PATH, 'utf8'))
  const targetUfs = UF_ONLY ? ufList.filter((uf) => UF_ONLY.includes(uf.label)) : ufList

  const estadoRows = raw.filter((row) => row[0] === 'UF')

  const municipioRowsByUf = new Map()
  for (const row of raw) {
    if (row[2] !== 'MU') {
      continue
    }
    const sigla = row[5]
    if (!municipioRowsByUf.has(sigla)) {
      municipioRowsByUf.set(sigla, [])
    }
    municipioRowsByUf.get(sigla).push(row)
  }

  fs.mkdirSync(MUNICIPIOS_DIR, { recursive: true })

  const estadosFeatures = []
  let totalMunicipiosOk = 0
  let totalMunicipiosSkipped = 0

  await runWithConcurrency(targetUfs, 4, async (uf) => {
    const sigla = uf.label
    console.log('Processando', sigla)

    const estadoRow = estadoRows.find((row) => row[1] === sigla)
    if (estadoRow) {
      const collection = await fetchZipGeoJsonWithRetry(getUfZipUrl(sigla))
      const feature = findFeatureByCandidates(collection, [sigla], ['SIGLA_UF']) ?? collection?.features?.[0] ?? null
      if (feature) {
        feature.properties = {
          dados: { id: sigla, name: estadoRow[2], uf: sigla, votes: buildVotes(estadoRow.slice(4)) }
        }
        estadosFeatures.push(feature)
      } else {
        console.warn('  sem geometria de estado para', sigla)
      }
    }

    const municipioRows = municipioRowsByUf.get(sigla) ?? []
    if (!municipioRows.length) {
      return
    }

    const collection = await fetchZipGeoJsonWithRetry(getMunicipiosZipUrl(sigla))
    const municipiosFeatures = []
    for (const row of municipioRows) {
      const [name, id] = row
      const feature = findFeatureByCandidates(collection, [id], ['CD_MUN'])
      if (!feature) {
        totalMunicipiosSkipped += 1
        console.warn('  sem geometria de municipio para', name, id)
        continue
      }
      feature.properties = { dados: { id, name, uf: sigla, votes: buildVotes(row.slice(6)) } }
      municipiosFeatures.push(feature)
      totalMunicipiosOk += 1
    }

    const simplified = await simplify({ type: 'FeatureCollection', features: municipiosFeatures })
    fs.writeFileSync(path.join(MUNICIPIOS_DIR, `${sigla}.json`), JSON.stringify(simplified))
  })

  const simplifiedEstados = await simplify({ type: 'FeatureCollection', features: estadosFeatures })
  fs.writeFileSync(path.join(OUTPUT_DIR, 'estados.json'), JSON.stringify(simplifiedEstados))

  console.log(`OK — estados: ${estadosFeatures.length}, municipios ok: ${totalMunicipiosOk}, municipios sem match: ${totalMunicipiosSkipped}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
