# Plan de Implementación: Sistema SHIGMA (Seguridad, Higiene y Medioambiente)

Este plan de implementación detalla el proceso para crear la herramienta **SHIGMA** (Seguridad e Higiene Industrial y Medio Ambiente) basada en la estructura del proyecto `dy_finnegans_addons`. El sistema servirá para gestionar la trazabilidad y el estado del reciclado dentro de la fábrica, ofreciendo 7 formularios de registro clave y un Dashboard unificado de métricas.

## Metas del Proyecto

1. **Copiar y Adaptar la Estructura Base**: Transferir todos los archivos necesarios de `dy_finnegans_addons` a `dy_shigma` sin arrastrar datos inútiles (como `node_modules` o archivos `.git` anteriores).
2. **Preparar para Git y Control de Entorno**: Inicializar Git en el nuevo repositorio y configurar los archivos `.env` y `.env.template` correspondientes.
3. **Conservar y Adaptar el Dashboard**: Rediseñar la interfaz principal manteniendo el estilo Glassmorphism, animaciones fluidas y soporte para modo claro/oscuro del proyecto original, agregando KPI Cards interactivas para el seguimiento de reciclado.
4. **Implementar los 7 Formularios de Registro**:
   - **Residuos Comunes**: Registro de cartón, plástico, vidrio, orgánicos.
   - **Residuos Especiales**: Manejo de aceites usados, solventes, trapos contaminados, baterías.
   - **Devoluciones**: Gestión e inspección de mercancía devuelta clasificada para reciclaje o descarte.
   - **Tratamiento**: Registro de procesos como compactado, triturado, compostado, etc.
   - **Economía Circular**: Trazabilidad de materiales reinsertados al ciclo productivo (ej. abono, pallets reparados, etc.).
   - **Pallets**: Gestión de palets de madera (recibidos, reparados, descartados).
   - **Registro de Espacios Verdes**: Control de áreas verdes, riego, plantaciones y consumo de agua.
5. **Almacenamiento Persistente Local**: Crear un backend Express ligero que almacene y consulte los registros en archivos JSON dentro de `server/data/` para simular una base de datos segura y local sin dependencias complejas de base de datos externa.
6. **Trazabilidad Unificada (Historial)**: Diseñar una pantalla de historial/auditoría donde el personal de Seguridad e Higiene pueda ver, buscar y filtrar todos los registros creados con estados interactivos.

---

## User Review Required

> [!IMPORTANT]
> - **Autenticación (OAuth / Mock)**: El sistema base `dy_finnegans_addons` cuenta con inicio de sesión corporativo mediante Microsoft / Google Azure AD. Para agilizar el testeo local del módulo de Seguridad e Higiene, mantendremos habilitado el `VITE_MOCK_AUTH=true` en `.env` de desarrollo, permitiendo saltarse la autenticación Azure AD si no hay credenciales configuradas.
> - **Almacenamiento Local (Archivos JSON)**: Para la persistencia de datos utilizaremos un almacenamiento basado en archivos JSON en `server/data/`. Esto no requiere infraestructura de bases de datos externa y es extremadamente fácil de respaldar e integrar en el futuro.

---

## Open Questions

- Ninguna por el momento. La definición de los 7 formularios cubre todos los casos de uso descritos y conservará la estética premium y modular solicitada.

---

## Proposed Changes

### Componente: Infraestructura y Configuración Base

#### [NEW] [README.md](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/README.md)
Documentación completa del sistema SHIGMA con guías de instalación, variables de entorno y descripción de módulos.

#### [NEW] [.env.template](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/client/.env.template)
Configuración de variables de entorno para el cliente React.

#### [NEW] [.env.template](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/server/.env.template)
Configuración de variables de entorno para el backend Express.

---

### Componente: Backend Express (Servicio de Persistencia de Registros)

Crearemos un controlador genérico y rutas para gestionar los registros de los 7 formularios de SHIGMA.

#### [NEW] [shigmaRoutes.js](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/server/routes/shigma.js)
Endpoints para guardar y consultar registros de Residuos, Tratamientos, Devoluciones, Pallets y Espacios Verdes.

#### [NEW] [shigmaController.js](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/server/controllers/shigmaController.js)
Lógica para leer/escribir archivos JSON persistentes en `server/data/` para cada formulario, con autoincrementables y fechas.

#### [MODIFY] [index.js](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/server/index.js)
Montar las nuevas rutas de SHIGMA e inicializar la carpeta `server/data/`.

---

### Componente: Frontend React (UI & Formularios)

#### [MODIFY] [App.jsx](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/client/src/App.jsx)
Actualizar rutas del enrutador para incluir las nuevas pantallas de los formularios, historial y dashboard adaptado.

#### [MODIFY] [Drawer.jsx](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/client/src/components/Drawer.jsx)
Actualizar la navegación lateral con accesos directos al Dashboard de SHIGMA, los formularios y el historial de trazabilidad.

#### [MODIFY] [Header.jsx](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/client/src/components/Header.jsx)
Renombrar la cabecera a **SHIGMA** (Seguridad, Higiene y Medioambiente).

#### [MODIFY] [Dashboard.jsx](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/client/src/pages/Dashboard.jsx)
Rediseñar el Dashboard para mostrar:
- Tarjetas de KPIs principales (Ej: Kg totales reciclados, Pallets reparados, Tareas de riego del día).
- Grid premium de acceso directo a los 7 formularios con iconos estilizados y descripciones.
- Sección de estadísticas rápidas mediante SVG dinámicos (barras de progreso, gráficos de dona).

#### [NEW] [Formularios y Páginas en /client/src/pages/shigma](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/client/src/pages/shigma)
- `ResiduosComunes.jsx`: Formulario premium con paso a paso para el registro de residuos reciclables urbanos.
- `ResiduosEspeciales.jsx`: Formulario con especificaciones de toxicidad, transportistas y certificados de disposición final.
- `Devoluciones.jsx`: Gestión de productos retornados que entran al canal de reacondicionamiento o reciclaje.
- `Tratamiento.jsx`: Registro del proceso de transformación (compactado, triturado, compostaje).
- `EconomiaCircular.jsx`: Registro de la valorización y reinserción de subproductos al mercado o uso interno.
- `Pallets.jsx`: Control de stock, reparación y descarte de palets de madera de logística.
- `EspaciosVerdes.jsx`: Formulario de mantenimiento ambiental, plantaciones y consumo de agua.
- `HistorialTrazabilidad.jsx`: Tabla interactiva y buscador global para auditar todos los registros generados por los inspectores.

---

## Plan de Verificación

### Pruebas Automatizadas e Integración
- Levantar el servidor Express con `npm run dev` y validar el inicio correcto de los servicios concurrentes.
- Realizar pruebas de APIs mediante logs de consola y simular el guardado de datos en `server/data/`.

### Verificación Manual de Flujo de Trabajo
1. Acceder al sistema en modo Mock de Autenticación.
2. Navegar por el Dashboard y verificar la visualización en modo claro y modo oscuro.
3. Rellenar y enviar cada uno de los 7 formularios de SHIGMA.
4. Confirmar que los datos se almacenan en los archivos JSON del backend.
5. Ir al "Historial de Trazabilidad" para buscar, filtrar y verificar que los datos registrados coincidan con las fórmulas de economía circular.
6. Corroborar el funcionamiento responsivo en vistas de tablet y celular.
