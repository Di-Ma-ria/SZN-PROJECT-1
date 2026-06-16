import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';


const authMiddleware = async(req, res, next)=>{
try{
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if(!authHeader || !authHeader.startsWith('Bearer')){
      return res.status(401).json({
            success:false,
            message:"token not provided"
        });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password")

    if(!user) return res.status(401).json({
        success:false,
        message:"Unauthorized"
    })

    req.user= user;
    next();
}catch(error){
     res.status(401).json({
        success:false,
        message:"Invalid or expired token"
    })

}

}

export default authMiddleware;