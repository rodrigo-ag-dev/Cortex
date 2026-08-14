const setVotingData = ({ setdataVote, geoJSON, partido }) => {
  if (!partido || !geoJSON) {
    setdataVote(null)
    return
  }

  const localdataVote = geoJSON.features.map((feature) => ({
    id: feature.properties.dados.id,
    vote: feature.properties.dados.votes[partido.label] || 0
  }))

  const total = localdataVote.reduce((sum, e) => sum + e.vote, 0)
  localdataVote.forEach((e) => {
    e.total = total
    e.perc = total ? (e.vote * 100) / total : 0
  })

  localdataVote.sort((a, b) => a.vote - b.vote)

  setdataVote(localdataVote)
}

export default setVotingData
