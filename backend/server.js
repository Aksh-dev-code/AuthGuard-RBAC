require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { config } = require('dotenv');
const prisma = require('.prisma/config')

const app = express();

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.get("/",(req,res)=>{
    res.json({message:'Backend server is running'});
})

const PORT = process.env.PORT ||3000;

app.listen(PORT,()=>{console.log(`Server is runnig on http/:localhost:${PORT}`)})