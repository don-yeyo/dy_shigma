require('dotenv').config();
const axios = require('axios');

async function testConnection() {
    console.log('--- Probando GetDocumentosVinculadosDEALS con Tipo y Externa ---');
    try {
        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.FINNEGANS_CLIENT_ID,
            client_secret: process.env.FINNEGANS_CLIENT_SECRET
        });

        const tokenRes = await axios.get(`${process.env.FINNEGANS_TOKEN_URL}?${params.toString()}`);
        const token = tokenRes.data.toString().trim();

        const report = 'GetDocumentosVinculadosDEALS';
        const url = `${process.env.FINNEGANS_API_BASE}/reports/${report}`;
        
        console.log(`Consultando reporte con Tipo="HOJARUTA" e IdentExterna="20887"...`);
        try {
            const res = await axios.get(url, {
                params: {
                    ACCESS_TOKEN: token,
                    PARAMWEBREPORT_Empresa: process.env.FINNEGANS_EMPRESA_COD,
                    PARAMTipo: 'HOJARUTA',
                    PARAMIdentificacionExterna: '20887'
                }
            });
            console.log('✅ Resultado:', JSON.stringify(res.data, null, 2));
        } catch (e) {
             console.error(`❌ Error con HOJARUTA:`, e.response ? e.response.data : e.message);
             // Probamos con ENVIO por las dudas
             console.log(`Probando con Tipo="ENVIO"...`);
              const res2 = await axios.get(url, {
                params: {
                    ACCESS_TOKEN: token,
                    PARAMWEBREPORT_Empresa: process.env.FINNEGANS_EMPRESA_COD,
                    PARAMTipo: 'ENVIO',
                    PARAMIdentificacionExterna: '20887'
                }
            });
            console.log('✅ Resultado (ENVIO):', JSON.stringify(res2.data, null, 2));
        }

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    }
}

testConnection();
