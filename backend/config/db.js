// Config: Mongoose connection helper with retry logic for Dokkhota.
// Adds a development fallback to a local MongoDB instance when an Atlas SRV
// lookup fails (helpful when DNS or network prevents resolving cluster hostnames).
const mongoose = require('mongoose');

const DEFAULT_LOCAL_URI = process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/dokkhota';

const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();
  const hasRealMongoUri = Boolean(uri && !uri.includes('<') && !uri.includes('>') && !uri.includes('your_'));

  if (!hasRealMongoUri) {
    console.warn('MONGO_URI not set or still using placeholder values — falling back to local MongoDB at', DEFAULT_LOCAL_URI);
    await tryConnectWithRetry(DEFAULT_LOCAL_URI);
    return;
  }

  try {
    await tryConnectWithRetry(uri);
    return;
  } catch (err) {
    // If the error looks like an SRV/DNS resolution problem, try local fallback.
    const isDnsError = err && (err.code === 'ENOTFOUND' || err.message.includes('getaddrinfo') || err.name === 'MongoParseError');
    if (isDnsError) {
      console.warn('Primary MongoDB URI failed with DNS/SRV error — attempting local fallback:', DEFAULT_LOCAL_URI);
      await tryConnectWithRetry(DEFAULT_LOCAL_URI);
      return;
    }
    // Re-throw other errors so the host is aware.
    throw err;
  }
};

async function tryConnectWithRetry(connectUri, retries = 5) {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  const connectOnce = async (remaining) => {
    try {
      await mongoose.connect(connectUri, options);
      console.log('MongoDB connected successfully to', connectUri);
    } catch (error) {
      if (remaining <= 0) {
        console.error('MongoDB connection failed after retries:', error);
        throw error;
      }
      console.warn(`MongoDB connection failed, retrying in 3 seconds... (${remaining} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await connectOnce(remaining - 1);
    }
  };

  await connectOnce(retries);
}

module.exports = connectDB;
