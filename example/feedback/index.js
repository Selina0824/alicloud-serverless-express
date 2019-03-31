let app = require('./app');
let alicloudServerlessExpress = require('../../index');

const binaryMimeTypes = [
    'application/javascript',
    'application/json',
    'application/octet-stream',
    'application/xml',
    'font/eot',
    'font/opentype',
    'font/otf',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'text/comma-separated-values',
    'text/css',
    'text/html',
    'text/javascript',
    'text/plain',
    'text/text',
    'text/xml'
  ]

let server = alicloudServerlessExpress.createServer(app,binaryMimeTypes);


exports.handler = (event, context, callback) =>{
    try{
        event = JSON.parse(event.toString());
    }catch(err){
        console.log('local event')
    }
    alicloudServerlessExpress.proxy(server, event, callback);
}
