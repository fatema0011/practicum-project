import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.mjs';

export default async function protectUser(req, res, next) {
  try {
    console.log("cookies:", req.cookies)
    let token = req.cookies.adminCookie;

    if (!token) {
      throw new Error('Not authorized, token failed');
    }
    const decoded = jwt.verify(token, 'JWTSecret');
    console.log(decoded);
    const user = await Admin.findById(decoded.UserInfo.adminId).select('-password');
    console.log(user);
    if (!user) {
      throw new Error('Not authorized, token failed');
    }

    req.body.adminId = user._id;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
