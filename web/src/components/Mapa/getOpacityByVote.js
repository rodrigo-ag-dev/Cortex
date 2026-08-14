const getOpacityByVote = ({ id, opacityById }) => opacityById?.get(id) ?? 0

export default getOpacityByVote
