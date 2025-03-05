import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configure dotenv to load the .env.local file
dotenv.config({ path: '.env.local' });

// Correct the URI format by placing the database name directly after the hostname
const MONGODB_URI = process.env.MONGODB_URI.replace(/\/\?/, '/CRM?');

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable');
  process.exit(1);
}

// Define the User schema with collection name 'users'
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
}, {
  collection: 'users' // Explicitly set collection name
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const defaultUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    email: 'employee@example.com',
    password: 'employee123',
    role: 'staff',
    firstName: 'Employee',
    lastName: 'User',
  },
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
    console.log('Attempting to connect to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => console.log('Connected to MongoDB'))
      .catch(err => console.error('Failed to connect to MongoDB', err));

    console.log('Using database:', mongoose.connection.db.databaseName);

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create new users
    try {
      const createdUsers = await User.create(defaultUsers);
      console.log('Created users:', createdUsers);
    } catch (error) {
      console.error('Failed to create users:', error);
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedUsers(); 