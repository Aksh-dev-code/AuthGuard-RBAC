exports.checkPermission = (resource,action) =>{
    return async (req,res,next) =>{
        try {
            const user = await prisma.user.findUnique({
                where: {id: req.user.id},
                include:{
                    roles:{
                        permissions:true,

                    },
                },
            });
            if (!user) return res.status(404).json({success:false,message:'User not found'})
            // is IsAdmin  all permission
            if 
            (user.roles.some(role => role.name = 'Admin')) return next();
             // Check permission 
             const hasPermission  = user.roles.some(role=>
                role.permissions.some(
                    perm => perm.resource === resource && perm.action ===action
                )
             ) ;
            if (!hasPermission) return res.status(403).json({success:false,message:'Access denied'})
                next();
        } catch (error) {
            console.log(error)
            res.status(500).json({success:false ,message:'Server error'})
        }
    }

}