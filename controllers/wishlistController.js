import { User } from '../models/userModel.js';
import { Product } from '../models/productModel.js';

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        populate: { path: 'category', select: 'name slug' },
      })
      .select('wishlist');

    res.status(200).json({ success: true, data: user?.wishlist || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleWishlist = async (req, res) => {
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
    res.status(500).json({ success: false, message: error.message });
  }
};
