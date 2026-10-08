// Gera os dados servidos pela API a partir de server/src/data/raw/{ano}-{turno}.json.
//
// Uso:
//   node server/scripts/build-data.mjs                     -> processa todos os raw/*.json
//   node server/scripts/build-data.mjs --all               -> idem
//   node server/scripts/build-data.mjs --ano=2026 --turno=1
//   ANO=2014 TURNO=1 node server/scripts/build-data.mjs
// Env opcionais: SIMPLIFY_PCT (padrao 8%), UF_ONLY (ex.: "SP,RJ"), CARGO (padrao presidente),
//                REFRESH_GEO=1 (ignora o cache de geometria e baixa/simplifica de novo).
//
// Saida: server/src/data/generated/{ano}-{turno}/estados.json, municipios/{UF}.json, meta.json
// Geometria (malha IBGE 2025) baixada e simplificada uma vez e reaproveitada de
// server/src/data/cache/geo/{SIMPLIFY_PCT}/ (fora do git).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as mapshaperNS from 'mapshaper'
import { ufList, getPartidoColor } from '../../common/lists.mjs'
import {
  fetchZipGeoJson,
  findFeatureByCandidates,
  getMunicipiosZipUrl,
  getUfZipUrl
} from './ibge.js'
import { parseRaw, aggregateCandidatos } from './raw-parser.mjs'

const mapshaper = mapshaperNS.default ?? mapshaperNS

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SERVER_ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(SERVER_ROOT, 'src/data')
const RAW_DIR = path.join(DATA_DIR, 'raw')
const GENERATED_DIR = path.join(DATA_DIR, 'generated')
const TSE_IBGE_PATH = path.join(DATA_DIR, 'tse-ibge.json')

const SIMPLIFY_PCT = process.env.SIMPLIFY_PCT || '8%'
const CARGO = process.env.CARGO || 'presidente'
const REFRESH_GEO = process.env.REFRESH_GEO === '1'
const GEO_CACHE_DIR = path.join(DATA_DIR, 'cache/geo', SIMPLIFY_PCT.replace(/[^0-9a-zA-Z.]/g, 'pct'))

const UF_ONLY = process.env.UF_ONLY
  ? process.env.UF_ONLY.split(',').map((s) => s.trim().toUpperCase())
  : null

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
  const base = `-i in.json -simplify ${SIMPLIFY_PCT} weighted keep-shapes`
  const cleaned = JSON.parse((await mapshaper.applyCommands(`${base} -clean allow-empty -o out.json format=geojson`, input))['out.json'])

  // O -clean do mapshaper zera a geometria de alguns poligonos validos da malha IBGE
  // (ex.: Manoel Urbano e Santa Rosa do Purus/AC). Nesses casos usa a versao simplificada sem -clean.
  const lost = cleaned.features.filter((f) => !f.geometry)
  if (lost.length) {
    const raw = JSON.parse((await mapshaper.applyCommands(`${base} -o out.json format=geojson`, input))['out.json'])
    cleaned.features = cleaned.features.map((f, index) => (f.geometry ? f : raw.features[index]))
    console.warn(`  -clean descartou ${lost.length} geometria(s); usando versao sem -clean para elas`)
  }
  return cleaned
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))
const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value))
}

const pickProps = (feature, keys) => ({
  ...feature,
  properties: Object.fromEntries(keys.map((key) => [key, feature.properties?.[key]]))
})

// ---------- cache de geometria (independente da eleicao) ----------

const getEstadosGeometry = async () => {
  const cachePath = path.join(GEO_CACHE_DIR, 'estados.json')
  if (!REFRESH_GEO && fs.existsSync(cachePath)) {
    return readJson(cachePath)
  }
  console.log('Geometria de estados: baixando e simplificando (todas as UFs)')
  const features = []
  await runWithConcurrency(ufList, 4, async (uf) => {
    const collection = await fetchZipGeoJsonWithRetry(getUfZipUrl(uf.label))
    const feature = findFeatureByCandidates(collection, [uf.label], ['SIGLA_UF']) ?? collection?.features?.[0] ?? null
    if (feature) {
      features.push(pickProps(feature, ['SIGLA_UF', 'NM_UF']))
    } else {
      console.warn('  sem geometria de estado para', uf.label)
    }
  })
  features.sort((a, b) => a.properties.SIGLA_UF.localeCompare(b.properties.SIGLA_UF))
  const simplified = await simplify({ type: 'FeatureCollection', features })
  writeJson(cachePath, simplified)
  return simplified
}

const getMunicipiosGeometry = async (sigla) => {
  const cachePath = path.join(GEO_CACHE_DIR, 'municipios', `${sigla}.json`)
  if (!REFRESH_GEO && fs.existsSync(cachePath)) {
    return readJson(cachePath)
  }
  console.log(`Geometria de municipios ${sigla}: baixando e simplificando`)
  const collection = await fetchZipGeoJsonWithRetry(getMunicipiosZipUrl(sigla))
  const features = collection.features.map((f) => pickProps(f, ['CD_MUN', 'NM_MUN', 'SIGLA_UF']))
  const simplified = await simplify({ type: 'FeatureCollection', features })
  writeJson(cachePath, simplified)
  return simplified
}

// ---------- montagem por eleicao ----------

const buildVotes = (candidatos) => Object.fromEntries(candidatos.map((c) => [c.partido, c.votos]))
const buildFlags = (candidatos) => Object.fromEntries(candidatos.filter((c) => c.flag).map((c) => [c.partido, c.flag]))
const isUpperCase = (text) => typeof text === 'string' && text === text.toUpperCase() && text !== text.toLowerCase()

