process.env.TZ ||= 'Asia/Ho_Chi_Minh';

import mongoose from 'mongoose';
import { createApp } from './app.js';
import { seedAll } from './seed.js';

const port = Number(process.env.PORT) || 3000;
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nineeleven';

await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).catch((error) => {
  // Log only the host: the connection string carries the database password.
  const host = uri.replace(/^[a-z+]+:\/\/(?:[^@/]*@)?/i, '').split(/[/?]/)[0];
  console.error(`Không kết nối được MongoDB (${host}). Chạy "npm run db" hoặc đặt MONGODB_URI.\n${error.message}`);
  process.exit(1);
});

await seedAll();

createApp().listen(port, () => console.log(`API sẵn sàng tại http://localhost:${port}`));
