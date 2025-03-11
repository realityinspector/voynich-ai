import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth, LoginCredentials } from '@/hooks/useAuth';
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

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login, loginIsLoading } = useAuth();
  const [isInvalid, setIsInvalid] = useState(false);
  
  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  const onSubmit = async (values: LoginCredentials) => {
    setIsInvalid(false);
    try {
      await login(values);
    } catch (error) {
      setIsInvalid(true);
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
            Voynich Manuscript Analysis Platform
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the platform
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
                      <Input placeholder="Enter your username" {...field} />
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
                        placeholder="Enter your password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isInvalid && (
                <div className="text-sm text-destructive">
                  Invalid username or password.
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginIsLoading}
              >
                {loginIsLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-neutral-600">
            Don't have an account? <Link href="/register">
              <a className="text-primary font-medium hover:underline">Register</a>
            </Link>
          </div>
          <div className="text-xs text-center text-neutral-500">
            By signing in, you agree to the platform's research and collaboration guidelines.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
