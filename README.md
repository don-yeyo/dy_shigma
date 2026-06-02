# SHIGMA — Seguridad, Higiene Industrial y Medio Ambiente
> [!NOTE]
> Sistema web interno de control ambiental, trazabilidad y estado de reciclado dentro de fábrica
>
> 📖 Para una guía detallada del sistema orientada al usuario final y supervisores, consulte el [Manual de Usuario](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/shigma_manual_usuario.md).

SHIGMA permite registrar y auditar todos los flujos de materiales de descartes, tratamiento de residuos, reinserción bajo la premisa de Economía Circular, gestión de pallets de logística y el monitoreo biológico de espacios verdes en un entorno interactivo de alto impacto estético.

---

## Stack Tecnológico

- **Frontend**: React 19 + Vite (CSS Variables, Glassmorphism, animaciones fluidas, modo oscuro y claro inteligente)
- **Backend**: Node.js + Express 5 (Conexión mediante pool de `mysql2/promise`)
- **Persistencia**: Base de datos MySQL (AWS RDS o Local) optimizada con soporte transaccional y columnas nativas `JSON` para desgloses estructurados.
- **Zona Horaria**: Control de GMT-3 (Argentina/Buenos Aires) garantizado mediante forzado de sesión (`SET time_zone`) en cada adquisición de conexión del pool.
- **Autenticación**: MSAL Azure AD (Microsoft) y Google OAuth 2.0. Soporte para `Mock Auth` en desarrollo local.
- **Control de Acceso**: Sistema de roles por base de datos con tres niveles: `sysadmin`, `supervisor` y `registrador`.

---

## Módulos y Funcionalidades

### 1. Dashboard Principal (KPIs en Tiempo Real)
El panel de control principal hereda la estética premium con transparencias (glassmorphism) e integra:
- **Métricas consolidadas**: Peso total de material reciclado común, volumen de residuos especiales acopiados, pallets reparados e impacto ambiental ecológico (CO₂ evitado y ahorro económico).
- **Distribución de Reciclaje**: Gráfico de barras interactivo que muestra los porcentajes relativos de Cartón, Plástico, Vidrio, Metal y Orgánicos procesados.
- **Zonas Verdes**: Contadores eficientes de consumo de agua hídrica de riego y plantaciones nuevas.

> Visible para roles: `sysadmin`, `supervisor`.

### 2. Formularios de Registro e Trazabilidad
SHIGMA cuenta con 7 formularios independientes de alta fidelidad visual y validación de negocio:
- **Residuos Industriales No Especiales (RINE)**: Registro y pesaje detallado de desperdicios orgánicos, inorgánicos de la marca de la empresa e inorgánicos generales por planta generadora. Incluye un switch interactivo para clasificar inorgánicos como *Recuperables* con desglose por material (Cartón, Metal, Cajones, etc.) y auto-cálculo reactivo del lote. Posee integración con un **Monitor de Capacidad de Bateas**, el cual permite a cualquier nivel de usuario ajustar de forma dinámica y en tiempo real la capacidad de cualquier batea en Kilos mediante un modal premium con controles numéricos finos, así como vaciar y reiniciar bateas (con manifiesto de salida obligatorio en estado *pendiente*).
- **Residuos Especiales**: Control estricto de aceites usados, solventes y trapos contaminados. Incluye clasificación por **Código Y de desecho peligroso** (Y9, Y42, Y31) y conversión dinámica de unidades (kg o litros).
- **Inspección de Devoluciones**: Control de mercadería devuelta por clientes para clasificar su destino ambiental (Compostado orgánico, reproceso, donación o destrucción directa).
- **Tratamiento y Valorización**: Registro de procesos físicos de valorización (Compactado hidráulico, trituración de plásticos, compostado industrial) detallando máquina utilizada y subproducto obtenido.
- **Economía Circular**: Trazabilidad de materiales reinsertados en el ciclo productivo. Realiza el **cálculo automático y dinámico de emisiones de CO₂ mitigadas** en base a factores ecológicos específicos:
  - *Pallets reparados*: Ahorra `15.0 kg` CO₂ por unidad.
  - *Compost orgánico maduro*: Ahorra `0.5 kg` CO₂ por kg.
  - *Film stretch de Nylon*: Ahorra `1.5 kg` CO₂ por kg.
  - *Cajas de cartón reutilizadas*: Ahorra `0.9 kg` CO₂ por kg.
