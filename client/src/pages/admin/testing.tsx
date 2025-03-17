import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import {
  ActivitySquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  Clock,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  MessageSquare,
  Bot,
  BookOpen,
  Puzzle,
  ScrollText,
  Key,
} from 'lucide-react';

export default function TestingDashboard() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [expandedServices, setExpandedServices] = useState<string[]>([]);
  
  // Fetch system health status
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/admin/health'],
    refetchOnWindowFocus: false,
    retry: false,
    enabled: isAdmin,
  });
  
  // Fetch system stats
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    refetchOnWindowFocus: false,
    retry: false,
    enabled: isAdmin,
  });
  
  // E2E test mutation
  const runTestsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/admin/test');
    },
    onSuccess: () => {
      toast({
        title: 'Tests completed',
        description: 'End-to-end tests have been completed successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Test error',
        description: 'Failed to run end-to-end tests',
        variant: 'destructive',
      });
    },
  });

  // Individual service test mutations
  const testAuthMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/admin/test/auth');
    },
  });

  const testPagesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/admin/test/pages');
    },
  });

  const testSymbolsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/admin/test/symbols');
    },
  });

  const testAnnotationsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/admin/test/annotations');
    },
  });

  const testNotesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/admin/test/notes');
    },
  });

  const testAIMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/admin/test/ai');
    },
  });

  const testBlogMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/admin/test/blog');
    },
  });

  const testAPIKeysMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/admin/test/api-keys');
    },
  });

  // Handle running all tests
  const handleRunAllTests = () => {
    runTestsMutation.mutate();
  };

  // Handle running individual service test
  const handleTestService = (service: string) => {
    switch (service) {
      case 'auth':
        testAuthMutation.mutate();
        break;
      case 'pages':
        testPagesMutation.mutate();
        break;
      case 'symbols':
        testSymbolsMutation.mutate();
        break;
      case 'annotations':
        testAnnotationsMutation.mutate();
        break;
      case 'notes':
        testNotesMutation.mutate();
        break;
      case 'ai':
        testAIMutation.mutate();
        break;
      case 'blog':
        testBlogMutation.mutate();
        break;
      case 'api-keys':
        testAPIKeysMutation.mutate();
        break;
    }
  };

  // Handle toggling service expansion
  const toggleServiceExpansion = (service: string) => {
    if (expandedServices.includes(service)) {
      setExpandedServices(expandedServices.filter(s => s !== service));
    } else {
      setExpandedServices([...expandedServices, service]);
    }
  };

  // If user is not admin, show access denied
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

  // Loading state
  if (healthLoading || statsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <RefreshCw className="animate-spin h-6 w-6 mx-auto mb-2" />
            <p>Loading system status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format bytes to human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format uptime to human-readable format
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Calculate health status colors
  const getDatabaseStatusColor = () => {
    if (!healthData || !healthData.services || !healthData.services.database) return 'bg-red-500';
    return healthData.services.database.status === 'ok' ? 'bg-green-500' : 'bg-red-500';
  };

  // Render system health status
  const renderHealthStatus = () => {
    if (!healthData) return null;
    
    const { services, system, timestamp } = healthData;
    const lastChecked = new Date(timestamp).toLocaleString();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${getDatabaseStatusColor()}`}></div>
                <span className="text-lg font-semibold">
                  {services.database.status === 'ok' ? 'Connected' : 'Error'}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Node Version</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">{system.nodeVersion}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-neutral-500" />
                <span className="text-lg font-semibold">{formatUptime(system.uptime)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-lg font-semibold">{formatBytes(system.memoryUsage.rss)}</span>
                <div className="mt-2">
                  <Progress value={system.memoryUsage.heapUsed / system.memoryUsage.heapTotal * 100} />
                  <p className="text-xs text-neutral-500 mt-1">
                    Heap: {formatBytes(system.memoryUsage.heapUsed)} / {formatBytes(system.memoryUsage.heapTotal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>Status of database tables and record counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.tables && Object.entries(services.tables).map(([table, data]: [string, any]) => (
                <div key={table} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-neutral-500" />
                    <span>{table}</span>
                  </div>
                  <div className="flex items-center">
                    {data.exists ? (
                      <Badge variant="outline">{data.count} records</Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-neutral-500">
            Last checked: {lastChecked}
          </CardFooter>
        </Card>
      </div>
    );
  };

  // Render test results
  const renderTestResults = () => {
    const testData = runTestsMutation.data;
    const isPending = runTestsMutation.isPending;
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Service Tests</h2>
          <Button 
            onClick={handleRunAllTests} 
            disabled={isPending}
            className="flex items-center gap-2"
          >
            {isPending && <RefreshCw className="animate-spin h-4 w-4" />}
            Run All Tests
          </Button>
        </div>
        
        {testData && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Test Results</CardTitle>
                <Badge variant={testData.status === 'pass' ? 'default' : 'destructive'}>
                  {testData.status === 'pass' ? 'PASSED' : 'FAILED'}
                </Badge>
              </div>
              <CardDescription>
                {testData.summary.passed} of {testData.summary.total} tests passed ({testData.summary.passRate})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testData.services && Object.entries(testData.services).map(([serviceName, serviceData]: [string, any]) => (
                  <Collapsible 
                    key={serviceName}
                    open={expandedServices.includes(serviceName)}
                    onOpenChange={() => toggleServiceExpansion(serviceName)}
                    className="border rounded-md"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
                      <div className="flex items-center gap-2">
                        {serviceData.status === 'pass' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : serviceData.status === 'fail' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                        <span className="font-medium">{serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={serviceData.status === 'pass' ? 'outline' : 'destructive'}>
                          {serviceData.status.toUpperCase()}
                        </Badge>
                        {expandedServices.includes(serviceName) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Separator />
                      <div className="p-4 space-y-2">
                        <div className="space-y-3">
                          {serviceData.tests.map((test: any, index: number) => (
                            <div 
                              key={index} 
                              className="flex items-start justify-between py-2 px-3 rounded-md bg-neutral-50"
                            >
                              <div className="flex items-center gap-2">
                                {test.status === 'pass' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : test.status === 'fail' ? (
                                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                )}
                                <div>
                                  <p className="font-medium text-sm">{test.name}</p>
                                  <p className="text-xs text-neutral-500">{test.message}</p>
                                </div>
                              </div>
                              <Badge 
                                variant={
                                  test.status === 'pass' 
                                    ? 'outline' 
                                    : test.status === 'skip'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                                className="ml-2 flex-shrink-0"
                              >
                                {test.status.toUpperCase()}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTestService(serviceName)}
                            className="text-xs"
                          >
                            Retest Service
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
            <CardFooter className="text-xs text-neutral-500">
              Tests completed at: {new Date(testData.timestamp).toLocaleString()}
            </CardFooter>
          </Card>
        )}
        
        {!testData && !isPending && (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 text-amber-500" />
              <h3 className="text-lg font-medium mb-1">No Test Results</h3>
              <p className="text-neutral-500 mb-4">Click the "Run All Tests" button to test all services</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestService('auth')}
                  disabled={testAuthMutation.isPending}
                >
                  {testAuthMutation.isPending ? (
                    <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                  ) : null}
                  Test Auth
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestService('pages')}
                  disabled={testPagesMutation.isPending}
                >
                  {testPagesMutation.isPending ? (
                    <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                  ) : null}
                  Test Pages
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestService('symbols')}
                  disabled={testSymbolsMutation.isPending}
                >
                  {testSymbolsMutation.isPending ? (
                    <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                  ) : null}
                  Test Symbols
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestService('annotations')}
                  disabled={testAnnotationsMutation.isPending}
                >
                  {testAnnotationsMutation.isPending ? (
                    <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                  ) : null}
                  Test Annotations
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestService('notes')}
                  disabled={testNotesMutation.isPending}
                >
                  {testNotesMutation.isPending ? (
                    <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                  ) : null}
                  Test Notes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestService('ai')}
                  disabled={testAIMutation.isPending}
                >
                  {testAIMutation.isPending ? (
                    <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                  ) : null}
                  Test AI
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestService('blog')}
                  disabled={testBlogMutation.isPending}
                >
                  {testBlogMutation.isPending ? (
                    <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                  ) : null}
                  Test Blog
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestService('api-keys')}
                  disabled={testAPIKeysMutation.isPending}
                >
                  {testAPIKeysMutation.isPending ? (
                    <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                  ) : null}
                  Test API Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Expandable service test details - Individual service tests */}
        {testAuthMutation.data && (
          <Card className="border border-neutral-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Authentication Service Test Results</CardTitle>
                <Badge variant={testAuthMutation.data.status === 'pass' ? 'default' : 'destructive'}>
                  {testAuthMutation.data.status === 'pass' ? 'PASSED' : 'FAILED'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testAuthMutation.data.tests.map((test: any, index: number) => (
                  <div key={index} className="flex items-start justify-between py-2 px-3 rounded-md bg-neutral-50">
                    <div className="flex items-center gap-2">
                      {test.status === 'pass' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : test.status === 'fail' ? (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{test.name}</p>
                        <p className="text-xs text-neutral-500">{test.message}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        test.status === 'pass' 
                          ? 'outline' 
                          : test.status === 'skip'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className="ml-2 flex-shrink-0"
                    >
                      {test.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Similar cards for other individual test results */}
      </div>
    );
  };

  // Render system statistics
  const renderSystemStatistics = () => {
    if (!statsData) return null;
    
    const { timestamp } = statsData;
    const lastChecked = new Date(timestamp).toLocaleString();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Users</span>
                  <span className="font-semibold">{statsData.totalUsers}</span>
                </div>
                <Separator />
                <div className="text-xs text-neutral-500">
                  <p className="font-medium mb-1">Recent Activity</p>
                  <ul className="space-y-1">
                    {statsData.recentActivity?.users?.map((activity: any, index: number) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Manuscript Pages Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Manuscript Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Pages</span>
                  <span className="font-semibold">{statsData.totalPages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Symbols</span>
                  <span className="font-semibold">{statsData.totalSymbols}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Annotation Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Annotation Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Annotations</span>
                  <span className="font-semibold">{statsData.totalAnnotations}</span>
                </div>
                <Separator />
                <div className="text-xs text-neutral-500">
                  <p className="font-medium mb-1">Recent Activity</p>
                  <ul className="space-y-1">
                    {statsData.recentActivity?.annotations?.map((activity: any, index: number) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Analysis Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Analysis Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Analysis Results</span>
                  <span className="font-semibold">{statsData.totalAnalysisResults}</span>
                </div>
                <Separator />
                <div className="text-xs text-neutral-500">
                  <p className="font-medium mb-1">Recent Activity</p>
                  <ul className="space-y-1">
                    {statsData.recentActivity?.analysis?.map((activity: any, index: number) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity by Service */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity by Service</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="auth">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="auth">Auth</TabsTrigger>
                  <TabsTrigger value="symbols">Symbols</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="blog">Blog</TabsTrigger>
                </TabsList>
                <TabsContent value="auth" className="space-y-1 text-sm">
                  {statsData.recentActivity?.auth?.map((activity: any, index: number) => (
                    <div key={index} className="p-2 rounded bg-neutral-50">{activity}</div>
                  ))}
                </TabsContent>
                <TabsContent value="symbols" className="space-y-1 text-sm">
                  {statsData.recentActivity?.symbols?.map((activity: any, index: number) => (
                    <div key={index} className="p-2 rounded bg-neutral-50">{activity}</div>
                  ))}
                </TabsContent>
                <TabsContent value="notes" className="space-y-1 text-sm">
                  {statsData.recentActivity?.notes?.map((activity: any, index: number) => (
                    <div key={index} className="p-2 rounded bg-neutral-50">{activity}</div>
                  ))}
                </TabsContent>
                <TabsContent value="blog" className="space-y-1 text-sm">
                  {statsData.recentActivity?.blog?.map((activity: any, index: number) => (
                    <div key={index} className="p-2 rounded bg-neutral-50">{activity}</div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="text-xs text-neutral-500">
              Last updated: {lastChecked}
            </CardFooter>
          </Card>
          
          {/* Blog Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Blog Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Blog Posts</span>
                  <span className="font-semibold">{statsData.totalBlogPosts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Comments</span>
                  <span className="font-semibold">{statsData.totalBlogComments}</span>
                </div>
                <Separator />
                <div className="text-xs text-neutral-500">
                  <p className="font-medium mb-1">Recent Activity</p>
                  <ul className="space-y-1">
                    {statsData.recentActivity?.blog?.map((activity: any, index: number) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* API Key Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total API Keys</span>
                  <span className="font-semibold">{statsData.totalApiKeys}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Extraction Jobs</span>
                  <span className="font-semibold">{statsData.totalExtractionJobs}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h1 className="text-2xl font-semibold">System Testing & Monitoring</h1>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { refetchHealth(); refetchStats(); }}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="health">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="health" className="flex items-center gap-1">
            <ActivitySquare className="h-4 w-4" />
            Health Status
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Service Tests
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1">
            <Database className="h-4 w-4" />
            System Statistics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="health" className="space-y-4">
          {renderHealthStatus()}
        </TabsContent>
        
        <TabsContent value="tests" className="space-y-4">
          {renderTestResults()}
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4">
          {renderSystemStatistics()}
        </TabsContent>
      </Tabs>
    </div>
  );
}