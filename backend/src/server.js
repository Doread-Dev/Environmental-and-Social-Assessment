require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 3000;

// Validate required env vars before starting (security: fail fast in production)
function validateEnv() {
  const missing = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
    missing.push('JWT_SECRET (must be set and at least 32 characters)');
  }
  if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.trim()) {
    missing.push('MONGODB_URI');
  }
  if (missing.length > 0) {
    console.error('Missing or invalid required environment variables:', missing.join(', '));
    process.exit(1);
  }
}
validateEnv();

// Connect to database, then start server (so we don't accept requests before DB is ready)
(async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err.message);
    server.close(() => process.exit(1));
  });

  // Handle SIGTERM: close server then MongoDB for clean shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      mongoose.connection.close()
        .then(() => process.exit(0))
        .catch(() => process.exit(0));
    });
  });
})();
