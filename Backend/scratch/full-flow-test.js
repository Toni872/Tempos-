
import fetch from 'node-fetch';

const API_URL = 'http://localhost:8080/api/v1';
const ADMIN_TOKEN = 'test-admin';
const EMPLOYEE_TOKEN = 'test-employee';

async function fullTest() {
  console.log('--- 1. Actualizando Perfil (Fiscal) ---');
  const updatePayload = {
    displayName: 'Dev Employee Updated',
    hourlyRate: 50.00,
    requiresGeolocation: true,
    requiresQR: true,
    status: 'active'
  };

  const updateRes = await fetch(`${API_URL}/employees/00000000-0000-0000-0000-000000000002`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload)
  });
  console.log('Update Status:', updateRes.status);
  console.log('Update Body:', await updateRes.json());

  console.log('\n--- 2. Fichando Entrada (Clock-In) ---');
  const clockInPayload = {
    location: { lat: 40.4168, lng: -3.7038 }, // Madrid Centro
    qrToken: 'QR-TEST-123'
  };

  const clockRes = await fetch(`${API_URL}/fichas/clockin`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${EMPLOYEE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(clockInPayload)
  });
  console.log('Clock-In Status:', clockRes.status);
  const clockData = await clockRes.json();
  console.log('Clock-In Body:', clockData);

  if (clockRes.status === 200) {
    console.log('\n--- 3. Verificando Jornada Activa ---');
    const activeRes = await fetch(`${API_URL}/fichas/active`, {
      headers: { 'Authorization': `Bearer ${EMPLOYEE_TOKEN}` }
    });
    console.log('Active Status:', activeRes.status);
    console.log('Active Body:', await activeRes.json());
  }
}

fullTest();
