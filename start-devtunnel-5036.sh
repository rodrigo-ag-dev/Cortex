#!/usr/bin/env bash
# Starts the Node API and exposes its persistent Dev Tunnel on port 5036.
# Stop with Ctrl+C; the API process started by this script is stopped as well.

set -Eeuo pipefail

readonly tunnel_id="map-qsai"
readonly api_port="5036"
readonly script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly project_dir="${script_dir}"

api_pid=""
api_log=""

fail() {
    echo "Erro: $*" >&2
    exit 1
}

cleanup() {
    if [[ -n "${api_pid}" ]] && kill -0 "${api_pid}" 2>/dev/null; then
        echo "Encerrando a API (PID ${api_pid})..."
        kill "${api_pid}" 2>/dev/null || true
        wait "${api_pid}" 2>/dev/null || true
    fi
}

trap cleanup EXIT
trap 'exit 130' INT TERM

command -v node >/dev/null || fail "node não foi encontrado no PATH."
command -v devtunnel >/dev/null || fail "devtunnel não foi encontrado no PATH."
command -v curl >/dev/null || fail "curl não foi encontrado no PATH."

cd "${project_dir}"

# This also verifies that the terminal is logged in with the same account that
# owns the persistent tunnel and that the tunnel has port 5036 configured.
# Keep the CLI output: it tells whether the ID is missing, belongs to another
# account, or simply does not have the expected port.
if ! tunnel_check_output="$(devtunnel port show "${tunnel_id}" -p "${api_port}" 2>&1)"; then
    echo "Resposta do devtunnel:" >&2
    echo "${tunnel_check_output}" >&2
    fail "Não foi possível acessar a porta ${api_port} do tunnel ${tunnel_id}. Use 'devtunnel list' para confirmar que fez login na mesma conta usada no VS Code."
fi

api_log="$(mktemp "${TMPDIR:-/tmp}/cortex-${api_port}.XXXXXX.log")"
echo "Iniciando a API em http://0.0.0.0:${api_port}..."
PORT="${api_port}" node ./server/index.js >"${api_log}" 2>&1 &
api_pid="$!"

echo "Aguardando o servidor responder..."
for _ in $(seq 1 30); do
    if curl --silent --show-error --max-time 2 "http://127.0.0.1:${api_port}/" >/dev/null 2>&1; then
        echo "API pronta."
        echo "Tunnel: https://${tunnel_id}-${api_port}.brs.devtunnels.ms"
        echo "Pressione Ctrl+C para encerrar o tunnel e a API."
        devtunnel host "${tunnel_id}"
        exit $?
    fi

    if ! kill -0 "${api_pid}" 2>/dev/null; then
        echo "A API encerrou antes de responder. Últimas linhas do log:" >&2
        tail -n 80 "${api_log}" >&2 || true
        fail "Falha ao iniciar a API. Log completo: ${api_log}"
    fi

    sleep 1
done

echo "A API não respondeu em 30 segundos. Últimas linhas do log:" >&2
tail -n 80 "${api_log}" >&2 || true
fail "Falha ao iniciar a API. Log completo: ${api_log}"
