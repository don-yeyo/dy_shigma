const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

(async () => {
    try {
        const [operadores] = await db.query('SELECT * FROM operadores');
        console.log('--- OPERADORES ---');
        console.log(operadores);

        const [op_form] = await db.query('SELECT * FROM operadores_formularios');
        console.log('--- OPERADORES FORMULARIOS ---');
        console.log(op_form);

        const [uo] = await db.query('SELECT * FROM usuarios_operadores');
        console.log('--- USUARIOS OPERADORES ---');
        console.log(uo);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
