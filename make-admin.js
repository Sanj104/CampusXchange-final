console.log('🚀 Starting make-admin script...');
console.log('');

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

console.log('📁 Environment loaded');
console.log(`📊 MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/campusxchange'}`);
console.log('');

// CHANGE THIS EMAIL to match the email you used in signup
const ADMIN_EMAIL = 'admin_campusXchange@gmail.com';

async function makeAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB (removed deprecated options)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusxchange');
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log('');
    
    console.log(`🔍 Looking for user with email: ${ADMIN_EMAIL}`);
    
    const user = await User.findOne({ email: ADMIN_EMAIL });
    
    if (!user) {
      console.log('');
      console.log(`❌ User with email "${ADMIN_EMAIL}" not found.`);
      console.log('');
      console.log('📝 Make sure you:');
      console.log('   1. Signed up at http://localhost:3000/auth/signup');
      console.log('   2. Used email: ' + ADMIN_EMAIL);
      console.log('   3. Changed ADMIN_EMAIL in this script to match your signup email');
      console.log('');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    console.log(`✅ User found: ${user.name} (${user.email})`);
    console.log('');
    
    if (user.role === 'admin') {
      console.log('ℹ️  This user is already an admin!');
      console.log('');
      console.log('👤 User Details:');
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
      console.log('🌐 Login and go to: http://localhost:3000/admin/dashboard');
      console.log('');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    console.log('⚡ Making user an admin...');
    
    user.role = 'admin';
    await user.save();
    
    console.log('');
    console.log('🎉 SUCCESS! User is now an admin!');
    console.log('');
    console.log('👤 User Details:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log('');
    console.log('✅ Next steps:');
    console.log('   1. Go to http://localhost:3000');
    console.log('   2. Login with your email and password');
    console.log('   3. Click "Admin Panel" in the navbar');
    console.log('');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('❌ ERROR OCCURRED:');
    console.log('');
    console.error(error);
    console.log('');
    console.log('💡 Common solutions:');
    console.log('   1. Make sure MongoDB is running (mongosh should connect)');
    console.log('   2. Check .env file exists with MONGODB_URI');
    console.log('   3. Make sure you added role field to User.js model');
    console.log('   4. Verify server.js was updated with admin changes');
    console.log('');
    await mongoose.disconnect();
    process.exit(1);
  }
}

makeAdmin();