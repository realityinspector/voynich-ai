import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { 
  Sparkles, 
  ArrowLeft, 
  Loader, 
  Brain, 
  ThumbsUp, 
  ThumbsDown, 
  Gauge, 
  BookText,
  FileText,
  AlertTriangle
} from 'lucide-react';

function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };
  
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-t-2 border-primary ${sizeClasses[size]}`}></div>
    </div>
  );
}

function getCategoryColor(category?: string) {
  switch (category) {
    case 'research': return 'bg-blue-100 text-blue-800';
    case 'analysis': return 'bg-purple-100 text-purple-800';
    case 'history': return 'bg-amber-100 text-amber-800';
    case 'cryptography': return 'bg-emerald-100 text-emerald-800';
    case 'language': return 'bg-red-100 text-red-800';
    case 'manuscript_features': return 'bg-indigo-100 text-indigo-800';
    case 'community': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getCategoryLabel(category?: string) {
  if (!category) return 'Unknown';
  
  // Convert snake_case to Title Case with spaces
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getComplexityColor(complexity?: string) {
  switch (complexity) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-amber-100 text-amber-800';
    case 'high': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getComplexityLabel(complexity?: string) {
  if (!complexity) return 'Unknown';
  return complexity.charAt(0).toUpperCase() + complexity.slice(1);
}

interface TopicIdea {
  id: number;
  title: string;
  description: string;
  category: string;
  complexity: string;
  status: string;
  promptTemplate: string;
  pageId?: number;
  symbolId?: number;
  generatedPostId?: number;
}

export default function TopicIdeas() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [complexity, setComplexity] = useState<string | undefined>(undefined);
  const [selectedTopic, setSelectedTopic] = useState<TopicIdea | null>(null);
  const [generatingPost, setGeneratingPost] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<any | null>(null);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch topic ideas
  const { data: topicsData, isLoading, error } = useQuery({
    queryKey: ['/api/blog/topics', { category, complexity }],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });
  
  // Generate post mutation
  const generateMutation = useMutation({
    mutationFn: async (topicId: number) => {
      return apiRequest('/api/blog/generate', {
        method: 'POST',
        body: { topicId },
      });
    },
    onSuccess: (data) => {
      setGeneratingPost(false);
      setGeneratedPost(data.post);
      queryClient.invalidateQueries({ queryKey: ['/api/blog/topics'] });
      toast({
        title: 'Blog post generated',
        description: 'Your blog post has been generated successfully.',
      });
    },
    onError: (error) => {
      setGeneratingPost(false);
      toast({
        title: 'Error',
        description: 'Failed to generate blog post. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const topicIdeas = topicsData?.topics || [];
  const availableTopics = topicIdeas.filter(topic => topic.status === 'available');
  
  function handleCategoryChange(value: string) {
    setCategory(value === 'all' ? undefined : value);
  }
  
  function handleComplexityChange(value: string) {
    setComplexity(value === 'all' ? undefined : value);
  }
  
  function handleTopicSelect(topic: TopicIdea) {
    setSelectedTopic(topic);
    setGeneratedPost(null);
  }
  
  function handleGeneratePost() {
    if (!selectedTopic) return;
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to generate blog posts',
        variant: 'destructive',
      });
      return;
    }
    
    setGeneratingPost(true);
    generateMutation.mutate(selectedTopic.id);
  }
  
  function handlePublishPost() {
    if (!generatedPost) return;
    navigate(`/blog/${generatedPost.slug}`);
  }
  
  function handleRejectPost() {
    setGeneratedPost(null);
    toast({
      title: 'Post rejected',
      description: 'You can try generating another post.',
    });
  }
  
  if (!user) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to generate blog posts.
            <div className="mt-4">
              <Button asChild>
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Topic Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the topic ideas. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild>
          <Link href="/blog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generate Blog Post</h1>
        <p className="text-muted-foreground">
          Select a topic idea to generate a blog post using AI. The generated post will be based on the selected topic's prompt template.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookText className="w-5 h-5 mr-2" />
                Topic Ideas
              </CardTitle>
              <CardDescription>
                Filter topics by category and complexity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select onValueChange={handleCategoryChange} value={category || 'all'}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="cryptography">Cryptography</SelectItem>
                      <SelectItem value="language">Language</SelectItem>
                      <SelectItem value="manuscript_features">Manuscript Features</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Complexity</label>
                  <Select onValueChange={handleComplexityChange} value={complexity || 'all'}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Complexities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Complexities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-4 space-y-4">
            {availableTopics.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No topic ideas found matching your filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              availableTopics.map((topic) => (
                <Card 
                  key={topic.id} 
                  className={`cursor-pointer transition-colors hover:border-primary/50
                    ${selectedTopic?.id === topic.id ? 'border-primary' : ''}`}
                  onClick={() => handleTopicSelect(topic)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <Badge className={getCategoryColor(topic.category)}>
                        {getCategoryLabel(topic.category)}
                      </Badge>
                      <Badge className={getComplexityColor(topic.complexity)}>
                        <Gauge className="w-3 h-3 mr-1" />
                        {getComplexityLabel(topic.complexity)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{topic.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {topic.description}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {!selectedTopic ? (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center py-12">
                <BookText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">Select a topic idea</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Choose a topic from the list on the left to generate a blog post with AI.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Topic: {selectedTopic.title}</CardTitle>
                <CardDescription>
                  {selectedTopic.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatingPost ? (
                  <div className="text-center py-12">
                    <Loader className="w-12 h-12 mx-auto mb-4 animate-spin opacity-30" />
                    <h3 className="text-lg font-medium mb-2">Generating blog post...</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      This may take a minute or two. The AI is crafting a post based on the selected topic.
                    </p>
                  </div>
                ) : generatedPost ? (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Generated Post Preview</h3>
                    <Separator className="my-4" />
                    <div>
                      <h2 className="text-xl font-bold mb-2">{generatedPost.title}</h2>
                      {generatedPost.excerpt && (
                        <p className="italic text-muted-foreground mb-4 p-3 bg-muted rounded-md">
                          {generatedPost.excerpt}
                        </p>
                      )}
                      <div className="prose prose-sm max-h-[400px] overflow-y-auto mb-4 border rounded-md p-4">
                        <div dangerouslySetInnerHTML={{ __html: generatedPost.content.substring(0, 1000) + '...' }} />
                        <p className="text-muted-foreground text-center mt-4 italic">Preview truncated. View full post after publishing.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Generate a blog post about this topic</h3>
                    <div className="bg-muted p-4 rounded-md mb-4">
                      <h4 className="font-medium mb-2">Prompt Template:</h4>
                      <p className="text-sm text-muted-foreground">{selectedTopic.promptTemplate}</p>
                    </div>
                    <Alert className="mb-4">
                      <Brain className="h-4 w-4" />
                      <AlertTitle>AI-generated content</AlertTitle>
                      <AlertDescription>
                        The blog post will be generated by AI based on the prompt above.
                        You can edit the content after generation.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {generatingPost ? (
                  <Button disabled>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generating...</span>
                  </Button>
                ) : generatedPost ? (
                  <>
                    <Button variant="outline" onClick={handleRejectPost}>
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Reject & Try Again
                    </Button>
                    <Button onClick={handlePublishPost}>
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Accept & Publish
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleGeneratePost}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Blog Post
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}