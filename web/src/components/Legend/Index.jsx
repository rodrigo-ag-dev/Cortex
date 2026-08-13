import './index.css'

const Legend = ({ partido, dataVote }) => {
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
