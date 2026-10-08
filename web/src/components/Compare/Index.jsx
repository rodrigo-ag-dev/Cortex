import Select from '../Select/Index.jsx'
import './index.css'

const Compare = ({ partidos = [], partidoA, partidoB, onChangeA, onChangeB, onSwap }) => {
  const optionsA = partidos.filter(p => p.value !== partidoB?.value)
  const optionsB = partidos.filter(p => p.value !== partidoA?.value)

  return (
    <div className='compare'>
      <Select
        options={optionsA}
        placeholder='Partido A'
        aria-label='Partido A'
        value={partidoA}
        closeMenuOnSelect
        noOptionsMessage={() => 'Nenhum partido'}
        onChange={value => onChangeA(value)}
      />
      <button
        type='button'
        className='compare-swap'
        onClick={onSwap}
        disabled={!partidoA && !partidoB}
        title='Trocar A e B'
        aria-label='Trocar partidos A e B'
      >
        ⇅ Trocar A e B
      </button>
      <Select
        options={optionsB}
        placeholder='Partido B'
        aria-label='Partido B'
        value={partidoB}
        closeMenuOnSelect
        noOptionsMessage={() => 'Nenhum partido'}
        onChange={value => onChangeB(value)}
      />
    </div>
  )
}

export default Compare
