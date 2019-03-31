# alicloud-serverless-express
Run serverless applications and REST APIs using your existing Node.js application framework, on top of AliCloud Function Compute and API Gateway

## Getting Started

```bash
npm install alicloud-serverless-express
```

```js
// index.js
let app = require('./app');
let alicloudServerlessExpress = require('alicloud-serverless-express');
let server = alicloudServerlessExpress.createServer(app);

exports.handler = (event, context, callback) =>{
    try{
        event = JSON.parse(event.toString());
    }catch(err){
        console.log('local event')
    }
    alicloudServerlessExpress.proxy(server, event, callback);
}
```

## Quick Start/Example

Want to get up and running quickly? [Check out our basic starter example](examples/feedback) which includes:
