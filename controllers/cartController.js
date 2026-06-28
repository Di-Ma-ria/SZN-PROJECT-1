import {Cart} from '../models/cartModel.js';

import { Product } from '../models/productModel.js';

export const getCart = async (req, res, next) => {
  try{
    let cart = await Cart.findOne({user: req.user._id}).populate('items.product', 'name price salePrice images stock isActive brand');

    if(!cart){
      return res.json({
        success: true,
        cart: {items: [],
           totalPrice: 0,
          totalItems: 0
        },
      });
    }

    return res.json({success: true, cart});
  } catch(error){
    next(error);
  }
};


// ADD TO CART

export  const addToCart = async (req, res, next) => {
  try{
    const {productId, quantity = 1} = req.body;

    const product = await Product.findOne({
      _id: productId,
      status:'active',
    });

    if(!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable',
      });
    }
// this checks for the available stocks
    if(product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} item(s) left in stock`,
      });
    }

    //this finds or creates cart

    let cart = await Cart.findOne({user: req.user._id});
    if(!cart){
      cart = new Cart({user: req.user._id, items: []});
    }

    //this uses sale price if available, otherwise regular price
    const effectivePrice = product.salePrice ?? product.basePrice;

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if(existingItem) {
      const newQuantity = existingItem.quantity + quantity;


      if(newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.stock}in stock and you already have ${existingItem.quantity} in your cart`,
        });
      }

      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: effectivePrice,
      });
    }


    await cart.save();
    await cart.populate('items.product', 'name price salePrice images stock brand');

    return res.json({
      success: true,
      message: 'Item added to cart',
      cart,
    });
  } catch (error){
    next(error);
  }
};



//UPDATE CART ITEM QUANTITY

export const updateCartItem = async (req, res, next) => {
  try{
    const {quantity} = req.body;
    const {productId} = req.params;

    const cart = await Cart.findOne({user: req.user._id});
    if(!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }
    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if(!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }


    //check stock
    const product = await Product.findById(productId);
    if(product && quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} item(s) available in stock`,
      });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name price salePrice images stock brand');

    return res.json({
      success: true,
      message: 'Cart updated',
      cart,
    });
  } catch(error) {
    next(error);
  }
};


//Remove ITEM FROM CART

export const removeFromCart = async (req, res, next) => {
  try{
    const  {productId} =req.params;
    
    const cart = await Cart.findOne({user: req.user._id});
    if(!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemExists = cart.items.some(
      (item) => item.product.toString() === productId
    );

    if(!itemExists){
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product', 'name price salePrice images stock brand')

    return res.json({
      success: true,
      message: 'Items removed from cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};


//CLEAR ENTIRE CART

export const clearCart = async (req, res, next) => {
  try{
    const cart = await Cart.findOne({user: req.user._id});
    if(!cart) {
      return res.status(404).json({
        success: false,
        message: 'cart not found',
      });
    }

    cart.items = [];
    await cart.save();

    return res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart,
    });
  } catch (error) {
    next(error);
  }
};