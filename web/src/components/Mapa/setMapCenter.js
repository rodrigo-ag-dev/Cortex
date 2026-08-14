import L from 'leaflet'

const latlngBrazil = { lat: -14.538635, lng: -52.813417 }

const getBounds = (geoJSON) => {
  if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0)
    return null

  const layerBounds = L.geoJSON(geoJSON).getBounds()
  return layerBounds.isValid() ? layerBounds : null
}

const setMapCenter = ({ geoJSON, mapRef, uf }) => {
  if (!mapRef || !mapRef.current)
    return

  const bounds = getBounds(geoJSON)

  if (bounds) {
    mapRef.current.fitBounds(bounds, {
      padding: [20, 20],
      maxZoom: uf ? 10 : 6,
      animate: false
    })
  } else {
    mapRef.current.setView(latlngBrazil, uf ? 8 : 5, { animate: false })
  }
}

export { latlngBrazil }
export default setMapCenter
