import './index.css'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'

export default (props) => {
  const animatedComponents = makeAnimated()
  const controlStyles = {
    control: (styles) => ({ ...styles, marginBottom: '10px' })
  }

  return (
    <Select
      fullWidth
      isClearable
      blurInputOnSelect
      closeMenuOnSelect={false}
      components={animatedComponents}
      className='basic-multi-select'
      classNamePrefix='select'
      styles={controlStyles}
      {...props}
    />
  )
}