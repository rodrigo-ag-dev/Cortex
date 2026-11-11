"""Gera votos presidenciais por município para o 1º turno de 2022.

Lê o arquivo do TSE votacao_candidato_munzona_2022_BR.csv, que contém
resultados por município e zona para Presidente, e agrega as zonas por município.
"""

import csv
import json
from collections import defaultdict
from pathlib import Path


INPUT = (
    Path.home()
    / "Desktop"
    / "2022"
    / "votacao_candidato_munzona_2022_BR.csv"
)
OUTPUT = Path(__file__).with_name("votacao_presidente_2022.json")
CODIGO_CARGO = "1"  # Presidente
TURNO = "1"  # Primeiro turno

NOME_UF = {
    "AC": "ACRE", "AL": "ALAGOAS", "AP": "AMAPÁ", "AM": "AMAZONAS",
    "BA": "BAHIA", "CE": "CEARÁ", "DF": "DISTRITO FEDERAL",
    "ES": "ESPÍRITO SANTO", "GO": "GOIÁS", "MA": "MARANHÃO",
    "MT": "MATO GROSSO", "MS": "MATO GROSSO DO SUL", "MG": "MINAS GERAIS",
    "PA": "PARÁ", "PB": "PARAÍBA", "PR": "PARANÁ", "PE": "PERNAMBUCO",
    "PI": "PIAUÍ", "RJ": "RIO DE JANEIRO", "RN": "RIO GRANDE DO NORTE",
    "RS": "RIO GRANDE DO SUL", "RO": "RONDÔNIA", "RR": "RORAIMA",
    "SC": "SANTA CATARINA", "SP": "SÃO PAULO", "SE": "SERGIPE",
    "TO": "TOCANTINS",
}


def inteiro(valor):
    valor = (valor or "").strip()
    return int(valor) if valor else 0


def main():
    if not INPUT.is_file():
        raise FileNotFoundError(f"Não encontrei o CSV do TSE: {INPUT}")

    municipios = {}
    with INPUT.open("r", encoding="cp1252", newline="") as arquivo:
        leitor = csv.DictReader(arquivo, delimiter=";")
        campos_necessarios = {
            "NR_TURNO", "CD_CARGO", "SG_UF", "CD_MUNICIPIO", "NM_MUNICIPIO",
            "NR_CANDIDATO", "NM_URNA_CANDIDATO", "SG_PARTIDO", "QT_VOTOS_NOMINAIS",
        }
        if not leitor.fieldnames or not campos_necessarios.issubset(leitor.fieldnames):
            raise ValueError("O CSV não tem as colunas esperadas de votação por município e zona")

        for linha in leitor:
            if linha["NR_TURNO"].strip() != TURNO or linha["CD_CARGO"].strip() != CODIGO_CARGO:
                continue

            uf = linha["SG_UF"].strip().upper()
            if uf not in NOME_UF:
                continue

            codigo = str(inteiro(linha["CD_MUNICIPIO"])).zfill(5)
            chave_municipio = (uf, codigo)
            municipio = municipios.setdefault(
                chave_municipio,
                {
                    "nome": linha["NM_MUNICIPIO"].strip(),
                    "candidatos": defaultdict(lambda: {"votos": 0}),
                },
            )

            numero = linha["NR_CANDIDATO"].strip()
            candidato = municipio["candidatos"][(numero, linha["SG_PARTIDO"].strip())]
            candidato["nome"] = linha["NM_URNA_CANDIDATO"].strip()
            candidato["votos"] += inteiro(linha["QT_VOTOS_NOMINAIS"])

    if not municipios:
        raise ValueError("O CSV não contém resultados presidenciais do primeiro turno")

    resultados = []
    for (uf, codigo), municipio in municipios.items():
        candidatos = list(municipio["candidatos"].items())
        total_votos = sum(dados["votos"] for _, dados in candidatos)
        linha = ["MUNICIPIO", codigo, municipio["nome"], uf, NOME_UF[uf]]
        candidatos.sort(key=lambda item: (-item[1]["votos"], int(item[0][0])))
        for (numero, partido), dados in candidatos:
            percentual = (dados["votos"] / total_votos * 100) if total_votos else 0.0
            linha.append([partido, dados["nome"], dados["votos"], round(percentual, 2), "N"])
        resultados.append(linha)

    resultados.sort(key=lambda linha: (linha[3], linha[2]))
    OUTPUT.write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Gerados {len(resultados)} municípios em {OUTPUT}")


if __name__ == "__main__":
    main()

