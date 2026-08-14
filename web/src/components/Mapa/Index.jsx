import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const [dataVote, setdataVote] = useState(null)
  const mapRef = useRef()

  const getColor = useCallback(() => {
    let color = '#000077'
    partidoList.forEach(e => {
      if (e.label == partido.label && e.color)
        color = e.color
    })
    return color
  }, [partido])

  const voteById = useMemo(() => {
    const map = new Map()
    if (dataVote) {
      dataVote.forEach(e => map.set(e.id, e))
    }
    return map
  }, [dataVote])

  const opacityById = useMemo(() => {
    const map = new Map()
    if (dataVote && dataVote.length) {
      dataVote.forEach((e, i) => map.set(e.id, i / dataVote.length))
    }
    return map
  }, [dataVote])

  const getTooltip = useCallback(({ dados }) => {
    let tooltip = `<div>${dados.name} - ${dados.uf}</div>`
    if (partido) {
      const vote = voteById.get(dados.id)?.vote ?? 0
      tooltip += `<div class='map-tooltip-value'>${vote.toLocaleString('pt-BR')}</div>`
      tooltip = `<div>${tooltip}</div>`
    }
    return tooltip
  }, [partido, voteById])

  const onEachState = useCallback((feature, layer) => {
    const fillColor = partido ? getColor() : '#D6DAC2'

    layer.on('mouseover', function () {
      this.setStyle({ 'fillColor': '#444444AA', fillOpacity: 1 })
    })

    layer.on('mouseout', function () {
      const { id } = feature.properties.dados
      const fillOpacity = getOpacityByVote({ opacityById, id })
      this.setStyle({ fillColor, fillOpacity })
    })

    layer.on('click', function () {
      if (partido && !uf) {
        setUF(null)
        setUF(getUfValue(feature.properties.dados.uf))
      }
    })

    const { id } = feature.properties.dados
    const fillOpacity = getOpacityByVote({ opacityById, id })
    layer.setStyle({ fillColor, fillOpacity, weight: uf ? .2 : .5, color: '#000000' });
    layer.bindTooltip(getTooltip(feature.properties), { direction: 'top', sticky: true })
  }, [partido, uf, opacityById, getColor, getTooltip])

  useEffect(() => {
    let cancelled = false

    if (uf)
      setLoading(true)

    getData({ setGeoJSON: (data) => { if (!cancelled) setGeoJSON(data) }, uf })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [uf])

  useEffect(() => {
    setMapCenter({ mapRef, uf, geoJSON })
  }, [geoJSON, uf])

  useEffect(() => {
    setVotingData({ setdataVote, geoJSON, partido })
  }, [geoJSON, partido])

  useEffect(() => {
    setUF(null)
  }, [partido])

  function MapFeatureGroup() {
    return (
      dataVote === null || !geoJSON ? null :
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
