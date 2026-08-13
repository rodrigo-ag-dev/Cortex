import { partidoList, ufList } from '../../../../common/lists.mjs'
import Select from '../Select/Index.jsx'

const getUfValue = (label) => {
  const value = ufList.filter(e => e.label.toUpperCase() == label.toUpperCase())
  if (value)
    return value[0]
}

export default ({ onChangeUF, onChangePartido, selectedUF }) => {
  return (
    <div className='panelLeft'>
      <Select options={partidoList} placeholder='Partidos' onChange={values => onChangePartido(values)} />
      <Select options={ufList} placeholder='Estados' value={selectedUF} onChange={value => onChangeUF(value)} />
    </div>
  )
}

export { getUfValue }