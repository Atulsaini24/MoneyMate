import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/**
 * Serves /api/* during `npm run dev` using the exact same handlers Vercel runs
 * in production, so auth and validation behave identically in both places.
 */
function devApi(): Plugin {
  const readBody = (req: any) =>
    new Promise<any>((resolve, reject) => {
      let body = '';
      req.on('data', (c: Buffer) => (body += c));
      req.on('end', () => {
        try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
      });
      req.on('error', reject);
    });

  return {
    name: 'moneymate-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next) => {
        const url = req.url?.split('?')[0];
        if (!['/api/sync', '/api/scan-receipt', '/api/ask', '/api/push-subscribe'].includes(url)) return next();

        const send = (status: number, payload: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        };

        try {
          const { verifyRequest, AuthError } = await import('./api/_auth.ts');
          let user;
          try {
            user = await verifyRequest(req.headers.authorization);
          } catch (e) {
            if (e instanceof AuthError) return send(401, { error: e.message });
            throw e;
          }

          if (url === '/api/scan-receipt') {
            const { extractReceipt, ReceiptError } = await import('./api/_receipt.ts');
            try {
              const body = await readBody(req);
              return send(200, await extractReceipt(body.image, body.mediaType));
            } catch (e: any) {
              if (e instanceof ReceiptError) return send(e.status, { error: e.message });
              throw e;
            }
          }

          if (url === '/api/ask' || url === '/api/push-subscribe') {
            // Reuse the production handler with a minimal req/res adapter
            const mod = await import(url === '/api/ask' ? './api/ask.ts' : './api/push-subscribe.ts');
            const body = await readBody(req);
            const resShim: any = { statusCode: 200, setHeader: () => resShim, status(c: number) { this.statusCode = c; return this; }, json: (p: unknown) => send(resShim.statusCode, p) };
            return mod.default({ method: req.method, headers: req.headers, body } as any, resShim);
          }

          const { default: clientPromise } = await import('./api/_db.ts');
          const { readLedger, writeLedger } = await import('./api/_ledger.ts');
          const db = (await clientPromise).db('moneymate');
          if (req.method === 'GET') return send(200, await readLedger(db, user));
          if (req.method === 'POST') return send(200, { success: true, updatedAt: await writeLedger(db, user, await readBody(req)) });
          return send(405, { error: 'Method not allowed' });
        } catch (err: any) {
          console.error('[dev api]', err);
          return send(500, { error: err?.message || 'Server error' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Expose server-only secrets (MONGODB_URI, ANTHROPIC_API_KEY) to the dev API.
  // Only VITE_* variables ever reach the browser bundle.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [react(), tailwindcss(), devApi()],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'firebase', test: /node_modules[\\/](firebase|@firebase)/ },
              { name: 'charts', test: /node_modules[\\/](recharts|d3-|victory)/ },
              { name: 'motion', test: /node_modules[\\/](framer-motion|motion-)/ },
              { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            ],
          },
        },
      },
    },
  };
});
