import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://atulsaini2496_db_user:zwGqQiwPh0ca1OEp@moneymate.uadcpfn.mongodb.net/moneymate?retryWrites=true&w=majority';

let cachedClient: MongoClient | null = null;
async function getMongoDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(mongoUri);
    await cachedClient.connect();
  }
  return cachedClient.db('moneymate');
}

function apiSyncPlugin() {
  return {
    name: 'api-sync-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/sync')) {
          return next();
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          return res.end();
        }

        try {
          const db = await getMongoDb();
          const ledgersCol = db.collection('user_ledgers');
          const usersCol = db.collection('users');

          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const userId = url.searchParams.get('userId');

          if (!userId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Missing userId parameter' }));
          }

          if (req.method === 'GET') {
            const record = await ledgersCol.findOne({ userId });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(record || {
              transactions: [],
              budgets: [],
              goals: [],
              friends: [],
              settings: null,
            }));
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', async () => {
              try {
                const payload = JSON.parse(body || '{}');
                if (payload.userInfo) {
                  await usersCol.updateOne(
                    { userId },
                    {
                      $set: {
                        userId,
                        email: payload.userInfo.email || null,
                        name: payload.userInfo.displayName || payload.userInfo.name || 'Anonymous',
                        lastActiveAt: new Date().toISOString()
                      },
                      $setOnInsert: { createdAt: new Date().toISOString() }
                    },
                    { upsert: true }
                  );
                }

                await ledgersCol.updateOne(
                  { userId },
                  {
                    $set: {
                      userId,
                      transactions: payload.transactions || [],
                      budgets: payload.budgets || [],
                      goals: payload.goals || [],
                      friends: payload.friends || [],
                      settings: payload.settings || null,
                      updatedAt: new Date().toISOString()
                    }
                  },
                  { upsert: true }
                );

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: 'Saved to MongoDB Atlas' }));
              } catch (parseErr: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: parseErr.message }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end();
        } catch (err: any) {
          console.error('[Vite Dev MongoDB Error]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiSyncPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
