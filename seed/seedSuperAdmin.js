import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {User} from '../models/userModel.js';

dotenv.config();

const seedAll = async () => {
  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Db...');

    const existingSuperAdmin = await User.findOne({role: 'superadmin'});

    if(!existingSuperAdmin) {
      await User.create({
       name: 'Super Admin',
       email: process.env.SUPERADMIN_EMAIL,
       password: process.env.SUPERADMIN_PASSWORD,
       role: 'superadmin',
       address: {
        street: '1 Almond Ave',
        city: 'Enugu',
        state: 'Lagos',
        country: 'Nigeria'
       } 
      });
      console.log('Superadmin created');
    }else {
      console.log('Superadmin already exists-skipping');
    };


  } catch(error){
    console.log('Seeding failed:', error.message);
    process.exist(1);
  }
};

seedAll ();