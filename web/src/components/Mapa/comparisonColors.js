const NEUTRAL_COLOR = '#EEEEE8'
const MIN_COLOR_DISTANCE = 160
// Cor alternativa de B quando A e B são parecidas: roxo; se A também for parecida com o roxo, laranja
const ALT_COLOR_B = '#7B1FA2'
const ALT_COLOR_B_FALLBACK = '#F57C00'

const parseHex = (hex) => {
  let value = String(hex || '').replace('#', '').slice(0, 6)
  if (value.length === 3)
    value = value.split('').map(c => c + c).join('')
  const num = parseInt(value, 16)
  if (value.length !== 6 || Number.isNaN(num))
    return [136, 136, 136]
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

const toHex = (rgb) => '#' + rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')

// Distância "redmean" (aproximação perceptual simples) entre duas cores
const colorDistance = (c1, c2) => {
  const [r1, g1, b1] = parseHex(c1)
  const [r2, g2, b2] = parseHex(c2)
  const rm = (r1 + r2) / 2
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db)
}

// Mantém a cor de A; se B for parecida demais com A, B vira roxo (ou laranja, se A for parecida com o roxo)
const getComparisonColors = (colorA, colorB) => {
  if (colorDistance(colorA, colorB) >= MIN_COLOR_DISTANCE)
    return { colorA, colorB, contrast: false }

  if (colorDistance(colorA, ALT_COLOR_B) >= MIN_COLOR_DISTANCE)
    return { colorA, colorB: ALT_COLOR_B, contrast: true }

  if (colorDistance(colorA, ALT_COLOR_B_FALLBACK) >= MIN_COLOR_DISTANCE)
    return { colorA, colorB: ALT_COLOR_B_FALLBACK, contrast: true }

  // Salvaguarda: nenhuma das duas atinge o limiar; usa a mais distante de A
  const best = colorDistance(colorA, ALT_COLOR_B) >= colorDistance(colorA, ALT_COLOR_B_FALLBACK) ? ALT_COLOR_B : ALT_COLOR_B_FALLBACK
  return { colorA, colorB: best, contrast: true }
}

const mixColor = (from, to, t) => {
  const a = parseHex(from)
  const b = parseHex(to)
  return toHex(a.map((c, i) => c + (b[i] - c) * t))
}

// Cor divergente: vencedor A×B com intensidade proporcional à margem (p.p.) relativa à maior margem do recorte
const getDivergingColor = ({ margin, maxMargin, colorA, colorB }) => {
  if (!margin || !maxMargin)
    return NEUTRAL_COLOR
  const t = 0.15 + 0.85 * Math.min(1, Math.abs(margin) / maxMargin)
  return mixColor(NEUTRAL_COLOR, margin > 0 ? colorA : colorB, t)
}

export { NEUTRAL_COLOR, colorDistance, getComparisonColors, getDivergingColor, mixColor }
