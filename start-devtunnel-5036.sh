#!/usr/bin/env bash
# Starts the Cortex container (via docker compose) and exposes its
# persistent Dev Tunnel on port 5036.
# Stop with Ctrl+C; the container started by this script is stopped as well.

set -Eeuo pipefail

readonly tunnel_id="map-qsai"
readonly api_port="5036"
readonly compose_file="${HOME}/Projetos/docker-compose.yml"
readonly compose_service="cortex"

fail() {
    echo "Erro: $*" >&2
    exit 1
}

cleanup() {
    echo "Parando o container ${compose_service}..."
    docker compose -f "${compose_file}" stop "${compose_service}" >/dev/null 2>&1 || true
}

trap cleanup EXIT
trap 'exit 130' INT TERM

command -v docker >/dev/null || fail "docker não foi encontrado no PATH."
command -v devtunnel >/dev/null || fail "devtunnel não foi encontrado no PATH."
command -v curl >/dev/null || fail "curl não foi encontrado no PATH."

# This also verifies that the terminal is logged in with the same account that
# owns the persistent tunnel and that the tunnel has port 5036 configured.
# Keep the CLI output: it tells whether the ID is missing, belongs to another
# account, or simply does not have the expected port.
if ! tunnel_check_output="$(devtunnel port show "${tunnel_id}" -p "${api_port}" 2>&1)"; then
    echo "Resposta do devtunnel:" >&2
    echo "${tunnel_check_output}" >&2
    fail "Não foi possível acessar a porta ${api_port} do tunnel ${tunnel_id}. Use 'devtunnel list' para confirmar que fez login na mesma conta usada no VS Code."
fi

echo "Subindo o container ${compose_service} (build se necessário)..."
docker compose -f "${compose_file}" up -d --build "${compose_service}"

echo "Aguardando o servidor responder..."
for _ in $(seq 1 30); do
    if curl --silent --show-error --max-time 2 "http://127.0.0.1:${api_port}/" >/dev/null 2>&1; then
        echo "API pronta."
        echo "Tunnel: https://${tunnel_id}-${api_port}.brs.devtunnels.ms"
        echo "Pressione Ctrl+C para encerrar o tunnel e o container."
        devtunnel host "${tunnel_id}" --allow-anonymous
        exit $?
    fi

    if [[ -z "$(docker compose -f "${compose_file}" ps --status running --quiet "${compose_service}")" ]]; then
        echo "O container encerrou antes de responder. Últimas linhas do log:" >&2
        docker compose -f "${compose_file}" logs --tail 80 "${compose_service}" >&2 || true
        fail "Falha ao iniciar o container ${compose_service}."
    fi

    sleep 1
done

echo "A API não respondeu em 30 segundos. Últimas linhas do log:" >&2
docker compose -f "${compose_file}" logs --tail 80 "${compose_service}" >&2 || true
fail "Falha ao iniciar o container ${compose_service}."
