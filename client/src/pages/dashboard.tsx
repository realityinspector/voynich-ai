import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
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
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import {
  BookOpen,
  Puzzle,
  MessageSquare,
  Bot,
  Image,
  Upload,
  Clock,
  User,
  Activity,
  Eye
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/dashboard'],
    retry: false,
  });
  
  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/activity/recent'],
    retry: false,
  });
  
  // Fetch pages statistics
  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ['/api/pages?limit=5'],
    retry: false,
  });
  
  // Fetch recent analysis results
  const { data: analysisData, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/ai/results'],
    retry: false,
  });
  
  // Mock statistics data - in a real implementation, this would come from the API
  const stats = statsData?.stats || {
    totalPages: 156,
    totalSymbols: 12845,
    totalAnnotations: 427,
    totalAnalyses: 78,
    userCredits: user?.credits || 0
  };
  
  // Recent activity
  const recentActivity = activityData?.activities || [];
  
  // Recent pages
  const recentPages = pagesData?.pages?.slice(0, 5) || [];
  
  // Recent analyses
  const recentAnalyses = analysisData?.results?.slice(0, 5) || [];
  
  // Chart data - in a real implementation, this would come from the API
  const symbolData = [
    { name: 'Herbal', value: 5243 },
    { name: 'Astronomical', value: 2150 },
    { name: 'Biological', value: 1872 },
    { name: 'Cosmological', value: 1320 },
    { name: 'Pharmaceutical', value: 1782 },
    { name: 'Recipes', value: 478 },
  ];
  
  const chartColors = ['#1a5276', '#d4ac0d', '#ca6f1e', '#2e86c1', '#28b463', '#cb4335'];
  
  const activityTimelineData = [
    { day: 'Mon', symbols: 212, annotations: 32 },
    { day: 'Tue', symbols: 326, annotations: 45 },
    { day: 'Wed', symbols: 187, annotations: 23 },
    { day: 'Thu', symbols: 498, annotations: 67 },
    { day: 'Fri', symbols: 423, annotations: 52 },
    { day: 'Sat', symbols: 120, annotations: 18 },
    { day: 'Sun', symbols: 89, annotations: 11 },
  ];
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Welcome, {user?.username}!</h1>
          <p className="text-neutral-600">
            Here's an overview of the Voynich Manuscript analysis project.
          </p>
        </div>
        <div className="flex space-x-2 mt-2 md:mt-0">
          <Link href="/manuscript">
            <Button className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Manuscript
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/admin/upload">
              <Button variant="outline" className="flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                Upload Pages
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  Manuscript Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : stats.totalPages}
                </div>
                <p className="text-xs text-neutral-500 mt-1">Total digitized pages</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Puzzle className="mr-2 h-5 w-5 text-primary" />
                  Extracted Symbols
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {statsLoading ? <Skeleton className="h-9 w-20" /> : stats.totalSymbols.toLocaleString()}
                </div>
                <p className="text-xs text-neutral-500 mt-1">Across all manuscript pages</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                  Annotations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : stats.totalAnnotations}
                </div>
                <p className="text-xs text-neutral-500 mt-1">From all researchers</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Bot className="mr-2 h-5 w-5 text-primary" />
                  AI Analysis Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : stats.userCredits}
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  <Link href="/credits">
                    <a className="text-primary hover:underline">Get more credits</a>
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity and Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Symbol Distribution</CardTitle>
                <CardDescription>Distribution of symbols across manuscript sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={symbolData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {symbolData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} symbols`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))
                  ) : recentActivity.length > 0 ? (
                    recentActivity.map((activity: any, i: number) => (
                      <div key={i} className="flex items-start space-x-3">
                        <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center">
                          {activity.type === 'extraction' && <Puzzle className="h-4 w-4 text-primary" />}
                          {activity.type === 'annotation' && <MessageSquare className="h-4 w-4 text-primary" />}
                          {activity.type === 'analysis' && <Bot className="h-4 w-4 text-primary" />}
                          {activity.type === 'upload' && <Upload className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-neutral-500">{activity.timeAgo}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">No recent activity to display</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="link" className="p-0 h-auto">View all activity</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="activity">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  Recent Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pagesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))
                  ) : recentPages.length > 0 ? (
                    recentPages.map((page: any) => (
                      <Link key={page.id} href={`/manuscript?pageId=${page.id}`}>
                        <a className="flex items-center p-2 hover:bg-neutral-50 rounded-md transition-colors">
                          <div className="h-10 w-10 bg-neutral-100 mr-3 rounded overflow-hidden">
                            <img 
                              src={`/uploads/${page.filename}`} 
                              alt={`Page ${page.folioNumber}`} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWJvb2stb3BlbiI+PHBhdGggZD0iTTIsM2gxOXY4aC02uvbgbj0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtYXJ0Ym9hcmQiPjxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgeD0iNCIgeT0iNCIgcng9IjIiIC8+PHBhdGggZD0iTTQgMTBoMTYiIC8+PHBhdGggZD0iTTEwIDR2MTYiIC8+PC9zdmc+';
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-medium">Folio {page.folioNumber}</p>
                            <p className="text-xs text-neutral-500 capitalize">
                              {page.section || 'Unknown'} Section
                            </p>
                          </div>
                        </a>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">No manuscript pages available</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/manuscript">
                  <Button variant="outline" className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View All Pages
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* Recent Analyses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="mr-2 h-5 w-5 text-primary" />
                  Recent Analyses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))
                  ) : recentAnalyses.length > 0 ? (
                    recentAnalyses.map((analysis: any) => (
                      <Link key={analysis.id} href={`/analysis?resultId=${analysis.id}`}>
                        <a className="flex items-start p-2 hover:bg-neutral-50 rounded-md transition-colors">
                          <div className="h-8 w-8 bg-secondary text-white rounded-full mr-3 flex items-center justify-center">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm line-clamp-1">
                              {analysis.prompt?.substring(0, 40) || 'Untitled analysis'}...
                            </p>
                            <p className="text-xs text-neutral-500">
                              {new Date(analysis.createdAt).toLocaleDateString()} • 
                              {analysis.model ? ` ${analysis.model}` : ' AI Analysis'}
                            </p>
                          </div>
                        </a>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Bot className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
                      <p className="text-sm text-neutral-500">No analyses yet</p>
                      <Link href="/analysis">
                        <Button variant="link" className="mt-1">
                          Run your first analysis
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/analysis">
                  <Button variant="outline" className="w-full">
                    <Bot className="mr-2 h-4 w-4" />
                    New Analysis
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activityTimelineData}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="symbols" fill="#1a5276" name="Symbols" />
                      <Bar dataKey="annotations" fill="#d4ac0d" name="Annotations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-primary mr-2"></div>
                    <span className="text-xs">Symbols</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-secondary mr-2"></div>
                    <span className="text-xs">Annotations</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="statistics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Symbol Distribution by Section</CardTitle>
                <CardDescription>How symbols are distributed across manuscript sections</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={symbolData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1a5276" name="Symbols" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Research Activity Trends</CardTitle>
                <CardDescription>Platform usage over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { month: 'Jan', analyses: 5, annotations: 12, symbols: 230 },
                      { month: 'Feb', analyses: 8, annotations: 17, symbols: 340 },
                      { month: 'Mar', analyses: 12, annotations: 23, symbols: 278 },
                      { month: 'Apr', analyses: 14, annotations: 30, symbols: 390 },
                      { month: 'May', analyses: 18, annotations: 41, symbols: 450 },
                      { month: 'Jun', analyses: 24, annotations: 48, symbols: 520 },
                    ]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="analyses" stroke="#ca6f1e" name="AI Analyses" />
                    <Line type="monotone" dataKey="annotations" stroke="#d4ac0d" name="Annotations" />
                    <Line type="monotone" dataKey="symbols" stroke="#1a5276" name="Symbols Extracted" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Researchers</CardTitle>
                <CardDescription>Most active contributors to the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { username: 'realityinspector', role: 'Admin', contributions: 248 },
                    { username: 'dr_smith', role: 'Researcher', contributions: 187 },
                    { username: 'linguist42', role: 'Researcher', contributions: 156 },
                    { username: 'historybuff', role: 'Researcher', contributions: 134 },
                    { username: 'codebreaker', role: 'Researcher', contributions: 112 },
                  ].map((researcher, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{researcher.username}</p>
                          <p className="text-xs text-neutral-500">{researcher.role}</p>
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {researcher.contributions} contributions
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Most Viewed Pages</CardTitle>
                <CardDescription>Popular manuscript pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { folio: '1r', views: 842, section: 'Herbal' },
                    { folio: '68r', views: 763, section: 'Astronomical' },
                    { folio: '78v', views: 714, section: 'Biological' },
                    { folio: '42r', views: 698, section: 'Pharmaceutical' },
                    { folio: '116v', views: 645, section: 'Recipes' },
                  ].map((page, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <Image className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Folio {page.folio}</p>
                          <p className="text-xs text-neutral-500">{page.section} Section</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm font-semibold">
                        <Eye className="h-4 w-4 mr-1 text-neutral-400" />
                        {page.views}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
