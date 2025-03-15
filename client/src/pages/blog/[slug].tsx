import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import {
  Calendar,
  MessageSquare,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Eye,
  ArrowLeft,
  Send,
  Bookmark,
  FileEdit,
  Globe,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';

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

function formatDate(dateString: string | null) {
  if (!dateString) return 'Unpublished';
  try {
    return format(new Date(dateString), 'MMMM d, yyyy');
  } catch (e) {
    return 'Unknown date';
  }
}

interface BlogComment {
  id: number;
  content: string;
  userId: number;
  username: string;
  createdAt: string;
}

export default function BlogPost() {
  const [match, params] = useRoute('/blog/:slug');
  const slug = params?.slug || '';
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState('');
  
  // Fetch blog post
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/blog/posts', slug],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!slug,
  });
  
  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/blog/posts/${post.id}/share`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', slug] });
      toast({
        title: 'Post shared',
        description: 'Share count incremented successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Could not share the post.',
        variant: 'destructive',
      });
    },
  });
  
  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ voteType }: { voteType: 'upvote' | 'downvote' }) => {
      return apiRequest(`/api/blog/posts/${post.id}/vote`, {
        method: 'POST',
        body: { voteType },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', slug] });
      toast({
        title: 'Vote recorded',
        description: 'Your vote has been recorded.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Could not record your vote.',
        variant: 'destructive',
      });
    },
  });
  
  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/blog/posts/${post.id}/comments`, {
        method: 'POST',
        body: { content: commentContent },
      });
    },
    onSuccess: () => {
      setCommentContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', slug] });
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Could not add your comment.',
        variant: 'destructive',
      });
    },
  });
  
  const post = data?.post;
  const comments = data?.comments || [];
  const relatedPosts = data?.relatedPosts || [];
  
  function handleShare() {
    // Share via Web Share API if available, or just increment count
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      })
      .then(() => shareMutation.mutate())
      .catch(err => console.error('Share failed:', err));
    } else {
      // Copy to clipboard as fallback
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          shareMutation.mutate();
          toast({
            title: 'Link copied',
            description: 'Post link copied to clipboard',
          });
        })
        .catch(err => console.error('Copy failed:', err));
    }
  }
  
  function handleVote(voteType: 'upvote' | 'downvote') {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to vote on posts',
        variant: 'destructive',
      });
      return;
    }
    voteMutation.mutate({ voteType });
  }
  
  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to comment',
        variant: 'destructive',
      });
      return;
    }
    
    commentMutation.mutate();
  }
  
  function getInitials(name: string) {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="container py-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Blog Post Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The blog post you're looking for doesn't exist or has been removed.</p>
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
          <Link href="/blog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </Button>
      </div>
      
      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge className={getCategoryColor(post.category)}>
              {getCategoryLabel(post.category)}
            </Badge>
            
            {post.tags?.map((tag, i) => (
              <Badge key={i} variant="outline">{tag}</Badge>
            ))}
          </div>
          
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(post.publishedAt)}
            </div>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              {post.viewCount} views
            </div>
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              {comments.length} comments
            </div>
            <div className="flex items-center">
              <Share2 className="w-4 h-4 mr-2" />
              {post.shareCount} shares
            </div>
          </div>
          
          {post.excerpt && (
            <div className="mb-6 bg-muted p-4 rounded-md italic">
              {post.excerpt}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="mr-2">
                <AvatarFallback>{getInitials(post.username || 'User')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post.username || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">Author</p>
              </div>
            </div>
            
            {post.userId === user?.id && (
              <Button variant="outline" asChild>
                <Link href={`/blog/edit/${post.id}`}>
                  <FileEdit className="w-4 h-4 mr-2" />
                  Edit Post
                </Link>
              </Button>
            )}
          </div>
        </header>
        
        <div className="prose prose-lg max-w-none mb-8">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
        
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => handleVote('upvote')}
            disabled={voteMutation.isPending}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Upvote ({post.upvotes})
          </Button>
          <Button
            variant="outline"
            onClick={() => handleVote('downvote')}
            disabled={voteMutation.isPending}
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            Downvote ({post.downvotes})
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={shareMutation.isPending}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
        
        <Separator className="my-8" />
        
        <Tabs defaultValue="comments">
          <TabsList className="mb-4">
            <TabsTrigger value="comments">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="related">
              <Globe className="w-4 h-4 mr-2" />
              Related Posts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="comments">
            {user ? (
              <form onSubmit={handleComment} className="mb-6">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="mb-2"
                />
                <Button type="submit" disabled={commentMutation.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </form>
            ) : (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <p className="text-center mb-4">Please log in to comment</p>
                  <div className="flex justify-center">
                    <Button asChild>
                      <Link href="/login">Log In</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment: BlogComment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{getInitials(comment.username || 'User')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{comment.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                              </p>
                            </div>
                          </div>
                          <p>{comment.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="related">
            {relatedPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-8 h-8 mx-auto mb-2" />
                <p>No related posts found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedPosts.map((related) => (
                  <Card key={related.id} className="flex flex-col h-full">
                    <CardHeader>
                      <Badge className={getCategoryColor(related.category)}>
                        {getCategoryLabel(related.category)}
                      </Badge>
                      <CardTitle className="line-clamp-2 text-lg">
                        <Link href={`/blog/${related.slug}`} className="hover:underline">
                          {related.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {formatDate(related.publishedAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="line-clamp-2 text-muted-foreground text-sm">
                        {related.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </article>
    </div>
  );
}