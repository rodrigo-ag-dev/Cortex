import { ufList } from '../../../../common/lists.mjs'
import Select from '../Select/Index.jsx'

const getUfValue = (label) => {
  const value = ufList.filter(e => e.label.toUpperCase() == label.toUpperCase())
  if (value)
    return value[0]
}

const eleicaoOption = (e) => e ? ({ ...e, label: e.titulo || `Eleições ${e.ano}`, value: `${e.ano}-${e.turno}` }) : null

export default ({
  eleicoes = [], selectedEleicao, onChangeEleicao,
  partidos = [], selectedPartido, onChangePartido,
  onChangeUF, selectedUF
}) => {
  const eleicaoOptions = eleicoes.map(eleicaoOption)

  return (
    <div className='panelLeft'>
      <div className='panelLeft-header'>
        <span className='panelLeft-title'>VotaBrasil</span>
      </div>
      <Select
        options={eleicaoOptions}
        placeholder='Eleição'
        aria-label='Eleição'
        value={eleicaoOption(selectedEleicao)}
        isClearable={false}
        isSearchable={false}
        closeMenuOnSelect
        isLoading={!eleicoes.length}
        onChange={value => onChangeEleicao(value)}
      />
      <Select
        options={partidos}
        placeholder='Partidos'
        aria-label='Partidos'
        value={selectedPartido}
        noOptionsMessage={() => 'Nenhum partido'}
        onChange={value => onChangePartido(value)}
      />
      <Select options={ufList} placeholder='Estados' aria-label='Estados' value={selectedUF} onChange={value => onChangeUF(value)} />
    </div>
  )
}

export { getUfValue }
