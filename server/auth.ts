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
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
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
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username or password' });
        }

        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: 'Incorrect username or password' });
        }

        return done(null, user);
      } catch (error) {
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
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
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
        role: isFirstUser ? 'admin' : 'user',
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
