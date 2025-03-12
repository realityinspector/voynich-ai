import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { compare, hash } from 'bcrypt';
import { storage } from './storage';
import { User } from '@shared/schema';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { randomBytes } from 'crypto';

const MemoryStore = createMemoryStore(session);

// Express session middleware setup
export function setupSession(app: express.Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to false for development
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        sameSite: 'lax',
      },
      store: new MemoryStore({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );
}

// Setup passport authentication
export function setupAuth(app: express.Express) {
  // Initialize passport and restore auth state if available
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for username: ${username}`);
        
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`User ${username} not found in database`);
          return done(null, false, { message: 'Incorrect username or password' });
        }
        
        console.log(`User found: ${user.username}, attempting password verification`);
        console.log(`Password hash from DB: ${user.password.substring(0, 10)}...`);
        
        // Check if password is present
        if (!password) {
          console.log('Empty password provided');
          return done(null, false, { message: 'Password is required' });
        }

        // Try/catch around bcrypt compare to prevent crashes on invalid hash
        try {
          const isPasswordValid = await compare(password, user.password);
          console.log(`Password valid: ${isPasswordValid}`);
          
          if (!isPasswordValid) {
            return done(null, false, { message: 'Incorrect username or password' });
          }
        } catch (bcryptError) {
          console.error('Bcrypt comparison error:', bcryptError);
          return done(null, false, { message: 'Authentication error' });
        }

        console.log(`Authentication successful for ${username}`);
        return done(null, user);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    })
  );

  // Define how user objects are serialized/deserialized for sessions
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Authentication routes
export function setupAuthRoutes(app: express.Express) {
  // Login route
  app.post('/api/auth/login', (req, res, next) => {
    console.log('Login endpoint called:', req.body.username);
    
    // Input validation
    if (!req.body.username || !req.body.password) {
      console.log('Missing credentials:', { 
        username: !!req.body.username, 
        password: !!req.body.password 
      });
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Passport authentication error:', err);
        return next(err);
      }
      
      if (!user) {
        console.log('Authentication failed:', info.message);
        return res.status(401).json({ message: info.message });
      }
      
      console.log('Authentication successful for user:', user.username);
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Session login error:', loginErr);
          return next(loginErr);
        }
        
        console.log('User session created successfully');
        
        // Return user info without sensitive data
        const { password, ...safeUser } = user;
        return res.json({ user: safeUser });
      });
    })(req, res, next);
  });

  // Register route
  app.post('/api/auth/register', async (req, res, next) => {
    try {
      const { username, email, password, institution } = req.body;
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      // Hash password
      const hashedPassword = await hash(password, 10);
      
      // Check if this is the first user (to make them admin)
      const isFirstUser = !(await storage.hasAnyUsers());
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        institution,
        role: isFirstUser ? 'admin' : 'researcher', // Default to researcher role
        credits: 12 // Start with 12 free credits
      });
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Return user info without sensitive data
        const { password, ...safeUser } = user;
        return res.json({ user: safeUser });
      });
    } catch (error) {
      next(error);
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Session check route
  app.get('/api/auth/session', (req, res) => {
    if (req.isAuthenticated()) {
      const { password, ...safeUser } = req.user as User;
      return res.json({ user: safeUser });
    }
    res.status(401).json({ message: 'Not authenticated' });
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Middleware to check if user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as User).role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden' });
}