- **Gestión de Pallets**: Inventario detallado de pallets de madera que ingresan de logística. Cuenta con **regla de validación reactiva** que impide ingresar más cantidad de pallets reparados, descartados o reciclados que el total ingresado.
- **Registro de Espacios Verdes**: Monitoreo de la huella forestal de la fábrica. Registra riego ecológico, plantaciones nuevas de especies botánicas nativas y el estado general de salud del suelo y plantas.

> Los módulos son accesibles por usuarios que los tengan explícitamente habilitados. Los sysadmin tienen acceso a todos.

### 3. Historial Unificado y Auditoría
Pantalla de auditoría de trazabilidad completa dotada de:
- **Paginación del Lado del Servidor**: Los registros se cargan paginados de forma eficiente desde el servidor según la variable de entorno `HISTORIAL_PAGE_SIZE`, optimizando el consumo de red y el rendimiento del navegador.
- **Buscador global y Filtrado debounced**: Búsqueda por palabra clave y selector de formularios operando en conjunto del lado del servidor para garantizar consistencia con los datos paginados.
- **Diseño en Acordeón**: Visualización elegante de los campos específicos de cada uno de los 7 tipos de registros.
- **Exportación a CSV con Rango**: Al exportar, un modal permite configurar el rango de exportación a formato CSV de auditoría (todo el historial o a partir de una fecha determinada), integrando filtros activos de búsqueda/formulario y aplicando el UTF-8 BOM para un soporte perfecto de caracteres en Microsoft Excel.
- **Modales de Confirmación y Éxito**: Todos los mensajes de confirmación de eliminación y alertas de éxito de modificación/creación han sido reemplazados por modales interactivos y estilizados que respetan la estética visual y el contraste de la aplicación, eliminando por completo el uso de `alert()` o `confirm()` nativos de JavaScript.

---

## Sistema de Autenticación y Control de Acceso

### Flujo de Login

1. El usuario inicia sesión con su cuenta **Microsoft** (Azure AD) o **Google** (si está habilitado).
2. El sistema valida el email autenticado contra la **tabla `usuarios`** de la base de datos.
3. Si el usuario está autorizado y activo, se carga su perfil con `rol` y `módulos` asignados.
4. Si la tabla `usuarios` está vacía (primer arranque), el sistema entra en **modo bootstrap**: los emails listados en `ADMIN_EMAILS` (`.env`) se tratan como sysadmin de emergencia.

### Niveles de Rol

| Rol | Descripción |
|---|---|
| `sysadmin` | Acceso total. Gestiona usuarios, roles y módulos. Ve todos los registros. |
| `supervisor` | Ve y edita registros de todos los registradores. Puede exportar y ver el dashboard. |
| `registrador` | Solo ve y gestiona sus propios registros. Sujeto a límites de tiempo y ediciones. |

### Permisos por Rol

| Capacidad | registrador | supervisor | sysadmin |
|---|---|---|---|
| Ver propios registros | ✅ | ✅ | ✅ |
| Ver registros de otros | ❌ | ✅ (todos) | ✅ |
| Editar propios registros | ✅ (con límites) | ✅ | ✅ |
| Editar registros de otros | ❌ | ✅ | ✅ |
| Eliminar propios registros | ✅ (si se habilita) | ✅ | ✅ |
| Exportar CSV | ❌ | ✅ | ✅ |
| Ver Dashboard | ❌ | ✅ | ✅ |
| Gestión de Usuarios | ❌ | ❌ | ✅ |
| Asignar Módulos | ❌ | ❌ | ✅ |

### Restricciones del rol Registrador

- Solo puede modificar registros propios hasta **N días hacia atrás** (configurable con `REGISTRADOR_MAX_EDIT_DAYS`).
- Solo puede editar un mismo registro hasta **X veces** (configurable con `REGISTRADOR_MAX_EDITS_PER_RECORD`).
- Puede eliminar sus propios registros **si y solo si** la variable de entorno `REGISTRADOR_PUEDE_ELIMINAR` está establecida en `true`, bajo las mismas restricciones de antigüedad y límite de ediciones anteriores.
- No puede exportar el historial de auditoría a formato CSV (botón oculto para este rol).
- En el Historial y Auditoría, la lista de opciones de filtrado de formularios se restringe dinámicamente mostrando **únicamente los formularios de los módulos que tiene habilitados**, optimizando la UX y evitando la confusión visual.
- Al modificar un registro, el usuario es redirigido directamente al formulario original de carga en modo edición (ej: `/residuos-comunes?edit=SHG-RC-0007`), heredando todas las validaciones complejas de negocio.
- Se registra de manera transparente la auditoría de cada modificación guardando el número de ediciones, el usuario que realizó la última edición (`usuario_edicion`) y la fecha/hora exacta del cambio (`updated_at`), visible como un indicador sutil e informativo en el historial.

