import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyBlock, atomOneLight } from 'react-code-blocks';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Code, Copy, Key, Eye, EyeOff, RefreshCcw, PlayCircle, PlusCircle, Trash2 } from 'lucide-react';

export default function ApiDocs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKeyName, setApiKeyName] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  
  // Fetch API keys only if user is authenticated
  const { data: keysData, isLoading: keysLoading, refetch: refetchKeys } = useQuery({
    queryKey: ['/api/api-keys'],
    retry: false,
    enabled: !!user, // Only run query if user is authenticated
  });
  
  const apiKeys = keysData?.keys || [];
  
  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest('POST', '/api/api-keys', { name });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setNewApiKey(data.key);
      refetchKeys();
      toast({
        title: "API Key Created",
        description: "Your new API key has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create API key",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      return apiRequest('DELETE', `/api/api-keys/${keyId}`);
    },
    onSuccess: async () => {
      refetchKeys();
      toast({
        title: "API Key Deleted",
        description: "Your API key has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete API key",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Create a new API key
  const handleCreateApiKey = () => {
    if (!apiKeyName.trim()) {
      toast({
        title: "Required Field",
        description: "Please enter a name for your API key.",
        variant: "destructive",
      });
      return;
    }
    
    createKeyMutation.mutate(apiKeyName);
  };
  
  // Delete an API key
  const handleDeleteApiKey = (keyId: number) => {
    deleteKeyMutation.mutate(keyId);
  };
  
  // Example API calls
  const examples = {
    manuscript: `// Fetch a list of manuscript pages
fetch('https://voynich-ai-production.up.railway.app/api/pages', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
    
    symbols: `// Get symbols from a specific page
fetch('https://voynich-ai-production.up.railway.app/api/symbols/page/42', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
    
    analysis: `// Request an AI analysis
fetch('https://voynich-ai-production.up.railway.app/api/ai/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pageId: 42,
    prompt: "Analyze the plant structures on this page and compare to known medieval herbals",
    modelParams: {
      model: "mixtral-8x7b-instruct",
      temperature: 0.7,
      maxTokens: 500
    },
    isPublic: false
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`
  };
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">API Documentation</h1>
        <p className="text-neutral-600">
          Integrate with the Voynich Manuscript Analysis Platform programmatically.
        </p>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reference">API Reference</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>API Overview</CardTitle>
              <CardDescription>
                Get started with the Voynich Manuscript Analysis Platform API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Introduction</h3>
                <p className="text-neutral-600 mb-4">
                  The Voynich Manuscript Analysis Platform API provides programmatic access to manuscript pages, 
                  extracted symbols, annotations, and AI analysis capabilities. This enables researchers and 
                  developers to build custom tools and integrations for studying the Voynich Manuscript.
                </p>
                <p className="text-neutral-600">
                  Our platform is designed to be collaborative and competitive. Contributions made through the API 
                  (such as annotations, symbol classifications, and analysis results) are tracked, can receive 
                  upvotes from the community, and contribute to your ranking on our leaderboards.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                <p className="text-neutral-600 mb-4">
                  All API requests require authentication using an API key. You can create and manage your API keys 
                  in the "API Keys" tab. Include your API key in the Authorization header of each request:
                </p>
                
                <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                  <code className="text-sm font-mono">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Rate Limits</h3>
                <p className="text-neutral-600">
                  API requests are subject to rate limiting. Standard accounts are limited to 1000 requests per day.
                  AI analysis endpoints consume credits from your account in addition to counting towards rate limits.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                <p className="text-neutral-600 mb-2">
                  All API endpoints are relative to the base URL:
                </p>
                
                <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                  <code className="text-sm font-mono">
                    https://voynich-ai-production.up.railway.app/api
                  </code>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Response Format</h3>
                <p className="text-neutral-600 mb-2">
                  All API responses are returned in JSON format. Successful responses typically include a data object, 
                  while error responses include an error message.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Success Response</h4>
                    <pre className="bg-neutral-50 p-3 rounded-md border border-neutral-200 text-xs font-mono overflow-auto max-h-40">
{`{
  "data": {
    "id": 42,
    "folioNumber": "76r",
    "section": "herbal",
    "width": 2400,
    "height": 3200,
    "uploadedAt": "2023-05-15T10:30:00Z"
  }
}`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Error Response</h4>
                    <pre className="bg-neutral-50 p-3 rounded-md border border-neutral-200 text-xs font-mono overflow-auto max-h-40">
{`{
  "error": {
    "message": "Invalid API key provided",
    "code": "auth_error",
    "status": 401
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={() => setActiveTab('reference')} className="mr-2">
                  View API Reference
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('examples')}
                >
                  See Examples
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reference">
          <Card>
            <CardHeader>
              <CardTitle>API Reference</CardTitle>
              <CardDescription>
                Comprehensive documentation of all available API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="authentication">
                  <AccordionTrigger className="text-lg font-medium">
                    Authentication Endpoints
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-md font-mono mr-2">POST</span>
                        <span className="font-mono text-sm">/api/auth/login</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Authenticate a user and get a session token</p>
                        <h4 className="text-xs font-medium mb-1">Request Body</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono mb-3">
{`{
  "username": "string",
  "password": "string"
}`}
                        </pre>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string",
    "credits": "number"
  }
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/auth/session</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get information about the current session</p>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string",
    "credits": "number"
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="manuscript">
                  <AccordionTrigger className="text-lg font-medium">
                    Manuscript Endpoints
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/pages</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get a list of manuscript pages</p>
                        <h4 className="text-xs font-medium mb-1">Query Parameters</h4>
                        <table className="w-full text-xs mb-3">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="p-2 text-left">Parameter</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">offset</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Number of items to skip (default: 0)</td>
                            </tr>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">limit</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Number of items to return (default: 20)</td>
                            </tr>
                          </tbody>
                        </table>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "pages": [
    {
      "id": "number",
      "folioNumber": "string",
      "filename": "string",
      "section": "string",
      "width": "number",
      "height": "number",
      "uploadedAt": "string"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/pages/:id</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get details of a specific manuscript page</p>
                        <h4 className="text-xs font-medium mb-1">Path Parameters</h4>
                        <table className="w-full text-xs mb-3">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="p-2 text-left">Parameter</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">id</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Page ID</td>
                            </tr>
                          </tbody>
                        </table>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "page": {
    "id": "number",
    "folioNumber": "string",
    "filename": "string",
    "section": "string",
    "width": "number",
    "height": "number",
    "uploadedAt": "string"
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="symbols">
                  <AccordionTrigger className="text-lg font-medium">
                    Symbol Endpoints
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/symbols/page/:pageId</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get symbols for a specific page</p>
                        <h4 className="text-xs font-medium mb-1">Path Parameters</h4>
                        <table className="w-full text-xs mb-3">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="p-2 text-left">Parameter</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">pageId</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Page ID</td>
                            </tr>
                          </tbody>
                        </table>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "symbols": [
    {
      "id": "number",
      "pageId": "number",
      "image": "string",
      "x": "number",
      "y": "number",
      "width": "number",
      "height": "number",
      "category": "string",
      "frequency": "number",
      "metadata": "object",
      "extractedAt": "string"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ai">
                  <AccordionTrigger className="text-lg font-medium">
                    AI Analysis Endpoints
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-md font-mono mr-2">POST</span>
                        <span className="font-mono text-sm">/api/ai/analyze</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Run an AI analysis on a manuscript page</p>
                        <h4 className="text-xs font-medium mb-1">Request Body</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono mb-3">
{`{
  "pageId": "number",
  "prompt": "string",
  "modelParams": {
    "model": "string",
    "temperature": "number",
    "maxTokens": "number"
  },
  "isPublic": "boolean"
}`}
                        </pre>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "result": {
    "id": "number",
    "userId": "number",
    "pageId": "number",
    "type": "string",
    "prompt": "string",
    "result": "object",
    "isPublic": "boolean",
    "model": "string",
    "createdAt": "string"
  },
  "remainingCredits": "number"
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/ai/models</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get available AI models</p>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "models": [
    {
      "id": "string",
      "name": "string",
      "creditCost": "number"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="external">
                  <AccordionTrigger className="text-lg font-medium">
                    External API Integration Endpoints
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/external/pages</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get a list of manuscript pages (API key auth enabled)</p>
                        <h4 className="text-xs font-medium mb-1">Query Parameters</h4>
                        <table className="w-full text-xs mb-3">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="p-2 text-left">Parameter</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">offset</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Number of items to skip (default: 0)</td>
                            </tr>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">limit</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Number of items to return (default: 20)</td>
                            </tr>
                          </tbody>
                        </table>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "pages": [
    {
      "id": "number",
      "folioNumber": "string",
      "filename": "string",
      "section": "string",
      "width": "number",
      "height": "number",
      "uploadedAt": "string"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/external/pages/:id</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get details of a specific manuscript page (API key auth enabled)</p>
                        <h4 className="text-xs font-medium mb-1">Path Parameters</h4>
                        <table className="w-full text-xs mb-3">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="p-2 text-left">Parameter</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">id</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Page ID</td>
                            </tr>
                          </tbody>
                        </table>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "page": {
    "id": "number",
    "folioNumber": "string",
    "filename": "string",
    "section": "string",
    "width": "number",
    "height": "number",
    "uploadedAt": "string"
  }
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/external/symbols/page/:pageId</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get symbols for a specific page (API key auth enabled)</p>
                        <h4 className="text-xs font-medium mb-1">Path Parameters</h4>
                        <table className="w-full text-xs mb-3">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="p-2 text-left">Parameter</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">pageId</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Page ID</td>
                            </tr>
                          </tbody>
                        </table>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "symbols": [
    {
      "id": "number",
      "pageId": "number",
      "image": "string",
      "x": "number",
      "y": "number",
      "width": "number",
      "height": "number",
      "category": "string",
      "frequency": "number"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-md font-mono mr-2">POST</span>
                        <span className="font-mono text-sm">/api/external/symbols</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Submit a new symbol classification or extraction (API key auth enabled)</p>
                        <h4 className="text-xs font-medium mb-1">Request Body</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono mb-3">
{`{
  "pageId": "number",
  "x": "number",
  "y": "number",
  "width": "number",
  "height": "number",
  "image": "string", // Base64 encoded image
  "category": "string", // Optional classification
  "metadata": "object" // Optional additional data
}`}
                        </pre>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "symbol": {
    "id": "number",
    "pageId": "number",
    "image": "string",
    "x": "number",
    "y": "number",
    "width": "number",
    "height": "number",
    "category": "string",
    "createdAt": "string"
  }
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-md font-mono mr-2">POST</span>
                        <span className="font-mono text-sm">/api/external/annotations</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Create a new annotation (API key auth enabled)</p>
                        <h4 className="text-xs font-medium mb-1">Request Body</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono mb-3">
{`{
  "pageId": "number",
  "x": "number",
  "y": "number",
  "width": "number",
  "height": "number",
  "content": "string",
  "isPublic": "boolean" // true to make this visible to other users
}`}
                        </pre>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "annotation": {
    "id": "number",
    "pageId": "number",
    "userId": "number",
    "x": "number",
    "y": "number",
    "width": "number",
    "height": "number",
    "content": "string",
    "isPublic": "boolean",
    "createdAt": "string",
    "upvotes": "number",
    "downvotes": "number"
  }
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-md font-mono mr-2">POST</span>
                        <span className="font-mono text-sm">/api/external/annotations/:id/vote</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Vote on an annotation (API key auth enabled)</p>
                        <h4 className="text-xs font-medium mb-1">Path Parameters</h4>
                        <table className="w-full text-xs mb-3">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="p-2 text-left">Parameter</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">id</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Annotation ID</td>
                            </tr>
                          </tbody>
                        </table>
                        <h4 className="text-xs font-medium mb-1">Request Body</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono mb-3">
{`{
  "voteType": "upvote" | "downvote"
}`}
                        </pre>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "success": true,
  "message": "Vote recorded",
  "annotation": {
    "id": "number",
    "upvotes": "number",
    "downvotes": "number"
  }
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/external/leaderboard</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get the contributor leaderboard (API key auth enabled)</p>
                        <h4 className="text-xs font-medium mb-1">Query Parameters</h4>
                        <table className="w-full text-xs mb-3">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="p-2 text-left">Parameter</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">timeframe</td>
                              <td className="p-2">string</td>
                              <td className="p-2">Timeframe: 'daily', 'weekly', 'monthly', or 'alltime' (default: 'alltime')</td>
                            </tr>
                          </tbody>
                        </table>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "timeframe": "string",
  "date": "string",
  "entries": [
    {
      "userId": "number",
      "username": "string",
      "score": "number",
      "annotationCount": "number",
      "upvotesReceived": "number",
      "rank": "number"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/external/activity-feed</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get public activity feed (API key auth enabled)</p>
                        <h4 className="text-xs font-medium mb-1">Query Parameters</h4>
                        <table className="w-full text-xs mb-3">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="p-2 text-left">Parameter</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">limit</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Number of items to return (default: 20)</td>
                            </tr>
                            <tr className="border-t border-neutral-100">
                              <td className="p-2 font-mono">offset</td>
                              <td className="p-2">number</td>
                              <td className="p-2">Number of items to skip (default: 0)</td>
                            </tr>
                          </tbody>
                        </table>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "activities": [
    {
      "id": "number",
      "userId": "number",
      "username": "string",
      "type": "string",
      "entityId": "number",
      "entityType": "string",
      "metadata": "object",
      "createdAt": "string"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="border border-neutral-200 rounded-md">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-mono mr-2">GET</span>
                        <span className="font-mono text-sm">/api/external/usage</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-3">Get API usage statistics (API key auth enabled)</p>
                        <h4 className="text-xs font-medium mb-1">Response</h4>
                        <pre className="bg-neutral-50 p-2 rounded-md text-xs font-mono">
{`{
  "totalRequests": "number",
  "requestsToday": "number",
  "requestsThisWeek": "number",
  "requestsThisMonth": "number",
  "tokensUsed": "number"
}`}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>API Examples</CardTitle>
              <CardDescription>
                Code examples for common API operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manuscript" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="manuscript" className="flex-1">Manuscript</TabsTrigger>
                  <TabsTrigger value="symbols" className="flex-1">Symbols</TabsTrigger>
                  <TabsTrigger value="analysis" className="flex-1">AI Analysis</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  <TabsContent value="manuscript">
                    <div className="rounded-md overflow-hidden border border-neutral-200">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex justify-between items-center">
                        <h3 className="font-medium">Fetch Manuscript Pages</h3>
                        <Button variant="ghost" size="sm" onClick={() => {
                          navigator.clipboard.writeText(examples.manuscript);
                          toast({
                            title: "Copied to clipboard",
                            description: "Code example copied to clipboard",
                          });
                        }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-0">
                        <CopyBlock
                          text={examples.manuscript}
                          language="javascript"
                          theme={atomOneLight}
                          showLineNumbers={true}
                          wrapLines
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="symbols">
                    <div className="rounded-md overflow-hidden border border-neutral-200">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex justify-between items-center">
                        <h3 className="font-medium">Get Symbols for a Page</h3>
                        <Button variant="ghost" size="sm" onClick={() => {
                          navigator.clipboard.writeText(examples.symbols);
                          toast({
                            title: "Copied to clipboard",
                            description: "Code example copied to clipboard",
                          });
                        }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-0">
                        <CopyBlock
                          text={examples.symbols}
                          language="javascript"
                          theme={atomOneLight}
                          showLineNumbers={true}
                          wrapLines
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="analysis">
                    <div className="rounded-md overflow-hidden border border-neutral-200">
                      <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex justify-between items-center">
                        <h3 className="font-medium">Run AI Analysis</h3>
                        <Button variant="ghost" size="sm" onClick={() => {
                          navigator.clipboard.writeText(examples.analysis);
                          toast({
                            title: "Copied to clipboard",
                            description: "Code example copied to clipboard",
                          });
                        }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-0">
                        <CopyBlock
                          text={examples.analysis}
                          language="javascript"
                          theme={atomOneLight}
                          showLineNumbers={true}
                          wrapLines
                        />
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Try It Yourself</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="endpoint">API Endpoint</Label>
                    <div className="flex space-x-2 mt-1">
                      <Select defaultValue="GET">
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input id="endpoint" className="flex-1" placeholder="/api/pages" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="request-body">Request Body (JSON)</Label>
                    <Textarea 
                      id="request-body" 
                      placeholder="{}" 
                      className="font-mono mt-1" 
                      rows={5}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Reset</Button>
                    <Button>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Send Request
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Access the Voynich Manuscript API using API keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-6">
                  {/* API key creation form */}
                  <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                    <h3 className="text-lg font-semibold mb-3">Create New API Key</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="key-name">Key Name</Label>
                        <Input 
                          id="key-name" 
                          placeholder="My API Key" 
                          className="mt-1"
                          value={apiKeyName}
                          onChange={(e) => setApiKeyName(e.target.value)}
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                          Give your key a descriptive name to remember its purpose
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleCreateApiKey}
                          disabled={createKeyMutation.isPending || !apiKeyName.trim()}
                        >
                          {createKeyMutation.isPending ? (
                            <>
                              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Create API Key
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Newly created API key */}
                  {newApiKey && (
                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                      <h3 className="text-lg font-semibold mb-3 flex items-center text-yellow-700">
                        <Key className="mr-2 h-5 w-5" />
                        Your New API Key
                      </h3>
                      <p className="text-sm text-yellow-700 mb-2">
                        Copy this key now. You won't be able to see it again!
                      </p>
                      <div className="flex items-center">
                        <Input 
                          value={newApiKey} 
                          readOnly 
                          type={showApiKey ? "text" : "password"}
                          className="font-mono bg-white"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="ml-2"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="ml-2"
                          onClick={() => {
                            navigator.clipboard.writeText(newApiKey);
                            toast({
                              title: "Copied to clipboard",
                              description: "API key copied to clipboard",
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* API key list */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Your API Keys</h3>
                    {keysLoading ? (
                      <div className="text-center py-8">
                        <RefreshCcw className="h-8 w-8 mx-auto text-neutral-300 animate-spin" />
                        <p className="mt-2 text-neutral-500">Loading API keys...</p>
                      </div>
                    ) : apiKeys.length === 0 ? (
                      <div className="text-center py-8 bg-neutral-50 rounded-md border border-neutral-200">
                        <Code className="h-8 w-8 mx-auto text-neutral-300" />
                        <p className="mt-2 text-neutral-500">No API keys found</p>
                        <p className="text-sm text-neutral-400">Create your first API key above</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {apiKeys.map((key: any) => (
                          <div 
                            key={key.id} 
                            className="flex items-center justify-between p-3 border border-neutral-200 rounded-md"
                          >
                            <div>
                              <div className="font-medium">{key.name}</div>
                              <div className="text-xs text-neutral-500 flex items-center">
                                <Key className="h-3 w-3 mr-1" />
                                {key.key.substring(0, 8)}•••••••••••••••
                                <span className="ml-2">
                                  Created: {new Date(key.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteApiKey(key.id)}
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-primary-50 p-6 rounded-lg border border-primary-100">
                    <h3 className="text-xl font-semibold mb-4 text-primary-900">Get Access to the Voynich Manuscript API</h3>
                    <p className="mb-4">
                      Create an account to generate API keys and access our Voynich Manuscript dataset programmatically. 
                      API keys enable AI agents and researchers to interact with the platform.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild className="w-full sm:w-auto">
                        <a href="/register">Create Free Account</a>
                      </Button>
                      <Button asChild variant="outline" className="w-full sm:w-auto">
                        <a href="/login">Sign In</a>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">API Access for AI Agents</h3>
                    <p className="text-neutral-600 mb-4">
                      Our API is specifically designed for AI agents to access and analyze the Voynich Manuscript:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                      <li>Structured data endpoints optimized for machine learning applications</li>
                      <li>Full access to manuscript pages, symbols, and annotations</li>
                      <li>Ability to contribute analyses and findings through API endpoints</li>
                      <li>Comprehensive error handling and response formats for automated processing</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
