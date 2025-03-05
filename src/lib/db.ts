import mongoose, { ConnectOptions } from 'mongoose';

// Track connection states
const connections: Record<string, mongoose.Connection> = {};

// Connection options with improved timeout settings
const options: ConnectOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds for server selection (reduced from 60s)
  socketTimeoutMS: 45000, // 45 seconds for socket operations
  connectTimeoutMS: 30000, // 30 seconds for initial connection
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 1, // Minimum number of connections in the pool
  retryWrites: true, // Retry failed write operations
  retryReads: true, // Retry failed read operations
};

// Parse the base MongoDB URI with proper type assertion
const BASE_URI = process.env.MONGODB_URI || '';
if (!BASE_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

// Maximum number of connection retry attempts
const MAX_RETRY_ATTEMPTS = 3;
// Delay between retry attempts in ms (starts at 1s, then exponential backoff)
const INITIAL_RETRY_DELAY = 1000;

/**
 * Attempts to establish a database connection with retry logic
 */
async function getConnection(dbName: string): Promise<mongoose.Connection> {
  let retryAttempt = 0;
  let lastError: Error | null = null;

  while (retryAttempt < MAX_RETRY_ATTEMPTS) {
    try {
      // If this isn't the first attempt, add delay with exponential backoff
      if (retryAttempt > 0) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryAttempt - 1);
        console.log(`Retry attempt ${retryAttempt}/${MAX_RETRY_ATTEMPTS} after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Return existing connection if already established and healthy
      if (connections[dbName] && connections[dbName].readyState === 1) {
        console.log(`Using existing healthy connection to ${dbName}`);
        return connections[dbName];
      } else if (connections[dbName]) {
        console.log(`Existing connection to ${dbName} is in state ${connections[dbName].readyState}`);
        console.log('Cleaning up unhealthy connection...');
        
        // Attempt to close the unhealthy connection gracefully
        try {
          await connections[dbName].close(true);
        } catch (closeErr) {
          console.warn(`Error closing unhealthy connection: ${closeErr}`);
          // Continue even if close fails
        }
        
        delete connections[dbName]; // Remove the bad connection
      }

      console.log(`Creating new connection to ${dbName}`);
      
      // Format the connection string correctly
      // Extract the part before query parameters
      const baseWithoutParams = BASE_URI.split('?')[0];
      // Remove trailing slash if present
      const cleanBase = baseWithoutParams.endsWith('/') 
        ? baseWithoutParams.slice(0, -1) 
        : baseWithoutParams;
      
      // Add database name
      const dbUri = `${cleanBase}/${dbName}`;
      
      // Add query parameters back if they exist
      const queryParams = BASE_URI.includes('?') ? `?${BASE_URI.split('?')[1]}` : '';
      const fullUri = `${dbUri}${queryParams}`;
      
      // Log redacted connection string for debugging
      const redactedUri = dbUri.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@');
      console.log(`Connecting to: ${redactedUri}`);
      console.log('Using connection options:', JSON.stringify(options));

      // For default connection (mongoose main connection)
      if (dbName === 'CRM') {
        if (mongoose.connection.readyState === 1) {
          connections.CRM = mongoose.connection;
          console.log(`Connected to default database: ${dbName}`);
          return mongoose.connection;
        }
        
        // Connect to default mongoose connection
        await mongoose.connect(fullUri, options);
        mongoose.connection.on('error', (err) => {
          console.error(`Default MongoDB connection error for ${dbName}:`, err);
        });
        mongoose.connection.on('disconnected', () => {
          console.warn(`Default MongoDB disconnected for ${dbName}`);
          delete connections.CRM;
        });
        connections.CRM = mongoose.connection;
        console.log(`Connected to default database: ${dbName}`);
        return mongoose.connection;
      }

      // For additional databases, create a new connection
      const connection = await mongoose.createConnection(fullUri, options).asPromise();
      
      // Add event listeners for connection issues
      connection.on('error', (err) => {
        console.error(`MongoDB connection error for ${dbName}:`, err);
      });
      
      connection.on('disconnected', () => {
        console.warn(`MongoDB disconnected for ${dbName}`);
        delete connections[dbName]; // Remove from connections on disconnect
      });
      
      // Store the connection
      connections[dbName] = connection;
      
      // Verify connection is actually working by attempting a simple operation
      if (connection.db) {
        await connection.db.admin().ping();
      }
      
      console.log(`Connected to database: ${dbName} (readyState: ${connection.readyState})`);
      
      return connection;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Connection attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS} to ${dbName} failed:`, lastError.message);
      retryAttempt++;
    }
  }

  // If we've exhausted all retries, throw the last error
  console.error(`All ${MAX_RETRY_ATTEMPTS} connection attempts to ${dbName} failed.`);
  throw lastError || new Error(`Failed to connect to ${dbName} after ${MAX_RETRY_ATTEMPTS} attempts`);
}

export const connectToDatabase = getConnection;
export const getWorkshopDb = () => getConnection('workshop');
export const getCrmDb = () => getConnection('CRM');

// Enhanced connection closing with timeout
export const closeConnections = async () => {
  const closePromises = [];
  
  for (const dbName in connections) {
    // Add timeout to each close operation
    const closeWithTimeout = Promise.race([
      connections[dbName].close(true),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout closing ${dbName} connection`)), 5000)
      )
    ]);
    
    closePromises.push(
      closeWithTimeout
        .then(() => {
          delete connections[dbName];
          console.log(`Closed connection to ${dbName}`);
        })
        .catch(err => console.error(`Error closing ${dbName} connection:`, err))
    );
  }
  
  await Promise.allSettled(closePromises);
}; 