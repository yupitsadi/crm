import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Crm:SU5gjqf8byFFXUj8@produtiongl.eamnm.mongodb.net/?retryWrites=true&w=majority&appName=produtionGL';

// Define the User schema directly in the script to avoid import issues
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'customer'],
    default: 'customer',
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
});

// Create the User model
const User = mongoose.models.User || mongoose.model('User', userSchema);

// const defaultUsers = [
//   {
//     email: 'admin@example.com',
//     password: 'admin123',
//     role: 'admin',
//     firstName: 'Admin',
//     lastName: 'User',
//   },
//   {
//     email: 'employee@example.com',
//     password: 'employee123',
//     role: 'staff',
//     firstName: 'Employee',
//     lastName: 'User',
//   },
// ];
const defaultUsers = [
  {
    email: 'aditya@geniuslabs.com',
    password: 'aditya123',
    role: 'admin',
    firstName: 'Aditya',
    lastName: 'Prasad',
  },
];

async function seedUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create new users
    const createdUsers = await User.create(defaultUsers);
    console.log('Created users:', createdUsers);

    // Verify users were created
    const usersInDb = await User.find({});
    console.log('Users in database:', usersInDb);

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedUsers(); 
