import express from 'express';
import { deleteUser, demoteAdmin, getAllUsers, getPendingAdmins, getPendingSellers, getSingleUser, handleAdminApplication, handleSellerApplication, makeAdmin, suspendUser, unsuspendUser } from '../controllers/userController.js';
import validate from '../validation/validate.js';
import { handleAdminApplicationSchema,handleSellerApplicationSchema, suspendUserSchema } from '../validation/userValidation.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { adminOnly, superAdminOnly } from '../middlewares/adminMiddleware.js';



const userRoutes = express.Router()
userRoutes.get(`/getAllUsers`,adminOnly ,getAllUsers)
userRoutes.get(`/getAuser`,adminOnly ,getSingleUser)
userRoutes.get(`/pendingSeller`,authMiddleware,adminOnly ,getPendingSellers)
userRoutes.patch(`/handleSellerApplication`,validate(handleSellerApplicationSchema),authMiddleware,adminOnly ,handleSellerApplication)
userRoutes.patch(`/suspendUser`,validate(suspendUserSchema),authMiddleware,adminOnly ,suspendUser)
userRoutes.patch(`/unsuspendUser`,authMiddleware,adminOnly ,unsuspendUser)
userRoutes.patch(`/demoteAdmin`,authMiddleware,superAdminOnly ,demoteAdmin)
userRoutes.delete(`/deleteUser`,authMiddleware,adminOnly ,deleteUser)
userRoutes.patch(`/makeAdmin`,authMiddleware, adminOnly ,makeAdmin)
userRoutes.get(`/pendingAdmin`,authMiddleware,superAdminOnly ,getPendingAdmins)
userRoutes.patch(`/handleAdminApplication`,validate(handleAdminApplicationSchema),authMiddleware,superAdminOnly ,handleAdminApplication)



export default userRoutes