const axios = require('axios');

const baseUrl = 'http://localhost:5000/api/shigma';

async function runTests() {
  console.log("=== INICIANDO PRUEBAS INTEGRALES API SHIGMA ===");

  try {
    // 1. Crear registro de Residuos Comunes
    console.log("\n[TEST 1] Creando Registro de Residuos Comunes...");
    const rcRes = await axios.post(`${baseUrl}/records/residuos-comunes`, {
      sector: 'Producción Masa',
      tipoResiduo: 'Plástico',
      peso: 120.5,
      destino: 'Contenedor Verde',
      observaciones: 'Descarte de empaques stretch limpios.'
    });
    console.log("Respuesta de Creación:", rcRes.data);
    const rcId = rcRes.data.record.id;
    if (rcId.startsWith('SHG-RC-')) {
      console.log("✔ ID Autogenerado Premium Correcto:", rcId);
    } else {
      throw new Error(`ID incorrecto para Residuos Comunes: ${rcId}`);
    }

    // 2. Crear registro de Residuos Especiales
    console.log("\n[TEST 2] Creando Registro de Residuos Especiales...");
    const reRes = await axios.post(`${baseUrl}/records/residuos-especiales`, {
      tipoResiduoEspecial: 'Aceites Usados',
      categoriaPeligro: 'Y9',
      cantidad: 80,
      unidad: 'L',
      sectorOrigen: 'Mantenimiento General',
      tipoEnvase: 'Tambor Metálico 200L',
      certificadoAcopio: 'CRT-2026-Y9-004',
      observaciones: 'Aceite lubricante de motor reductor.'
    });
    console.log("Respuesta de Creación:", reRes.data);
    const reId = reRes.data.record.id;
    if (reId.startsWith('SHG-RE-')) {
      console.log("✔ ID Autogenerado Premium Correcto:", reId);
    } else {
      throw new Error(`ID incorrecto para Residuos Especiales: ${reId}`);
    }

    // 3. Crear registro de Economía Circular
    console.log("\n[TEST 3] Creando Registro de Economía Circular...");
    // Pallets recuperados: Ahorro 15.0kg CO2 cada uno
    const ecRes = await axios.post(`${baseUrl}/records/economia-circular`, {
      materialRevalorizado: 'Pallets recuperados logísticos',
      cantidad: 20,
      unidad: 'uds',
      destinoReinsercion: 'Reuso logístico interno en fábrica',
      ahorroEstimado: 35000,
      co2Evitado: 300, // 20 * 15.0 = 300 kg CO2
      observaciones: 'Pallets de madera reparados en taller propio.'
    });
    console.log("Respuesta de Creación:", ecRes.data);
    const ecId = ecRes.data.record.id;
    if (ecId.startsWith('SHG-EC-')) {
      console.log("✔ ID Autogenerado Premium Correcto:", ecId);
    } else {
      throw new Error(`ID incorrecto para Economía Circular: ${ecId}`);
    }

    // 4. Obtener todos los registros (Historial de Registros)
    console.log("\n[TEST 4] Consultando Historial de Trazabilidad Completo...");
    const historyRes = await axios.get(`${baseUrl}/records`);
    const records = historyRes.data;
    console.log(`Registros totales en historial: ${records.length}`);

    // Verificar que los 3 registros creados estén presentes
    const ids = records.map(r => r.id);
    console.log("IDs encontrados en historial:", ids);
    if (ids.includes(rcId) && ids.includes(reId) && ids.includes(ecId)) {
      console.log("✔ Los registros creados están presentes en el historial unificado.");
    } else {
      throw new Error("Faltan registros creados en el historial unificado.");
    }

    // 5. Consultar estadísticas consolidadas del Dashboard
    console.log("\n[TEST 5] Consultando Estadísticas del Dashboard...");
    const statsRes = await axios.get(`${baseUrl}/stats`);
    const stats = statsRes.data;
    console.log("Estadísticas de Negocio Consolidadas:", stats);

    // Verificar agregaciones
    if (stats.totalKgComunes === 120.5) {
      console.log("✔ Agregación de Residuos Comunes correcta (120.5 kg).");
    } else {
      throw new Error(`Agregación de peso común incorrecta: ${stats.totalKgComunes}`);
    }

    if (stats.totalKgEspeciales === 80) {
      console.log("✔ Agregación de Residuos Especiales correcta (80 L).");
    } else {
      throw new Error(`Agregación de volumen especial incorrecta: ${stats.totalKgEspeciales}`);
    }

    if (stats.totalCO2Reducido === 300) {
      console.log("✔ Suma de emisiones de CO2 mitigado correcta (300 kg CO2).");
    } else {
      throw new Error(`Suma de CO2 mitigado incorrecta: ${stats.totalCO2Reducido}`);
    }

    if (stats.totalAhorroCircular === 35000) {
      console.log("✔ Suma de ahorro económico de economía circular correcta ($35,000).");
    } else {
      throw new Error(`Suma de ahorro circular incorrecta: ${stats.totalAhorroCircular}`);
    }

    if (stats.materialBreakdown.Plastico === 120.5) {
      console.log("✔ Segmentación por material Plástico correcta (120.5 kg).");
    } else {
      throw new Error(`Segmentación incorrecta para Plástico: ${stats.materialBreakdown.Plastico}`);
    }

    console.log("\n=== ¡TODAS LAS PRUEBAS FINALIZARON EXITOSAMENTE! ===");
  } catch (error) {
    console.error("\n❌ ERROR EN LAS PRUEBAS:", error.message);
    if (error.response) {
      console.error("Respuesta del servidor:", error.response.data);
    }
    process.exit(1);
  }
}

runTests();
