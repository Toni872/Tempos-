import { test, expect } from '@playwright/test';

test.describe('Flujo de Acceso Rápido y Fichaje', () => {
  
  test('debe permitir entrar como admin y realizar un fichaje', async ({ page }) => {
    // 1. Ir a la página de login
    await page.goto('http://localhost:5173/login');
    
    // 2. Click en Acceso Temporal (Admin)
    const adminBtn = page.getByRole('button', { name: /ACCESO TEMPORAL \(ADMIN\)/i });
    await expect(adminBtn).toBeVisible();
    await adminBtn.click();

    // 3. Verificar que estamos en el Dashboard (redirección exitosa)
    // Esperamos a que la URL cambie o aparezca un elemento del dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);

    // 4. Gestionar el Modal de Protección de Datos (si aparece)
    const consentBtn = page.getByRole('button', { name: /Entendido, Aceptar y Continuar/i });
    if (await consentBtn.isVisible()) {
      await consentBtn.click();
      console.log('⚖️ Consentimiento legal aceptado');
    }

    // 5. Intentar realizar un fichaje
    const clockInBtn = page.getByRole('button', { name: /Iniciar Entrada/i });
    
    // Si ya hay un fichaje activo, el botón dirá "Finalizar Jornada", así que comprobamos ambos
    const isClockedIn = await page.getByRole('button', { name: /Finalizar Jornada/i }).isVisible();
    
    if (!isClockedIn) {
      await expect(clockInBtn).toBeVisible();
      await clockInBtn.click();
      
      // Verificamos que el botón cambie a "Finalizar Jornada" indicando éxito
      await expect(page.getByRole('button', { name: /Finalizar Jornada/i })).toBeVisible({ timeout: 5000 });
      console.log('✅ Fichaje de entrada realizado con éxito via Playwright');
    } else {
      console.log('ℹ️ El usuario ya estaba fichado, saltando paso de entrada');
    }
  });

});
