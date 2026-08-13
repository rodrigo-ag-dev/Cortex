import { useCallback, useEffect, useRef, useState } from 'react'
import { FeatureGroup, GeoJSON, MapContainer } from 'react-leaflet'
import { partidoList } from '../../../../common/lists.mjs'
import Filter, { getUfValue } from '../Filters/Index.jsx'
import Legend from '../Legend/Index.jsx'
import Loading from '../Loading/Index.jsx'
import getData from './getData.js'
import getOpacityByVote from './getOpacityByVote.js'
import './index.css'
import setMapCenter, { latlngBrazil } from './setMapCenter.js'
import setVotingData from './setVotingData.js'

function Mapa({ id }) {
  const [uf, setUF] = useState(null)
  const [partido, setPartido] = useState(null)
  const [loading, setLoading] = useState(false)
  const [geoJSON, setGeoJSON] = useState(null)
  const [dataJSON, setDataJSON] = useState(null)
  const [dataVote, setdataVote] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const mapRef = useRef()

  const getColor = useCallback(() => {
    let color = '#000077'
    partidoList.forEach(e => {
      if (e.label == partido.label && e.color)
        color = e.color
    })
    return color
  }, [partido])

  const getTooltip = useCallback(({ dados }) => {
    let tooltip = `<div>${dados.name} - ${dados.uf}</div>`
    if (partido) {
      let vote = 0
      dataVote.forEach(e => {
        if (e.id == dados.id)
          vote += e.vote
      })
      tooltip += `<div class='map-tooltip-value'>${vote.toLocaleString('pt-BR')}</div>`
      tooltip = `<div>${tooltip}</div>`
    }
    return tooltip
  }, [partido, dataVote])

  const onEachState = useCallback((feature, layer) => {
    const fillColor = partido ? getColor() : '#D6DAC2'

    layer.on('mouseover', function () {
      this.setStyle({ 'fillColor': '#444444AA', fillOpacity: 1 })
    })

    layer.on('mouseout', function () {
      const { id } = feature.properties.dados
      const fillOpacity = getOpacityByVote({ dataVote, id })
      this.setStyle({ fillColor, fillOpacity })
    })

    layer.on('click', function () {
      if (partido && !uf) {
        setUF(null)
        setUF(getUfValue(feature.properties.dados.uf))
      }
    })

    const { id } = feature.properties.dados
    const fillOpacity = getOpacityByVote({ dataVote, id })
    layer.setStyle({ fillColor, fillOpacity, weight: uf ? .2 : .5, color: '#000000' });
    layer.bindTooltip(getTooltip(feature.properties), { direction: 'top', sticky: true })
  }, [partido, uf, dataVote, getColor, getTooltip])

  useEffect(() => {
    if (uf)
      setLoading(true)
    getData({ setGeoJSON, setDataJSON, uf })
  }, [refresh])

  useEffect(() => {
    setMapCenter({ mapRef, uf, geoJSON })
  }, [geoJSON])

  useEffect(() => {
    setVotingData({ setdataVote, dataJSON, partido, uf })
    setLoading(false)
  }, [dataJSON])

  useEffect(() => {
    setUF(null)
    setdataVote(null)
    setRefresh(refresh + 1)
  }, [partido])

  useEffect(() => {
    setdataVote(null)
    setRefresh(refresh + 1)
  }, [uf])

  function MapFeatureGroup() {
    return (
      dataVote === null ? null :
        <FeatureGroup>
          <GeoJSON data={geoJSON} onEachFeature={onEachState} />
        </FeatureGroup>
    )
  }

  function MapLoading() {
    return (loading ? <Loading /> : null)
  }

  return (
    <>
      <Filter
        selectedUF={uf} onChangeUF={value => {
          setUF(null)

          if (partido)
            setUF(value)
        }}
        selectedPartido={partido} onChangePartido={value => setPartido(value)}
      />
      <MapContainer
        zoom={5}
        ref={mapRef}
        classsName="map"
        dragging={false}
        zoomControl={false}
        center={latlngBrazil}
        scrollWheelZoom={false}
      >
        <MapFeatureGroup />
      </MapContainer>
      <MapLoading />
      <Legend partido={partido} dataVote={dataVote} />
    </>
  )
}

export default Mapa