const buildDados = ({ id, name, uf, candidatos }) => {
  const dados = { id, name, uf, votes: buildVotes(candidatos) }
  const flags = buildFlags(candidatos)
  if (Object.keys(flags).length) {
    dados.flags = flags
  }
  return dados
}

const listElections = () => fs.readdirSync(RAW_DIR)
  .map((file) => /^(\d{4})-(\d+)\.json$/.exec(file))
  .filter(Boolean)
  .map(([, ano, turno]) => ({ ano: Number(ano), turno: Number(turno) }))
  .sort((a, b) => a.ano - b.ano || a.turno - b.turno)

const parseArgs = () => {
  const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=')
    return [key, value ?? true]
  }))
  const ano = args.ano ?? process.env.ANO
  const turno = args.turno ?? process.env.TURNO ?? 1
  if (args.all || !ano) {
    return listElections()
  }
  return [{ ano: Number(ano), turno: Number(turno) }]
}

const buildElection = async ({ ano, turno }, tseToIbge) => {
  const key = `${ano}-${turno}`
  const sourcePath = path.join(RAW_DIR, `${key}.json`)
  const outputDir = path.join(GENERATED_DIR, key)
  const municipiosDir = path.join(outputDir, 'municipios')
  console.log(`\n=== Eleicao ${key} (${sourcePath}) ===`)

  const { estados, municipios } = parseRaw(readJson(sourcePath), tseToIbge)
  const targetUfs = UF_ONLY ? ufList.filter((uf) => UF_ONLY.includes(uf.label)) : ufList

  const semIbge = municipios.filter((m) => !m.ibge)
  for (const m of semIbge) {
    console.warn(`  sem codigo IBGE para TSE ${m.tse} (${m.nome}/${m.uf}) — adicione em tse-ibge.json`)
  }

  const municipiosByUf = new Map()
  for (const m of municipios) {
    if (!municipiosByUf.has(m.uf)) {
      municipiosByUf.set(m.uf, [])
    }
    municipiosByUf.get(m.uf).push(m)
  }

  fs.mkdirSync(municipiosDir, { recursive: true })

  const estadosGeo = await getEstadosGeometry()
  const estadosFeatures = []
  let totalOk = 0
  let totalSkipped = semIbge.length

  await runWithConcurrency(targetUfs, 4, async (uf) => {
    const sigla = uf.label
    const municipiosUf = municipiosByUf.get(sigla) ?? []

    const estadoRow = estados.find((e) => e.uf === sigla)
    const estadoGeo = estadosGeo.features.find((f) => f.properties.SIGLA_UF === sigla)
    if (estadoRow || municipiosUf.length) {
      if (estadoGeo) {
        const candidatos = estadoRow ? estadoRow.candidatos : aggregateCandidatos(municipiosUf.map((m) => m.candidatos))
        const name = estadoRow && !isUpperCase(estadoRow.nome) ? estadoRow.nome : (estadoGeo.properties.NM_UF ?? municipiosUf[0]?.nomeUF)
        estadosFeatures.push({ ...estadoGeo, properties: { dados: buildDados({ id: sigla, name, uf: sigla, candidatos }) } })
      } else {
        console.warn('  sem geometria de estado para', sigla)
      }
    }

    if (!municipiosUf.length) {
      return
    }

    const geo = await getMunicipiosGeometry(sigla)
    const geoById = new Map(geo.features.map((f) => [String(f.properties.CD_MUN), f]))
    const features = []
    for (const m of municipiosUf) {
      if (!m.ibge) {
        continue
      }
      const feature = geoById.get(m.ibge)
      if (!feature) {
        totalSkipped += 1
        console.warn('  sem geometria de municipio para', m.nome, m.ibge)
        continue
      }
      const name = isUpperCase(m.nome) ? (feature.properties.NM_MUN ?? m.nome) : m.nome
      features.push({ ...feature, properties: { dados: buildDados({ id: m.ibge, name, uf: sigla, candidatos: m.candidatos }) } })
      totalOk += 1
    }
    const semVoto = geo.features.length - features.length
    if (semVoto) {
      const usados = new Set(features.map((f) => f.properties.dados.id))
      const faltantes = geo.features.filter((f) => !usados.has(String(f.properties.CD_MUN)))
      console.warn(`  ${sigla}: ${semVoto} municipio(s) da malha sem dados: ${faltantes.map((f) => `${f.properties.NM_MUN} (${f.properties.CD_MUN})`).join(', ')}`)
    }

    writeJson(path.join(municipiosDir, `${sigla}.json`), { type: 'FeatureCollection', features })
  })

  estadosFeatures.sort((a, b) => a.properties.dados.uf.localeCompare(b.properties.dados.uf))
  writeJson(path.join(outputDir, 'estados.json'), { type: 'FeatureCollection', features: estadosFeatures })

  // meta.json — partidos presentes, ordenados pelo total nacional de votos
  const nacional = aggregateCandidatos(municipios.map((m) => m.candidatos))
  const meta = {
    ano,
    turno,
    cargo: CARGO,
    titulo: `Eleições ${ano} - ${turno}º turno`,
    partidos: nacional.map((c) => ({ label: c.partido, color: getPartidoColor(c.partido) }))
  }
  fs.writeFileSync(path.join(outputDir, 'meta.json'), JSON.stringify(meta, null, 2))

  console.log(`OK ${key} — estados: ${estadosFeatures.length}, municipios ok: ${totalOk}, municipios sem match: ${totalSkipped}`)
}

const main = async () => {
  const tseToIbge = readJson(TSE_IBGE_PATH)
  const elections = parseArgs()
  if (!elections.length) {
    throw new Error(`nenhum arquivo raw encontrado em ${RAW_DIR}`)
  }
  for (const election of elections) {
    await buildElection(election, tseToIbge)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
