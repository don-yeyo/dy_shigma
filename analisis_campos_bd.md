# Análisis: Campos Seleccionables Candidatos a Tablas de BD

## Cambios realizados — Variables de Entorno para Nombre de Empresa

Se agregaron las variables:

| Variable | Alcance | Valor actual |
|---|---|---|
| `VITE_COMPANY_NAME` | Frontend (React) | `Don Yeyo S.A.` |
| `VITE_COMPANY_NAME_SHORT` | Frontend (React) | `Don Yeyo` |
| `COMPANY_NAME` | Backend (Node) | `Don Yeyo S.A.` |
| `COMPANY_NAME_SHORT` | Backend (Node) | `Don Yeyo` |

Archivos modificados:
- [client/.env](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/client/.env) y `.env.template`
- [server/.env](file:///c:/Users/gabrielt/Documents/Proyectos/SeguridadHigieneMedioambiente/dy_shigma/server/.env)
- `App.jsx`, `Dashboard.jsx`, `ResiduosComunes.jsx`, `Devoluciones.jsx`, `EspaciosVerdes.jsx`
- `server/index.js`, `server/services/finnegansService.js`, `server/controllers/shigmaController.js`

---

## Campos Seleccionables — Análisis de Migración a BD

### 🔴 ALTA PRIORIDAD — Muy dependientes de la industria/empresa

| Campo | Formulario | Opciones actuales | Tabla sugerida |
|---|---|---|---|
| **Tipo de Residuo** | Residuos Comunes | Inorgánicos marca X, Inorgánicos Generales, Orgánicos | `catalogos_tipo_residuo` |
| **Tipo de Residuo Especial** | Residuos Especiales | Aceite mineral, Solventes, Trapos, Pilas, RAEE | `catalogos_residuo_especial` |
| **Sector de Origen** | Residuos Especiales | Mantenimiento, Compresores, Calderas, Producción... | `sectores_planta` |
| **Planta Generadora** | Residuos Comunes | ER, HY, PE | `plantas` |
| **Espacios Verdes** | Espacios Verdes | Jardín Frontal, Perímetro Norte... | `espacios_verdes` |
| **Tipo de Pallet** | Pallets | Estándar ARLOG, EUR/EPAL, Descartable... | `catalogos_tipo_pallet` |

### 🟡 MEDIA PRIORIDAD — Relevantes para la industria, pero más estables

| Campo | Formulario | Opciones actuales | Tabla sugerida |
|---|---|---|---|
| **Material a Procesar (entrada)** | Tratamiento | Film Nylon, Cartón, PET, Harinas, Bidones | `catalogos_material` |
| **Máquina / Prensa** | Tratamiento | Prensa P1, Molino M3, Composteras... | `maquinas_planta` |
| **Subproducto Obtenido** | Tratamiento | Fardo, Plástico molido, Compost... | `catalogos_subproducto` |
| **Material Revalorizado** | Economía Circular | Compost, Pallets, Film, Cajas cartón | `catalogos_material` (compartida) |
| **Destino de Reinserción** | Economía Circular | Venta recicladora, Donación, Reuso... | `catalogos_destino_reinsercion` |
| **Tipo de Proceso** | Tratamiento | Compactado, Triturado, Compostado... | `catalogos_proceso_tratamiento` |
| **Tarea Realizada** | Espacios Verdes | Riego, Poda, Plantación, Fertilización... | `catalogos_tarea_espacio_verde` |

### 🟢 BAJA PRIORIDAD — Suficientemente genéricos o normativos

| Campo | Formulario | Razón |
|---|---|---|
| **Categoría de Peligro** (Y9, Y42...) | Residuos Especiales | Es nomenclatura normativa (Convenio de Basilea); no cambia por empresa |
| **Tipo de Envase** | Residuos Especiales | Tambor 200L, Bidón 20L... relativamente estándar en la industria |
| **Unidad de Medida** | Varios | kg / L / uds — universal |
| **Estado de Salud de Vegetación** | Espacios Verdes | Escala descriptiva genérica |
| **Motivo de Devolución** | Devoluciones | Varía por empresa pero son pocos y estables |

---

## Propuesta de Estructura SQL

```sql
-- Maestros genéricos para opciones de formularios
CREATE TABLE shigma_catalogos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    tipo        VARCHAR(80)  NOT NULL,  -- ej: 'tipo_residuo', 'proceso_tratamiento'
    codigo      VARCHAR(50)  NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    activo      TINYINT(1)   DEFAULT 1,
    orden       INT          DEFAULT 0,
    UNIQUE KEY uq_tipo_codigo (tipo, codigo)
) ENGINE=InnoDB;

-- Plantas/Sucursales propias de la empresa
CREATE TABLE shigma_plantas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(10)  NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    activo      TINYINT(1)   DEFAULT 1
) ENGINE=InnoDB;

-- Sectores de planta (origen de residuos)
CREATE TABLE shigma_sectores (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    planta_id   INT,
    activo      TINYINT(1)   DEFAULT 1,
    FOREIGN KEY (planta_id) REFERENCES shigma_plantas(id)
) ENGINE=InnoDB;

-- Máquinas/equipos de planta
CREATE TABLE shigma_maquinas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL,
    tipo        VARCHAR(80),  -- ej: 'compactadora', 'trituradora'
    activo      TINYINT(1)   DEFAULT 1
) ENGINE=InnoDB;

-- Espacios verdes registrados
CREATE TABLE shigma_espacios_verdes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL,
    activo      TINYINT(1)   DEFAULT 1
) ENGINE=InnoDB;
```

> [!TIP]
> Con una tabla `shigma_catalogos` genérica se pueden manejar la mayoría de los listados con un solo endpoint `GET /api/shigma/catalogo?tipo=proceso_tratamiento`, evitando crear una tabla por cada dropdown.

> [!IMPORTANT]
> La tabla `shigma_catalogos` ya puede crearse hoy y alimentarse con datos. El cambio en el frontend sería reemplazar los arrays hardcodeados por llamadas `useEffect` similares a las ya existentes para operadores y bateas.

---

## Resumen de Impacto

- **9 archivos** de código fuente ya no contienen referencias a "Don Yeyo"
- **4 variables de entorno** nuevas parametrizan el nombre en front y back
- **13 campos seleccionables** identificados como candidatos a migración a BD
- **6 de alta prioridad** para hacer el sistema verdaderamente multi-empresa sin cambios de código
