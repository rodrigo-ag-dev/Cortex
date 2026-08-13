const getOpacityByVote = ({ id, partido, dataVote, ...props }) => {
  let perc = 0
  let total = 0
  if (dataVote) {
    dataVote.forEach(e => total += e.vote)
    dataVote.forEach((e, i) => {
      if (e.id == id)
        perc = i
    })
  }
  return 1 / dataVote.length * perc
}

export default getOpacityByVote