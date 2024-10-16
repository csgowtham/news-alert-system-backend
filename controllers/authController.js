import User from '../models/User.js'; // Use ESM import
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodeMailer from 'nodemailer';
import mongoose from 'mongoose';

export const register = async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const transporter = nodeMailer.createTransport({
    service : 'gmail',
    auth:{
        user : process.env.EMAIL,
        pass: process.env.PASS
    }
})

export const getEmailById = async (req, res) => {
    try {
      const { id } = req.query;
  
      // Validate the ID to ensure it's a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
  
      // Find the user by ObjectId
      const user = await User.findById(id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Send the email as a response
      return res.status(200).json({ email: user.email });
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };