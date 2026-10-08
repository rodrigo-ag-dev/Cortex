const formatVotes = (value) => (value || 0).toLocaleString('pt-BR')

const formatPct = (value) => `${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

const formatPP = (value) => {
  const abs = Math.abs(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${abs} p.p.`
}

const winnerLabel = (winner, labelA, labelB) => {
  if (winner === 'A') return labelA
  if (winner === 'B') return labelB
  if (winner === 'empate') return 'Empate'
  return 'Sem votos'
}

export { formatVotes, formatPct, formatPP, winnerLabel }
