import mongoose from 'mongoose'

const reservationSchema = new mongoose.Schema({
  customerId: String,
  name: String,
  email: String,
  phoneNumber: String,
  event: String,
  numberOfPersons: Number,
  date: Date,
});
const Reservation = mongoose.model('Reservation', reservationSchema,'reservations');
export default Reservation 
