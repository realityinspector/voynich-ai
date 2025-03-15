import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ThumbsUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  createdAt: string;
  publishedAt: string;
  viewCount: number;
  upvotes: number;
  userId: number;
  username?: string;
  featuredImage?: string;
}

function formatDate(dateString: string) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (e) {
    return 'Unknown date';
  }
}

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

export default function BlogPreview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/blog/posts'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    select: (data) => {
      // Limit to 3 posts for preview
      return {
        ...data,
        posts: data.posts?.slice(0, 3) || []
      };
    }
  });
  
  const posts = data?.posts || [];
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error || posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <h3 className="text-lg font-medium">No blog posts found</h3>
            <p className="text-muted-foreground mt-2">
              Check back soon for new articles about the Voynich Manuscript.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post: BlogPost) => (
        <Card key={post.id} className="flex flex-col h-full">
          {post.featuredImage && (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
              <img 
                src={post.featuredImage} 
                alt={post.title}
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" 
              />
            </div>
          )}
          <CardHeader className={post.featuredImage ? "pt-4" : ""}>
            <div className="flex justify-between items-start mb-2">
              <Badge className={getCategoryColor(post.category)}>
                {getCategoryLabel(post.category)}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <ThumbsUp className="w-4 h-4 mr-1" />
                <span>{post.upvotes}</span>
              </div>
            </div>
            <CardTitle className="line-clamp-2">
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </CardTitle>
            <CardDescription className="flex gap-2 items-center mt-2">
              <Clock className="w-4 h-4" />
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="line-clamp-3 text-muted-foreground">{post.excerpt}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex flex-wrap gap-2">
              {post.tags?.slice(0, 2).map((tag, i) => (
                <Badge key={i} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/blog/${post.slug}`}>
                <BookOpen className="w-4 h-4 mr-2" />
                Read
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}