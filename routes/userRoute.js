// routes/userRoute.js
import express from 'express';
import {
  getAllUsers, getSingleUser,
  getPendingSellers, handleSellerApplication,
  getPendingAdmins, handleAdminApplication,
  suspendUser, unsuspendUser,
  makeAdmin, demoteAdmin, deleteUser,
} from '../controllers/userController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

import { isAdmin, isSuperAdmin } from '../middlewares/adminMiddleware.js';

import validate from '../validation/validate.js';

import {
  handleSellerApplicationSchema,
  handleAdminApplicationSchema,
  suspendUserSchema,
} from '../validation/userValidation.js';


const userRoutes = express.Router();

// admin routes
userRoutes.get('/all', authMiddleware, isAdmin, getAllUsers);

userRoutes.get('/pending-sellers', authMiddleware, isAdmin, getPendingSellers);

<<<<<<< HEAD
=======

// superadmin routes
userRoutes.get('/pending-admins', authMiddleware, isSuperAdmin, getPendingAdmins);

//admin route


>>>>>>> c1d0e81077efade1d33dd1923dbbc9b31fa58387
userRoutes.patch('/handle-seller/:id', authMiddleware, isAdmin, validate(handleSellerApplicationSchema), handleSellerApplication);

userRoutes.patch('/suspend/:id', authMiddleware, isAdmin, validate(suspendUserSchema), suspendUser);

userRoutes.patch('/unsuspend/:id', authMiddleware, isAdmin, unsuspendUser);

userRoutes.get('/:id', authMiddleware, isAdmin, getSingleUser);

userRoutes.delete('/delete/:id', authMiddleware, isAdmin, deleteUser);

// superadmin routes
<<<<<<< HEAD
userRoutes.get('/pending-admins', authMiddleware, isSuperAdmin, getPendingAdmins);
=======
>>>>>>> c1d0e81077efade1d33dd1923dbbc9b31fa58387

userRoutes.patch('/handle-admin/:id', authMiddleware, isSuperAdmin, validate(handleAdminApplicationSchema), handleAdminApplication);

userRoutes.patch('/make-admin/:id', authMiddleware, isSuperAdmin, makeAdmin);

userRoutes.patch('/demote-admin/:id', authMiddleware, isSuperAdmin, demoteAdmin);

export default userRoutes;