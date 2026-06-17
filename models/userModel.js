import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({

  // INFO 
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    minlength:8
  },

  phone: {
    type: String,
    trim: true
  },


  profileImage: {
    type: String,
    default: null
  },

  role: {
    type: String,
    enum: ['customer', 'seller', 'admin', 'superadmin'],
    default: 'customer'
  },

  //ALL ROLE STATUS 

  isVerified: {
    type: Boolean,
    default: false
  },

  isSuspended: {
    type: Boolean,
    default: false
  },

  suspensionReason: {
    type: String,
    default: null
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: {
    type: Date,
    default: null
  },

// SELLER FIELDS 

  sellerStatus: {
    type: String,
    enum: ['none', 'pending','approved', 'rejected'],
    default: 'none'
  },

   sellerRejectionReason: {
      type: String,
      default: null
    },

  sellerProfile: {
    storeName: {
      type: String,
      trim: true
    },
    storeDescription: {
      type: String,
    },

    storeImage: {
      type: String,
      default: null
    },

    storeAddress: {
    street: {
      type: String,
      //required: true,
    },

    city: {
      type: String,
      //required: true,
    },

    state: {
      type: String,
      //required: true,
    },

    country: {
      type: String,
      //required: true
    },
  },

    bankDetails: {
      bankName: {
        type: String,
    },
    accountNumber :{
      type: String
    },

    accountName: {
      type: String
    },

    },

    totalSales: {
      type: Number,
      default: 0
    },

    totalRevenue: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        default: 0
      },

      count: {
        type: Number,
        default: 0
      },
},

isVerifiedSeller: {
    type: Boolean,
    default: false
  },

  //ADMIN FIELD 

  adminStatus: {
    type: String,
    enum:['none', 'pending',  'approved', 'rejected'],
    default: 'none'
  },

  adminRejectionReason: {
    type: String,
    default: null
  },


  //CUSTOMER 
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  totalOrders: {
    type: Number,
    default: 0
  },

  totalSpent: {
    type: Number,
    default: 0
  },

// ALL ROLES ADDRESS
  // address: {
  //   street: {
  //     type: String,
  //    required: true,
  //   },

  //   city: {
  //     type: String,
  //    required: true,
  //   },

  //   state: {
  //     type: String,
  //     required: true,
  //   },

  //   country: {
  //     type: String,
  //     required: true
  //   },
  // },

  // SECURITY

  passwordChangedAt: {
    type: Date,
    default: null
  },

  passwordResetToken: {
    type: String,
    default: null
  },

  passwordResetExpires: {
    type: Date,
    default: null
  },

  lastLogin: {
    type: Date,
    default: null
  },

  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: {
    type: Date,
    default: null
  },
}
}
);
{
  timestamps: true
}

// HASH PASSWORD WITH BCRYPT BEFORE SAVING

userSchema.pre('save', async function () {
  if(!this.isModified('password')) return;
  this.password = await  bcryptjs.hash(this.password, 12);
  this.passwordChangedAt = Date.now();
});

// compare passwords at logim  
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// checks if acccount is locked
userSchema.methods.isLocked = function()
 {
  return !! (this.lockUntil && this.lockUntil > Date.now());
 };

// increment login attempts

 userSchema.methods.incrementLoginAttempts = async function() {
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 2 * 60 * 60 * 1000;
  }
  this.loginAttempts += 1;
  await this.save();
};

// reset login attempts

userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  this.lastLogin = Date.now();
  await this.save();
};

export const User = mongoose.model('User', userSchema);