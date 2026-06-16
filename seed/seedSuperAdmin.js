import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {User} from '../models/userModel.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database..');

    const existingSuperAdmin = await User.findOne({role: 'superadmin'});
    if(!existingSuperAdmin) {
      await User.create({
        name: process.env.SUPERADMIN_NAME, 
        email:process.env.SUPERADMIN_EMAIL,
        password: process.env.SUPERADMIN_PASSWORD,
        phone: process.env.SUPERADMIN_PHONE,
        role: 'superadmin',
        isVerified: true,
        isSuspended: false,
        isDeleted: false,
        adminStatus: 'approved',
        sellerStatus:'none',
        address: {
          street: process.env.SUPERADMIN_STREET,
          city: process.env.SUPERADMIN_CITY,
          state:process.env.SUPERADMIN_STATE,
          country:process.env.SUPERADMIN_COUNTRY,
        },
      });

      console.log('Superadmin created');
    } else {
      console.log('Superadmin already exists -skipping');
    }

    console.log('');
    console.log('=============');
    console.log('Seeding completed successfully');
    console.log('=============');
    console.log(`Email:       ${process.env.SUPERADMIN_EMAIL}`);
    console.log(`Password:    ${process.env.SUPERADMIN_PASSWORD}`);
    console.log('============');


    process.exit();

  } catch (error) {
      console.error('Seeding failed:', error.message);
      process.exit(1);
    }
  };

  seedSuperAdmin ();
