import { User } from '../models/userModel.js';
import { Product } from '../models/productModel.js';

export const getWishlist = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page -1)*limit;

    //Pull the raw IDs first so we know the total without fetching all products
    const userDoc = await User.findById(req.user._id).select('wishlist');
    if(!userDoc) {
      return res.status(404).json({
        success:false,
        message:'User not found'
      });
    }

    const total = userDoc.wishlist.length;
    const pageIds = userDoc.wishlist.slice(skip, skip + limit);

    //populate only the current page slice
    const products =await Product.find({_id:{$in: pageIds}, status:'active'})
    .populate('category', 'name slug')
    .sort({createdAt: -1});

    res.status(200).json({
      success:true,
      total,
      page,
      totalPages:Math.ceil(total/limit),
      data: products,
    })
  } catch (error) {
   next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);
    const exists = user.wishlist.some((id) => id.toString() === product._id.toString());

    if (exists) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== product._id.toString());
      await user.save();
      return res.status(200).json({ success: true, message: 'Removed from wishlist' });
    }

    user.wishlist.push(product._id);
    await user.save();

    res.status(200).json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
   next(error);
  }
};
