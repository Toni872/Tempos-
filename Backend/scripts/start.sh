#!/usr/bin/env bash
set -e
proj="$(cd "$(dirname "$0")/.." && pwd)"
cd "$proj"
echo "Starting Docker Compose stack..."
docker compose pull
docker compose up -d
echo "Waiting for API to become healthy..."
sleep 5
if curl -fsS http://localhost:8080/health; then
  echo "Health OK"
else
  echo "Health check failed"
fi
