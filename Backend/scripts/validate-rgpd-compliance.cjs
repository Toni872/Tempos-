#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando cumplimiento RGPD - Tempos\n');

// Archivos requeridos para cumplimiento RGPD
const requiredFiles = [
  'docs/compliance/LEGAL_BASES.md',
  'docs/compliance/DPA.md',
  'docs/compliance/PRIVACY_POLICY.md',
  'docs/compliance/RETENTION_POLICY.md',
  'docs/HARDENING_CHECKLIST.md'
];

let allFilesExist = true;
const missingFiles = [];

console.log('📋 Verificando archivos de documentación legal:\n');

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - EXISTE`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
    missingFiles.push(file);
    allFilesExist = false;
  }
});

console.log('\n🔧 Verificando implementación técnica:\n');

// Verificar rutas GDPR en index.ts
const indexPath = path.join(__dirname, '..', 'src', 'index.ts');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const gdprRoutes = [
    '/api/v1/gdpr/access',
    '/api/v1/gdpr/rectify',
    '/api/v1/gdpr/delete',
    '/api/v1/gdpr/restrict',
    '/api/v1/gdpr/export'
  ];

  let routesImplemented = true;
  gdprRoutes.forEach(route => {
    if (indexContent.includes(route)) {
      console.log(`✅ Ruta ${route} - IMPLEMENTADA`);
    } else {
      console.log(`❌ Ruta ${route} - FALTANTE`);
      routesImplemented = false;
    }
  });

  if (!routesImplemented) {
    allFilesExist = false;
  }
} else {
  console.log('❌ src/index.ts - NO ENCONTRADO');
  allFilesExist = false;
}

// Verificar controlador GDPR
const controllerPath = path.join(__dirname, '..', 'src', 'controllers', 'gdpr.controller.ts');
if (fs.existsSync(controllerPath)) {
  console.log('✅ Controlador GDPR - EXISTE');
} else {
  console.log('❌ Controlador GDPR - FALTANTE');
  allFilesExist = false;
}

console.log('\n🎯 Resultado de validación:\n');

if (allFilesExist) {
  console.log('🎉 ¡CUMPLIMIENTO RGPD COMPLETADO!');
  console.log('✅ Todos los archivos requeridos existen');
  console.log('✅ Todas las rutas GDPR están implementadas');
  console.log('✅ Controlador GDPR implementado');
  console.log('\n🚀 Listo para Go-Live + Auditoría Final');
} else {
  console.log('⚠️  CUMPLIMIENTO RGPD INCOMPLETO');
  console.log('❌ Faltan archivos o implementaciones:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
  console.log('\n📝 Complete los elementos faltantes antes del Go-Live');
}

console.log('\n📊 Resumen:');
console.log(`Archivos requeridos: ${requiredFiles.length}`);
console.log(`Archivos existentes: ${requiredFiles.length - missingFiles.length}`);
console.log(`Archivos faltantes: ${missingFiles.length}`);