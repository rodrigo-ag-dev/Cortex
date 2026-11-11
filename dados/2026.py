"""Baixa os resultados oficiais do TSE e gera votos presidenciais por município.

Cada registro de saída tem o formato:
["MUNICIPIO", código TSE, nome, sigla UF, nome UF,
 [sigla do partido, nome de urna, votos, percentual, eleito], ...]

Fonte: arquivos JSON EA12 (municípios) e EA20 (resultados) do TSE.

Uso:
    python 2026.py            # 1º turno
    python 2026.py --turno 2  # 2º turno
"""

import argparse
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests


BASE_URL = "https://resultados.tse.jus.br"
CICLO = "ele2026"
CODIGOS_ELEICAO = {"1": "6257", "2": "6258"}
CODIGO_CARGO = "0001"  # Presidente da República
MAX_WORKERS = 8


def obter_json(url, session):
    resposta = session.get(url, timeout=60)
    resposta.raise_for_status()
    return resposta.json()


def percentual_float(valor):
    """Converte percentuais do TSE, que podem usar vírgula decimal."""
    if valor is None or valor == "":
        return 0.0
    if isinstance(valor, str):
        valor = valor.strip().replace(",", ".")
    return float(valor)


def ler_candidatos(dados):
    """Converte a estrutura EA20 de um município em itens candidato do resultado."""
    cargos = dados.get("carg", [])
    cargo = next(
        (item for item in cargos if str(item.get("cd", "")).zfill(4) == CODIGO_CARGO),
        None,
    )
    if cargo is None:
        raise ValueError("O arquivo EA20 não contém o cargo Presidente (0001)")

    candidatos = []
    for agregacao in cargo.get("agr", []):
        for partido in agregacao.get("par", []):
            sigla = partido.get("sg", "")
            for candidato in partido.get("cand", []):
                nome = candidato.get("nmu") or candidato.get("nm", "")
                votos = int(candidato.get("vap", 0) or 0)
                percentual = percentual_float(candidato.get("pvap", 0) or 0)
                eleito = "S" if str(candidato.get("e", "n")).lower() == "s" else "N"
                candidatos.append(
                    (sigla, nome, votos, percentual, eleito, str(candidato.get("n", "")))
                )

    if not candidatos:
        raise ValueError("O arquivo EA20 não contém candidatos presidenciais")
    return sorted(candidatos, key=lambda item: (-item[2], item[5]))


def buscar_resultado_municipio(uf, municipio, codigo_eleicao, turno):
    codigo = str(municipio["cd"]).zfill(5)
    uf = uf.lower()
    nome_arquivo = f"{uf}{codigo}-c{CODIGO_CARGO}-e{codigo_eleicao.zfill(6)}-u.json"
    url = f"{BASE_URL}/oficial/{CICLO}/{codigo_eleicao}/dados/{uf}/{nome_arquivo}"

    with requests.Session() as session:
        dados = obter_json(url, session)

    if dados.get("f") != "o":
        raise ValueError(f"Resultado não é da fase oficial: {url}")
    if str(dados.get("t", "")) != turno:
        raise ValueError(f"Turno inesperado no arquivo: {url}")

    linha = [
        "MUNICIPIO",
        codigo,
        municipio.get("nm", ""),
        uf.upper(),
        municipio.get("nome_uf", ""),
    ]
    linha.extend(item[:5] for item in ler_candidatos(dados))
    return linha


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--turno", choices=CODIGOS_ELEICAO, default="1")
    turno = parser.parse_args().turno
    codigo_eleicao = CODIGOS_ELEICAO[turno]
    output = Path(__file__).with_name(
        f"votacao_presidente_2026{'_2' if turno == '2' else ''}.json"
    )

    config_url = (
        f"{BASE_URL}/oficial/{CICLO}/{codigo_eleicao}/config/"
        f"mun-e{codigo_eleicao.zfill(6)}-cm.json"
    )
    with requests.Session() as session:
        municipios_config = obter_json(config_url, session)

    tarefas = []
    for abrangencia in municipios_config.get("abr", []):
        uf = str(abrangencia.get("cd", "")).upper()
        # ZZ representa localidades do exterior, não municípios brasileiros.
        if uf not in {
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
            "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
            "RS", "RO", "RR", "SC", "SP", "SE", "TO",
        }:
            continue
        for municipio in abrangencia.get("mu", []):
            registro = dict(municipio)
            registro["nome_uf"] = abrangencia.get("ds", "")
            tarefas.append((uf, registro))

    if not tarefas:
        raise RuntimeError(f"A configuração do TSE não listou municípios: {config_url}")

    resultados = []
    erros = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futuros = {
            executor.submit(
                buscar_resultado_municipio, uf, municipio, codigo_eleicao, turno
            ): (uf, municipio)
            for uf, municipio in tarefas
        }
        for futuro in as_completed(futuros):
            uf, municipio = futuros[futuro]
            try:
                resultados.append(futuro.result())
            except Exception as erro:
                erros.append(f"{uf.upper()} {municipio.get('nm', municipio.get('cd'))}: {erro}")

    if erros:
        resumo = "\n".join(erros[:20])
        extra = f"\n... e mais {len(erros) - 20} erro(s)" if len(erros) > 20 else ""
        raise RuntimeError(
            f"Falha ao obter {len(erros)} de {len(tarefas)} resultados; "
            f"não gravei uma saída incompleta.\n{resumo}{extra}"
        )

    resultados.sort(key=lambda linha: (linha[3], linha[2]))
    output.write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Gerados {len(resultados)} municípios em {output}")


if __name__ == "__main__":
    main()
