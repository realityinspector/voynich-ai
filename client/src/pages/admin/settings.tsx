import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Settings, 
  Database, 
  Users, 
  CreditCard, 
  Key, 
  Bell, 
  RefreshCw, 
  Save,
  ShieldCheck,
  UserCog2,
  Route
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function SettingsPage() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  
  // Initialize form state
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Voynich Manuscript Analysis Platform',
    description: 'A collaborative research platform for analyzing the Voynich Manuscript',
    contactEmail: 'admin@example.com',
    defaultCredits: '12',
    maxUploadSize: '20',
    enablePublicGallery: true,
    enableApiAccess: true,
  });
  
  const [aiSettings, setAiSettings] = useState({
    defaultModel: 'mixtral-8x7b-instruct',
    defaultTemperature: '0.7',
    defaultMaxTokens: '500',
    togetherApiKey: '••••••••••••••••',
    creditCostMultiplier: '1',
  });
  
  // Mock mutation for saving settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      // This would be an actual API request in implementation
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your settings have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Handle general settings form submission
  const handleSaveGeneralSettings = () => {
    saveSettingsMutation.mutate(generalSettings);
  };
  
  // Handle AI settings form submission
  const handleSaveAISettings = () => {
    saveSettingsMutation.mutate(aiSettings);
  };
  
  // If user is not admin, redirect or show error
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2 text-destructive">Access Denied</h2>
            <p>You need administrator privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Admin Settings</h1>
        <p className="text-neutral-600">
          Configure platform settings and manage system configurations.
        </p>
      </div>
      
      <Tabs defaultValue="general">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64 space-y-1">
            <TabsList className="flex flex-col h-auto bg-transparent items-start p-0 w-full">
              <TabsTrigger 
                value="general" 
                className="w-full justify-start px-3 py-2 data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
              >
                <Settings className="mr-2 h-4 w-4" />
                General Settings
              </TabsTrigger>
              <TabsTrigger 
                value="ai" 
                className="w-full justify-start px-3 py-2 data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                AI & Integration
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="w-full justify-start px-3 py-2 data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
              >
                <UserCog2 className="mr-2 h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger 
                value="billing" 
                className="w-full justify-start px-3 py-2 data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Billing & Credits
              </TabsTrigger>
              <TabsTrigger 
                value="api" 
                className="w-full justify-start px-3 py-2 data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
              >
                <Route className="mr-2 h-4 w-4" />
                API Configuration
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1">
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Basic platform configuration and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input 
                      id="site-name" 
                      value={generalSettings.siteName}
                      onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Site Description</Label>
                    <Input 
                      id="description" 
                      value={generalSettings.description}
                      onChange={(e) => setGeneralSettings({...generalSettings, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input 
                      id="contact-email" 
                      type="email" 
                      value={generalSettings.contactEmail}
                      onChange={(e) => setGeneralSettings({...generalSettings, contactEmail: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-credits">Default User Credits</Label>
                      <Input 
                        id="default-credits" 
                        type="number" 
                        value={generalSettings.defaultCredits}
                        onChange={(e) => setGeneralSettings({...generalSettings, defaultCredits: e.target.value})}
                      />
                      <p className="text-xs text-neutral-500">
                        Credits assigned to new users upon registration
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max-upload">Max Upload Size (MB)</Label>
                      <Input 
                        id="max-upload" 
                        type="number" 
                        value={generalSettings.maxUploadSize}
                        onChange={(e) => setGeneralSettings({...generalSettings, maxUploadSize: e.target.value})}
                      />
                      <p className="text-xs text-neutral-500">
                        Maximum file size for manuscript page uploads
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="public-gallery" className="block mb-1">Public Gallery</Label>
                        <p className="text-xs text-neutral-500">
                          Allow publicly visible analysis results
                        </p>
                      </div>
                      <Switch 
                        id="public-gallery" 
                        checked={generalSettings.enablePublicGallery}
                        onCheckedChange={(checked) => setGeneralSettings({...generalSettings, enablePublicGallery: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="api-access" className="block mb-1">API Access</Label>
                        <p className="text-xs text-neutral-500">
                          Allow users to create and use API keys
                        </p>
                      </div>
                      <Switch 
                        id="api-access" 
                        checked={generalSettings.enableApiAccess}
                        onCheckedChange={(checked) => setGeneralSettings({...generalSettings, enableApiAccess: checked})}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={handleSaveGeneralSettings} 
                    disabled={saveSettingsMutation.isPending}
                  >
                    {saveSettingsMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="ai">
              <Card>
                <CardHeader>
                  <CardTitle>AI & Integration Settings</CardTitle>
                  <CardDescription>
                    Configure AI models and external service integrations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-model">Default AI Model</Label>
                    <Select 
                      value={aiSettings.defaultModel}
                      onValueChange={(value) => setAiSettings({...aiSettings, defaultModel: value})}
                    >
                      <SelectTrigger id="default-model">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mixtral-8x7b-instruct">Mixtral 8x7B</SelectItem>
                        <SelectItem value="llama-2-70b-chat">Llama 2 70B</SelectItem>
                        <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-temperature">Default Temperature</Label>
                      <Input 
                        id="default-temperature" 
                        type="number" 
                        step="0.1" 
                        min="0"
                        max="1"
                        value={aiSettings.defaultTemperature}
                        onChange={(e) => setAiSettings({...aiSettings, defaultTemperature: e.target.value})}
                      />
                      <p className="text-xs text-neutral-500">
                        Controls randomness in model responses (0-1)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="default-tokens">Default Max Tokens</Label>
                      <Input 
                        id="default-tokens" 
                        type="number" 
                        value={aiSettings.defaultMaxTokens}
                        onChange={(e) => setAiSettings({...aiSettings, defaultMaxTokens: e.target.value})}
                      />
                      <p className="text-xs text-neutral-500">
                        Maximum response length in tokens
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="together-api-key">Together AI API Key</Label>
                    <div className="flex">
                      <Input 
                        id="together-api-key" 
                        type="password" 
                        value={aiSettings.togetherApiKey}
                        onChange={(e) => setAiSettings({...aiSettings, togetherApiKey: e.target.value})}
                        className="font-mono"
                      />
                      <Button 
                        variant="outline" 
                        className="ml-2" 
                        onClick={() => {
                          // Would show/edit the API key in implementation
                          toast({
                            title: "API Key",
                            description: "API key editing feature would be implemented here",
                          });
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Required for AI analysis functionality
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="credit-multiplier">Credit Cost Multiplier</Label>
                    <Input 
                      id="credit-multiplier" 
                      type="number" 
                      step="0.1" 
                      min="0.1"
                      value={aiSettings.creditCostMultiplier}
                      onChange={(e) => setAiSettings({...aiSettings, creditCostMultiplier: e.target.value})}
                    />
                    <p className="text-xs text-neutral-500">
                      Adjust the credit cost for all AI operations (1.0 = normal rate)
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={handleSaveAISettings} 
                    disabled={saveSettingsMutation.isPending}
                  >
                    {saveSettingsMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage platform users and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto text-neutral-300" />
                    <p className="mt-2 text-neutral-500">User management features will be implemented here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Credits</CardTitle>
                  <CardDescription>
                    Manage payment settings and credit packages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <CreditCard className="h-8 w-8 mx-auto text-neutral-300" />
                    <p className="mt-2 text-neutral-500">Billing management features will be implemented here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="api">
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>
                    Configure API endpoints and access control
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Route className="h-8 w-8 mx-auto text-neutral-300" />
                    <p className="mt-2 text-neutral-500">API configuration features will be implemented here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
