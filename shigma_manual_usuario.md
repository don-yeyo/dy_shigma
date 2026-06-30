# Manual de Usuario — SHIGMA
### Sistema de Gestión de Seguridad, Higiene y Medioambiente.

Bienvenido al manual oficial de usuario de **SHIGMA**. Esta herramienta integral ha sido diseñada para registrar, auditar y controlar con precisión todos los aspectos relacionados con los flujos de materiales de descarte, residuos especiales, devoluciones, revalorización y mantenimiento ambiental de nuestra planta industrial.

---

## 📋 Índice
1. [Introducción al Sistema](#1-introducción-al-sistema)
2. [Estructura de Roles y Accesos](#2-estructura-de-roles-y-accesos)
3. [Inicio de Sesión y Acceso](#3-inicio-de-sesión-y-acceso)
4. [Gestión de Usuarios y Módulos](#4-gestión-de-usuarios-y-módulos)
5. [Guía de Módulos Operativos](#5-guía-de-módulos-operativos)
   * [Residuos Industriales No Especiales (RINE)](#residuos-industriales-no-especiales-rine)
   * [Residuos Especiales y Peligrosos](#residuos-especiales-y-peligrosos)
   * [Inspección de Devoluciones](#inspección-de-devoluciones)
   * [Tratamiento y Valorización](#tratamiento-y-valorización)
   * [Economía Circular (Emisiones Co₂)](#economia-circular-emisiones-co2)
   * [Movimiento de Pallets (Logística)](#movimiento-de-pallets-logística)
   * [Registro de Espacios Verdes](#registro-de-espacios-verdes)
6. [Historial y Auditoría de Registros](#6-historial-y-auditoría-de-registros)
7. [Exportación e Informes en Excel](#7-exportación-e-informes-en-excel)

---

## 1. Introducción al Sistema
SHIGMA opera como el núcleo de trazabilidad ambiental, permitiendo a la empresa certificar sus procesos bajo normas de sustentabilidad, optimización de recursos y economía circular. Su interfaz web adaptativa proporciona una experiencia visual clara tanto en turnos diurnos (Modo Claro) como en trabajos nocturnos de planta (Modo Oscuro).

---

## 2. Estructura de Roles y Accesos
Para garantizar la integridad y seguridad del historial de auditoría, el sistema divide a sus usuarios en tres categorías o de nivel de acceso:

### A. Registrador (Personal Operativo y de Carga)
Es el perfil encargado de capturar la información diaria en el piso de planta. Sus capacidades son:
* **Carga**: Acceder y registrar datos en los formularios operativos que tenga habilitados en su perfil.
* **Trazabilidad Individual**: En el historial, solo puede ver los registros que él mismo haya cargado. No tiene acceso a registros de otros compañeros.
* **Modificación controlada**: Puede corregir sus propios registros cargados, pero bajo estrictas reglas operativas para resguardar la validez de los datos:
  * Solo puede editar el registro dentro de un **límite de días** posterior a su creación (ejemplo: 7 días).
  * Solo puede editar un mismo registro un **número máximo de veces** (ejemplo: 3 veces).
  * Cada modificación deja una bitácora automática de auditoría indicando quién modificó, la fecha, la hora exacta y cuántas ediciones lleva.
* **Eliminación controlada**: Puede eliminar sus propios registros si la administración lo ha habilitado para su perfil, sujeto a los mismos límites de tiempo y número de ediciones que posee la modificación.
* **Restricciones**: No tiene acceso a los paneles estadísticos (Dashboard), no puede visualizar la gestión de usuarios, ni exportar los datos a formato de planillas CSV.

### B. Supervisor (Jefes de Área y Auditores)
Es el perfil de control y análisis de gestión de la planta. Sus capacidades son:
* **Dashboard Completo**: Visualización del panel de indicadores, métricas, CO₂ evitado y distribución de reciclados en tiempo real.
* **Auditoría Global**: Visualización y búsqueda libre sobre la totalidad de los registros cargados por todos los registradores del sistema.
* **Edición y Eliminación sin límites**: Puede modificar o eliminar cualquier registro (propio o ajeno) sin restricciones de antigüedad o de cantidad de modificaciones previas.
* **Exportación**: Descargar reportes históricos en formato compatible con Microsoft Excel (CSV).

### C. Administrador (Soporte y Sistemas)
Control total de la infraestructura técnica de la plataforma:
* **Gestión de Cuentas**: Dar de alta nuevos integrantes, suspender accesos (sin borrar su historial) y modificar nombres o emails.
* **Asignación de Módulos**: Elegir individualmente qué formularios tiene permitidos ver y cargar cada usuario.
* **Configuración del Sistema**: Administrar los operadores autorizados y los parámetros de edición de los registradores.

---

## 3. Inicio de Sesión y Acceso
El sistema se encuentra integrado con las cuentas corporativas oficiales de la empresa:
1. Ingrese a la dirección web provista por el departamento de sistemas.
2. Presione el botón de inicio de sesión correspondiente a su proveedor corporativo (**Microsoft Azure AD** o **Google Workspace**).
3. Escriba sus credenciales de correo electrónico de la empresa.
4. Si su cuenta ya está habilitada en la base de datos de SHIGMA, ingresará automáticamente a su pantalla correspondiente (Dashboard o Listado de Formularios habilitados).
5. En caso de error o advertencia de *"Cuenta no autorizada"*, comuníquese con el administrador del sistema para que le asigne su rol.

---

## 4. Gestión de Usuarios y Módulos
*(Exclusivo para el Administrador de Sistemas)*

Desde el menú lateral, acceda a **"Gestión de Usuarios"**:
* **Crear Usuario**: Presione *"Nuevo Usuario"*, capture su correo electrónico corporativo, nombre completo, asigne su nivel de rol (`Registrador`, `Supervisor`, `Administrador`) y seleccione mediante casillas de verificación (checkboxes) cuáles formularios tendrá habilitados.
* **Modificar Permisos**: Pulse el botón de edición en el listado para añadir o remover módulos a un usuario de manera instantánea.
* **Baja de Personal**: Para seguridad del sistema, no elimine usuarios que hayan cargado registros históricos (para no perder la trazabilidad de autoría). En su lugar, desmarque la casilla de *"Activo"* para suspender su acceso de inmediato.

---

## 5. Guía de Módulos Operativos

---

### Residuos Industriales No Especiales (RINE)
Este formulario es el núcleo de trazabilidad de desperdicios comunes generados en fábrica. Su diseño dinámico automatiza los cálculos y valida que el almacenamiento sea seguro.

#### Paso a Paso para la Carga:
1. **Fecha y Hora de la Carga**: El sistema sugiere el momento actual. En caso de estar registrando un pesaje atrasado, haga clic en el campo de fecha para abrir el calendario interactivo.
2. **Planta Generadora**: Seleccione la planta de procedencia de los residuos comunes:
   * *Elguea Roman*
   * *Hipólito Yrigoyen*
   * *Pellegrini*
3. **Tipo de Residuo**: Elija entre:
   * **Orgánicos**: Desperdicios de materia prima o producción.
   * **Inorgánicos**: Descartes de embalaje, oficinas o insumos.
4. **Asignación de Batea**: El sistema le mostrará las bateas disponibles en tiempo real según el tipo seleccionado. Podrá ver un medidor gráfico indicando la capacidad actual ocupada de la batea en Kilos. Si la batea está al límite, se activará un aviso preventivo.
5. **Clasificación (Para Inorgánicos)**:
   * **Irrecuperables**: Descarte final que no se puede reincorporar ni reciclar. Ingrese directamente el peso en kilos y presione *"Registrar Lote"*.
   * **Recuperables**: Al seleccionar esta opción, se desplegará una grilla dinámica con los materiales reciclables admitidos por la planta:
     * *Cartón y Papel*
     * *Film Stretch / Nylon*
     * *Cajones de Plástico*
     * *Hierro y Metales varios*
     * *Madera de Descarte*
     * Ingrese la cantidad estimada en kilos para cada uno de los materiales presentes en el lote. **El sistema calculará automáticamente la suma total del lote en tiempo real**, evitando errores matemáticos manuales.
6. **Supervisor de Seguridad**: Seleccione el auditor ambiental responsable de firmar digitalmente la operación en planta.
7. **Observaciones**: Describa cualquier anomalía (ej: humedad excesiva en cartón, roturas de estiba, etc.).
8. Presione **"Registrar Pesaje"**. Se abrirá una ventana emergente premium confirmando el registro con un identificador único único (ej: `SHG-RC-0015`). Pulse *"Volver al Dashboard"* o *"Cargar Otro"* para continuar.

#### Monitor e Inspección de Capacidad de Bateas:
El panel de **"Gestión de Bateas"** permite monitorear y configurar el almacenamiento de RINE en tiempo real:
* Muestra el porcentaje de llenado y peso acumulado de todas las bateas activas en tiempo real.
* **Ajustar Capacidad**: Cualquier usuario (registrador, supervisor o administrador) que tenga habilitado este módulo puede definir y cambiar la capacidad máxima en kilogramos de cualquier batea de forma dinámica presionando el ícono de **Ajustes / Deslizadores (Sliders)** en la tarjeta correspondiente. Esto permite una flexibilidad inmediata ante cambios operativos en planta.
* **Vaciar y Reiniciar Batea**: Cuando una batea se llena, se debe vaciar físicamente y registrar el vaciado en el sistema:
  1. Pulse el botón de vaciado correspondiente.
  2. Complete el **Manifiesto de Salida Obligatorio** (Destino del viaje, chofer, patente del camión y observaciones).
  3. Al confirmar, el sistema reinicia el contador de peso de la batea a `0 kg` y genera una **Salida con Estado Pendiente** en el historial para ser auditada posteriormente al ingresar el ticket definitivo de la báscula externa.

---

### Residuos Especiales y Peligrosos
Este módulo controla los elementos que posean características de toxicidad, inflamabilidad o riesgo químico (aceites usados, solventes, trapos contaminados con hidrocarburos, baterías gastadas).

#### Paso a Paso para la Carga:
1. Complete la fecha, hora de carga e inspector responsable en planta.
2. **Tipo de Residuo Especial**: Seleccione la categoría correspondiente (ejemplo: Aceites lubricantes usados, Envases contaminados, Filtros, etc.).
3. **Categoría Corriente de Desecho**: Seleccione el código técnico internacional (Código Y de peligrosidad) sugerido por el inspector ambiental (ejemplo: `Y9` para mezclas de aceites/agua, `Y42` para disolventes orgánicos).
4. **Cantidad y Unidad**: Capture el valor exacto del acopio especificando si la medición es en **Kilogramos (kg)** o **Litros (L)**.
5. **Sector de Origen**: Indique la sección de la fábrica que generó el residuo (ejemplo: Taller Mecánico, Compresores, Caldera, Mantenimiento Eléctrico).
6. **Tipo de Envase**: Especifique el contenedor de resguardo (Tambor plástico de 200L, Contenedor IBC 1000L, Pallet encajonado, Big Bag de seguridad).
7. **Certificado de Acopio Interno (Opcional)**: En caso de poseer un precinto o ticket físico de numeración de residuo peligroso, capture el código de trazabilidad para futura inspección legal.
8. Presione **"Registrar Acopio Peligroso"** para almacenar la información.

---

### Inspección de Devoluciones
Trazabilidad de productos terminados que regresan a la planta debido a retiros de mercado, vencimientos, fallas de empaque o rechazos logísticos.

#### Paso a Paso para la Carga:
1. Especifique el cliente o sucursal de origen que realiza la devolución.
2. Ingrese el nombre comercial del producto devuelto.
3. **Cantidad de Bultos**: Ingrese la cantidad de cajas, bandejas o unidades devueltas.
4. **Peso Estimado**: Capture el peso del lote en kilogramos para control de masa de desecho.
5. **Motivo de Devolución**: Seleccione la causa (Vencimiento de fecha, Rotura de empaque primario, Pérdida de vacío, Temperatura fuera de rango).
6. **Inspección de Calidad**: Indique el dictamen del inspector de calidad (Apto para reproceso, No apto con sospecha microbiológica, Devolución comercial simple).
7. **Disposición Final**: Especifique el destino ecológico asignado al lote:
   * *Donación a entidades autorizadas* (solo si el producto es inocuo).
   * *Destrucción y Compostaje Orgánico* (para reintegrarse como abono orgánico en espacios verdes).
   * *Reproceso interno controlado*.
   * *Destrucción final irrecuperable* (Relleno sanitario).

---

### Tratamiento y Valorización
Registra las acciones físicas aplicadas en nuestra planta de reciclaje para transformar los residuos comunes en subproductos útiles o reducir su volumen para logística.

#### Paso a Paso para la Carga:
1. **Proceso Aplicado**: Seleccione el método de tratamiento físico:
   * *Compactado hidráulico de fardos* (para cartón y nylon).
   * *Triturado mecánico de plásticos* (cajones y mermas plásticas).
   * *Compostado industrial* (para restos orgánicos y áreas verdes).
2. **Material de Entrada**: Seleccione el insumo alimentado a la máquina (Fardos sueltos, Plásticos soplados, Descarte de panadería, etc.).
3. **Cantidad Procesada**: Ingrese el peso total alimentado a la línea en kilogramos.
4. **Equipo Utilizado**: Indique la maquinaria operadora (Prensa Enfardadora Hidráulica 01, Trituradora de Plástico Fénix, Batea de Compostaje Industrial).
5. **Subproducto Obtenido**: Especifique el resultado (Fardo de cartón prensado de 250kg, Escamas de plástico molido, Compost orgánico maduro).

---

### Economía Circular (Emisiones Co₂)
Este módulo no requiere carga de datos independiente. Se alimenta automáticamente de los registros aprobados de revalorización de materiales para calcular en tiempo real el **ahorro ecológico**.

#### Cómo entender los Indicadores:
* **Emisiones de CO₂ Mitigadas**: Muestra los kilogramos de Dióxido de Carbono que la empresa ha evitado liberar a la atmósfera mediante el reciclaje. Los cálculos se basan en los siguientes coeficientes ambientales de valorización:
  * Cada *Pallet de madera reparado* evita **15.0 kg** de CO₂.
  * Cada kilogramo de *Film stretch de Nylon recuperado* evita **1.5 kg** de CO₂.
  * Cada *Caja de cartón reutilizada* evita **0.9 kg** de CO₂.
  * Cada kilogramo de *Compost orgánico maduro generado* evita **0.5 kg** de CO₂.
* **Ahorro Económico Estimado**: Sumatoria de costos evitados por no adquirir materia prima virgen gracias a la recuperación interna de insumos de empaque y logística.

---

### Movimiento de Pallets (Logística)
Módulo rediseñado para registrar movimientos y transacciones individuales de pallets de madera. Al ingresar al módulo, el operario debe seleccionar el tipo de transacción mediante una botonera interactiva:

#### Tipos de Movimiento:
1. **Descartes**: Para pallets rotos que se envían a disposición final. Requiere registrar Destino (texto libre capitalizado), número de Remito y Operario de entrega.
2. **Reparación Externa**: Pallets enviados a un taller externo. Registra el Proveedor, número de Remito y el Operario de entrega. El estado inicial es "Retirado".
3. **Reparación Interna**: Pallets reparados dentro de la fábrica. Registra el Operario de entrega y el Operario que recibe para reparación. El estado inicial es "Retirado".
4. **Ingreso de Nuevos**: Registro de adquisición de pallets nuevos. Requiere Proveedor, número de Remito y el Operario que recibe.
5. **Entrega Interna**: Traslado de pallets a una planta y sector específicos dentro de la fábrica. Requiere seleccionar Planta, Sector (fijos), Operario de entrega y Operario que recibe.
6. **Entrega Externa**: Envío de pallets a proveedores o clientes externos. Requiere Proveedor, número de Remito y Operario de entrega.

#### Circuito de Estados y Devoluciones de Reparaciones:
* Para las reparaciones (tanto internas como externas), el registro nace en estado **"Retirado"**.
* Posteriormente, cuando los pallets son devueltos y recibidos en planta, un supervisor o registrador puede acceder al **Historial de Registros**, expandir el detalle del movimiento y presionar el botón **"Registrar Devolución"**.
* Se abrirá un modal pidiendo seleccionar el **Operario que Recibe** y la fecha/hora de la devolución, lo cual cambiará el estado del lote a **"Devuelto"** para auditoría y sumará estas unidades como pallets reparados en el Dashboard.

---

### Registro de Espacios Verdes
Monitorea la salud ecológica, riego y forestación de los parques y cortinas de viento perimetrales de la fábrica.

#### Paso a Paso para la Carga:
1. **Zona Ambiental**: Seleccione el área bajo intervención (Jardín frontal de administración, Perímetro Norte Compresores, Parque recreativo del comedor, Barrera forestal trasera).
2. **Tarea Realizada**: Riego controlado con agua de recuperación, Poda selectiva, Plantación de nuevos ejemplares, Fertilización orgánica con compost interno.
3. **Consumo de Agua**: Ingrese los litros estimados utilizados para el riego ecológico de la zona.
4. **Forestación**: Si se sembraron nuevas plantas o árboles, capture la cantidad y el nombre de la especie botánica (ej: Jacarandá, arbustos nativos, plantas florales).
5. **Estado de Salud**: Evalúe visualmente el estado del sector (Excelente, Crecimiento estable, Falta de riego con estrés hídrico, Bajo tratamiento biológico de plagas).

---

## 6. Historial y Auditoría de Registros
La pantalla **"Historial de Registros"** es una bitácora unificada y dinámica de todas las cargas realizadas en la plataforma.

### Herramientas de Control:
* **Buscador Global Inteligente**: Escriba cualquier palabra clave (el ID único del registro, el nombre de un inspector, una planta, un material o sector) en la barra superior. El listado se actualizará de forma instantánea trayendo las coincidencias directamente del servidor.
* **Segmentación por Formulario**: Utilice el menú desplegable derecho para filtrar únicamente RINE, Residuos Especiales, Logística de Pallets, etc.
* **Estructura en Acordeón**: Cada registro se visualiza en una tarjeta compacta que detalla su ID, tipo de formulario, fecha, hora e inspector responsable. Al hacer clic en ella, se despliega una grilla elegante mostrando el 100% de los campos específicos, observaciones detalladas y botones de acción.

---

## 7. Exportación e Informes en Excel
*(Exclusivo para Supervisores y Auditores)*

El sistema incluye una función de exportación avanzada adaptada para auditorías internas e inspecciones del organismo provincial de medio ambiente:
1. Ingrese a la pantalla de Historial de Registros.
2. Aplique los filtros deseados utilizando el buscador y el selector de formularios (por ejemplo: si solo desea auditar *Residuos Especiales* en el sector *Taller*, aplique ambos filtros).
3. Presione el botón **"Exportar CSV"** ubicado en el extremo superior derecho.
4. Se abrirá la ventana de configuración:
   * Elija **"Exportar todo el historial sin límite de fecha"** para descargar todo el histórico filtrado.
   * O elija **"Exportar registros a partir de una fecha específica"** y seleccione una fecha de inicio (ejemplo: a partir del 1 de Mayo).
5. Pulse **"Exportar a CSV"**. El sistema compilará y descargará una planilla compatible con **Microsoft Excel** de manera instantánea, con codificación perfecta de caracteres para una visualización impecable.
