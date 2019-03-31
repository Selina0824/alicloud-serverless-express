const lambdaFunction = require('../lambda.js')
const apiGatewayEvent = require('../api-gateway-event.json')
process.env.NODE_ENV = 'test'

const server = lambdaFunction.handler(apiGatewayEvent, {},function(err,data){
if(err){
    console.error(err)
    process.exit(1)
}else {
    console.log(data)
    process.exit(0) 
}
})

process.stdin.resume()

function exitHandler (options, err) {
  if (options.cleanup && server && server.close) {
    server.close()
  }

  if (err) console.error(err.stack)
  if (options.exit) process.exit()
}

process.on('exit', exitHandler.bind(null, { cleanup: true }))
process.on('SIGINT', exitHandler.bind(null, { exit: true })) // ctrl+c event
process.on('SIGTSTP', exitHandler.bind(null, { exit: true })) // ctrl+v event
process.on('uncaughtException', exitHandler.bind(null, { exit: true }))
