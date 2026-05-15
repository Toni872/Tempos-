import { test, expect } from '@playwright/test';

test.describe('Validación 360º', () => {
  test('fichaje geolocalizado con auto-provisionamiento', async ({ browser }) => {
    test.setTimeout(240000);
    const context = await browser.newContext({ permissions: ['geolocation'], viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    
    await page.addInitScript(() => {
      localStorage.setItem('geolocation-consent', 'accepted');
      localStorage.setItem('geolocation-consent-date', new Date().toISOString());
      window._TEMPOS_DEBUG = [];
      const _origFetch = window.fetch;
      window.fetch = async (...args) => {
        window._TEMPOS_DEBUG.push(`📡 FETCH: ${args[0]}`);
        return _origFetch(...args);
      };
    });

    const coords = { latitude: 40.4168, longitude: -3.7038 };

    // 1. ADMIN PROVISION
    await page.goto('http://localhost:5173/login');
    await page.getByRole('button', { name: /ACCESO TEMPORAL \(ADMIN\)/i }).click();
    await page.waitForURL('**/dashboard');
    const token = await page.evaluate(() => JSON.parse(localStorage.getItem('tempos-session') || '{}').token);
    await page.evaluate(async ({ token, coords }) => {
      await fetch('/api/v1/work-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: 'Sede E2E', latitude: coords.latitude, longitude: coords.longitude, radiusMeters: 1000, status: 'active' })
      });
    }, { token, coords });
    await page.evaluate(() => localStorage.clear());

    // 2. EMPLEADO TEST
    await page.goto('http://localhost:5173/login');
    await page.getByRole('button', { name: /ACCESO TEMPORAL \(EMPLEADO\)/i }).click();
    await page.waitForURL('**/dashboard');

    const clickSafe = async () => {
      const b = page.getByRole('button').filter({ hasText: /Iniciar Entrada|Finalizar Jornada|Fichar/i }).first();
      await b.click({ delay: 500 });
      await page.getByRole('button', { name: /Confirmar|Aceptar/i }).click({ timeout: 2000 }).catch(() => {});
    };

    // Salir si estaba dentro
    if (await page.getByRole('button', { name: /Finalizar Jornada/i }).isVisible()) {
      await context.setGeolocation(coords);
      await page.reload();
      await clickSafe();
      await page.waitForTimeout(3000);
    }

    // TEST PARÍS
    console.log('🗼 TEST PARÍS...');
    await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });
    await page.reload();
    await clickSafe();
    await page.waitForTimeout(5000);
    // Verificamos que seguimos fuera (el botón sigue siendo "Iniciar" o similar)
    const stillOut = await page.getByRole('button').filter({ hasText: /Iniciar Entrada|Fichar/i }).first().isVisible();
    expect(stillOut).toBeTruthy();

    // TEST MADRID
    console.log('🇪🇸 TEST MADRID...');
    await context.setGeolocation(coords);
    await page.reload();
    await clickSafe();
    
    // ÉXITO: El botón debe cambiar a "Finalizar Jornada"
    await expect(page.getByRole('button', { name: /Finalizar Jornada/i })).toBeVisible({ timeout: 15000 });

    // LIMPIEZA: Salir para dejar la DB limpia para el usuario
    console.log('🧹 LIMPIEZA: Finalizando jornada...');
    await clickSafe();
    await expect(page.getByRole('button', { name: /Iniciar Jornada/i })).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'tests/e2e/screenshots/victory.png' });

    console.log('🏆 SEGURIDAD 360º VALIDADA CORRECTAMENTE.');
  });
});