### Tabla de Módulos Disponibles

| Slug | Nombre en UI |
|---|---|
| `residuos-comunes` | Residuos No Especiales (RINE) |
| `gestion-bateas` | Gestión de Bateas |
| `residuos-especiales` | Residuos Especiales |
| `devoluciones` | Devoluciones |
| `tratamiento` | Tratamiento de Residuos |
| `economia-circular` | Economía Circular |
| `pallets` | Gestión de Pallets |
| `espacios-verdes` | Espacios Verdes |
| `historial` | Historial de Registros |
| `gestion-operadores` | Gestión de Operadores |

### Panel de Gestión de Usuarios (`/gestion-usuarios`)

Accesible solo para `sysadmin`. Permite:
- Ver todos los usuarios con su rol, módulos y estado.
- Crear nuevos usuarios con email, nombre, rol y módulos asignados.
- Editar nombre, rol y módulos de un usuario existente.
- Activar / desactivar usuarios (soft delete — el historial se preserva).

---

## Estructura del Proyecto

```
dy_shigma/
├── client/                    # Frontend React + Vite
│   ├── src/
│   │   ├── assets/            # Logos e imágenes
│   │   ├── components/        # Componentes reutilizables (Layout, Drawer, Modal...)
│   │   ├── config/
│   │   │   ├── AuthContext.jsx    # Contexto de autenticación + roles
│   │   │   ├── ThemeContext.jsx   # Contexto de tema (dark/light)
│   │   │   └── msal.js           # Configuración Microsoft MSAL
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GestionUsuarios.jsx  # Panel de administración de usuarios
│   │   │   ├── Settings.jsx
│   │   │   └── shigma/          # Páginas de cada módulo
│   │   └── services/
│   │       └── api.js           # Axios + interceptor + servicios por entidad
│   ├── .env                   # Variables de entorno del cliente
│   └── .env.template          # Plantilla de variables de entorno del cliente
│
├── server/                    # Backend Node.js + Express
│   ├── config/
│   │   └── db.js              # Pool de conexiones MySQL
│   ├── controllers/
│   │   ├── systemController.js    # Versión + validación de email (con rol y módulos)
│   │   ├── usersController.js     # CRUD de usuarios
│   │   └── shigmaController.js    # Lógica de negocio SHIGMA
│   ├── middleware/
│   │   └── auth.js            # Middleware requireRole() para rutas protegidas
│   ├── routes/
│   │   ├── system.js
│   │   ├── users.js           # Rutas de gestión de usuarios
│   │   └── shigma.js
│   ├── shigma_setup.sql       # Schema completo de la base de datos
│   ├── .env                   # Variables de entorno del servidor
│   └── .env.template          # Plantilla de variables de entorno del servidor
│
└── README.md
```

---

## Setup y Configuración Local

### Requisitos
- **Node.js** v18 o superior
- **npm** v9 o superior
- Servidor **MySQL** v8 (local o AWS RDS)

### Instalación

```bash
# Instalar de manera automática todas las dependencias del proyecto (root, backend y frontend)
npm run install-all
```

### Configuración de Variables de Entorno

Copiar las plantillas `.env.template` correspondientes a `.env` tanto en la carpeta `client/` como en `server/`.

#### Backend (`server/.env`)

