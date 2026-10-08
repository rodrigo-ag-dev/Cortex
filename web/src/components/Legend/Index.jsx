import { NEUTRAL_COLOR } from '../Mapa/comparisonColors.js'
import { formatPP } from '../Mapa/formatNumber.js'
import './index.css'

const ComparisonLegend = ({ comparison, partidoA, partidoB, colorA, colorB }) => {
  const max = comparison.summary.maxMargin

  return (
    <div className="legend-panel">
      <div className="legend-title legend-title--split">
        <span style={{ color: colorA }}>{partidoA.label}</span>
        <span className="legend-vs">×</span>
        <span style={{ color: colorB }}>{partidoB.label}</span>
      </div>
      <div className="legend-bar" style={{ background: `linear-gradient(to right, ${colorA}, ${NEUTRAL_COLOR}, ${colorB})` }} />
      <div className="legend-labels">
        <span>+{formatPP(max)}</span>
        <span>Empate</span>
        <span>+{formatPP(max)}</span>
      </div>
    </div>
  )
}

const Legend = ({ partido, dataVote, comparison, ...compareProps }) => {
  if (comparison)
    return <ComparisonLegend comparison={comparison} {...compareProps} />

  if (!partido || !dataVote || dataVote.length === 0)
    return null

  const min = dataVote[0].vote
  const max = dataVote[dataVote.length - 1].vote
  const color = partido.color || '#000077'

  return (
    <div className="legend-panel">
      <div className="legend-title">{partido.label}</div>
      <div className="legend-bar" style={{ background: `linear-gradient(to right, ${color}33, ${color})` }} />
      <div className="legend-labels">
        <span>{min.toLocaleString('pt-BR')}</span>
        <span>{max.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  )
}

export default Legend
