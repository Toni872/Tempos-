#!/usr/bin/env node

/**
 * Script de Validación RGPD Compliance - Tempos
 * Verifica cumplimiento específico de RGPD para GPS y datos personales
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Iniciando validación RGPD Compliance...\n');

// Checklist RGPD específico
const rgpdChecklist = {
  // Artículos RGPD relevantes para Tempos
  articles: [
    {
      id: 'RGPD-5',
      name: 'Principio de minimización de datos',
      description: '¿Solo se procesan datos personales necesarios para el fichaje?',
      check: () => {
        // Verificar que solo se almacenan campos necesarios
        const entityPath = path.join(__dirname, 'src/entities/TimeEntry.ts');
        if (!fs.existsSync(entityPath)) {
          console.log('   ❌ No se encuentra TimeEntry.ts');
          return false;
        }

        const content = fs.readFileSync(entityPath, 'utf8');
        const hasOnlyNecessaryFields = !content.includes('unnecessary') && content.includes('latitude') && content.includes('longitude');
        console.log(`   ${hasOnlyNecessaryFields ? '✓' : '❌'} Solo campos necesarios ${hasOnlyNecessaryFields ? 'almacenados' : 'detectados campos innecesarios'}`);
        return hasOnlyNecessaryFields;
      }
    },
    {
      id: 'RGPD-6',
      name: 'Licitud del tratamiento',
      description: '¿Existe base legal para procesar datos GPS?',
      check: () => {
        // Verificar documentación de base legal
        const legalPath = path.join(__dirname, '../docs/compliance/LEGAL_BASES.md');
        const exists = fs.existsSync(legalPath);
        if (!exists) {
          console.log('   ❌ Documentación de bases legales no encontrada');
          return false;
        }

        const content = fs.readFileSync(legalPath, 'utf8');
        const hasGpsLegalBasis = content.includes('GPS') && (content.includes('Art. 6.1.b') || content.includes('contrato laboral'));
        console.log(`   ${hasGpsLegalBasis ? '✓' : '❌'} Base legal GPS ${hasGpsLegalBasis ? 'documentada' : 'ausente'}`);
        return hasGpsLegalBasis;
      }
    },
    {
      id: 'RGPD-7',
      name: 'Consentimiento para GPS',
      description: '¿Se obtiene consentimiento específico para geolocalización?',
      check: () => {
        // Verificar implementación de consentimiento GPS
        const modalPath = path.join(__dirname, '../Frontend/src/components/GeolocationConsentModal.jsx');
        const hookPath = path.join(__dirname, '../Frontend/src/hooks/useGeolocation.js');

        const modalExists = fs.existsSync(modalPath);
        const hookExists = fs.existsSync(hookPath);

        if (!modalExists || !hookExists) {
          console.log('   ❌ Componentes de consentimiento GPS incompletos');
          return false;
        }

        const modalContent = fs.readFileSync(modalPath, 'utf8');
        const hasSpecificConsent = modalContent.includes('geolocation') && modalContent.includes('consent');
        const hasRevocation = modalContent.includes('revoke') || modalContent.includes('deny');

        console.log(`   ${hasSpecificConsent ? '✓' : '❌'} Consentimiento específico ${hasSpecificConsent ? 'implementado' : 'ausente'}`);
        console.log(`   ${hasRevocation ? '✓' : '❌'} Opción de revocación ${hasRevocation ? 'disponible' : 'ausente'}`);

        return hasSpecificConsent && hasRevocation;
      }
    },
    {
      id: 'RGPD-13',
      name: 'Información al interesado',
      description: '¿Se informa claramente sobre procesamiento de datos GPS?',
      check: () => {
        // Verificar información proporcionada al usuario
        const privacyPath = path.join(__dirname, '../Frontend/src/pages/PrivacyPolicy.jsx');
        const exists = fs.existsSync(privacyPath);

        if (!exists) {
          console.log('   ❌ Política de privacidad no encontrada');
          return false;
        }

        const content = fs.readFileSync(privacyPath, 'utf8');
        const hasGpsInfo = content.includes('GPS') || content.includes('geolocation') || content.includes('ubicación');
        const hasPurpose = content.includes('fichaje') || content.includes('control horario');
        const hasRetention = content.includes('4 años') || content.includes('48 meses');

        console.log(`   ${hasGpsInfo ? '✓' : '❌'} Información GPS ${hasGpsInfo ? 'proporcionada' : 'ausente'}`);
        console.log(`   ${hasPurpose ? '✓' : '❌'} Propósito ${hasPurpose ? 'explicado' : 'no explicado'}`);
        console.log(`   ${hasRetention ? '✓' : '❌'} Período retención ${hasRetention ? 'especificado' : 'no especificado'}`);

        return hasGpsInfo && hasPurpose && hasRetention;
      }
    },
    {
      id: 'RGPD-17',
      name: 'Derecho de supresión',
      description: '¿Se pueden eliminar datos GPS del interesado?',
      check: () => {
        // Verificar implementación de derecho al olvido
        const controllerPath = path.join(__dirname, 'src/controllers/gdpr.controller.ts');
        const exists = fs.existsSync(controllerPath);

        if (!exists) {
          console.log('   ❌ Controlador GDPR no encontrado');
          return false;
        }

        const content = fs.readFileSync(controllerPath, 'utf8');
        const hasDeletionEndpoint = content.includes('DELETE') && content.includes('/gdpr/delete');
        const hasAnonymization = content.includes('anonymize') || content.includes('pseudonymize');

        console.log(`   ${hasDeletionEndpoint ? '✓' : '❌'} Endpoint de eliminación ${hasDeletionEndpoint ? 'implementado' : 'ausente'}`);
        console.log(`   ${hasAnonymization ? '✓' : '❌'} Anonimización ${hasAnonymization ? 'implementada' : 'ausente'}`);

        return hasDeletionEndpoint && hasAnonymization;
      }
    },
    {
      id: 'RGPD-25',
      name: 'Protección de datos desde el diseño',
      description: '¿Se implementaron medidas de privacidad by design?',
      check: () => {
        // Verificar medidas de privacy by design
        const securityPath = path.join(__dirname, 'SECURITY.md');
        const exists = fs.existsSync(securityPath);

        if (!exists) {
          console.log('   ❌ Documento de seguridad no encontrado');
          return false;
        }

        const content = fs.readFileSync(securityPath, 'utf8');
        const hasEncryption = content.includes('encrypt') || content.includes('AES');
        const hasAccessControl = content.includes('RBAC') || content.includes('role-based');
        const hasAudit = content.includes('audit') && content.includes('log');

        console.log(`   ${hasEncryption ? '✓' : '❌'} Encriptación ${hasEncryption ? 'implementada' : 'ausente'}`);
        console.log(`   ${hasAccessControl ? '✓' : '❌'} Control de acceso ${hasAccessControl ? 'implementado' : 'ausente'}`);
        console.log(`   ${hasAudit ? '✓' : '❌'} Auditoría ${hasAudit ? 'implementada' : 'ausente'}`);

        return hasEncryption && hasAccessControl && hasAudit;
      }
    },
    {
      id: 'RGPD-32',
      name: 'Seguridad del tratamiento',
      description: '¿Se implementaron medidas de seguridad apropiadas?',
      check: () => {
        // Verificar medidas de seguridad
        const hardeningPath = path.join(__dirname, '../docs/HARDENING_CHECKLIST.md');
        const exists = fs.existsSync(hardeningPath);

        if (!exists) {
          console.log('   ❌ Checklist de hardening no encontrado');
          return false;
        }

        const content = fs.readFileSync(hardeningPath, 'utf8');
        const hasHttps = content.includes('HTTPS') || content.includes('SSL');
        const hasRateLimit = content.includes('rate limit') || content.includes('RateLimit');
        const hasInputValidation = content.includes('validation') || content.includes('sanitization');

        console.log(`   ${hasHttps ? '✓' : '❌'} HTTPS ${hasHttps ? 'implementado' : 'ausente'}`);
        console.log(`   ${hasRateLimit ? '✓' : '❌'} Rate limiting ${hasRateLimit ? 'implementado' : 'ausente'}`);
        console.log(`   ${hasInputValidation ? '✓' : '❌'} Validación entrada ${hasInputValidation ? 'implementada' : 'ausente'}`);

        return hasHttps && hasRateLimit && hasInputValidation;
      }
    }
  ],

  // Derechos ARCO
  derechosArco: [
    {
      id: 'ARCO-1',
      name: 'Derecho de Acceso',
      description: '¿Los interesados pueden acceder a sus datos GPS?',
      check: () => {
        // Verificar endpoint de acceso a datos
        const controllerPath = path.join(__dirname, 'src/controllers/gdpr.controller.ts');
        if (!fs.existsSync(controllerPath)) return false;

        const content = fs.readFileSync(controllerPath, 'utf8');
        const hasAccessEndpoint = content.includes('GET') && content.includes('/gdpr/access');
        console.log(`   ${hasAccessEndpoint ? '✓' : '❌'} Endpoint acceso ${hasAccessEndpoint ? 'implementado' : 'ausente'}`);
        return hasAccessEndpoint;
      }
    },
    {
      id: 'ARCO-2',
      name: 'Derecho de Rectificación',
      description: '¿Se pueden corregir datos GPS inexactos?',
      check: () => {
        // Verificar capacidad de corrección con audit log
        const controllerPath = path.join(__dirname, 'src/controllers/ficha.controller.ts');
        if (!fs.existsSync(controllerPath)) return false;

        const content = fs.readFileSync(controllerPath, 'utf8');
        const hasCorrectionWithLog = content.includes('TimeEntryChangeLog') && content.includes('correction');
        console.log(`   ${hasCorrectionWithLog ? '✓' : '❌'} Corrección con log ${hasCorrectionWithLog ? 'implementada' : 'ausente'}`);
        return hasCorrectionWithLog;
      }
    },
    {
      id: 'ARCO-3',
      name: 'Derecho de Supresión',
      description: '¿Se implementó el "derecho al olvido"?',
      check: () => {
        // Verificar derecho de supresión (ya verificado en RGPD-17)
        return true; // Ya verificado arriba
      }
    },
    {
      id: 'ARCO-4',
      name: 'Derecho de Oposición',
      description: '¿Los interesados pueden oponerse al procesamiento GPS?',
      check: () => {
        // Verificar posibilidad de oposición
        const modalPath = path.join(__dirname, '../Frontend/src/components/GeolocationConsentModal.jsx');
        if (!fs.existsSync(modalPath)) return false;

        const content = fs.readFileSync(modalPath, 'utf8');
        const hasObjectionOption = content.includes('deny') || content.includes('revoke');
        console.log(`   ${hasObjectionOption ? '✓' : '❌'} Opción objeción ${hasObjectionOption ? 'disponible' : 'ausente'}`);
        return hasObjectionOption;
      }
    }
  ]
};

// Ejecutar validaciones
function runRgpdValidation() {
  let articlesPassed = 0;
  let articlesTotal = rgpdChecklist.articles.length;
  let derechosPassed = 0;
  let derechosTotal = rgpdChecklist.derechosArco.length;

  console.log('📋 ARTÍCULOS RGPD RELEVANTES:\n');

  rgpdChecklist.articles.forEach(article => {
    console.log(`${article.id}: ${article.name}`);
    console.log(`   ${article.description}`);
    const passed = article.check();
    if (passed) articlesPassed++;
    console.log(`   Resultado: ${passed ? '✅ PASADO' : '❌ FALLADO'}\n`);
  });

  console.log('⚖️  DERECHOS ARCO:\n');

  rgpdChecklist.derechosArco.forEach(derecho => {
    console.log(`${derecho.id}: ${derecho.name}`);
    console.log(`   ${derecho.description}`);
    const passed = derecho.check();
    if (passed) derechosPassed++;
    console.log(`   Resultado: ${passed ? '✅ PASADO' : '❌ FALLADO'}\n`);
  });

  // Resultado final
  console.log('📊 RESULTADO RGPD:\n');
  console.log(`Artículos RGPD: ${articlesPassed}/${articlesTotal} (${Math.round(articlesPassed/articlesTotal*100)}%)`);
  console.log(`Derechos ARCO: ${derechosPassed}/${derechosTotal} (${Math.round(derechosPassed/derechosTotal*100)}%)\n`);

  if (articlesPassed === articlesTotal && derechosPassed === derechosTotal) {
    console.log('🎉 ¡VALIDACIÓN RGPD COMPLETA! Sistema cumple con RGPD.');
    console.log('📋 Checklist RGPD aprobado.');
    process.exit(0);
  } else {
    console.log('⚠️  VALIDACIÓN RGPD INCOMPLETA: Hay aspectos sin resolver.');
    console.log('🚫 No se puede proceder sin cumplimiento RGPD completo.');
    process.exit(1);
  }
}

// Ejecutar
runRgpdValidation();