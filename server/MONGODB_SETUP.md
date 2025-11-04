# MongoDB Atlas Database Connection Guide

## Quick Check

To verify your MongoDB Atlas database connection, run:

```bash
cd server
npm run check-db
```

## What the Checker Does

The MongoDB connection checker performs the following verification steps:

1. **Connection Test**: Verifies connectivity to your MongoDB Atlas cluster
2. **Cluster Info**: Retrieves host, port, and database name
3. **Database List**: Lists all databases in your MongoDB instance
4. **Collections**: Shows existing collections and document counts
5. **Write Test**: Performs a test write operation to ensure read/write permissions
6. **Cleanup**: Removes test data

## Setting Up MongoDB Atlas

### Step 1: Create a MongoDB Atlas Account
- Go to https://www.mongodb.com/cloud/atlas
- Sign up for a free account
- Create an organization and project

### Step 2: Create a Cluster
- Click "Create" or "Build a Database"
- Choose M0 (free tier) or appropriate plan
- Select your preferred region and cloud provider
- Click "Create Cluster"

### Step 3: Set Up Network Access
- Go to **Network Access** in the left menu
- Click **Add IP Address**
- For development: Add `0.0.0.0/0` (allows any IP)
- For production: Add your specific server IP address

### Step 4: Create Database User
- Go to **Database Access** in the left menu
- Click **Add new database user**
- Set username and auto-generate password
- Save the credentials securely

### Step 5: Get Connection String
- Go to **Clusters** and click **Connect**
- Choose **Drivers** and select **Node.js**
- Copy the connection string
- Replace `<password>` with your actual password

### Step 6: Configure Environment Variables

Create a `.env` file in the `server/` directory:

```env
MONGODB_URI=mongodb+srv://username:password@clustername.mongodb.net/clouddeck?retryWrites=true&w=majority
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_here
```

## MongoDB URI Format

**Atlas Connection String:**
```
mongodb+srv://username:password@cluster-name.mongodb.net/database-name
```

**Local Connection String:**
```
mongodb://localhost:27017/clouddeck
```

## Troubleshooting

### Authentication Failed
- Verify username and password are correct
- Check that special characters in password are properly URL-encoded
- Confirm user has database access privileges

### Connection Timeout
- Check if cluster is running (not paused)
- Verify IP address is whitelisted in Network Access
- Check network connectivity to MongoDB Atlas

### No Collections
- New databases are empty until you create documents
- Collections are automatically created when you insert your first document

## Automatic Database Creation

The application will automatically create collections and indexes when:
- You first save a document of a specific model
- The application runs migrations (if implemented)
- Models are initialized

## Example Collections

Depending on your models, you might see:

- `users` - User accounts
- `projects` - Projects
- `deployments` - Deployment records
- `billingcontacts` - Billing contacts
- `subscriptions` - Subscription records
- `invoices` - Invoice documents
- And more...

## Monitoring Database

You can monitor your database from MongoDB Atlas:

1. Go to **Databases** in the left menu
2. Click on your cluster
3. Navigate to **Collections** tab
4. View documents, add indexes, and manage data

## Performance Considerations

### For Development:
- Use M0 (free tier) with shared resources
- Connection pooling is handled by Mongoose
- Good enough for testing and development

### For Production:
- Use at least M10 (dedicated cluster)
- Configure read replicas for high availability
- Enable backups and encryption
- Set up performance monitoring
- Use dedicated IP address access

## Useful Commands

Check connection in Node.js REPL:
```bash
cd server
node

const mongoose = require('mongoose');
await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected!');
```

## Need Help?

- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Mongoose Docs: https://mongoosejs.com/
- Connection String Builder: https://www.mongodb.com/docs/manual/reference/connection-string/
