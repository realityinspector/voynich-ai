import { Request, Response, Router } from 'express';
import { isAuthenticated } from '../auth';
import { storage } from '../storage';
import Stripe from 'stripe';

const router = Router();

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Credit packages available for purchase
const CREDIT_PACKAGES = [
  { id: 'basic', name: '20 Credits', credits: 20, price: 500 }, // $5.00
  { id: 'standard', name: '50 Credits', credits: 50, price: 1000 }, // $10.00
  { id: 'premium', name: '120 Credits', credits: 120, price: 2000 }, // $20.00
];

// Get available credit packages
router.get('/packages', isAuthenticated, (req, res) => {
  res.json({ packages: CREDIT_PACKAGES });
});

// Create a checkout session for credit purchase
router.post('/create-checkout-session', isAuthenticated, async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user!.id;
    
    // Find the selected package
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      return res.status(400).json({ message: 'Invalid package selected' });
    }
    
    // Get user data
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create Stripe customer if not exists
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: userId.toString()
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Update user with Stripe customer ID
      await storage.updateUserStripeInfo(userId, { 
        stripeCustomerId: customer.id
      });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.credits} credits for Voynich Manuscript Analysis Platform`
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId.toString(),
        packageId: packageId,
        credits: selectedPackage.credits.toString()
      },
      success_url: `${req.headers.origin}/credits?success=true`,
      cancel_url: `${req.headers.origin}/credits?canceled=true`,
    });
    
    res.json({ url: session.url });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ message: 'Stripe webhook secret not configured' });
  }
  
  let event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      signature as string,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Add credits to user
    const { userId, credits } = session.metadata;
    if (userId && credits) {
      try {
        const creditsToAdd = parseInt(credits);
        await storage.addUserCredits(
          parseInt(userId), 
          creditsToAdd, 
          'purchase', 
          `Purchased ${creditsToAdd} credits`, 
          session.payment_intent as string
        );
        
        console.log(`Added ${creditsToAdd} credits to user ${userId}`);
      } catch (error) {
        console.error('Error adding credits to user:', error);
      }
    }
  }
  
  res.json({ received: true });
});

export default router;
