// Gera server/src/data/tse-ibge.json ({ codigoTSE5: codigoIBGE7 }).
// Fonte principal: raw/2014-1.json (linhas MU trazem TSE no indice 3 e IBGE no indice 1).
// Complementos/correcoes manuais em EXTRA abaixo (sobrescrevem o 2014).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseRaw } from './raw-parser.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../src/data')
const SOURCE = path.join(DATA_DIR, 'raw/2014-1.json')
const OUTPUT = path.join(DATA_DIR, 'tse-ibge.json')

// Boa Esperanca do Norte/MT — instalado em 01/01/2025 (desmembrado de Sorriso/Nova Ubirata).
// TSE 73709: codigo da Justica Eleitoral (relatorio de totalizacao TRE-MT, eleicoes 2024).
// IBGE 5101837: CD_MUN na malha municipal oficial IBGE 2025 (MT_Municipios_2025.zip, NM_MUN "Boa Esperança do Norte").
// Pinto Bandeira/RS — TSE 89540: o 2014 traz IBGE 4301454 (inexistente na malha); o CD_MUN oficial
// na malha IBGE 2025 (RS_Municipios_2025.zip) e 4314548.
const EXTRA = {
  73709: '5101837',
  89540: '4314548'
}

const { municipios } = parseRaw(JSON.parse(fs.readFileSync(SOURCE, 'utf8')))
const map = {}
for (const m of municipios) {
  if (map[m.tse] && map[m.tse] !== m.ibge) {
    throw new Error(`TSE ${m.tse} com dois IBGE: ${map[m.tse]} / ${m.ibge}`)
  }
  map[m.tse] = m.ibge
}
for (const [tse, ibge] of Object.entries(EXTRA)) {
  map[String(tse).padStart(5, '0')] = ibge
}

const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(OUTPUT, JSON.stringify(sorted, null, 0))
console.log(`tse-ibge.json: ${Object.keys(sorted).length} municipios`)
