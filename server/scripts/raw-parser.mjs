// Parser dos arquivos brutos em server/src/data/raw/{ano}-{turno}.json.
// Detecta o formato linha a linha e normaliza para:
//   { tipo: 'UF' | 'MU', ibge, tse, nome, uf, nomeUF, candidatos: [{ partido, nome, votos, pct, flag }] }
//
// Formatos suportados:
//   2014 UF:  ["UF", sigla, nome, sigla, cand...]                       (cand a partir do indice 4)
//   2014 MU:  [nome, IBGE7, "MU", TSE5, nomeUF, sigla, cand...]         (cand a partir do indice 6)
//   2022/2026 MU: ["MUNICIPIO", TSE5, nome, sigla, nomeUF, cand...]         (cand a partir do indice 5)
// Tupla de candidato: [partido, nome, votos, pct, flag("S"/"N")].
// Linhas da UF 'ZZ' (exterior) e linhas desconhecidas (ex.: "Brasil") sao ignoradas.

const parseCandidatos = (cells) => cells
  .filter(Array.isArray)
  .map(([partido, nome, votos, pct, flag]) => ({
    partido,
    nome,
    votos: Number(votos) || 0,
    pct: Number(pct) || 0,
    flag: flag ?? null
  }))

const parseRow = (row, tseToIbge = {}) => {
  if (!Array.isArray(row)) {
    return null
  }

  if (row[0] === 'UF') {
    return { tipo: 'UF', ibge: null, tse: null, nome: row[2], uf: row[1], nomeUF: row[2], candidatos: parseCandidatos(row.slice(4)) }
  }

  if (row[0] === 'MUNICIPIO') {
    const tse = String(row[1])
    return {
      tipo: 'MU',
      ibge: tseToIbge[tse] ?? null,
      tse,
      nome: row[2],
      uf: row[3],
      nomeUF: row[4],
      candidatos: parseCandidatos(row.slice(5))
    }
  }

  if (row[2] === 'MU') {
    const tse = String(row[3])
    return {
      tipo: 'MU',
      // tse-ibge.json tem prioridade (corrige codigos IBGE errados do arquivo bruto)
      ibge: tseToIbge[tse] ?? String(row[1]),
      tse,
      nome: row[0],
      uf: row[5],
      nomeUF: row[4],
      candidatos: parseCandidatos(row.slice(6))
    }
  }

  return null
}

const parseRaw = (rows, tseToIbge = {}) => {
  const estados = []
  const municipios = []
  for (const row of rows) {
    const parsed = parseRow(row, tseToIbge)
    if (!parsed || parsed.uf === 'ZZ') {
      continue
    }
    if (parsed.tipo === 'UF') {
      estados.push(parsed)
    } else {
      municipios.push(parsed)
    }
  }
  return { estados, municipios }
}

// Agrega candidatos somando votos por partido; pct recalculado sobre o total de votos validos somados.
const aggregateCandidatos = (lista) => {
  const byPartido = new Map()
  for (const candidatos of lista) {
    for (const c of candidatos) {
      const acc = byPartido.get(c.partido)
      if (acc) {
        acc.votos += c.votos
      } else {
        byPartido.set(c.partido, { ...c })
      }
    }
  }
  const result = [...byPartido.values()]
  const total = result.reduce((sum, c) => sum + c.votos, 0)
  for (const c of result) {
    c.pct = total ? Math.round((c.votos / total) * 10000) / 100 : 0
  }
  return result.sort((a, b) => b.votos - a.votos)
}

export { parseRow, parseRaw, parseCandidatos, aggregateCandidatos }
