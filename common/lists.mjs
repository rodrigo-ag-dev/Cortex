const ufList = [
  { label: 'AL', value: 27 }, { label: 'SE', value: 28 }, { label: 'BA', value: 29 }, { label: 'MG', value: 31 },
  { label: 'ES', value: 32 }, { label: 'RJ', value: 33 }, { label: 'SP', value: 35 }, { label: 'PR', value: 41 },
  { label: 'SC', value: 42 }, { label: 'RS', value: 43 }, { label: 'MS', value: 50 }, { label: 'MT', value: 51 },
  { label: 'GO', value: 52 }, { label: 'DF', value: 53 }, { label: 'RO', value: 11 }, { label: 'AC', value: 12 },
  { label: 'AM', value: 13 }, { label: 'RR', value: 14 }, { label: 'PA', value: 15 }, { label: 'AP', value: 16 },
  { label: 'TO', value: 17 }, { label: 'MA', value: 21 }, { label: 'PI', value: 22 }, { label: 'CE', value: 23 },
  { label: 'RN', value: 24 }, { label: 'PB', value: 25 }, { label: 'PE', value: 26 }
].sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0))

const partidoList = [
  { label: "PSDB", value: "PSDB", color: "#0080FF" },
  { label: "PT", value: "PT", color: "#c4122d" },
  { label: "PSB", value: "PSB", color: "#FFCC00" },
  { label: "PSOL", value: "PSOL", color: "	#FFEE57" },
  { label: "PV", value: "PV", color: "#006600" },
  { label: "PSC", value: "PSC", color: "	#006f41" },
  { label: "PRTB", value: "PRTB", color: "	#2cb53f" },
  { label: "PSTU", value: "PSTU", color: "#c92127" },
  { label: "PSDC", value: "PSDC", color: "#FFA500" },
  { label: "PCB", value: "PCB", color: "#ff0000" },
  { label: "PCO", value: "PCO", color: "#9F030A" }
].sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0))

export { ufList, partidoList }