const express = require('express');
const bodyParser = require('body-parser');

let comments = [{
    name: '张三',
    message: '今天天气不错！',
    dateTime: '1/25/2019'
},
{
    name: '张三2',
    message: '今天天气不错！',
    dateTime: '1/25/2019'
},
{
    name: '张三3',
    message: '今天天气不错！',
    dateTime: '1/25/2019'
},
{
    name: '张三4',
    message: '今天天气不错！',
    dateTime: '1/25/2019'
},
{
    name: '张三5',
    message: '今天天气不错！',
    dateTime: '1/25/2019'
}
];

let app = express();
app.engine('html', require('express-art-template')); 
app.use('/public', express.static('public'));   
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


app.get('/', (req,res)=>{
    res.render('index.html', {
        comments
    })
});

app.get('/post', (req,res)=>{
    res.render('comments-add.html') 
}).post('/post', (req, res)=>{
    let body  = req.body;
    console.log(body)
    comments.unshift({
        name: body.name,
        message: body.message,
        dateTime: new Date().toLocaleDateString()
    });
    res.redirect('/')
})

module.exports =  app;
