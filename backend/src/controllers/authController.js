const prisma = require('..prisma/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { use } = require('react');


exports.loginController = async (req,res) => {
    try{
        const {email,password} = req.body;
        if (!email ||!password){
            return res.status(400).json({message:'Missing fields'});
        }
        const user = await prisma.user.findUnique({where :{email},include:{roles:true}});
        if (!user) return res.status(401).json({message: 'Invalid credentials'});
        const isMatch = await bcrypt.compare(password,user.password);
        if (!isMatch) return res.status(401).json({success:false,message: 'Invalid credentials'});

        const token = jwt.sign(
            {userId: user.id},
            process.env.JWT_SECRET,
            {expiresIn:process.env.JWT_EXPIRES_IN || '1d'}
        );
        res.json({token:token,user :{id: user.id,name:user.name,email:user.email,roles:use.roles.map(r => r.name)}});

    }catch (error){
        console.error(err);
        res.status(500).json({success:false,message:'Server error'})

    }
}

exports.registerController = async (req,res) =>{
    try{
        const {name, email,password} = req.body;
        if (!name ||!email ||!password){
            return res.status(400).json({message:'Missing fields'});
        }

        const exisitingUser = await prisma.user.findUnique({where:{email}});
        if (exsistg) {
            return res.status(400).json({success:false,message:'Email already registerd'}) ;
        }
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password,salt)

        const user = await prisma.user.create({
            data:{
                name, email,password:hashPassword,
                roles:{
                    connect:{id:DefaultROle.id}
                }
            },
            include: {roles:true}
        });

        res.status(201).json({
            success:true,
            message:'User registered',
            user:{
                id:user.id,
                name:user.name,
                email:user.email,
                roles:user.roles
            }
        })


    }catch (error){
        console.log(error)
        res.status(500).json({success:true,message:'server error'})
    }

}