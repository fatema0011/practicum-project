import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import MenuItem from "../models/Menu.mjs";
import Admin from "../models/Admin.mjs";
import path from "path";
import protectUser from "../utils/protectAdmin.mjs";
import Transaction from "../models/Transaction.mjs";
const router = express.Router();
// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename the file with a unique name (you can modify the filename as needed)
  },
});
const upload = multer({ storage: storage });

// POST route for handling menu item creation
router.post("/menu/add", protectUser, upload.single("photo"), async (req, res) => {
  try {
    const { text, number } = req.body;
    const { filename } = req.file; // Get the filename from multer

    // Create a new menu item using the MenuItem Mongoose model
    const newItem = new MenuItem({
      title: text,
      price: number,
      photo: filename, // Store the file path in the database
    });

    // Save the new menu item to the database
    await newItem.save();

    res.status(201).json({ message: "Menu item created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// Route to get all menu items
router.get("/menu/all", protectUser, async (req, res) => {
  try {
    const allMenus = await MenuItem.find({}); // Fetch all menu items from the database
    res.json(allMenus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/update/:id",protectUser, upload.single("photo"), async (req, res) => {
  const { title, price } = req.body;
  const { filename } = req.file;
  const { id } = req.params;

  try {
    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Update the menu item fields
    menuItem.title = title;
    menuItem.price = price;
    menuItem.photo = filename;

    // Save the updated menu item
    await menuItem.save();

    res
      .status(200)
      .json({
        message: "Menu item updated successfully",
        updatedMenuItem: menuItem,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});
router.delete("/menu/:id", protectUser, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedMenuItem = await MenuItem.findByIdAndDelete(id);

    if (deletedMenuItem) {
      res
        .status(200)
        .json({ message: `Menu item with ID ${id} deleted successfully` });
    } else {
      res.status(404).json({ error: `Menu item with ID ${id} not found` });
    }
  } catch (error) {
    res.status(500).json({ error: "Error deleting menu item" });
  }
});
router.post("/register", async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password } = req.body;
    const newUser = new Admin({ name, email, password });
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
    const user = await Admin.findOne({ email, password }).exec();
    if (user && password === user.password) {
      const token = jwt.sign(
        {
          UserInfo:{
            adminId: user._id,
            role: "admin",
          }
        },
        'JWTSecret',
        { expiresIn: "30d" }
      )
      return res.status(200).cookie("adminCookie", token,
      {
        httpOnly: true, //accessible only by web server
        secure: true, //https
        sameSite: "None", //cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
      }).json({ role: 'admin'});
    }

   res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/transactions', protectUser, async (req, res) => {
  try {
    // Find all transactions where payment is true
    const transactions = await Transaction.find({ payment_status: true });
    console.log(transactions)
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});
export default router;
