# Pantry Backend API

Express.js backend for the Pantry app with minimal dependencies.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Copy environment file:
```bash
cp env.example .env
```

3. Start development server:
```bash
npm run dev
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Pantry
- `GET /api/pantry` - Get all pantry items
- `GET /api/pantry/:id` - Get specific pantry item
- `POST /api/pantry` - Add new pantry item
- `PUT /api/pantry/:id` - Update pantry item
- `DELETE /api/pantry/:id` - Delete pantry item
- `GET /api/pantry/stats` - Get pantry statistics

### Cooks (formerly Posts)
- `GET /api/cooks` - Get all cooks (feed)
- `GET /api/cooks/:id` - Get specific cook
- `POST /api/cooks` - Create new cook
- `PUT /api/cooks/:id` - Update cook
- `DELETE /api/cooks/:id` - Delete cook
- `POST /api/cooks/:id/like` - Like a cook
- `POST /api/cooks/:id/comment` - Add comment to cook

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (mock)
- `GET /api/auth/users` - Get all users (for testing)

## Example Usage

### Get Pantry Items
```bash
curl http://localhost:5000/api/pantry
```

### Add Pantry Item
```bash
curl -X POST http://localhost:5000/api/pantry \
  -H "Content-Type: application/json" \
  -d '{"name": "Milk", "quantity": "1 gallon", "expiry": "2024-01-25"}'
```

### Get Cooks
```bash
curl http://localhost:5000/api/cooks
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "username": "newuser", "password": "password123"}'
```

## Development

- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start production server

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

## Notes

- Currently uses in-memory storage (data resets on restart)
- No real authentication (mock implementation)
- CORS enabled for frontend connection
- Error handling included
