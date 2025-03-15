import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';
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
import { ChevronLeft, ChevronRight, BookOpen, Clock, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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

export default function BlogList() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/blog/posts', { category, page }],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });
  
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/blog/categories'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });
  
  const posts = data?.posts || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1 };
  const categories = categoriesData?.categories || [];
  
  function handleCategoryChange(value: string) {
    setCategory(value === 'all' ? undefined : value);
    setPage(1);
  }
  
  function handlePrevPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }
  
  function handleNextPage() {
    if (page < pagination.totalPages) {
      setPage(page + 1);
    }
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
            <CardTitle className="text-red-600">Error Loading Blog Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the blog posts. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Voynich Manuscript Blog</h1>
        <div className="flex items-center gap-4">
          <Select onValueChange={handleCategoryChange} value={category || 'all'}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat: string) => (
                <SelectItem key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {user && (
            <Button asChild>
              <Link href="/blog/topics">Generate New Post</Link>
            </Button>
          )}
        </div>
      </div>
      
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h3 className="text-lg font-medium">No blog posts found</h3>
              <p className="text-muted-foreground mt-2">
                {category
                  ? `No posts found in the ${getCategoryLabel(category)} category.`
                  : 'No blog posts have been published yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: BlogPost) => (
            <Card key={post.id} className="flex flex-col h-full">
              <CardHeader>
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
                  {post.tags?.slice(0, 3).map((tag, i) => (
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
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <span className="mx-4">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={page >= pagination.totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}