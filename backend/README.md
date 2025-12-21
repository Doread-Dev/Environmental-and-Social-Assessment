# Express + MongoDB Backend

A production-ready Express.js backend with MongoDB using Mongoose, featuring centralized error handling, request validation, and a clean architecture.

## Features

- ✅ Express.js web framework
- ✅ MongoDB with Mongoose ODM
- ✅ Centralized error handling with custom ApiError class
- ✅ Async handler wrapper for cleaner async/await code
- ✅ Request validation with Joi
- ✅ Security middleware (Helmet, CORS)
- ✅ Request logging with Morgan
- ✅ Environment variable management with dotenv
- ✅ Clean folder structure following best practices

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/your-database-name
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Project Structure

```
src/
├── config/          # Configuration files
│   └── database.js  # MongoDB connection
├── db/              # Database utilities (if needed)
├── models/          # Mongoose models
│   └── User.js
├── routes/          # API routes
│   ├── index.js
│   └── userRoutes.js
├── controllers/     # Route controllers
│   └── userController.js
├── services/        # Business logic
│   └── userService.js
├── middlewares/     # Custom middlewares
│   ├── errorHandler.js
│   └── validate.js
├── validators/      # Joi validation schemas
│   └── userValidator.js
├── utils/           # Utility functions
│   ├── ApiError.js
│   └── asyncHandler.js
├── app.js           # Express app configuration
└── server.js        # Server entry point
```

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create a new user
- `PUT /api/v1/users/:id` - Update a user
- `DELETE /api/v1/users/:id` - Delete a user

## Example API Request

### Create a User
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }'
```

### Get All Users
```bash
curl http://localhost:3000/api/v1/users
```

## Error Handling

The application uses a centralized error handling system:

- Custom `ApiError` class for consistent error responses
- Automatic error formatting with stack traces in development
- Proper HTTP status codes
- User-friendly error messages

## Validation

Request validation is handled using Joi schemas. Invalid requests will return a 400 status code with detailed error messages.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `MONGODB_URI` - MongoDB connection string

## Security

- Helmet.js for security headers
- CORS enabled for cross-origin requests
- Input validation and sanitization
- Environment variable protection

## License

ISC

