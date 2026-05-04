import { sanitizeInput, Validator, apiRateLimiter, generateCSRFToken } from '../../Frontend/src/lib/security.js';

console.log("=== SCRIPT 9 SECURITY MODULE TEST ===");

// 1. Test CSRF Token
console.log("\n[1] CSRF Token Generation:");
console.log("Token 1:", generateCSRFToken());
console.log("Token 2:", generateCSRFToken());

// 2. Test XSS Sanitization
console.log("\n[2] XSS Sanitization (DOMPurify):");
const maliciousInput = '<script>alert("HACKED")</script><img src="x" onerror="alert(1)"><b>Texto seguro</b><a href="javascript:alert(1)">Click</a>';
console.log("Input original:", maliciousInput);
console.log("Input sanitizado:", sanitizeInput(maliciousInput));

// 3. Test Payloads
console.log("\n[3] NoSQL/SQLi Payload Validation:");
console.log("Email válido (admin@tempos.es):", Validator.isEmailValid('admin@tempos.es'));
console.log("Email inyección (admin@tempos.es' OR '1'='1):", Validator.isEmailValid("admin@tempos.es' OR '1'='1"));
console.log("Texto seguro (Hola equipo):", Validator.isSafeText('Hola equipo'));
console.log("Texto inyección (Hola $eq 1):", Validator.isSafeText('Hola $eq 1'));

// 4. Test Rate Limiter
console.log("\n[4] API Rate Limiter Test (Limit: 50/min):");
let allowedCount = 0;
let blockedCount = 0;
for (let i = 0; i < 55; i++) {
  if (apiRateLimiter.canMakeRequest()) allowedCount++;
  else blockedCount++;
}
console.log(`Intentos: 55 | Permitidos: ${allowedCount} | Bloqueados (Protegidos): ${blockedCount}`);

console.log("\n=== TEST COMPLETED ===");
