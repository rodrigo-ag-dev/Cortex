import apiCortex from '../../../api/apiCortex.js'

const getData = async ({ setGeoJSON, setDataJSON, uf, ...props }) => {
  try {
    setGeoJSON(null)
    const { data } = await apiCortex.get(uf ? `/${uf.value}/municipios` : ``)
    if (data && data[0] && data[0].GeoJSon) {
      let localGeoJson = []
      let localDataJson = []
      for (const e of data) {
        if (e && e.GeoJSon && e.GeoJSon.features) {
          for (const f of e.GeoJSon.features) {
            if (f && f.properties) {
              f.properties.dados = {}
              const { dados } = f.properties
              if (uf) {
                dados.id = e.dados[0][1]
                dados.uf = e.dados[0][5]
                dados.name = e.dados[0][0]
              } else {
                dados.id = e.dados[0][1]
                dados.uf = e.dados[0][1]
                dados.name = e.dados[0][2]
              }
            }
          }
          localDataJson.push(e.dados)
          localGeoJson.push(e.GeoJSon)
        }
      }
      setGeoJSON(localGeoJson)
      setDataJSON(localDataJson)
    }
  } catch (error) {
    console.log(error)
  }
}

export default getData