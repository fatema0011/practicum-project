import mongoose from "mongoose";
const Schema = mongoose.Schema;

const menuItemSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  photo: {
    type: String, // Store the URL as a string
    required: true // Assuming the photo link is necessary
  }
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema, 'menus');

export default MenuItem;
