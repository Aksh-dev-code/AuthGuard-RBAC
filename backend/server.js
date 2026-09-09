require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { config } = require('dotenv');
const prisma = require('.prisma/config')
const authRoutes = require('../src/routes/authRoutes.js');
const roleRoutes = require('../src/routes/rolRoutes.js');
const { loginController } = require('./src/controllers/authController.js');

const app = express();

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.get("/",(req,res)=>{
    res.json({message:'Backend server is running'});
})

app.use('/auth',authRoutes)
app.use('/roles',roleRoutes)

const PORT = process.env.PORT ||3000;

app.listen(PORT,()=>{console.log(`Server is runnig on http/:localhost:${PORT}`)})