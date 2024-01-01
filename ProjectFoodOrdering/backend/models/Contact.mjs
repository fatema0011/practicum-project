import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema({
 
  name: String,
  email: String,
  phoneNumber: String,
  yourMessage: String, 

});
const Contact = mongoose.model('Contact', contactSchema,'contacts');
export default Contact; 