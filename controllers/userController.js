import {User} from '../models/userModel.js';

import {sendTemplateEmail} from '../utils/sendEmail.js';


export const getAllUsers = async (req, res, next) => {
  try{
    const {role, isSuspended, search} =req.query;
    const  page = Number(req.query.page) || 1; 
    const limit = Number(req.query.limit) || 10; 

    const filter = {isDeleted: false,
      role:{$ne: 'superadmin'}
    };

    if(role) filter.role = role;
    if(isSuspended !== undefined)
    {
      filter.isSuspended = isSuspended === 'true';
    }
    if(search) {
      filter.$or = [ 
        {name: {$regex: search, $options: 'i'}},
        {email: {$regex: search, $options: 'i'}},

      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select('-password -passwordResetToken -passwordResetExpires -loginAttempt -lockUntil')
      .skip(skip)
      .limit(Number(limit))
      .sort({createdAt: -1});

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    next (error);
  }
};



//GET SINGLE USER

export const getSingleUser = async (req, res, next) => {
  try{
    const user = await User.findOne({
      _id: req.params.id,
      isDeleted: false
    }).select('-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil');

    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next (error);
  }
};


// GET PENDING SELLERS

export const getPendingSellers = async (req, res, next) => {
  try{
    const sellers = await User.find({
      sellerStatus: 'pending',
      isDeleted: false
    }).select('-password -passwordResetToken -passwordResetExpires');
    
    res.json({
      success: true,
      count: sellers.length,
      users: sellers,
    });
  }catch (error){
    next(error);
  }
};


// HAndle seller application 

export const handleSellerApplication = async (req, res, next) => {
  try{
    const {action, reason} = req.body;

    const user = await User.findById(req.params.id);
    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if(user.sellerStatus !== 'pending'){
      return res.status(400).json({
        success: false,
        message: 'This user has no pending seller application',
      });
    }

    if(action === 'approve') {
      user.role = 'seller';
      user.sellerStatus = 'approved';
      user.isVerifiedSeller = true;
      await user.save();

      await sendTemplateEmail(user.email, 'sellerApplicationResult', {
        name: user.name,
        action: 'approve',
      });
    

      return res.json({
        success: true,
        message: `${user.name} is now an approved seller`,
      });
    }

    if (action === 'reject'){
      user.sellerStatus = 'rejected';
      user.sellerRejectionReason = reason;
      await user.save();

      await sendTemplateEmail(user.email, 'sellerApplicationResult', {
        name: user.name,
        action: 'reject',
        reason,
      });

      return res.json({
        success: true,
        message: `${user.name}this seller application has been rejected`,
      });
    }
  } catch (error){
    next (error);
  }
};



//GET PENDING ADMINS 

export const getPendingAdmins = async (req, res, next) => {
  try{
    const admins = await User.find({
      adminStatus: 'pending',
      isDeleted: false
    }).select('-password -passwordResetToken -passwordResetExpires');

    res.json({
      success: true,
      count: admins.length,
      users: admins,
    });
  } catch (error) {
    next(error);
  }
};

//Handle Admin Application

export const handleAdminApplication = async (req, res, next) => {
  try{
    const { action, reason} = req.body;

    const user = await User.findById(req.params.id);
    if(!user) {
      return res.status(404).json({
        success: false,
        message: "USer not found",
      });
    }

    if (user.adminStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message:"This user has no pending admin application",
      });
    }

    if( action === 'approve') {
      user.role = 'admin';
      user.adminStatus = 'approved';
      await user.save();

      return res.json({
        success: true,
        message: `${user.name} this user is now an apporved admin`,
      });
    }

    if(action === 'reject') {
      user.adminStatus = 'rejected';
      user.adminRejectionReason = reason;
      await user.save();

      return res.json({
        success: true,
        message: `${user.name} this user's admin application has been deleted`,
      });
    }
  } catch (error){
    next (error);
  }
};



//SUSPEND USER

export  const suspendUser = async (req, res, next) => {
  try{
    const {reason} = req.body;

    const user = await User.findById(req.params.id);
    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if(user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: "Cannot suspend superadmin",
      });
    }

    if(user.isSuspended) {
      return res.status(400).json({
        success: false,
        message: `${user.name} this user is already suspended`,
      });
    }

    user.isSuspended = true;
    user.suspensionReason = reason;
    await user.save();

    await sendTemplateEmail(user.email, 'accountSuspended', {
      name: user.name,
      reason: user.suspensionReason,
    });

    res.json({
      success: true,
      message: `${user.name} has been suspended`,
    });
  } catch (error) {
    next (error);
  }
};


//UNSUSPENED USER

export const unsuspendUser = async (req, res, next) => {
  try{
    const user = await User.findById(req.params.id);
    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if(!user.isSuspended) {
      return res.status(404).json({
        success: false,
        message: `${user.name} user is not suspended`
      });
    }

    user.isSuspended = false;
    user.suspensionReason = null;
    await user.save();

    res.json({
      success: true,
      message:`${user.name} user has been unsuspended`,
    });
  } catch (error){
    next(error);
  }
};


//MAKE AN ADMIN

export const makeAdmin  = async (req, res, next) => {
  try{
    const user = await User.findById(req.params.id);

    if(!user){
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: "Cannot change superadmin role",
      });
    }


    if(user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: "User is already an admin",
      });
    }

    user.role = 'admin';
    user.adminStatus = 'approved';
    await user.save();

    res.json({
      success: true,
      message: `${user.name} user is now an admin`,
      user:{
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
       }
    });
  } catch (error){
    next(error);
  }
};


// DEMOTE ADMIN (SUPERAMIN ONLY)
export const demoteAdmin = async (req, res, next) => {
  try{
    const user = await User.findById(req.params.id);
    if(!user){
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if(user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: "This user is not an admin",
      });
    }

    user.role = 'customer';
    user.adminStatus = 'none';
    await user.save();

    res.json({
      success: true,
      message:`${user.name} this user has been demoted to customer`,
    });
  } catch (error) {
    next(error);
  }
};


//DELETE USER

export const deleteUser = async (req, res, next) => {
  try{
    const user = await User.findById(req.params.id);
    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: "Cannot delete superadmin account",
      });
    }

    if(user.role === 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: "Only superadmin can delete an admin account",
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: `${user.name} this user's account has been permanently deleted`,
    });
  } catch (error) {
    next(error);
  }
};