# AI Travel Planner (TripSage)

AI Travel Planner is a full-stack MERN application that generates personalized itineraries using OpenRouter, stores trips in MongoDB, and provides extra planning tools like trip history, cost estimation, weather snapshots, hotel and restaurant suggestions, map preview, and PDF export.

## Features

### Authentication and profile
- Register and login with JWT-based authentication.
- Gmail-only account validation for signup and login.
- Protected APIs for planning and trip history.
- Profile menu with current-user details and profile photo update.

### AI itinerary generation
- Generate a day-wise itinerary from destination, budget, interests, and trip duration.
- Prompt includes overview, daily time blocks, food options, logistics, budget breakdown, and packing tips.
- Duplicate detection via hashed input to reuse an existing plan when the same request is made.

### Trip management
- Save generated itineraries to MongoDB.
- View trip history for the logged-in user.
- Deduplicate repeated history entries.
- Delete plans from history.
- Edit and regenerate a plan from an existing trip context.

### Smart planning add-ons
- Cost Estimator reads itinerary text and estimates expected spend.
- Travel Insights includes:
	- Weather snapshot (Open-Meteo)
	- Restaurant suggestions (OpenStreetMap Nominatim)
	- Hotel suggestions (OpenStreetMap Nominatim)
	- Embedded map preview and full-map link
- Download itinerary as PDF.

### UI and navigation
- React Router based pages for home, login, register, and planner.
- Planner tabs for Home, New Plan, and My Trips.
- Responsive custom styling with separate component-level CSS files.

## Tech stack

### Frontend
- React 19
- React Router
- Axios
- jsPDF
- CSS

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JSON Web Token
- bcryptjs

### AI and external data APIs
- OpenRouter Chat Completions API
	- Current model in code: openai/gpt-3.5-turbo
- Open-Meteo API
- OpenStreetMap Nominatim API

## Project structure

```text
ai-travel-planner/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── CostEstimator.js
│       │   ├── HomePage.js
│       │   ├── Itinerary.js
│       │   ├── LoginForm.js
│       │   ├── RegisterForm.js
│       │   ├── TravelForm.js
│       │   ├── TravelInsights.js
│       │   └── TripHistory.js
│       ├── img/
│       ├── styles/
│       ├── App.js
│       └── index.js
├── server/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── plannerController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Plan.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── planner.js
│   └── index.js
└── README.md
```

## API overview

Base URL: http://localhost:5000

### Auth routes
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me (protected)
- PATCH /api/auth/profile-photo (protected)

### Planner routes
- POST /api/plan (protected)
- GET /api/plans (protected)
- DELETE /api/plans/:id (protected)

## Environment variables

Create a file at server/.env with:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENROUTER_API_KEY=your_openrouter_api_key
```

## Local setup

### 1. Clone repository

```bash
git clone https://github.com/17kdeekshitha/Ai_travel_planner.git
cd ai-travel-planner
```

### 2. Install dependencies

```bash
cd server
npm install
cd ../client
npm install
```

### 3. Run backend

From server directory:

```bash
node index.js
```

### 4. Run frontend

From client directory:

```bash
npm start
```

Frontend runs on http://localhost:3000 and backend runs on http://localhost:5000.





