# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gps-consent.spec.js >> GPS Consent Tests >> Enlaces a documentos legales funcionan
- Location: tests\e2e\gps-consent.spec.js:125:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - button "Volver al inicio" [ref=e6] [cursor=pointer]:
      - img [ref=e7]
      - text: Volver al inicio
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - img [ref=e12]
          - generic [ref=e21]: Tempos
        - heading "Bienvenido de nuevo" [level=1] [ref=e22]
        - paragraph [ref=e23]: Introduce tus credenciales para acceder a tu panel de control.
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]: "Modo local: entra sin registrarte"
          - button "Entrar como Admin" [ref=e28] [cursor=pointer]
        - alert [ref=e29]: No se pudo conectar con la API local. ¿Está levantada la API en http://localhost:8080?
        - generic [ref=e30]:
          - generic [ref=e31]: Correo electrónico
          - textbox "ejemplo@empresa.com" [ref=e32]: employee@tempos.com
        - generic [ref=e33]:
          - generic [ref=e34]:
            - generic [ref=e35]: Contraseña
            - link "¿Olvidaste tu contraseña?" [ref=e36] [cursor=pointer]:
              - /url: "#"
          - textbox "••••••••" [ref=e37]: employee123
        - button "Iniciar sesión" [ref=e38] [cursor=pointer]
        - generic [ref=e41]: o
        - button "Continuar con Google" [ref=e43] [cursor=pointer]:
          - img [ref=e44]
          - text: Continuar con Google
      - generic [ref=e49]:
        - text: ¿No tienes cuenta?
        - link "Regístrate" [ref=e50] [cursor=pointer]:
          - /url: /register
    - generic [ref=e51]: Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
  - generic [ref=e52]:
    - img "Visual login employee" [ref=e53]
    - generic:
      - generic: El control vuelve a ti.
      - generic: Accede a tus datos en tiempo real.
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Page Object for Login Page
  5  |  * Handles authentication flows for E2E testing
  6  |  */
  7  | export class LoginPage {
  8  |   constructor(page) {
  9  |     this.page = page;
  10 |     this.emailInput = page.locator('input[type="email"]');
  11 |     this.passwordInput = page.locator('input[type="password"]');
  12 |     this.loginButton = page.locator('button[type="submit"]');
  13 |     this.errorMessage = page.locator('.error-message');
  14 |   }
  15 | 
  16 |   async goto() {
  17 |     await this.page.goto('/login');
  18 |   }
  19 | 
  20 |   async login(email, password) {
  21 |     await this.emailInput.fill(email);
  22 |     await this.passwordInput.fill(password);
  23 |     await this.loginButton.click();
  24 |   }
  25 | 
  26 |   async loginAsAdmin() {
  27 |     await this.login('admin@tempos.com', 'admin123');
  28 |     await this.page.waitForURL('**/dashboard');
  29 |   }
  30 | 
  31 |   async loginAsEmployee() {
  32 |     await this.login('employee@tempos.com', 'employee123');
> 33 |     await this.page.waitForURL('**/dashboard');
     |                     ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  34 |   }
  35 | 
  36 |   async expectErrorMessage(message) {
  37 |     await expect(this.errorMessage).toContainText(message);
  38 |   }
  39 | }
```