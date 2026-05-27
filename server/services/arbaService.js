/**
 * ArbaService — Generación de archivo TXT para COT ARBA
 * 
 * Formato basado en la documentación oficial del proyecto (44 campos para Registro 02).
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class ArbaService {
    constructor() {
        this.cotUrl = process.env.ARBA_COT_URL;
        if (this.cotUrl && this.cotUrl.startsWith('http://')) {
            this.cotUrl = this.cotUrl.replace('http://', 'https://');
        }
        this.cotUser = process.env.ARBA_COT_USER;
        this.cotPassword = process.env.ARBA_COT_PASSWORD;
        this.cuitEmpresa = process.env.ARBA_CUIT_EMPRESA;
        this.saveLocal = process.env.ARBA_SAVE_LOCAL === 'true';
        this.localPath = process.env.ARBA_LOCAL_PATH || './txts';
        this.cookie = process.env.ARBA_COOKIE || '';
        this.planta = (process.env.ARBA_PLANTA || '001').padStart(3, '0');
        this.puerta = (process.env.ARBA_PUERTA || '001').padStart(3, '0');
    }

    /** Procesa valor para que sea entero (centavos) */
    _toCents(val) {
        if (!val) return '0';
        const str = String(val).trim();
        // Si ya viene formateado de Finnegans (sin puntos ni comas y largo)
        if (!str.includes('.') && !str.includes(',') && str.length >= 5) {
            return String(BigInt(str));
        }
        // Si es un decimal humano
        const num = parseFloat(str.replace(',', '.'));
        return String(Math.round(num * 100));
    }

    generarArchivoCOT(datos) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        
        const nombreArchivo = `TB_${this.cuitEmpresa}_${this.planta}${this.puerta}_${yyyy}${mm}${dd}_${hh}${min}${ss}.txt`;
        
        let lineas = [];
        lineas.push(this._generarHeader());
        
        const remitos = Array.isArray(datos) ? datos : [datos];
        for (const remito of remitos) {
            lineas.push(this._generarRemito(remito));
            if (remito.productos) {
                for (const prod of remito.productos) {
                    lineas.push(this._generarProducto(prod));
                }
            }
        }
        
        lineas.push(this._generarFooter(remitos.length));
        
        const contenido = lineas.join('\r\n');
        
        if (this.saveLocal) {
            if (!fs.existsSync(this.localPath)) {
                fs.mkdirSync(this.localPath, { recursive: true });
            }
            fs.writeFileSync(path.join(this.localPath, nombreArchivo), contenido);
        }
        
        return {
            nombreArchivo,
            contenido,
            lineas
        };
    }

    _generarHeader() {
        return ['01', this.cuitEmpresa].join('|');
    }

    _generarRemito(remito) {
        let codigoUnico = remito.CODIGO_UNICO || remito.codigoUnicoArba;
        if (!codigoUnico) {
            let sucursal = String(remito.sucursal || '1').replace(/\D/g, '').padStart(4, '0');
            let numero = String(remito.numero || remito.CODIGO_DOC || '1').replace(/\D/g, '').padStart(8, '0');
            codigoUnico = `91 R${sucursal}${numero}`;
        }

        const fEmision = String(remito.FECHA_EMISION || remito.fechaEmision || '').replace(/[-]/g, '').substring(0, 8);
        const fSalida = String(remito.FECHA_SALIDA_TRANSPORTE || remito.fechaPartida || fEmision).replace(/[-]/g, '').substring(0, 8);
        let hSalida = String(remito.HORA_SALIDA_TRANSPORTE || remito.horaPartida || '0000').replace(/:/g, '').trim();
        if (!hSalida) hSalida = '0000';
        hSalida = hSalida.substring(0, 4).padEnd(4, '0');

        const fields = [
            '02',                                                               // 1: TIPO_REGISTRO
            fEmision,                                                           // 2: FECHA_EMISION
            codigoUnico,                                                        // 3: CODIGO_UNICO
            fSalida,                                                            // 4: FECHA_SALIDA_TRANSPORTE
            hSalida,                                                            // 5: HORA_SALIDA_TRANSPORTE
            remito.SUJETO_GENERADOR || 'E',                                     // 6: SUJETO_GENERADOR
            remito.DESTINATARIO_CONSUMIDOR_FINAL || '0',                        // 7: DESTINATARIO_CONSUMIDOR_FINAL
            ' ',                                                                // 8: DESTINATARIO_TIPO_DOCUMENTO
            ' ',                                                                // 9: DESTINATARIO_DOCUMENTO
            remito.DESTINATARIO_CUIT || remito.cuitDestinatario || '',          // 10: DESTINATARIO_CUIT
            remito.DESTINATARIO_RAZON_SOCIAL || remito.razonSocialDestinatario || '', // 11: DESTINATARIO_RAZON_SOCIAL
            remito.DESTINATARIO_TENEDOR || (remito.DESTINATARIO_CONSUMIDOR_FINAL === '1' ? '0' : '1'), // 12: DESTINATARIO_TENEDOR
            remito.DESTINO_DOMICILIO_CALLE || remito.destinoCalle || '',        // 13: DESTINO_DOMICILIO_CALLE
            remito.DESTINO_DOMICILIO_NUMERO || remito.destinoNumero || '0',     // 14: DESTINO_DOMICILIO_NUMERO
            ' ',                                                                // 15: DESTINO_DOMICILIO_COMPLE
            ' ',                                                                // 16: DESTINO_DOMICILIO_PISO
            ' ',                                                                // 17: DESTINO_DOMICILIO_DTO
            ' ',                                                                // 18: DESTINO_DOMICILIO_BARRIO
            remito.DESTINO_DOMICILIO_CODIGOPOSTAL || remito.DESTINO_DOMICILIO_CODIGOP || remito.destinoCP || '', // 19
            remito.DESTINO_DOMICILIO_LOCALIDAD || remito.destinoLocalidad || '', // 20
            remito.DESTINO_DOMICILIO_PROVINCIA || remito.destinoProvincia || 'B', // 21
            ' ',                                                                // 22: PROPIO_DESTINO_DOMICILIO_CODIGO
            'NO',                                                               // 23: ENTREGA_DOMICILIO_ORIGEN
            remito.ORIGEN_CUIT || this.cuitEmpresa,                             // 24: ORIGEN_CUIT
            remito.ORIGEN_RAZON_SOCIAL || 'DON YEYO S.A.',                      // 25: ORIGEN_RAZON_SOCIAL
            '0',                                                                // 26: EMISOR_TENEDOR
            remito.ORIGEN_DOMICILIO_CALLE || remito.origenCalle || '',          // 27: ORIGEN_DOMICILIO_CALLE
            remito.ORIGEN_DOMICILIO_NUMERO || remito.origenNumero || '0',       // 28: ORIGEN_DOMICILIO_NUMERO
            ' ',                                                                // 29: ORIGEN_DOMICILIO_COMPLE
            ' ',                                                                // 30: ORIGEN_DOMICILIO_PISO
            ' ',                                                                // 31: ORIGEN_DOMICILIO_DTO
            ' ',                                                                // 32: ORIGEN_DOMICILIO_BARRIO
            remito.ORIGEN_DOMICILIO_CODIGOPOSTAL || remito.origenCP || '',      // 33: ORIGEN_DOMICILIO_CODIGOPOSTAL
            remito.ORIGEN_DOMICILIO_LOCALIDAD || remito.origenLocalidad || '',  // 34: ORIGEN_DOMICILIO_LOCALIDAD
            remito.ORIGEN_DOMICILIO_PROVINCIA || 'B',                           // 35: ORIGEN_DOMICILIO_PROVINCIA
            remito.cuitTransportista || remito.TRANSPORTISTA_CUIT || '',        // 36: TRANSPORTISTA_CUIT
            remito.TIPO_RECORRIDO || 'U',                                       // 37: TIPO_RECORRIDO
            remito.RECORRIDO_LOCALIDAD || ' ',                                  // 38: RECORRIDO_LOCALIDAD
            remito.RECORRIDO_CALLE || ' ',                                      // 39: RECORRIDO_CALLE
            remito.RECORRIDO_RUTA || ' ',                                       // 40: RECORRIDO_RUTA
            remito.patenteVehiculo || remito.patente || remito.PATENTE_VEHICULO || '', // 41: PATENTE_VEHICULO
            remito.patenteAcoplado || remito.PATENTE_ACOPLADO || '',            // 42: PATENTE_ACOPLADO
            remito.PRODUCTO_NO_TERM_DEV || remito.productoNoTerminado || '0',   // 43: PRODUCTO_NO_TERM_DEV
            this._toCents(remito.IMPORTE || remito.importeTotal || 0)           // 44: IMPORTE
        ].map(val => String(val || '').trim());

        return fields.join('|');
    }

    _generarProducto(producto) {
        const fields = [
            '03',                                                               // 1: TIPO_REGISTRO
            String(producto.codigoArba || producto.CODIGO_UNICO_PRODUCTO || '').trim(), // 2: CODIGO_UNICO_PRODUCTO
            String(producto.unidadMedida || producto.RENTAS_CODIGO_UNIDAD_MEDIDA || '3').trim(), // 3: ARBA_CODIGO_UNIDAD_MEDIDA
            this._toCents(producto.cantidad || producto.CANTIDAD || 0),         // 4: CANTIDAD
            String(producto.codigoPropio || producto.PROPIO_CODIGO_PRODUCTO || 'PROPIO').trim(), // 5: PROPIO_CODIGO_PRODUCTO
            (producto.descripcion || producto.PROPIO_DESCRIPCION_PRODUCTO || 'DESCRIPCION').substring(0, 40).replace(/\|/g, ' ').trim(), // 6: PROPIO_DESCRIPCION_PRODUCTO
            String(producto.unidadDescripcion || producto.PROPIO_DESCRIPCION_UNIDAD_MEDIDA || 'Unidades').trim(), // 7: PROPIO_DESCRIPCION_UNIDAD_MEDIDA
            this._toCents(producto.cantidadAjustada || producto.CANTIDAD_AJUSTADA || producto.cantidad || 0) // 8: CANTIDAD_AJUSTADA
        ];

        return fields.join('|');
    }

    _generarFooter(totalRemitos) {
        return ['04', String(totalRemitos)].join('|');
    }

    async enviarCOT(contenido, nombreArchivo) {
        try {
            const form = new FormData();
            form.append('user', this.cotUser);
            form.append('password', this.cotPassword);
            
            // Creamos un Buffer en latin1 para el contenido del archivo para asegurar compatibilidad con ARBA
            const fileBuffer = Buffer.from(contenido, 'latin1');
            
            form.append('file', fileBuffer, {
                filename: nombreArchivo,
                contentType: 'text/plain',
            });

            const headers = {
                ...form.getHeaders(),
            };
            
            // Si hay una cookie configurada, la añadimos (aunque axios lo maneja mejor con jar, aquí lo ponemos manual)
            if (this.cookie) {
                headers['Cookie'] = this.cookie;
            }

            console.log(`[ARBA] Enviando archivo ${nombreArchivo} (${fileBuffer.length} bytes) via Axios...`);

            const response = await axios.post(this.cotUrl, form, {
                headers,
                timeout: 60000 // 60 segundos
            });

            const responseText = response.data;

            // Guardar respuesta para debug (solo si saveLocal está activo y no estamos en cloud)
            if (this.saveLocal) {
                try {
                    fs.writeFileSync(path.join(this.localPath, 'arba_last_response.txt'), responseText);
                } catch (e) {}
            }

            const nroCotMatch = responseText.match(/<cot>(\d+)<\/cot>/);
            if (nroCotMatch) {
                return { success: true, nroCOT: nroCotMatch[1] };
            }

            const errores = [];
            const errorMatches = responseText.matchAll(/<error>\s*<codigo>(.*?)<\/codigo>\s*<descripcion>(.*?)<\/descripcion>/gs);
            for (const match of errorMatches) {
                errores.push({
                    codigo: match[1].trim(),
                    descripcion: match[2].trim(),
                    tipo: 'VALIDACION'
                });
            }

            const tbErrorMatch = responseText.match(/<codigoError>(.*?)<\/codigoError>\s*<mensajeError>(.*?)<\/mensajeError>/s);
            if (tbErrorMatch) {
                errores.push({
                    codigo: tbErrorMatch[1].trim(),
                    descripcion: tbErrorMatch[2].trim(),
                    tipo: 'ESTRUCTURA'
                });
            }

            if (errores.length === 0 && (responseText.includes('Error') || responseText.includes('error'))) {
                errores.push({ codigo: 'GENERIC_ERROR', descripcion: 'Error no identificado en la respuesta de ARBA.' });
            }

            return { success: false, errores };

        } catch (error) {
            console.error('[ARBA] Error en envío vía Axios:', error.message);
            return { 
                success: false, 
                errores: [{ 
                    codigo: 'AXIOS_ERROR', 
                    descripcion: `Error de conexión: ${error.message}`,
                    tipo: 'CONEXION'
                }] 
            };
        }
    }
}

module.exports = ArbaService;
