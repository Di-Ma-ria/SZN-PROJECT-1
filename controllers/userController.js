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
        message: "can't change superadmin role",
      });
    }


    if(user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: "User is already an admin",
      });
    }

    user.role = 'admin';
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