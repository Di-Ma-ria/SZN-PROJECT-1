export const adminOnly = (req, res, next)=>{
    if(req.user&& req.user.role ==='admin'|| req.user.role==='superadmin'){
        next();
    }else{
        res.status(403).json({
            success:false, 
            message:"Access denied, admins only"
        });
    }
}

export const superAdminOnly =(req,res,next)=>{
    if(req.user && req.user.role ==='superadmin'){
        next();
    }else{
        res.status(403).json({
            success:false,
            message:"Access denied, superAdmins only"
        })
    }
}