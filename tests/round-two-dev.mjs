// Isolated browser fixture: every backend request is intercepted by Playwright.
import { createServer } from 'vite';
process.env.VITE_SUPABASE_URL='http://127.0.0.1:54444';
process.env.VITE_SUPABASE_PUBLISHABLE_KEY='synthetic-publishable-key';
process.env.VITE_GOOGLE_CLIENT_ID='';
const server=await createServer({server:{host:'127.0.0.1',port:5187,strictPort:true,open:false}});
await server.listen();
server.printUrls();
