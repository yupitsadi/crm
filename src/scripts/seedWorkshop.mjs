import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configure dotenv to load the .env.local file
dotenv.config({ path: '.env.local' });

// MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define MONGODB_URI in .env.local file');
  process.exit(1);
}

// Workshop data to insert
const workshopData = {
  theme: "Smart City Vehicles",
  date: {
    time_slots: [
      "11:00 AM - 1:30 PM",
      "4:00 PM - 6:30 PM"
    ],
    list_datetime: new Date("2024-12-28T09:00:00Z")
  },
  date_of_workshop: "2025-03-22",
  duration: 2.5,
  rate: 1690,
  video_url: "https://www.youtube-nocookie.com/embed/t_nOVtHGnPs?autoplay=1&loop=1&playlist=t_nOVtHGnPs&controls=0&mute=1&enablejsapi=0&modestbranding=1&rel=0",
  description: [
    {
      type: "paragraph",
      content: "Lego-In-Action STEM workshops are great to power your critical thinking and problem solving skills.During the robotics workshop themed Smart City Vehicles students get an overview of the project and then they Build, Code and Create a Fare System . \n"
    },
    {
      type: "paragraph",
      content: "Lesson plans of all themes are created to generate interest in robotics , coding and product design. Look at the glimpses of past workshops in the below video\n"
    },
    {
      type: "paragraph",
      content: "Our curious innovators work with IIT-IIM graduates who are now GeniusLabs senior faculty members. Each age group is allocated different building and coding challenges. \n"
    },
    {
      type: "paragraph",
      content: "During our presentation we cover over 20 types of city vehicles before we starting building either Smart Bus or River Ferry System based on the age-group . \n"
    },
    {
      type: "list",
      content: "Students in 6-9 years age group build a Smart Bus which knows how to stop at the according to the traffic light and at the correct destinations. \n",
      subpoint: [
        "Faculty engages with the children by asking question such as - How does the bus know where to stop? What happens if people are waiting at the bus stop? What happens if no one is waiting? \n",
        "After the building is done, the first challenge is : making the bus stop at the red light.\n",
        "Students complete coding challenges such such as coding the bus to stop at a bus stop Using MIT Scratch  coding software\n"
      ]
    },
    {
      type: "list",
      content: "Students in 9-11 years age group build a build a Smart Bus and code advance challenges to stop and start as per the scheduled timing of the bus\n",
      subpoint: [
        "Faculty engages with the children by asking question such as - How does the bus know where to stop? What happens if people are waiting at the bus stop? What happens if no one is waiting? \n",
        "Students also build a bus schedule and understand the scratch coding blocks such as delay, broadcasting, conditional blocks\n",
        "Students complete coding challenges such as upgrading the bus route to stop at different locations Using MIT Scratch  coding software\n"
      ]
    },
    {
      type: "list",
      content: "Students in 11+ years age group build the River Ferry and program it using python coding \n",
      subpoint: [
        "Faculty engages with the children by asking question such as - What happens if we change the boat's position?How many ways can you move your boat on the river?\n",
        "Understand real-world transportation challenges. Apply Python programming concepts to control and navigate the ferry.\n",
        "Students complete coding challenges such as coding to navigate the ferry using two different methods type Using python\n"
      ]
    }
  ],
  location: {
    address: "Genius Labs, Skymark",
    city: "Sec 98, Noida",
    country: "India"
  },
  likes: 451,
  rating: 4.6,
  children_enrolled: 10,
  kit_name: "LEGO® Education SPIKE™ Prime Set",
  meta: "Join GeniusLabs' Smart City Vehicles workshop! 🚍🚤 Kids 6-12+ build & code Smart Buses & River Ferries using Scratch like platform & Python, exploring real-world transportation challenges. Hands-on STEM fun!",
  workshop_url: "https://www.youtube-nocookie.com/embed/4sjAYFyBGjU?autoplay=1&loop=1&playlist=4sjAYFyBGjU&controls=0&mute=1&enablejsapi=0&modestbranding=1&rel=0\n"
};

async function seedWorkshop() {
  try {
    console.log('Connecting to MongoDB...');
    const dbURI = `${MONGODB_URI}/workshop`;
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB database: workshop');

    // Get the collection - workshopDetails
    const db = mongoose.connection.db;
    const collection = db.collection('workshop_details');
    
    // Insert the workshop data
    const result = await collection.insertOne(workshopData);
    
    if (result.acknowledged) {
      console.log(`Workshop document inserted with ID: ${result.insertedId}`);
    } else {
      console.log('Failed to insert workshop document');
    }

    // Check how many documents are in the collection
    const count = await collection.countDocuments();
    console.log(`Total workshops in collection: ${count}`);

  } catch (error) {
    console.error('Error seeding workshop data:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedWorkshop(); 