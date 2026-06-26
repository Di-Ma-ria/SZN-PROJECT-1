import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: null,
    },

    image: {
      type: String,
      default: null,
    },

    //subcategory support
    parent:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    isActive: { 
      type: Boolean,
      default: true
     },
    isDeleted: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true}
);

// auto-generate slug from

categorySchema.pre('save', function () {
  if(this.isModified('name')){
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
});

export const Category = mongoose.model('Category', categorySchema);