#!/usr/bin/env bash
# Prueba rápida del entorno público (HU-40). Uso: scripts/smoke-demo.sh <api-url> <web-url>
# No usa tokens ni secretos: solo comprueba lo que cualquiera puede ver desde fuera.
set -u

api="${1:?Usage: smoke-demo.sh <api-url> <web-url>}"
web="${2:?Usage: smoke-demo.sh <api-url> <web-url>}"
api="${api%/}"
web="${web%/}"
failures=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "PASS  $name ($actual)"
  else
    echo "FAIL  $name: expected $expected, got $actual"
    failures=$((failures + 1))
  fi
}

status() {
  curl --silent --output /dev/null --write-out '%{http_code}' --max-time 120 "$@"
}

# El API gratuito puede estar dormido: la primera petición lo despierta (hasta ~1 minuto).
echo "Waking the API (can take about a minute)..."
health_body=$(curl --silent --max-time 120 "$api/api/health")
check "API health" '200' "$(status "$api/api/health")"
case "$health_body" in
  *'"database":"Healthy"'*) echo "PASS  database healthy" ;;
  *) echo "FAIL  database not healthy: $health_body"; failures=$((failures + 1)) ;;
esac

check "Protected route without token" '401' "$(status "$api/api/accounts")"
redirect=$(status "${api/https:/http:}/api/health")
# Render o la API redirigen (301/302/307/308): cualquier 3xx sirve; un 200 por HTTP sería un fallo.
check "HTTP redirects to HTTPS" '3xx' "$(case "$redirect" in 3??) echo 3xx ;; *) echo "$redirect" ;; esac)"

check "Web landing" '200' "$(status "$web/")"
check "Web deep link served by the SPA" '200' "$(status "$web/app/transactions")"

allowed=$(curl --silent --max-time 60 --dump-header - --output /dev/null -H "Origin: $web" "$api/api/health" \
  | tr -d '\r' | grep -i '^access-control-allow-origin:' | cut -d' ' -f2)
check "CORS allows the web origin" "$web" "${allowed:-none}"

refused=$(curl --silent --max-time 60 --dump-header - --output /dev/null -H "Origin: https://evil.example.com" \
  "$api/api/health" | tr -d '\r' | grep -ci '^access-control-allow-origin:')
check "CORS refuses another origin" '0' "$refused"

hsts=$(curl --silent --max-time 60 --dump-header - --output /dev/null "$api/api/health" \
  | tr -d '\r' | grep -ci '^strict-transport-security:')
check "HSTS header on the API" '1' "$hsts"

echo
if [ "$failures" -eq 0 ]; then
  echo "All checks passed."
else
  echo "$failures check(s) failed."
fi
exit "$failures"
