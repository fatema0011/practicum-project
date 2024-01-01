import express from 'express';
import mongoose from 'mongoose';
import customerRoutes from './routes/customerRoutes.mjs'
import adminRoutes from './routes/adminRoutes.mjs'
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
const app = express();
const port = 5000; 

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/foodOrdering', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB successfully');
});
mongoose.connection.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err.message);
});
//Database code ends

app.use(cookieParser());

//Routes Here
app.use(express.json());
app.use('/customer', customerRoutes);
app.use('/admin', adminRoutes);
app.use(express.static(path.resolve('uploads')));
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});