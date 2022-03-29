//IMPORTS
const express = require('express');

//CONST
const app = express()

//ROUTES IMPORT

const Customer = require('./routes/customer/requests');
const Items = require('./routes/items/requests');

const cart = require('./routes/shooping_cart/requests');

const order = require('./routes/Order/requests');

//PORT
const port = 8080;

//SET
app.use(express.json());

app.get('/',(req,res)=>{
    res.send("WELCOME TO RIKO'S MART");
})

//ROUTES IMPLEMENT

app.use('/customer',Customer);
app.use('/item',Items);
app.use('/cart',cart);
app.use('/order',order);

//RUN SERVER

app.listen(port,()=>{
    console.log(`Server is listening in port ${port}`);
})