const express = require('express');
const app = express();

app.get('/',(req,res)=>{
  res.send('wellcome to my app')
})

const whatsappRoute = require('./whatsapp/whatsapp').app
app.use('/bot', whatsappRoute)


let date = new Date();
let day = date.getDate();
let mounth = date.getMonth()+1;
let year = date.getFullYear();
app.listen(5000,()=>{
console.log(`Listening to port 5000,at ${day+'/'+mounth+'/'+year}`);
})

