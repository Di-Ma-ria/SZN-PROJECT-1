import { connect } from 'mongoose';

const ConnectDb = async () => {
  try {
    await connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default ConnectDb;