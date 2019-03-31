/** 
 * Author Liu Qian 2019
 */
'use strict'
const http = require('http');
const url = require('url');
const path = require('path')
const binarycase = require('binary-case');
const isType = require('type-is');
const Base64 = require('js-base64').Base64;

function isContentTypeBinaryMimeType(params) {
    return params.binaryMimeTypes.length > 0 && !!isType.is(params.contentType, params.binaryMimeTypes)
}

function getHttpRequestOption(event, socketPath) {
    const headers = event.headers || {};
    if (event.body && JSON.parse(event.body)) headers['Content-Type'] = 'application/json'; //workaround the apigate way tricky handler of Content-Type;
    return {
        method: event.httpMethod,
        path: url.format({
            pathname: event.path,
            query: event.queryParameters
        }),
        headers,
        socketPath
    }
}

function responseToApiGateway(server, response, callback) {
    let buf = []
    response
        .on('data', (chunk) => buf.push(chunk))
        .on('end', () => {
            const bodyBuffer = Buffer.concat(buf)
            const statusCode = response.statusCode
            const headers = response.headers

            // chunked transfer not currently supported by API Gateway
            /* istanbul ignore else */
            if (headers['transfer-encoding'] === 'chunked') {
                delete headers['transfer-encoding']
            }

            // HACK: modifies header casing to get around API Gateway's limitation of not allowing multiple
            Object.keys(headers)
                .forEach(h => {
                    if (Array.isArray(headers[h])) {
                        if (h.toLowerCase() === 'set-cookie') {
                            headers[h].forEach((value, i) => {
                                headers[binarycase(h, i + 1)] = value
                            })
                            delete headers[h]
                        } else {
                            headers[h] = headers[h].join(',')
                        }
                    }
                })

            const contentType = headers['Content-Type'] ? headers['Content-Type'].split(';')[0] : ''; // only compare mime type; ignore encoding part
            const isBase64Encoded = isContentTypeBinaryMimeType({
                contentType,
                binaryMimeTypes: server._binaryTypes
            })
            const body = bodyBuffer.toString(isBase64Encoded ? 'base64' : 'utf8')
            const successResponse = {
                statusCode,
                body,
                headers,
                isBase64Encoded
            }

            callback(null, successResponse)
        })
}

function requestToIPCServer(server, event, callback) {
    try {
        const requestOptions = getHttpRequestOption(event, getSocketPath(server._socketPathSuffix))
        const req = http.request(requestOptions, (response) => responseToApiGateway(server, response, callback))
        if (event.body) {
            if (event.isBase64Encoded) event.body = Base64.decode(event.body);
            req.write(event.body)
        }

        req.on('error', () => callback({
                statusCode: 502, // "DNS resolution, TCP level errors, or actual HTTP parse errors" - https://nodejs.org/api/http.html#http_http_request_options_callback
                body: '',
                headers: {}
            }))
            .end()
    } catch (error) {
        callback({
            statusCode: 500,
            body: '',
            headers: {}
        })
        return server
    }
}

function getSocketPath(socketPathSuffix) {
    return /^win/.test(process.platform) ? path.join('\\\\?\\pipe', process.cwd(), `server-${socketPathSuffix}`) : `/tmp/server-${socketPathSuffix}.sock`;
}

function createServer(requestListener, binaryTypes) {
    const server = http.createServer(requestListener);
    server._socketPathSuffix = Date.now();
    server._binaryTypes = binaryTypes ? binaryTypes.slice() : [];
    server.on('listening', () => {
        server._isListening = true;
    })
    server.on('close', () => {
            server._isListening = false;
        })
        .on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.warn(`WARNING: Socket ${getSocketPath(server._socketPathSuffix)}, is already in use. 
                alicloud-serverless-express will restart the Node.js server listening on a new port and continue with this request.`);
                server._socketPathSuffix = Date.now()
                return server.close(() => server.listen(getSocketPath(server._socketPathSuffix)));
            } else {
                console.log('ERROR: server error');
                console.error(error);
            }
        })

    return server
}

function proxy(server, event, callback) {
    return {
        promise: new Promise(() => {
            if (server._isListening) {
                requestToIPCServer(server, event, callback);
            } else {
                server.listen(getSocketPath(server._socketPathSuffix))
                    .on('listening', () => requestToIPCServer(server, event, callback));
            }
        })
    }
}
module.exports = {
    createServer,
    proxy
}