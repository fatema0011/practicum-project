import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.mjs";
import MenuItem from "../models/Menu.mjs";
import protectCustomer from "../utils/protectCustomer.mjs";
import Transaction from "../models/Transaction.mjs";
import Order from "../models/Order.mjs"
import SSLCommerzPayment from  'sslcommerz-lts';
import mongodb from 'mongodb';
import Reservation from "../models/Reservation.mjs";
import Contact from "../models/Contact.mjs";
const router = express.Router();

const store_id =  'mbd6561a027ee43e';
const store_passwd = 'mbd6561a027ee43e@ssl'
const is_live = false;

router.post('/reservations', protectCustomer, async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      event,
      numberOfPersons,
      date
    } = req.body;
    const customerId =req.body.userId ;
    const reservation = new Reservation({
      customerId ,
      name,
      email,
      phoneNumber,
      event,
      numberOfPersons,
      date
    });
    console.log(reservation);
    const savedReservation = await reservation.save();
    res.json(savedReservation);
  } catch (err) {
    res.json({ message: err });
  }
});

router.post("/register", async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password } = req.body;
    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password }).exec();
    if (user && password === user.password) {
      const token = jwt.sign(
        {
          UserInfo:{
            customerId: user._id,
            role: "customer",
          }
        },
        'JWTSecret',
        { expiresIn: "30d" }
      )
      return res.status(200).cookie("customerCookie", token,
      {
        httpOnly: true, //accessible only by web server
        secure: true, //https
        sameSite: "None", //cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
      }).json({ role: 'customer'});
    }

   res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post('/orders/add', protectCustomer, async (req, res) => {
  try {
    const { menuId, userId } = req.body;
    const payment = false;

    const currentDate = new Date().toISOString().split('T')[0];

    const existingReservation = await Reservation.findOne({ date: currentDate, customerId: userId });

    if (existingReservation) {
      const newOrder = await Order.create({ menuId, userId, payment });
      res.status(201).json(newOrder);
    } else {
      res.status(400).json({ message: 'No reservation found for the current date for this user' });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});


router.get('/menu/all', protectCustomer , async (req, res) => {
  try {
    const allMenus = await MenuItem.find(); // Fetch all menu items from the database
    res.json(allMenus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Express route to get all orders by userId
router.get('/orders', protectCustomer, async (req, res) => {
  try {
    const { userId } = req.body;

    // Find orders that match the userId
    const orders = await Order.find({ userId , payment: false});

    // Extract menuIds from orders
    const menuIds = orders.map(order => order.menuId);

    // Fetch menu details for the extracted menuIds
    const menus = await MenuItem.find({ _id: { $in: menuIds } });

    // Combine orders with their respective menu details
    const ordersWithMenus = orders.map(order => {
      const menu = menus.find(menu => menu._id.toString() === order.menuId.toString());
      return {
        ...order.toObject(),
        menu // Attach menu details to the order object
      };
    });

    res.status(200).json(ordersWithMenus);
  } catch (error) {
    console.error('Error fetching orders with menu details:', error);
    res.status(500).json({ message: 'Failed to fetch orders with menu details' });
  }
});
router.post('/process-payment', protectCustomer, async (req, res)=>{
 try {
  console.log("Init payment")
  const { orderIds, totalPrice } = req.body;
  const transActionId = new mongodb.ObjectId().toString();
  const newTransaction = new Transaction({
    orderIds: orderIds,
    tranId: transActionId,
    payment_status: false, 
    total_amount: totalPrice,
  });
  const savedTransaction = await newTransaction.save();
   const data = {
       total_amount: totalPrice ,
       currency: 'BDT',
       tran_id: transActionId , // use unique tran_id for each api call
       success_url: `http://localhost:5000/customer/validate/${transActionId}`,
       fail_url: 'http://localhost:3030/fail',
       cancel_url: 'http://localhost:3030/cancel',
       ipn_url: 'http://localhost:5000/payment/validate-ipn',
       shipping_method: 'Courier',
       product_name: 'Computer.',
       product_category: 'Electronic',
       product_profile: 'general',
       cus_name: 'Customer Name',
       cus_email: 'customer@example.com',
       cus_add1: 'Dhaka',
       cus_add2: 'Dhaka',
       cus_city: 'Dhaka',
       cus_state: 'Dhaka',
       cus_postcode: '1000',
       cus_country: 'Bangladesh',
       cus_phone: '01711111111',
       cus_fax: '01711111111',
       ship_name: 'Customer Name',
       ship_add1: 'Dhaka',
       ship_add2: 'Dhaka',
       ship_city: 'Dhaka',
       ship_state: 'Dhaka',
       ship_postcode: 1000,
       ship_country: 'Bangladesh',
   };

   const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
   const apiResponse = await sslcz.init(data);
  // console.log(apiResponse);
   let GatewayPageURL = apiResponse.GatewayPageURL;
   res.json({ GatewayPageURL, "message":"Initializing payment"});
   console.log('Redirecting to: ', GatewayPageURL);
 } catch (error) {
  console.error(error);
 }
})


router.post('/validate/:tId', async (req, res) => {
  const { tId } = req.params; // Extracting tId from the request params

  try {
    // Find the Transaction document by tranId
    const transaction = await Transaction.findOne({ tranId: tId });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update orders corresponding to orderIds in the Transaction document
    const orderUpdatePromises = transaction.orderIds.map(async orderId => {
      // Update each order with payment: true
      return Order.findByIdAndUpdate(orderId, { payment: true });
    });

    await Promise.all(orderUpdatePromises);

    // Update the payment_status in the Transaction document to true
    transaction.payment_status = true;
    await transaction.save();

    res.status(200).json({ message: 'Payment processed successfully' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

export default router;
