import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth, RegisterCredentials } from '@/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Logo from '@/components/Logo';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  institution: z.string().optional(),
});

export default function Register() {
  const { register, registerIsLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<RegisterCredentials>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      institution: '',
    },
  });
  
  const onSubmit = async (values: RegisterCredentials) => {
    setError(null);
    try {
      await register(values);
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Logo size={60} />
          </div>
          <CardTitle className="text-2xl font-heading text-center">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center">
            Join the Voynich Manuscript research community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email address" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Create a password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="University or research organization" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={registerIsLoading}
              >
                {registerIsLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-neutral-600">
            Already have an account? <Link href="/login">
              <a className="text-primary font-medium hover:underline">Sign in</a>
            </Link>
          </div>
          <div className="text-xs text-center text-neutral-500">
            By registering, you agree to the platform's research ethics guidelines and data sharing policies.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
