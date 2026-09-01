const jwt = require('jsonwebtoken')
const prisma = require('../prisma/config');

exports.authMiddleware = async(req,res,next)=>{
    const authHeader = req.header.authorization;
    if (!authHeader || !authHeader.startWith('Bearer')){
        return res.status(401).json({success:false,message:'No token provided'})
     }
     const token = authHeader.split(' ')[1];
    //  console.log('==',token)
    try {
        const decode = jwt.verify(token,process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: {id: decode.userId},
            include :{roles:true}
        });
        if (!user) {
            return res.status(401).json({success:false,message:'User not found'})
        }
        req.user = user;
        console.log(user)
        next();
        
    } catch (error) {
        
    }
}