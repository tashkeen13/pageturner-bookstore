import 'dotenv/config';
import mongoose from 'mongoose';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const suppliedEmail = process.argv[2]?.trim().toLowerCase();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function createAdmin() {
  let adminEmail = suppliedEmail;
  if (!adminEmail) {
    const interactive = createInterface({ input: stdin, output: stdout });
    try { adminEmail = (await interactive.question('Email of the registered account to make an admin: ')).trim().toLowerCase(); }
    finally { interactive.close(); }
  }

  if (!emailPattern.test(adminEmail) || adminEmail.length > 254) {
    throw new Error('Enter a valid account email address.');
  }

  await connectDB(process.env.MONGO_URI);
  const user = await User.findOne({ email: adminEmail });
  if (!user) {
    throw new Error(`No PageTurner account exists for ${adminEmail}. Register that email first, then run this command again.`);
  }

  user.role = 'admin';
  user.isBlocked = false;
  await user.save();
  process.stdout.write(`Admin access enabled for ${user.email}. Sign out and sign in again to refresh the account role.\n`);
}

createAdmin()
  .catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
