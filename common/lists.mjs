const ufList = [
  { label: 'AL', value: 27 }, { label: 'SE', value: 28 }, { label: 'BA', value: 29 }, { label: 'MG', value: 31 },
  { label: 'ES', value: 32 }, { label: 'RJ', value: 33 }, { label: 'SP', value: 35 }, { label: 'PR', value: 41 },
  { label: 'SC', value: 42 }, { label: 'RS', value: 43 }, { label: 'MS', value: 50 }, { label: 'MT', value: 51 },
  { label: 'GO', value: 52 }, { label: 'DF', value: 53 }, { label: 'RO', value: 11 }, { label: 'AC', value: 12 },
  { label: 'AM', value: 13 }, { label: 'RR', value: 14 }, { label: 'PA', value: 15 }, { label: 'AP', value: 16 },
  { label: 'TO', value: 17 }, { label: 'MA', value: 21 }, { label: 'PI', value: 22 }, { label: 'CE', value: 23 },
  { label: 'RN', value: 24 }, { label: 'PB', value: 25 }, { label: 'PE', value: 26 }
].sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0))

// Cores por sigla partidaria (todas as eleicoes). Usado pelo build (meta.json) e pelo front.
const partidoColors = {
  PSDB: '#0080FF',
  PT: '#c4122d',
  PSB: '#FFCC00',
  PSOL: '#FFEE57',
  PV: '#006600',
  PSC: '#006f41',
  PRTB: '#2cb53f',
  PSTU: '#c92127',
  PSDC: '#FFA500',
  PCB: '#ff0000',
  PCO: '#9F030A',
  PL: '#1B3F8B',
  PSD: '#E6A100',
  AVANTE: '#00A6A6',
  'MISSÃO': '#7B2CBF',
  NOVO: '#F26522',
  DC: '#2E8B57',
  UP: '#D6336C',
  DEMOCRATA: '#8D6E63'
}

const DEFAULT_PARTIDO_COLOR = '#888888'

const getPartidoColor = (sigla) => partidoColors[sigla] ?? DEFAULT_PARTIDO_COLOR

// Lista legada (eleicao 2014) mantida para compatibilidade com o front atual.
const partidoList = ['PSDB', 'PT', 'PSB', 'PSOL', 'PV', 'PSC', 'PRTB', 'PSTU', 'PSDC', 'PCB', 'PCO']
  .map((sigla) => ({ label: sigla, value: sigla, color: partidoColors[sigla] }))
  .sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0))

export { ufList, partidoList, partidoColors, getPartidoColor, DEFAULT_PARTIDO_COLOR }
