# MyPantry

A modern pantry management and cooking community app. Upload receipts, discover recipes, and collaborate with friends to create unique dishes!

Won Best Beginner Hack at Columbia DivHacks 2025!

## Demo

[![Video Demo](assets/image.png)](https://youtu.be/0AoogzEljQc)


## Tech Stack

### Frontend
- Next.js 15.5.4
- TypeScript
- Tailwind CSS
- Framer Motion

### Backend
- Node.js
- Express.js
- Prisma
- SQLite
- Tavily

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/swang484/pantry.git
cd pantry
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
```

4. **Set up the database**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run seed
```

5. **Configure environment variables**
```bash
# Copy example environment file
cp env.example .env

# Edit .env with your configuration
```

6. **Start the development servers**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

7. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)



