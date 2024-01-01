import jwt from 'jsonwebtoken';
import User from '../models/User.mjs'; // Import the User schema from your models

export default async function protectUser(req, res, next) {
  try {
    console.log("cookies:", req.cookies)
    let token = req.cookies.customerCookie;

    if (!token) {
      throw new Error('Not authorized, token failed');
    }
    const decoded = jwt.verify(token, 'JWTSecret');
    const user = await User.findById(decoded.UserInfo.customerId).select('-password');
    if (!user) {
      throw new Error('Not authorized, token failed');
    }

    req.body.userId = user._id;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
