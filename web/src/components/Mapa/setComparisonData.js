const sumVotes = (votes) => Object.values(votes || {}).reduce((sum, v) => sum + (Number(v) || 0), 0)

// Compara os partidos A e B (siglas) em cada unidade do GeoJSON.
// Percentuais calculados sobre o total de votos de todos os partidos da unidade.
const setComparisonData = ({ geoJSON, siglaA, siglaB }) => {
  if (!geoJSON?.features || !siglaA || !siglaB || siglaA === siglaB)
    return null

  const byId = new Map()
  const summary = {
    votesA: 0, votesB: 0, total: 0, pctA: 0, pctB: 0, margin: 0,
    winsA: 0, winsB: 0, ties: 0, semVotos: 0, units: 0, maxMargin: 0, winner: null
  }

  geoJSON.features.forEach((feature) => {
    const dados = feature.properties?.dados
    if (!dados)
      return

    const votes = dados.votes || {}
    const votesA = Number(votes[siglaA]) || 0
    const votesB = Number(votes[siglaB]) || 0
    const total = sumVotes(votes)
    const pctA = total ? (votesA * 100) / total : 0
    const pctB = total ? (votesB * 100) / total : 0
    const margin = pctA - pctB

    let winner = null
    if (total > 0)
      winner = votesA > votesB ? 'A' : votesB > votesA ? 'B' : 'empate'

    summary.units++
    summary.votesA += votesA
    summary.votesB += votesB
    summary.total += total
    if (winner === 'A') summary.winsA++
    else if (winner === 'B') summary.winsB++
    else if (winner === 'empate') summary.ties++
    else summary.semVotos++
    summary.maxMargin = Math.max(summary.maxMargin, Math.abs(margin))

    byId.set(dados.id, { id: dados.id, votesA, votesB, total, pctA, pctB, margin, winner })
  })

  if (summary.total) {
    summary.pctA = (summary.votesA * 100) / summary.total
    summary.pctB = (summary.votesB * 100) / summary.total
  }
  summary.margin = summary.pctA - summary.pctB
  if (summary.total)
    summary.winner = summary.votesA > summary.votesB ? 'A' : summary.votesB > summary.votesA ? 'B' : 'empate'

  return { siglaA, siglaB, byId, summary }
}

export default setComparisonData
