const setVotingData = async ({ setdataVote, dataJSON, partido, uf, ...props }) => {
  setdataVote(null)
  const localdataVote = []
  if (partido && dataJSON) {
    for (const d of dataJSON) {
      for (const l of d) {
        for (const v of l) {
          if (typeof v != 'string') {
            if (v[0] == partido.label) {
              localdataVote.push({ id: l[1], vote: v[2] })
            }
          }
        }
      }
    }

    let total = 0
    localdataVote.forEach(e => {
      total += e.vote
    })

    localdataVote.forEach(e => {
      e.total = total
      e.perc = e.vote * 100 / total
    })

    localdataVote.sort((a, b) => {
      if (a.vote > b.vote)
        return 1
      if (a.vote < b.vote)
        return -1
      return 0
    })
  }
  setdataVote(localdataVote)
}

export default setVotingData