| Variable | Descripción | Ejemplo / Default |
|---|---|---|
| `PORT` | Puerto del servidor Express | `5000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `DB_HOST` | Endpoint MySQL (AWS RDS o Local) | `127.0.0.1` |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASS` | Contraseña MySQL | `root` |
| `DB_NAME` | Nombre de la base de datos | `shigma` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_TIMEZONE` | Zona horaria del pool | `-03:00` |
| `ENABLE_GOOGLE_LOGIN` | Habilita login con Google | `true` |
| `VAPID_PUBLIC_KEY` | Llave pública para notificaciones push | *(generada)* |
| `VAPID_PRIVATE_KEY` | Llave privada para notificaciones push | *(generada)* |
| `AZURE_AD_CLIENT_ID` | Client ID de Azure AD | *(tu app Azure)* |
| `AZURE_AD_TENANT_ID` | Tenant ID de Azure AD | *(tu tenant)* |
| `ADMIN_EMAILS` | Emails de sysadmin de emergencia (bootstrap, separados por comas) | `admin@empresa.com` |
| `REGISTRADOR_MAX_EDIT_DAYS` | Días hacia atrás que puede editar un registrador | `7` |
| `REGISTRADOR_MAX_EDITS_PER_RECORD` | Máximo de ediciones por registro para registradores | `3` |
| `REGISTRADOR_PUEDE_ELIMINAR` | Permitir a registradores borrar registros (con límites) | `true` |
| `HISTORIAL_PAGE_SIZE` | Cantidad de registros mostrados por página en el Historial (paginación del lado del servidor) | `20` |

> [!NOTE]
> `ADMIN_EMAILS` es el fallback de emergencia usado **solo cuando la tabla `usuarios` está vacía** (primer arranque). Una vez que se crea el primer sysadmin en el panel, esta variable deja de tener efecto para el login.

#### Frontend (`client/.env`)

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL de la API del servidor | `http://localhost:5000/api` |
| `VITE_COMPANY_NAME` | Nombre completo de la empresa | `DEMO S.A.` |
| `VITE_COMPANY_NAME_SHORT` | Nombre corto de la empresa | `DEMO` |
| `VITE_MOCK_AUTH` | Activa login mock en desarrollo | `true` |
| `VITE_MOCK_AUTH_EMAIL` | Email del usuario mock | `user@ddominio.com` |
| `VITE_MOCK_AUTH_NAME` | Nombre del usuario mock | `Nombre Apellido` |
| `VITE_AZURE_AD_CLIENT_ID` | Client ID Azure para MSAL | *(tu app Azure)* |
| `VITE_AZURE_AD_TENANT_ID` | Tenant ID Azure para MSAL | *(tu tenant)* |
| `VITE_ENABLE_GOOGLE_LOGIN` | Habilita botón de login Google | `true` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google OAuth | *(opcional)* |
| `VITE_DASHBOARD_DEFAULT_DAYS_BACK` | Días por defecto del Dashboard | `30` |
| `VITE_MAX_PAST_DAYS_REGISTRATION` | Días pasados permitidos en formularios | `5` |
| `VITE_MAX_FUTURE_DAYS_REGISTRATION` | Días futuros permitidos en formularios | `3` |
| `VITE_REGISTRADOR_MAX_EDIT_DAYS` | Días hacia atrás que puede editar un registrador | `7` |
| `VITE_REGISTRADOR_MAX_EDITS_PER_RECORD` | Máximo de ediciones por registro (registrador) | `3` |
| `VITE_REGISTRADOR_PUEDE_ELIMINAR` | Habilitar eliminación a registradores (con límites) | `true` |

---

## Despliegue en Netlify

El proyecto está configurado para desplegarse de manera unificada en **Netlify** utilizando el archivo `netlify.toml` en la raíz del proyecto.

### Arquitectura de Producción
- **Frontend (React)**: Se construye mediante `npm run build --prefix client` y se publica el directorio estático `client/dist`.
- **Backend (API)**: Las rutas `/api/*` se redirigen automáticamente al handler de Netlify Functions en `server/netlify-handler.js`, el cual ejecuta el backend Express en modo serverless.

### Configuración en Netlify
1. **Vincular Repositorio**: Conectar el repositorio de GitHub `https://github.com/don-yeyo/dy_shigma.git` (rama `main`).
2. **Variables de Entorno**: Configurar todas las variables tanto del cliente como del servidor en el panel de Netlify.
3. **Base de Datos**: Requiere configurar un servidor MySQL accesible externamente (como AWS RDS) y proveer las credenciales de producción en las variables correspondientes.

---

## Ejecución del Proyecto

### 1. Configuración de Base de Datos

Antes del primer inicio, importar el schema ejecutando el archivo [`shigma_setup.sql`](./server/shigma_setup.sql) en tu gestor MySQL (DBeaver, Workbench, CLI):

```sql
-- En MySQL CLI:
SOURCE /ruta/a/dy_shigma/server/shigma_setup.sql;
```

Esto crea todas las tablas incluyendo `usuarios`, `usuarios_modulos` y los triggers de auditoría.

### 2. Primer Arranque (Bootstrap)

Cuando la tabla `usuarios` está vacía, el sistema entra en **modo bootstrap**:
- Los emails en `ADMIN_EMAILS` (server `.env`) son tratados como `sysadmin`.
- Al iniciar sesión con uno de esos emails, accedés al panel de **Gestión de Usuarios** para crear el primer usuario definitivo.
- Una vez que existe al menos un usuario en la tabla, el modo bootstrap queda desactivado automáticamente.

### 3. Ejecución de los Servicios

En la raíz del proyecto:

```bash
# Iniciar frontend (Vite, puerto 5173) y backend (Express, puerto 5000) simultáneamente
npm run dev
```

---

## Licencia

Uso interno.
División Seguridad e Higiene Industrial y Medio Ambiente.
