require('dotenv').config();
const axios = require('axios');

async function runDiagnosis() {
    const idsToTest = ['20890', '20899', '20915', '20887'];
    const reportsToTest = [
        'analisisDespachos',
        'AnalisisFirmaRemitosDY',
        'REPANALISISFIRMAREMITO',
        'APICONSULTAFACTURAVENTADY',
        'analisisDespachoVenta'
    ];

    console.log('--- Diagnóstico Autónomo de Vinculación ---');
    try {
        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.FINNEGANS_CLIENT_ID,
            client_secret: process.env.FINNEGANS_CLIENT_SECRET
        });
        const tokenRes = await axios.get(`${process.env.FINNEGANS_TOKEN_URL}?${params.toString()}`);
        const token = tokenRes.data.toString().trim();

        for (const report of reportsToTest) {
            console.log(`\nEvaluando reporte: ${report}...`);
            try {
                const res = await axios.get(`${process.env.FINNEGANS_API_BASE}/reports/${report}`, {
                    params: {
                        ACCESS_TOKEN: token,
                        PARAMWEBREPORT_Empresa: process.env.FINNEGANS_EMPRESA_COD,
                        PARAMWEBREPORT_FechaDesde: '2025-01-01',
                        PARAMWEBREPORT_FechaHasta: '2026-12-31'
                    },
                    timeout: 10000
                });

                if (Array.isArray(res.data)) {
                    console.log(`  -> Registros devueltos: ${res.data.length}`);
                    for (const targetId of idsToTest) {
                        const found = res.data.filter(d => JSON.stringify(d).includes(targetId));
                        if (found.length > 0) {
                            console.log(`  🔥 ¡MATCH ENCONTRADO en ${report} para Hoja ${targetId}! (${found.length} registros)`);
                            console.log(`  -> Primer comprobante: ${found[0].COMPROBANTE || found[0].DOCNROINT}`);
                        }
                    }
                }
            } catch (e) {
                console.log(`  ❌ Error en ${report}: ${e.message}`);
            }
        }
    } catch (error) {
        console.error('Error fatal:', error.message);
    }
}

runDiagnosis();
