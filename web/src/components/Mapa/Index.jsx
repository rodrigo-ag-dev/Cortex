import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FeatureGroup, GeoJSON, MapContainer } from 'react-leaflet'
import { getPartidoColor } from '../../../../common/lists.mjs'
import { getMeta, listEleicoes } from '../../../api/apiCortex.js'
import Filter, { getUfValue } from '../Filters/Index.jsx'
import Legend from '../Legend/Index.jsx'
import Loading from '../Loading/Index.jsx'
import getData from './getData.js'
import getOpacityByVote from './getOpacityByVote.js'
import './index.css'
import setMapCenter, { latlngBrazil } from './setMapCenter.js'
import setVotingData from './setVotingData.js'

// Usado quando /api/eleicoes falha, para manter o app utilizável
const FALLBACK_ELEICAO = { ano: 2014, turno: 1, cargo: 'presidente', titulo: 'Eleições 2014' }

const eleicaoKey = (e) => `${e.ano}-${e.turno}`

const sortEleicoes = (list) => [...list].sort((a, b) =>
  (Number(b.ano) - Number(a.ano)) || String(b.turno).localeCompare(String(a.turno), undefined, { numeric: true }))

// Opções do Select de partidos a partir de [{label,color}] (mantém a ordem do meta)
const toPartidoOptions = (partidos) => (partidos || [])
  .map(p => ({ label: p.label, value: p.label, color: p.color || getPartidoColor(p.label) }))

// Se o /meta falhar, deriva os partidos das chaves de votos do GeoJSON
const partidosFromGeoJSON = (geoJSON) => {
  const siglas = new Set()
  geoJSON?.features?.forEach(f => Object.keys(f.properties?.dados?.votes || {}).forEach(k => siglas.add(k)))
  return [...siglas].sort().map(label => ({ label, color: getPartidoColor(label) }))
}

function Mapa() {
  const [eleicoes, setEleicoes] = useState([])
  const [eleicao, setEleicao] = useState(null)
  const [meta, setMeta] = useState(null)
  const [uf, setUF] = useState(null)
  const [partido, setPartido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [geoJSON, setGeoJSON] = useState(null)
  const [dataVote, setdataVote] = useState(null)
  const mapRef = useRef()

  const partidoOptions = useMemo(() => {
    if (meta?.partidos?.length)
      return toPartidoOptions(meta.partidos)
    return toPartidoOptions(partidosFromGeoJSON(geoJSON))
  }, [meta, geoJSON])

  const titulo = meta?.titulo || eleicao?.titulo || (eleicao ? `Eleições ${eleicao.ano}` : '')

  const getColor = useCallback(() => {
    const found = partidoOptions.find(e => e.label === partido?.label)
    return found?.color || partido?.color || '#000077'
  }, [partido, partidoOptions])

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

  // Lista de eleições; seleciona a mais recente
  useEffect(() => {
    let cancelled = false
    listEleicoes()
      .then(list => {
        if (cancelled) return
        const sorted = sortEleicoes(list)
        setEleicoes(sorted.length ? sorted : [FALLBACK_ELEICAO])
        setEleicao(sorted[0] || FALLBACK_ELEICAO)
      })
      .catch(err => {
        if (cancelled) return
        console.warn('Falha ao listar eleições; usando 2014-1', err?.message)
        setEleicoes([FALLBACK_ELEICAO])
        setEleicao(FALLBACK_ELEICAO)
      })
    return () => { cancelled = true }
  }, [])

  // Meta da eleição (título e partidos)
  useEffect(() => {
    if (!eleicao) return
    let cancelled = false
    setMeta(null)
    getMeta(eleicao)
      .then(data => { if (!cancelled) setMeta(data) })
      .catch(err => { if (!cancelled) console.warn('Falha ao carregar meta da eleição', err?.message) })
    return () => { cancelled = true }
  }, [eleicao])

  useEffect(() => {
    document.title = titulo ? `VotaBrasil - ${titulo}` : 'VotaBrasil'
  }, [titulo])

  // GeoJSON (estados ou municípios) da eleição selecionada
  useEffect(() => {
    if (!eleicao) return
    let cancelled = false

    setLoading(true)
    setError(null)

    getData({ eleicao, uf })
      .then(data => { if (!cancelled) setGeoJSON(data) })
      .catch(err => {
        if (cancelled) return
        console.warn('Falha ao carregar dados do mapa', err?.message)
        setError('Não foi possível carregar os dados desta eleição.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [eleicao, uf])

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

  const onChangeEleicao = (option) => {
    if (!option || eleicaoKey(option) === (eleicao && eleicaoKey(eleicao)))
      return
    setUF(null)
    setPartido(null)
    setdataVote(null)
    setGeoJSON(null)
    setEleicao(option)
  }

  return (
    <>
      <Filter
        eleicoes={eleicoes} selectedEleicao={eleicao} onChangeEleicao={onChangeEleicao}
        partidos={partidoOptions}
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
      {error ? <div className="map-error" role="alert">{error}</div> : null}
      <Legend partido={partido} dataVote={dataVote} />
    </>
  )
}

export default Mapa
