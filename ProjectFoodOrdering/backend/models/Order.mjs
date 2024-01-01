import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  menuId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem', // Reference to the Menu schema
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the Customer schema (assuming there's a Customer schema)
    required: true
  },
  
  payment :{
    type: Boolean,
    required: false
  },
  // Other fields related to the order can be added here
  // For example: quantity, totalPrice, etc.
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema,'orders');

export default Order
