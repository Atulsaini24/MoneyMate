import { MongoClient } from 'mongodb';

// The connection string must come from the environment. Never commit it.
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not set. Add it to your Vercel project settings or local .env file.');
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Reuse one client across hot reloads and warm serverless invocations.
const clientPromise: Promise<MongoClient> =
  globalThis._mongoClientPromise ?? (globalThis._mongoClientPromise = new MongoClient(uri).connect());

export default clientPromise;
