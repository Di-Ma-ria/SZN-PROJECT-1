import mongoose, { Schema } from "mongoose";
import slugify from "slugify";


const variantSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true,
    },
    sku:{
        type:String,
        required:true,
        lowercase:true,
        index:true,
    },
    price:{
        type:Number,
        required:true,
        min:0,
    },
    stock:{
        type:Number,
        default:0,
        min:0,
    },
    attributes:{
        type:Map,
        of:String,
    },  //{colour: "Black", storage: "128gb"}
});

const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
    },
    slug:{
        type:String,
        unique:true,
    },
    description:{
        type:String,
        required:true,
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:'Category',
        required:true,
    },
    brand:{
        type:String,
        required:true
    },
    seller:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },

    productType:{
        type:String,
        enum:['own', 'marketplace'],
        required:true,
    },

    images:{
        type:[String],
        validate:{
            validator:(val)=> val.length <=13,
            message:'A product cannot have more than 13 images',
        },
    },

    variants:[variantSchema],

    //Used when the product has no variants
    basePrice:{
        type:Number,
        required: function(){
            return this.variants.length ===0;
        },
        min:0,
    },
    stock:{
        type:Number,
        default: function () {
            return this.variants.length ===0 ? 0: undefined;
        },
        min:0,
    },
    status:{
        type:String,
        enum:['draft', 'pending', 'active', 'rejected', 'archived'],
        default: 'draft',
    },

    specs:{
        type:Map,
        of:String,
    },     //{RAM: "8gb", Battery:"5000mAh"}

    isFeatured:{
        type:Boolean,
        default:false,
    },
    discountPercentage:{
        type:Number,
        default:0,
        min:0,
        max:100,
    },
    ratings:{
        average:{
            type:Number,
            default:0,
        },
        count:{
            type:Number,
            default:0,
        },
    },
},{timestamps:true
});

productSchema.index({
    name:'text',
    description:'text',
    brand:'text'
});



// create

productSchema.pre('save', async function () {
  if (!this.isModified('name')) return;

  let baseSlug = slugify(this.name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await mongoose.model('Product').findOne({
    slug,
    _id: { $ne: this._id }
  })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = slug;
});

// to update

productSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  if (!update.name) return; 

    let baseSlug = slugify(update.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await mongoose.model('Product').findOne({
      slug,
      _id: { $ne: this.getQuery()._id }
    })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    update.slug = slug;
  
});

export const Product = mongoose.model('Product', productSchema);