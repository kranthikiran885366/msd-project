/**
 * MongoDB Atlas Connection Checker
 * Verify database connectivity and collection creation
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clouddeck';

async function checkMongoDBConnection() {
  console.log('\n========================================');
  console.log('MongoDB Atlas Connection Checker');
  console.log('========================================\n');

  console.log(`📍 Connecting to: ${MONGODB_URI.replace(/([a-zA-Z0-9]+:)([a-zA-Z0-9]+)@/, '$1****@')}`);
  console.log('');

  try {
    // Step 1: Connect to MongoDB
    console.log('⏳ Step 1: Attempting connection...');
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    });

    console.log('✅ Connection successful!\n');

    // Step 2: Check database details
    console.log('⏳ Step 2: Retrieving database information...');
    const db = conn.connection.db;
    const adminDb = db.admin();

    // Ping the server
    const pingResult = await adminDb.ping();
    console.log('✅ Database ping successful');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Port: ${conn.connection.port}`);
    console.log(`   Name: ${conn.connection.name}`);
    console.log('');

    // Step 3: List existing databases
    console.log('⏳ Step 3: Listing existing databases...');
    const databases = await adminDb.listDatabases();
    console.log(`✅ Found ${databases.databases.length} database(s):`);
    databases.databases.forEach((db) => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('');

    // Step 4: List collections in current database
    console.log('⏳ Step 4: Listing collections in current database...');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('⚠️  No collections found. The database is empty.');
      console.log('   Collections will be created when you first create documents.\n');
    } else {
      console.log(`✅ Found ${collections.length} collection(s):`);
      for (const collection of collections) {
        const collName = collection.name;
        const collStats = await db.collection(collName).stats();
        console.log(`   - ${collName}`);
        console.log(`     • Documents: ${collStats.count}`);
        console.log(`     • Size: ${(collStats.size / 1024).toFixed(2)} KB`);
      }
      console.log('');
    }

    // Step 5: Test write operation
    console.log('⏳ Step 5: Testing write operation...');
    const testCollection = db.collection('_connection_test');
    const testDoc = {
      testId: `test_${Date.now()}`,
      timestamp: new Date(),
      status: 'connection check',
    };

    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Write operation successful');
    console.log(`   Document ID: ${insertResult.insertedId}`);

    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('   Test document cleaned up');
    console.log('');

    // Final summary
    console.log('========================================');
    console.log('✅ ALL CHECKS PASSED!');
    console.log('========================================');
    console.log('\n✨ Your MongoDB Atlas database is ready to use!\n');

    // Connection details
    console.log('Connection Details:');
    console.log(`- Database: ${conn.connection.name}`);
    console.log(`- Collections: ${collections.length}`);
    console.log(`- Connection Status: Connected`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error('Error Details:');
    console.error(`- Type: ${error.name}`);
    console.error(`- Message: ${error.message}`);
    console.error('');

    // Provide helpful troubleshooting steps
    console.log('🔧 Troubleshooting Steps:');
    console.log('');

    if (error.message.includes('authentication failed')) {
      console.log('1. Check your MongoDB credentials:');
      console.log('   - Username and password are correct');
      console.log('   - Special characters in password are properly URL-encoded');
      console.log('   - User has permission to access the database');
      console.log('');
      console.log('2. Verify MONGODB_URI format:');
      console.log('   mongodb+srv://username:password@cluster.mongodb.net/databasename');
      console.log('');
    }

    if (error.message.includes('getaddrinfo') || error.message.includes('ECONNREFUSED')) {
      console.log('1. Check your cluster is running:');
      console.log('   - Visit MongoDB Atlas dashboard');
      console.log('   - Ensure cluster is not paused');
      console.log('   - Verify cluster name in connection string');
      console.log('');
      console.log('2. Check IP whitelist:');
      console.log('   - Go to Network Access in Atlas');
      console.log('   - Add your IP address (or use 0.0.0.0/0 for testing)');
      console.log('');
    }

    if (error.message.includes('MONGODB_URI')) {
      console.log('1. Set MONGODB_URI environment variable:');
      console.log('   - Create .env file in server/ directory');
      console.log('   - Add: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname');
      console.log('');
    }

    console.log('3. Common solutions:');
    console.log('   - Restart the application');
    console.log('   - Check network connectivity');
    console.log('   - Verify firewall settings');
    console.log('   - Check MongoDB Atlas cluster status');
    console.log('');

    console.log('Full error:');
    console.error(error);
    console.log('');

    process.exit(1);
  }
}

// Run the checker
checkMongoDBConnection();
