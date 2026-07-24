import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    quantity:{
      type: Number,
      required: true,
      min:1,
      default: 1,
    },

    //price snapshot- locked in at time of adding.
    //protects customer if seller changes price later

    price:{
      type: Number,
      required: true,
    },
  },
  {_id: false}
);

const cartSchema = new mongoose.Schema(
  {
    user:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one cart per user
    },
    items:[cartItemSchema],

    totalPrice: {
      type: Number,
       default: 0 
      },
    totalItems: {
      type: Number,
       default: 0
      },
  },
  {
    timestamps: true
  }
);

//auto-calculate totlas before every save

cartSchema.pre('save', function (){
  this.totalPrice = this.items.reduce(
    (sum,item) => sum + item.price *item.quantity, 0
  );

  this.totalItems = this.items.reduce(
    (sum, item) => sum + item.quantity, 0
  );

});

export const Cart = mongoose.model('Cart', cartSchema);
