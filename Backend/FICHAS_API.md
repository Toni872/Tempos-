# Tempos API — Fichas Endpoints

## Descripción

Los endpoints de Fichas permiten a usuarios crear, listar, actualizar y eliminar registros de tiempo trabajado.

### Autenticación

Todos los endpoints de Fichas requieren un header `Authorization` con un token JWT válido de Firebase:

```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

---

## Endpoints

### 📝 POST /api/v1/fichas

**Crear nueva ficha (entrada de tiempo)**

#### Request
```json
{
  "date": "2026-03-23",
  "startTime": "09:00",
  "endTime": "12:30",
  "description": "Desarrollo API Tempos",
  "projectCode": "TEMPOS-001",
  "metadata": {
    "tags": ["backend", "api"],
    "location": "Home"
  }
}
```

#### Response (201)
```json
{
  "message": "Ficha creada",
  "ficha": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-03-23T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "12:30",
    "hoursWorked": 3.5,
    "status": "draft"
  }
}
```

---

### 📋 GET /api/v1/fichas

**Listar fichas del usuario (con paginación y filtros)**

#### Query Parameters

| Param | Type | Default | Descripción |
|-------|------|---------|------------|
| `startDate` | ISO Date | - | Fecha inicio (YYYY-MM-DD) |
| `endDate` | ISO Date | - | Fecha fin (YYYY-MM-DD) |
| `status` | string | - | Filtrar por estado (draft\|confirmed\|disputed\|archived) |
| `limit` | number | 50 | Resultados por página |
| `offset` | number | 0 | Número de página |

#### Example Request
```
GET /api/v1/fichas?startDate=2026-03-01&endDate=2026-03-31&status=confirmed&limit=10&offset=0
```

#### Response (200)
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2026-03-23T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "12:30",
      "hoursWorked": 3.5,
      "description": "Desarrollo API",
      "projectCode": "TEMPOS-001",
      "status": "confirmed"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

---

### 🔍 GET /api/v1/fichas/:id

**Obtener ficha específica por ID**

#### Response (200)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2026-03-23T00:00:00.000Z",
  "startTime": "09:00",
  "endTime": "12:30",
  "hoursWorked": 3.5,
  "description": "Desarrollo API",
  "projectCode": "TEMPOS-001",
  "metadata": { "tags": ["backend"] },
  "status": "confirmed",
  "createdAt": "2026-03-23T08:00:00.000Z"
}
```

#### Response (404)
```json
{
  "error": "Ficha no encontrada"
}
```

---

### ✏️ PUT /api/v1/fichas/:id

**Actualizar ficha existente**

#### Request
```json
{
  "endTime": "13:00",
  "description": "Desarrollo API + testing",
  "status": "confirmed"
}
```

#### Response (200)
```json
{
  "message": "Ficha actualizada",
  "ficha": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-03-23T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "13:00",
    "hoursWorked": 4.0,
    "description": "Desarrollo API + testing",
    "projectCode": "TEMPOS-001",
    "status": "confirmed"
  }
}
```

---

### 🗑️ DELETE /api/v1/fichas/:id

**Archivar ficha (soft delete)**

#### Response (200)
```json
{
  "message": "Ficha archivada",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 📊 GET /api/v1/fichas/stats/daily

**Obtener estadísticas diarias de horas trabajadas**

#### Query Parameters

| Param | Type | Descripción |
|-------|------|------------|
| `startDate` | ISO Date | Fecha inicio (requerida) |
| `endDate` | ISO Date | Fecha fin (requerida) |

#### Example Request
```
GET /api/v1/fichas/stats/daily?startDate=2026-03-01&endDate=2026-03-31
```

#### Response (200)
```json
{
  "data": [
    {
      "date": "2026-03-23",
      "hours": 7.5,
      "entries": 2
    },
    {
      "date": "2026-03-24",
      "hours": 8.0,
      "entries": 1
    }
  ],
  "total": 2
}
```

---

## Estados de Ficha

| Estado | Descripción |
|--------|------------|
| `draft` | Borrador (no confirmado) |
| `confirmed` | Confirmado (válido para reportes) |
| `disputed` | Cuestionado (requiere revisión) |
| `archived` | Archivado (soft delete) |

---

## Cálculo de Horas

`hoursWorked = (endTime - startTime) / 60 minutos`

**Ejemplo:**
- startTime: `09:00`
- endTime: `12:30`
- hoursWorked: `3.5` horas

---

## Testing con cURL

### 1. Crear ficha
```bash
curl -X POST http://localhost:8080/api/v1/fichas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "date": "2026-03-23",
    "startTime": "09:00",
    "endTime": "12:30",
    "description": "Desarrollo",
    "projectCode": "TEMPOS-001"
  }'
```

### 2. Listar fichas
```bash
curl -X GET "http://localhost:8080/api/v1/fichas?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### 3. Obtener ficha por ID
```bash
curl -X GET http://localhost:8080/api/v1/fichas/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### 4. Actualizar ficha
```bash
curl -X PUT http://localhost:8080/api/v1/fichas/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "status": "confirmed"
  }'
```

### 5. Archivar ficha
```bash
curl -X DELETE http://localhost:8080/api/v1/fichas/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### 6. Estadísticas diarias
```bash
curl -X GET "http://localhost:8080/api/v1/fichas/stats/daily?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

---

## Códigos HTTP

| Código | Significado |
|--------|------------|
| 201 | Creado exitosamente |
| 200 | OK |
| 400 | Bad Request |
| 401 | Unauthorized (token inválido) |
| 404 | Not Found |
| 500 | Server Error |

---

## Próximas Fases

- **Fase 2 (Sem 5-6)**: Reportes mensuales + exportar a CSV
- **Fase 3 (Sem 7-8)**: Integración con Stripe para pagos
- **Fase 4 (Sem 9+)**: Analytics dashboard
