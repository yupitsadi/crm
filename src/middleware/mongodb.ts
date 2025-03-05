import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/db';

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

const withMongoDB = (handler: Handler) => async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    // Add a timeout to the database connection
    const connectionPromise = connectToDatabase('CRM');
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 15000);
    });
    
    // Use Promise.race to add a timeout to the connection
    await Promise.race([connectionPromise, timeoutPromise]);
    
    return handler(req, res);
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown connection error'
    });
  }
};

export default withMongoDB; 