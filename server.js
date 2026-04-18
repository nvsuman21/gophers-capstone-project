const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { ClerkExpressRequireAuth, ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

// ========= Import Controllers =========
const BaseController = require('./controllers/BaseController');
const TeamController = require('./controllers/TeamController');

// ========= Import Routers =========
const BaseRouter = require('./routes/BaseRouter');
const TeamRouter = require('./routes/TeamRoutes');
const createShareRouter = require("./routes/ShareRoutes");

// ========= Import Models =========
const BaseModel = require('./models/BaseModel');
const TeamModel = require('./models/TeamModel');

// Load environment variables
dotenv.config();

// Create express app
const app = express();

// Enables req.auth early
app.use(ClerkExpressWithAuth());

// Middleware to log the Authorization token
app.use((req, res, next) => {
  console.log("Authorization Header:", req.headers['authorization']);
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded images
const imagesDirectory = path.join(__dirname, '..', 'images');
if (!fs.existsSync(imagesDirectory)) {
  fs.mkdirSync(imagesDirectory, { recursive: true });
}
app.use('/images', express.static(imagesDirectory));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Feed Portal API' });
});

// Protected route example
app.get('/protected', ClerkExpressRequireAuth(), (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  res.json({
    message: 'This is a protected route',
    user: {
      id: req.auth.userId,
      username: req.auth.username || 'Anonymous'
    }
  });
});

// ========= Instantiate =========
const teamModel = new TeamModel();
const teamController = new TeamController(teamModel);
const teamRouter = new TeamRouter(teamController);

const UserRepository = require('./user/UserRepository');
const UserService = require('./user/UserService');
const UserController = require('./user/UserController');

//DI UserDomain + Instantiation
const userRepo = new UserRepository();
const userService = new UserService(userRepo);
const userController = new UserController(userService);

const UserRouter = require('./user/UserRouter');
const userRouter = new UserRouter(userController);

// ========= Mount Routers =========
app.use('/api/user', userRouter.getRouter());
app.use('/api/team', teamRouter.getRouter());
app.use('/api/feed', ClerkExpressRequireAuth(), require('./feed/FeedRoutes'));
app.use('/api/ingredient', ClerkExpressRequireAuth(), require('./ingredient/IngredientRoutes'));
app.use('/api/species', ClerkExpressRequireAuth(), require('./species/SpeciesRoutes'));
app.use('/api/tags', ClerkExpressRequireAuth(), require('./tag/TagRoutes'));
app.use('/api/ratings', ClerkExpressRequireAuth(), require('./routes/RatingRoutes'));
app.use('/api/log', ClerkExpressRequireAuth(), require('./routes/LogRoutes'));
app.use('/api/dashboard', ClerkExpressRequireAuth(), require('./routes/AnalyticsRoutes'));
app.use("/api/feed-shares", createShareRouter("feed"));
app.use("/api/ingredient-shares", createShareRouter("ingredient"));
app.use("/api/species-shares", createShareRouter("species"));
app.use('/api/recycle',ClerkExpressRequireAuth(),require('./routes/RecycleRoutes'));


// ========= Error Handler =========
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========= Start Server =========
const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
