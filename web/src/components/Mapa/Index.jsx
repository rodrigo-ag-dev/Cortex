import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FeatureGroup, GeoJSON, MapContainer } from 'react-leaflet'
import { getPartidoColor } from '../../../../common/lists.mjs'
import { getMeta, listEleicoes } from '../../../api/apiCortex.js'
import ComparisonSummary from '../ComparisonSummary/Index.jsx'
import Filter, { getUfValue } from '../Filters/Index.jsx'
import Legend from '../Legend/Index.jsx'
import Loading from '../Loading/Index.jsx'
import { getComparisonColors, getDivergingColor, NEUTRAL_COLOR } from './comparisonColors.js'
import { formatPct, formatPP, formatVotes, winnerLabel } from './formatNumber.js'
import getData from './getData.js'
import getOpacityByVote from './getOpacityByVote.js'
import './index.css'
import setComparisonData from './setComparisonData.js'
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
  const [modo, setModo] = useState('partido')
  const [partidoA, setPartidoA] = useState(null)
  const [partidoB, setPartidoB] = useState(null)
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

  const comparison = useMemo(() => modo === 'comparar'
    ? setComparisonData({ geoJSON, siglaA: partidoA?.value, siglaB: partidoB?.value })
    : null, [modo, geoJSON, partidoA, partidoB])

  const compareColors = useMemo(() => {
    const colorOf = (p) => partidoOptions.find(e => e.value === p?.value)?.color || p?.color || '#888888'
    return getComparisonColors(colorOf(partidoA), colorOf(partidoB))
  }, [partidoA, partidoB, partidoOptions])

  const compareFillById = useMemo(() => {
    const map = new Map()
    if (comparison) {
      const { maxMargin } = comparison.summary
      comparison.byId.forEach((e, id) => map.set(id, getDivergingColor({ margin: e.margin, maxMargin, ...compareColors })))
    }
    return map
  }, [comparison, compareColors])

  const isPainting = modo === 'comparar' ? !!comparison : !!partido

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
    if (comparison) {
      const c = comparison.byId.get(dados.id)
      if (!c)
        return tooltip
      const { colorA, colorB } = compareColors
      const linha = (label, color, votes, pct) =>
        `<div class='map-tooltip-row'><span><i class='map-tooltip-dot' style='background:${color}'></i>${label}</span><span>${formatVotes(votes)} (${formatPct(pct)})</span></div>`
      tooltip += linha(partidoA.label, colorA, c.votesA, c.pctA)
      tooltip += linha(partidoB.label, colorB, c.votesB, c.pctB)
      tooltip += `<div class='map-tooltip-row'><span>Diferença</span><span>${formatPP(c.margin)}</span></div>`
      tooltip += `<div class='map-tooltip-winner'>Vencedor: ${winnerLabel(c.winner, partidoA.label, partidoB.label)}</div>`
      return `<div>${tooltip}</div>`
    }
    if (partido) {
      const vote = voteById.get(dados.id)?.vote ?? 0
      tooltip += `<div class='map-tooltip-value'>${vote.toLocaleString('pt-BR')}</div>`
      tooltip = `<div>${tooltip}</div>`
    }
    return tooltip
  }, [partido, voteById, comparison, compareColors, partidoA, partidoB])

  const onEachState = useCallback((feature, layer) => {
    const { id } = feature.properties.dados
    const fillColor = comparison ? (compareFillById.get(id) || NEUTRAL_COLOR) : partido ? getColor() : '#D6DAC2'
    const getFillOpacity = () => comparison ? 0.85 : getOpacityByVote({ opacityById, id })

    layer.on('mouseover', function () {
      this.setStyle({ 'fillColor': '#444444AA', fillOpacity: 1 })
    })

    layer.on('mouseout', function () {
      this.setStyle({ fillColor, fillOpacity: getFillOpacity() })
    })

    layer.on('click', function () {
      if (isPainting && !uf) {
        setUF(null)
        setUF(getUfValue(feature.properties.dados.uf))
      }
    })

    layer.setStyle({ fillColor, fillOpacity: getFillOpacity(), weight: uf ? .2 : .5, color: '#000000' });
    layer.bindTooltip(getTooltip(feature.properties), { direction: 'top', sticky: true })
  }, [partido, uf, opacityById, getColor, getTooltip, comparison, compareFillById, isPainting])

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
      !geoJSON || (modo === 'comparar' ? !comparison : dataVote === null) ? null :
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
    setPartidoA(null)
    setPartidoB(null)
    setdataVote(null)
    setGeoJSON(null)
    setEleicao(option)
  }

  const onChangeModo = (value) => {
    setUF(null)
    setModo(value)
  }

  const onChangePartidoComparado = (setter) => (value) => {
    if (!value)
      setUF(null)
    setter(value)
  }

  const onSwapPartidos = () => {
    setPartidoA(partidoB)
    setPartidoB(partidoA)
  }

  return (
    <>
      <Filter
        eleicoes={eleicoes} selectedEleicao={eleicao} onChangeEleicao={onChangeEleicao}
        partidos={partidoOptions}
        selectedUF={uf} onChangeUF={value => {
          setUF(null)

          if (isPainting)
            setUF(value)
        }}
        selectedPartido={partido} onChangePartido={value => setPartido(value)}
        modo={modo} onChangeModo={onChangeModo}
        partidoA={partidoA} partidoB={partidoB}
        onChangePartidoA={onChangePartidoComparado(setPartidoA)}
        onChangePartidoB={onChangePartidoComparado(setPartidoB)}
        onSwapPartidos={onSwapPartidos}
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
      {comparison ?
        <div className='compare-dock'>
          <Legend comparison={comparison} partidoA={partidoA} partidoB={partidoB} {...compareColors} />
          <ComparisonSummary comparison={comparison} partidoA={partidoA} partidoB={partidoB} uf={uf} {...compareColors} />
        </div> :
        modo === 'partido' ? <Legend partido={partido} dataVote={dataVote} /> : null}
    </>
  )
}

export default Mapa
