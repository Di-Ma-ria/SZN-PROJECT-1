import {Coupon} from '../models/couponModel.js';

//Create coupon by (admin)

export const createCoupon = async (req, res, next) => {
  try{
    const {code, discountType, discountValue, minOrderAmount, maxUsage, expiresAt} = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase()});
    if(existing){
      return res.status(409).json({
        success: false,
        message:'Coupon code already exists'
      });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxUsage,
      expiresAt,
    });

    return res.status(201).json({success: true,
      message: 'Coupon created successfully', coupon
    });
  } catch (error) {
    next(error);
  }
};

//get all coupons by (admin)

export const getallCoupons = async (req, res, next) => {
  try{
    const { isActive, page = 1, limit = 20} = req.query;
    const filter = {};
    if(isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page -1) * limit;
    const coupons = await Coupon.find(filter)
      .select('-usedBy') // don't expose user IDs list publicly
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1});


    const total = await Coupon.countDocuments(filter);

    return res.json({
      success: true,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total,
      coupons,
    });
  } catch (error){
    next(error);
  }
};


// Validate coupon (customer applies at checkout)

export const validateCoupon = async ( req, res, next ) => {
  try{
    const { code, orderAmount} = req.body;
    const userId = req.user._id;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true
    });

    if(!coupon){
      return res.status(404).json({
        success: false,
      message: 'Invalid or inactive coupon code' });
    }

    if(new Date() > coupon.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has expired'
      });
    }
    if(coupon.usageCount >= coupon.maxUage){
      return res.status(400).json({
        success: false,
        message: 'This coupon has reached its usage limit'
      });
    }
    if(orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is #${coupon.minOrderAmount.toLocaleString()}`,
      });
    }

    if(coupon.usedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already used this coupon'
      });
    }

    //Calculate discount
    let discount = coupon.discounttype === 'percentage'
    ?(orderAmount * coupon.discountValue) / 100 
    : coupon.discountValue;

    discount = Math.min(discount, orderAmount); //cap at order amount

    const finalAmount = orderAmount - discount;

    return res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        code:  coupon.code,
        discountType: coupon.dsicountType,
        discountValue:  coupon.discountValue,
        discount,
        finalAmount,
      },
    });
  } catch (error){
    next(error);
  }
};

// Toggle active status (admin)

export const toggleCouponStatus = async (req, res, next) => {
  try{
    const coupon = await Coupon.findById(req.params.id);
    if(!coupon){
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.json({
      success: true,
      message: `Coupon is now ${coupon.isActive ? 'active' : 'inactive'}`,
      coupon,
    });
  } catch (error){
    next(error);
  }
};


// Delete coupon by admin

export const deleteCoupon = async (req, res, next) => {
  try{
    const coupon = await coupon.findByIdAndDelete(req.params.id);
    if(!coupon){
      return res.status(404).json({
        success: false,
         message: 'Coupon not found'
        });
    }

    return res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch(error){
    next(error);
  }
};