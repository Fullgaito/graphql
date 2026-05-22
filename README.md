# GraphQL Colombia API 

Servidor GraphQL construido con Apollo Server que expone datos de la API pública [api-colombia.com](https://api-colombia.com). Incluye soporte para consultar departamentos, presidentes, regiones, artículos de la constitución y festivos — más una capa de mutaciones para registrar universidades por ciudad.

---

## Requisitos

- Node.js 18 o superior
- npm o yarn

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Fullgaito/graphql.git

# Instalar dependencias
npm install
```

### Dependencias utilizadas

| Paquete | Versión recomendada | Para qué sirve |
|---|---|---|
| `apollo-server` | ^3.x | Servidor GraphQL |
| `graphql` | ^16.x | Motor de GraphQL |
| `node-fetch` | ^2.x | HTTP hacia api-colombia.com |

> **Nota:** `node-fetch` v3 usa ESModules por defecto. Si tu proyecto usa CommonJS (`require`), instala la v2: `npm install node-fetch@2`.

```bash
npm install apollo-server graphql node-fetch
```

Asegúrate de tener `"type": "module"` en tu `package.json` si usas la sintaxis `import/export`:

```json
{
  "type": "module"
}
```

---

## Ejecución

```bash
node index.js
```

El servidor queda disponible en `http://localhost:4000`. Apollo Server abre automáticamente Apollo Sandbox en esa URL, desde donde puedes probar todas las queries y mutations.

---

## Estructura del schema

### Tipos principales

```
University     id, name, cityId
City           id, name, description, surface, population, postalCode, universities
Department     id, name, description, municipalities, surface, population, phonePrefix, cityCapital
President      id, name, lastName, startPeriodDate, endPeriodDate, politicalParty, description, cityId
Region         id, name, description
ConstitutionArticle  id, titleNumber, title, chapterNumber, chapter, articleNumber, content
Holiday        date, name
```

### Queries disponibles

| Query | Argumentos | Descripción |
|---|---|---|
| `departments` | — | Lista todos los departamentos con su ciudad capital |
| `presidents` | — | Lista todos los presidentes de Colombia |
| `regions` | — | Lista las regiones naturales |
| `constitutionArticles` | — | Artículos de la Constitución del 91 |
| `holidays` | `year: Int!` | Festivos de un año específico |

### Mutations disponibles

| Mutation | Argumentos | Descripción |
|---|---|---|
| `addUniversity` | `cityId: ID!, name: String!` | Agrega una universidad a una ciudad |

---

## Ejemplos de uso

### 1. Consultar departamentos con ciudad capital

```graphql
query {
  departments {
    id
    name
    cityCapital {
      id
      name
      population
    }
  }
}
```

**Respuesta esperada:**
```json
{
  "data": {
    "departments": [
      {
        "id": "1",
        "name": "Amazonas",
        "cityCapital": {
          "id": "12",
          "name": "Leticia",
          "population": 42239
        }
      }
    ]
  }
}
```

---

### 2. Agregar una universidad a una ciudad

Primero obtén el `id` de la ciudad capital desde la query anterior, luego úsalo en la mutation:

```graphql
mutation {
  addUniversity(cityId: "88", name: "Universidad Nacional de Colombia") {
    success
    message
    university {
      id
      name
      cityId
    }
  }
}
```

**Respuesta esperada (éxito):**
```json
{
  "data": {
    "addUniversity": {
      "success": true,
      "message": "Universidad agregada correctamente.",
      "university": {
        "id": "88-1718200000000",
        "name": "Universidad Nacional de Colombia",
        "cityId": "88"
      }
    }
  }
}
```

**Respuesta si ya existe (duplicado):**
```json
{
  "data": {
    "addUniversity": {
      "success": false,
      "message": "Ya existe una universidad llamada \"Universidad Nacional de Colombia\" en la ciudad 88.",
      "university": null
    }
  }
}
```

---

### 3. Verificar universidades registradas en una ciudad

Después de agregar universidades, aparecen en el campo `universities` de `cityCapital`:

```graphql
query {
  departments {
    id
    name
    cityCapital {
      name
      population
      universities {
        id
        name
      }
    }
  }
}
```

---

### 4. Consultar presidentes

```graphql
query {
  presidents {
    id
    name
    lastName
    startPeriodDate
    endPeriodDate
    politicalParty
  }
}
```

---

### 5. Consultar festivos de un año

```graphql
query {
  holidays(year: 2025) {
    date
    name
  }
}
```

---

### 6. Artículos de la Constitución

```graphql
query {
  constitutionArticles {
    articleNumber
    title
    content
  }
}
```

---

### 7. Regiones naturales

```graphql
query {
  regions {
    id
    name
    description
  }
}
```

---

## Flujo recomendado para agregar universidades

```
1. Ejecutar query departments
        ↓
2. Identificar el cityCapital.id del departamento de interés
        ↓
3. Ejecutar mutation addUniversity con ese cityId
        ↓
4. Volver a ejecutar query departments incluyendo universities
   para confirmar el registro
```

---

## Consideraciones importantes

**Almacenamiento en memoria**
Las universidades se guardan en un objeto en memoria (`universitiesByCity`). Los datos se pierden al reiniciar el servidor. Para persistencia real se necesitaría integrar una base de datos como PostgreSQL o MongoDB.

**Fuente de datos externa**
Toda la información de departamentos, presidentes, regiones y festivos viene de `https://api-colombia.com/api/v1`. Si esa API no responde, las queries devuelven arreglos vacíos o `null` en lugar de lanzar un error.

**Resolver de `cityCapital`**
La API de Colombia devuelve los departamentos con un campo `capitalId`, no con el objeto ciudad embebido. Por eso el resolver de `Department.cityCapital` hace un fetch adicional a `/City/{id}` por cada departamento cuando se consulta ese campo. En producción convendría agregar DataLoader para evitar el problema N+1.

---

## Posibles errores comunes

| Error | Causa probable | Solución |
|---|---|---|
| `Cannot use import statement` | Falta `"type": "module"` en package.json | Agregar `"type": "module"` |
| `node-fetch` not found | Dependencia no instalada | `npm install node-fetch` |
| `cityCapital` siempre `null` | El campo en la API se llama diferente a `capitalId` | Verificar la respuesta real de `/api/v1/Department` e ajustar el resolver |
| Puerto 4000 ocupado | Otro proceso usa ese puerto | Cambiar puerto: `server.listen({ port: 4001 })` |