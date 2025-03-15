import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useRoute, Link } from 'wouter';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeft, 
  Save, 
  FileEdit, 
  Eye, 
  Sparkles, 
  AlertTriangle, 
  Wand2, 
  RefreshCw,
  Brain,
  ThumbsUp,
  ThumbsDown
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

// Define the form schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters").max(300, "Excerpt must be at most 300 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  category: z.string(),
  tags: z.string().transform(value => value.split(',').map(tag => tag.trim()).filter(Boolean)),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditBlogPost() {
  const [match, params] = useRoute('/blog/edit/:id');
  const postId = params?.id ? parseInt(params.id) : undefined;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [regenerateSection, setRegenerateSection] = useState<'intro' | 'body' | 'conclusion' | 'all'>('all');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "research",
      tags: "",
      metaTitle: "",
      metaDescription: "",
      status: "draft",
    },
  });
  
  // Fetch blog post
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/blog/posts/edit', postId],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!postId,
  });
  
  // Update form values when data is loaded
  useEffect(() => {
    if (data?.post) {
      const post = data.post;
      form.reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content,
        category: post.category,
        tags: post.tags?.join(', ') || '',
        metaTitle: post.metaTitle || '',
        metaDescription: post.metaDescription || '',
        status: post.status,
      });
    }
  }, [data, form]);
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!postId) throw new Error("Post ID is required");
      return apiRequest(`/api/blog/posts/${postId}`, {
        method: 'PUT',
        body: values,
      });
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts/edit', postId] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      
      toast({
        title: 'Post updated',
        description: 'Your blog post has been updated successfully.',
      });
      
      // Navigate to the updated post
      navigate(`/blog/${data.post.slug}`);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: 'Failed to update blog post. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!postId) throw new Error("Post ID is required");
      return apiRequest(`/api/blog/posts/${postId}/publish`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts/edit', postId] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      
      toast({
        title: 'Post published',
        description: 'Your blog post has been published successfully.',
      });
      
      // Navigate to the published post
      navigate(`/blog/${data.post.slug}`);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: 'Failed to publish blog post. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Content regeneration mutation
  const regenerateMutation = useMutation({
    mutationFn: async (params: { 
      postId: number, 
      section: string, 
      currentData: { 
        title: string, 
        content: string, 
        category: string, 
        tags: string[] 
      } 
    }) => {
      return apiRequest('/api/blog/regenerate', {
        method: 'POST',
        body: params
      });
    },
    onSuccess: (data) => {
      if (data?.content) {
        setGeneratedContent(data.content);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate content. Please try again.',
          variant: 'destructive',
        });
      }
      setIsGenerating(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'An error occurred during content generation.',
        variant: 'destructive',
      });
      console.error('Error generating content:', error);
      setIsGenerating(false);
    }
  });
  
  // Function to generate a slug from the title
  function generateSlug(title: string) {
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
    
    form.setValue('slug', slug);
  }
  
  // Function to submit the form
  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to update blog posts',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    updateMutation.mutate(values);
  }
  
  // Function to publish the post
  function handlePublish() {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to publish blog posts',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    publishMutation.mutate();
  }
  
  // Function to handle content regeneration with AI
  function handleRegenerateContent() {
    if (!postId) return;
    
    setIsGenerating(true);
    
    regenerateMutation.mutate({
      postId,
      section: regenerateSection,
      currentData: {
        title: form.getValues('title'),
        content: form.getValues('content'),
        category: form.getValues('category'),
        tags: form.getValues('tags').split(',').map(tag => tag.trim()).filter(Boolean)
      }
    });
  }
  
  // Function to handle accepting generated content
  function handleAcceptContent() {
    if (!generatedContent) return;
    
    // Update the form based on which section was regenerated
    if (regenerateSection === 'all') {
      form.setValue('content', generatedContent);
    } else {
      const currentContent = form.getValues('content');
      
      // Very simple content section detection - in a real app this would be more sophisticated
      // with HTML parsing or section markers
      if (regenerateSection === 'intro') {
        // Replace the first paragraph or add at beginning
        const parts = currentContent.split('</p>');
        if (parts.length > 1) {
          parts[0] = generatedContent;
          form.setValue('content', parts.join('</p>'));
        } else {
          form.setValue('content', generatedContent + currentContent);
        }
      } else if (regenerateSection === 'conclusion') {
        // Replace the last paragraph or add at end
        const parts = currentContent.split('<p>');
        if (parts.length > 1) {
          parts[parts.length - 1] = generatedContent;
          form.setValue('content', parts.join('<p>'));
        } else {
          form.setValue('content', currentContent + generatedContent);
        }
      } else if (regenerateSection === 'body') {
        // Replace the middle content or insert after first paragraph
        const paragraphs = currentContent.split('<p>').filter(p => p.trim());
        if (paragraphs.length > 2) {
          const firstPara = paragraphs[0];
          const lastPara = paragraphs[paragraphs.length - 1];
          form.setValue('content', `<p>${firstPara}${generatedContent}<p>${lastPara}`);
        } else {
          form.setValue('content', currentContent + generatedContent);
        }
      }
    }
    
    // Close dialog and clear generated content
    setGeneratedContent('');
    setAiDialogOpen(false);
    
    toast({
      title: 'Content Updated',
      description: 'The AI-generated content has been added to your post.'
    });
  }
  
  if (!user) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to edit blog posts.
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
  
  if (error || !data?.post) {
    return (
      <div className="container py-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Blog Post Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The blog post you're trying to edit doesn't exist or you don't have permission to edit it.</p>
            <Button asChild className="mt-4">
              <Link href="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Blog
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (data.post.userId !== user.id && user.role !== 'admin') {
    return (
      <div className="container py-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Permission Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to edit this blog post.</p>
            <Button asChild className="mt-4">
              <Link href="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Blog
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild>
          <Link href={`/blog/${data.post.slug}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Post
          </Link>
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Blog Post</h1>
        <p className="text-muted-foreground">
          Make changes to your blog post and save or publish when you're ready.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileEdit className="w-5 h-5 mr-2" />
            Edit Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter post title" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-generate slug when title changes if slug is empty
                            if (!form.getValues('slug')) {
                              generateSlug(e.target.value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <div className="flex">
                        <FormControl>
                          <Input placeholder="enter-post-slug" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="ml-2"
                          onClick={() => generateSlug(form.getValues('title'))}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        Used in the URL: /blog/your-slug
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief summary of the post"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A short summary that appears in blog listings (max 300 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter post content (supports HTML)"
                        className="min-h-[300px] font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      HTML content for the blog post
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="analysis">Analysis</SelectItem>
                          <SelectItem value="history">History</SelectItem>
                          <SelectItem value="cryptography">Cryptography</SelectItem>
                          <SelectItem value="language">Language</SelectItem>
                          <SelectItem value="manuscript_features">Manuscript Features</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="tag1, tag2, tag3"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of tags
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title (SEO)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SEO title (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Custom title for search engines
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description (SEO)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SEO description (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Custom description for search engines
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select post status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Draft posts are not visible to other users
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAiDialogOpen(true)}
                  className="mr-auto"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  AI Assist
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  asChild
                >
                  <Link href={`/blog/${data.post.slug}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Link>
                </Button>
                
                {data.post.status !== 'published' && (
                  <Button
                    type="button"
                    onClick={handlePublish}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && publishMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </Button>
                )}
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && updateMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* AI Content Generation Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI-Assisted Content Generation
            </DialogTitle>
            <DialogDescription>
              Use AI to generate or improve content for your blog post
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">What would you like to generate?</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="intro" 
                      name="section" 
                      value="intro"
                      checked={regenerateSection === 'intro'}
                      onChange={() => setRegenerateSection('intro')}
                      className="mr-2"
                    />
                    <label htmlFor="intro">Introduction</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="body" 
                      name="section" 
                      value="body"
                      checked={regenerateSection === 'body'}
                      onChange={() => setRegenerateSection('body')}
                      className="mr-2"
                    />
                    <label htmlFor="body">Main Content</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="conclusion" 
                      name="section" 
                      value="conclusion"
                      checked={regenerateSection === 'conclusion'}
                      onChange={() => setRegenerateSection('conclusion')}
                      className="mr-2"
                    />
                    <label htmlFor="conclusion">Conclusion</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="all" 
                      name="section" 
                      value="all"
                      checked={regenerateSection === 'all'}
                      onChange={() => setRegenerateSection('all')}
                      className="mr-2"
                    />
                    <label htmlFor="all">Entire Article</label>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <Button
                  onClick={handleRegenerateContent}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Smart Tips</h3>
                <ul className="text-sm space-y-2 list-disc pl-4">
                  <li>Choose specific sections for more targeted results</li>
                  <li>AI works best with clear topic information</li>
                  <li>Review and edit AI content before publishing</li>
                  <li>Add personal insights to AI-generated content</li>
                  <li>Use AI for research summaries and data analysis</li>
                </ul>
              </Card>
            </div>
            
            {generatedContent && (
              <Card className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Generated Content</h3>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleAcceptContent}
                      className="flex items-center"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setGeneratedContent('')}
                      className="flex items-center"
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-md max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {generatedContent}
                  </pre>
                </div>
              </Card>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}