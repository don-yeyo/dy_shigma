# SHIGMA — Seguridad, Higiene Industrial y Medio Ambiente
> [!NOTE]
> Sistema web interno de control ambiental, trazabilidad y estado de reciclado dentro de la fábrica de **Don Yeyo S.A.**

SHIGMA permite registrar y auditar todos los flujos de materiales de descarte, tratamiento de residuos, reinserción bajo la premisa de Economía Circular, gestión de pallets de logística y el monitoreo biológico de espacios verdes en un entorno interactivo y premium de alto impacto estético.

---

## Stack Tecnológico

- **Frontend**: React 19 + Vite (CSS Variables, Glassmorphism, animaciones fluidas, modo oscuro y claro inteligente)
- **Backend**: Node.js + Express 5
- **Persistencia**: Sistema de base de datos local y liviano basado en archivos JSON estructurados con autogeneración de identificadores de trazabilidad premium (ej: `SHG-RC-0001`).
- **Seguridad**: MSAL Azure AD integrado, Google OAuth 2.0 y soporte para `Mock Auth` en modo de desarrollo local.

---

## Módulos y Funcionalidades

### 1. Dashboard Principal (KPIs en Tiempo Real)
El panel de control principal hereda la estética premium con transparencias (glassmorphism) e integra:
- **Métricas consolidadas**: Peso total de material reciclado común, volumen de residuos especiales acopiados, pallets reparados e impacto ambiental ecológico (CO₂ evitado y ahorro económico).
- **Distribución de Reciclaje**: Gráfico de barras interactivo que muestra los porcentajes relativos de Cartón, Plástico, Vidrio, Metal y Orgánicos procesados.
- **Zonas Verdes**: Contadores eficientes de consumo de agua hídrica de riego y plantaciones nuevas.

### 2. Formularios de Registro e Trazabilidad
SHIGMA cuenta con 7 formularios independientes de alta fidelidad visual y validación de negocio:
- **Residuos Comunes**: Pesaje detallado por sector generador y asignación de destino de reciclables (Contenedor Verde, Acopio General, Compostera).
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

### 3. Historial Unificado y Auditoría
Pantalla de auditoría de trazabilidad completa dotada de:
- **Buscador global**: Búsqueda reactiva por palabra clave sobre campos como ID único, sector, tipo de residuo, inspector o cliente.
- **Filtrado dinámico**: Selector que segmenta por tipo de formulario cargado.
- **Diseño en Acordeón**: Visualización elegante de los campos específicos de cada uno de los 7 tipos de registros.
- **Exportación Premium a CSV**: Generador de archivos de auditoría listos para abrir en Microsoft Excel a partir de los datos filtrados en tiempo real.

---

## Setup y Configuración Local

### Requisitos
- **Node.js** v18 o superior
- **npm** v9 o superior

### Instalación

```bash
# Instalar de manera automática todas las dependencias del proyecto (root, backend y frontend)
npm run install-all
```

### Configuración de Variables de Entorno

Copiar las plantillas `.env.template` correspondientes a `.env` tanto en la carpeta `client/` como en `server/`.

#### Backend (`server/.env`)
| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `PORT` | Puerto del servidor Express | `5000` |
| `SHIGMA_DATA_PATH` | Carpeta de persistencia local para archivos JSON | `./data` |
| `AUTHORIZED_EMAILS` | Emails con permiso de acceso de administrador | `gabrielt@donyeyo.com.ar` |

#### Frontend (`client/.env`)
| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `VITE_API_URL` | URL de la API del servidor Express | `http://localhost:5000/api` |
| `VITE_MOCK_AUTH` | Permite iniciar sesión localmente con un perfil simulado | `true` |
| `VITE_MOCK_AUTH_EMAIL` | Correo del usuario MOCK | `gabrielt@donyeyo.com.ar` |
| `VITE_MOCK_AUTH_NAME` | Nombre del usuario MOCK | `Gabriel Tonelli` |

---

## Ejecución del Proyecto

En la raíz de la carpeta de trabajo, ejecute el siguiente comando para lanzar ambos servicios simultáneamente (servidor Express en puerto 5000 y Vite client en puerto 5173):

```bash
# Iniciar frontend y backend en paralelo de forma interactiva
npm run dev
```

El servidor web creará automáticamente el directorio configurado en `SHIGMA_DATA_PATH` para almacenar y organizar los archivos JSON de control y auditoría.

---

## Licencia

Uso interno — Don Yeyo S.A.
División Seguridad e Higiene Industrial y Medio Ambiente.
