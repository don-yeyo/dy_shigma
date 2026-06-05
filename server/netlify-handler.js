const serverless = require('serverless-http');
const app = require('./index');

module.exports.handler = serverless(app, {
    request(request, event, context) {
        request.event = event;
        request.context = context;
    }
});
