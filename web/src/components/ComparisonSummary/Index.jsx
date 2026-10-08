import { formatPct, formatPP, formatVotes, winnerLabel } from '../Mapa/formatNumber.js'
import './index.css'

const ComparisonSummary = ({ comparison, partidoA, partidoB, colorA, colorB, uf }) => {
  if (!comparison)
    return null

  const { summary } = comparison
  const recorte = uf ? `Municípios de ${uf.label}` : 'Estados'
  const rows = [
    { key: 'A', label: partidoA.label, color: colorA, votes: summary.votesA, pct: summary.pctA, wins: summary.winsA },
    { key: 'B', label: partidoB.label, color: colorB, votes: summary.votesB, pct: summary.pctB, wins: summary.winsB }
  ]

  return (
    <div className='compare-summary' aria-label='Resumo da comparação'>
      <div className='compare-summary-title'>{recorte} · {summary.units} unidades</div>
      <table>
        <thead>
          <tr><th>Partido</th><th>Votos</th><th>%</th><th>Vitórias</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.key}>
              <td><span className='compare-dot' style={{ background: r.color }} />{r.label}</td>
              <td>{formatVotes(r.votes)}</td>
              <td>{formatPct(r.pct)}</td>
              <td>{r.wins}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='compare-summary-footer'>
        <div>
          Margem geral: <strong>{summary.winner === 'A' || summary.winner === 'B'
            ? `${winnerLabel(summary.winner, partidoA.label, partidoB.label)} +${formatPP(summary.margin)}`
            : winnerLabel(summary.winner)}</strong>
        </div>
        <div>
          Empates: {summary.ties}{summary.semVotos ? ` · Sem votos: ${summary.semVotos}` : ''}
        </div>
      </div>
    </div>
  )
}

export default ComparisonSummary
