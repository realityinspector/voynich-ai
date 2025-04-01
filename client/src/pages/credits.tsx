import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest, fetchApiConfig } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  CreditCard, 
  Check, 
  RefreshCw, 
  Zap, 
  Clock, 
  FileText, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with async configuration
const getStripe = async () => {
  try {
    const config = await fetchApiConfig();
    const stripePublicKey = config.STRIPE_PUBLIC_KEY;
    
    if (!stripePublicKey) {
      console.warn('Stripe public key is not set. Payments will not work.');
      return null;
    }
    
    return await loadStripe(stripePublicKey);
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
};

export default function Credits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripe, setStripe] = useState(null);
  
  // Initialize Stripe
  useEffect(() => {
    getStripe().then(stripeInstance => {
      setStripe(stripeInstance);
    });
  }, []);
  
  // Fetch user's credits
  const { data: creditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ['/api/ai/credits'],
    retry: false,
  });
  
  // Fetch available packages
  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['/api/payments/packages'],
    retry: false,
  });
  
  // Get credits and packages
  const credits = creditsData?.credits || 0;
  const packages = packagesData?.packages || [
    { id: 'basic', name: '20 Credits', credits: 20, price: 500 },
    { id: 'standard', name: '50 Credits', credits: 50, price: 1000 },
    { id: 'premium', name: '120 Credits', credits: 120, price: 2000 }
  ];
  
  // Handle checkout
  const handleCheckout = async (packageId: string) => {
    if (!packageId) {
      toast({
        title: "Please select a package",
        description: "You need to select a credit package to proceed.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await apiRequest('POST', '/api/payments/create-checkout-session', {
        packageId
      });
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Unable to initiate checkout",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };
  
  // Check for success or canceled query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success) {
      toast({
        title: "Payment successful",
        description: "Thank you! Your credits have been added to your account.",
      });
      
      // Clean URL by removing query parameters
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, document.title, url.toString());
    } else if (canceled) {
      toast({
        title: "Payment canceled",
        description: "Your payment was canceled. No credits have been charged.",
        variant: "destructive",
      });
      
      // Clean URL by removing query parameters
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [toast]);
  
  // Format price from cents to dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Credit Management</h1>
        <p className="text-neutral-600">
          Purchase and manage credits for AI analysis on the Voynich Manuscript.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Information */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Your Credits</CardTitle>
              <CardDescription>
                Credits available for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="py-6 text-center">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 mb-4">
                  <span className="text-3xl font-bold text-primary">
                    {creditsLoading ? (
                      <RefreshCw className="h-8 w-8 animate-spin" />
                    ) : (
                      credits
                    )}
                  </span>
                </div>
                <h3 className="text-xl font-medium">Available Credits</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Use credits for AI analysis and advanced features
                </p>
              </div>
              
              <div className="space-y-4 mt-2">
                <div className="border-t border-neutral-200 pt-4">
                  <h4 className="text-sm font-medium mb-2">What can you do with credits?</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                      <span className="text-sm">Run AI analysis on manuscript pages</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                      <span className="text-sm">Access advanced symbol extraction features</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                      <span className="text-sm">Generate comprehensive reports</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-neutral-200 pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => document.getElementById('packages-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Zap className="mr-2 h-4 w-4" />
                Get More Credits
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Purchase Options */}
        <div className="lg:col-span-2">
          <Card id="packages-section">
            <CardHeader>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>
                Select a credit package that suits your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map(pkg => (
                  <Card 
                    key={pkg.id} 
                    className={`cursor-pointer border-2 transition-colors ${
                      selectedPackage === pkg.id ? 'border-primary' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        {pkg.id === 'premium' && (
                          <Badge className="bg-secondary text-primary-foreground">Best Value</Badge>
                        )}
                      </div>
                      <CardDescription>
                        {pkg.credits} analysis credits
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-1">
                        {formatPrice(pkg.price)}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {(pkg.price / pkg.credits / 100).toFixed(2)} per credit
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <Button 
                        variant={selectedPackage === pkg.id ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedPackage(pkg.id)}
                      >
                        {selectedPackage === pkg.id ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Selected
                          </>
                        ) : (
                          'Select'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button 
                  size="lg" 
                  onClick={() => handleCheckout(selectedPackage)}
                  disabled={!selectedPackage || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-4 text-center text-sm text-neutral-500">
                <div className="flex justify-center gap-4 mt-2">
                  <span className="flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    Secure payment
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Instant delivery
                  </span>
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Receipts available
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Your credit purchases and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="purchases">
                <TabsList>
                  <TabsTrigger value="purchases">Purchases</TabsTrigger>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                </TabsList>
                <TabsContent value="purchases" className="mt-4">
                  <div className="text-center py-8">
                    <p className="text-neutral-500">
                      Your credit purchase history will appear here.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="usage" className="mt-4">
                  <div className="text-center py-8">
                    <p className="text-neutral-500">
                      Your credit usage history will appear here.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* FAQ Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Common questions about credits and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">What are credits used for?</h3>
            <p className="text-neutral-600 text-sm">
              Credits are consumed when using AI analysis features like translation attempts, 
              pattern analysis, and custom prompt analysis of manuscript pages. Each analysis 
              typically costs 1 credit, with more advanced models costing more.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">How do I get more credits?</h3>
            <p className="text-neutral-600 text-sm">
              You can purchase credit packages through our secure payment system. 
              New accounts start with 12 free credits. Special bonuses may also be 
              awarded for significant research contributions.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Do credits expire?</h3>
            <p className="text-neutral-600 text-sm">
              Credits do not expire and remain in your account until used. There is 
              no time limit for using your purchased credits.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Can I get a refund?</h3>
            <p className="text-neutral-600 text-sm">
              Unused credit packages purchased within the last 30 days may be eligible 
              for a refund. Please contact support with your order details to request 
              a refund for unused credits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
