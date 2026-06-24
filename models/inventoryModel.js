import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },

    lowStockThreshold: {
      type: Number,
      default: 10,
    },

    lastRestockedAt: {
      type: Date,
      default: null,
    },
  },
  {timestamps: true}
);

export const Inventory = mongoose.model('Inventory', inventorySchema);