exports.createPermissionController = async() =>{
    try {
        const{resource, action } =req.body;
        if(!resource,action){
            return res.status(400).json({success:true, message:"Resource and actiob are required"});

        }
        const exsistingPermission = await prisma.permission.findMany({
            where:{resource, action},
        })
        if (exsistingPermission){
            return res.status(409).json({success:false, message:'Permission a;ready exists'});

        }
        const permission = await prisma.permission.create({
            data:{
                resource,
                action
            }
        })
        return res.status(201).json({success:true,message:'Permission Create successfully', permission})

    } catch (error) {
        console.error('Error creating permission', error)
        return res.status(500).json({success:false, message:'Server error'})    
    }

}
exports.getPermissionController = async() =>{
    try {
        const permission = await prisma.permission.findMany();
        return res.status(200).json({success:true, permission});

    } catch (error) {
        console.log(error)
        return res.status(500).json({success:false,message:'server error'});
        
    }
    
}