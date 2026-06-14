import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import ConnectDb from './config/db.js';
import {errorHandler} from './middlewares/errorHandler.js';


dotenv.config();
const app = express();
const PORT = process.env.PORT
ConnectDb();

// MIDDLEWARES
app.use(express.json());
app.use(cors());


//ROUTES


app.get('/',(req, res) => {
  res.json({message: "your api is running"});
});

app.use('/', (req,res) => {
  res.json({message: "wrong url"});
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on the ${PORT}`);
});
