const serverless = require('serverless-http');
const app = require('./index');

module.exports.handler = serverless(app, {
    request(request, event, context) {
        request.event = event;
        request.context = context;
        
        // Netlify a veces envía el body serializado como Buffer o JSON dentro de event.body
        if (event && event.body) {
            try {
                let rawBody = event.body;
                if (rawBody && typeof rawBody === 'object' && rawBody.type === 'Buffer' && Array.isArray(rawBody.data)) {
                    rawBody = Buffer.from(rawBody.data).toString('utf8');
                } else if (event.isBase64Encoded && typeof rawBody === 'string') {
                    rawBody = Buffer.from(rawBody, 'base64').toString('utf8');
                }
                
                if (typeof rawBody === 'string') {
                    request.body = JSON.parse(rawBody);
                } else if (typeof rawBody === 'object') {
                    request.body = rawBody;
                }
            } catch (err) {
                console.error('[NETLIFY HANDLER BODY PARSE ERROR]:', err);
            }
        }
    }
});
