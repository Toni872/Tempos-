#!/bin/bash

# Tempos Backend Quickstart
# Este script configura el backend listo para desarrollo

set -e

echo "🚀 Tempos Backend Setup"
echo "================================"

# 1. Instalar dependencias
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias..."
  npm install
else
  echo "✅ Dependencias ya instaladas"
fi

# 2. Construir TypeScript
echo "🏗️  Compilando TypeScript..."
npm run build

# 3. Crear archivo .env si no existe
if [ ! -f ".env" ]; then
  echo "📝 Creando .env desde .env.example..."
  cp .env.example .env
  echo "⚠️  Recuerda configurar DATABASE_URL en .env"
fi

# 4. Opcionalmente levantar Docker Compose
echo ""
echo "¿Deseas levantar PostgreSQL + API con docker-compose? (s/n)"
read -r response

if [[ "$response" =~ ^[sS]$ ]]; then
  echo "🐳 Iniciando docker-compose..."
  docker-compose up -d
  echo "✅ PostgreSQL en localhost:5432"
  echo "✅ API en localhost:8080"
  echo ""
  echo "📋 Próximos pasos:"
  echo "  1. npm run dev          # Inicia el servidor en modo watch"
  echo "  2. npm run migration:run # Ejecuta migraciones"
else
  echo "⏭️  Saltando docker-compose"
fi

echo ""
echo "✨ Backend listo para desarrollo"
echo ""
echo "Comandos útiles:"
echo "  npm run dev              # Desarrollo (watch mode)"
echo "  npm run build            # Compilar TypeScript"
echo "  npm run migration:generate # Generar migración"
echo "  npm run migration:run    # Ejecutar migraciones"
echo "  npm run lint             # Ejecutar ESLint"
echo "  npm run format           # Formatear código con Prettier"
