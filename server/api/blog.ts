import { Request, Response, Router } from 'express';
import { isAuthenticated, isAdmin } from '../auth';
import { storage } from '../storage';
import { nanoid } from 'nanoid';
import slug from 'slug';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { blogPostStatusEnum, blogPostCategoryEnum } from '@shared/schema';

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'blog');
      // Create directory if it doesn't exist
      fs.mkdir(uploadDir, { recursive: true })
        .then(() => cb(null, uploadDir))
        .catch(err => cb(err, uploadDir));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `blog-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|svg|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed"));
  }
});

// GET /api/blog/posts - Get all published blog posts with pagination and filtering
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Get only published posts for public endpoint
    const posts = await storage.listBlogPosts({
      category, 
      tag,
      status: 'published',
      offset,
      limit
    });
    
    // Get the total count for pagination
    const allPosts = await storage.listBlogPosts({
      category,
      tag,
      status: 'published'
    });
    
    const totalCount = allPosts.length;
    
    res.json({
      posts,
      pagination: {
        offset,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Error fetching blog posts' });
  }
});

// GET /api/blog/posts/:slug - Get a single blog post by slug
router.get('/posts/:slug', async (req: Request, res: Response) => {
  try {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Increment view count
    await storage.incrementBlogPostView(post.id);
    
    // Get related posts
    const relatedPosts = await storage.getRelatedBlogPosts(post.id, 3);
    
    // Get comments
    const comments = await storage.getBlogCommentsByPost(post.id);
    
    // Get page and symbol info if they exist
    let pageInfo = null;
    let symbolInfo = null;
    
    if (post.pageId) {
      pageInfo = await storage.getManuscriptPage(post.pageId);
    }
    
    if (post.symbolId) {
      symbolInfo = await storage.getSymbol(post.symbolId);
    }
    
    // Get author info
    const author = await storage.getUser(post.userId);
    const authorData = author ? {
      id: author.id,
      username: author.username,
      institution: author.institution,
      bio: author.bio
    } : null;
    
    res.json({
      post: {
        ...post,
        author: authorData
      },
      relatedPosts,
      comments,
      pageInfo,
      symbolInfo
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Error fetching blog post' });
  }
});

// POST /api/blog/posts - Create a new blog post (authenticated)
router.post('/posts', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      excerpt, 
      content, 
      category, 
      status = 'draft',
      pageId,
      symbolId,
      metaTitle,
      metaDescription,
      tags = []
    } = req.body;
    
    // Validate required fields
    if (!title || !excerpt || !content || !category) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, excerpt, content, and category are required' 
      });
    }
    
    // Generate slug from title
    let slugText = slug(title);
    
    // Check for duplicate slug
    const existingPost = await storage.getBlogPostBySlug(slugText);
    if (existingPost) {
      // Add a unique suffix
      slugText = `${slugText}-${nanoid(6)}`;
    }
    
    const newPost = await storage.createBlogPost({
      title,
      slug: slugText,
      excerpt,
      content,
      category,
      status,
      userId: req.user!.id,
      pageId,
      symbolId,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
      tags,
      promptTemplate: req.body.promptTemplate
    });
    
    // If status is published, set publishedAt
    if (status === 'published') {
      await storage.publishBlogPost(newPost.id);
    }
    
    res.status(201).json({ post: newPost });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ message: 'Error creating blog post' });
  }
});

// PUT /api/blog/posts/:id - Update a blog post (authenticated)
router.put('/posts/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const existingPost = await storage.getBlogPost(postId);
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Check if user is the author or admin
    if (existingPost.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }
    
    const { 
      title, 
      excerpt, 
      content, 
      category,
      status,
      pageId,
      symbolId,
      metaTitle,
      metaDescription,
      tags,
      promptTemplate
    } = req.body;
    
    // If title was changed, update slug only if the post is still a draft
    let slugText = existingPost.slug;
    if (title && title !== existingPost.title && existingPost.status === 'draft') {
      slugText = slug(title);
      
      // Check for duplicate slug
      const duplicatePost = await storage.getBlogPostBySlug(slugText);
      if (duplicatePost && duplicatePost.id !== postId) {
        // Add a unique suffix
        slugText = `${slugText}-${nanoid(6)}`;
      }
    }
    
    const updateData: any = {};
    
    if (title) updateData.title = title;
    if (slugText !== existingPost.slug) updateData.slug = slugText;
    if (excerpt) updateData.excerpt = excerpt;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (status) updateData.status = status;
    if (pageId !== undefined) updateData.pageId = pageId;
    if (symbolId !== undefined) updateData.symbolId = symbolId;
    if (metaTitle) updateData.metaTitle = metaTitle;
    if (metaDescription) updateData.metaDescription = metaDescription;
    if (tags) updateData.tags = tags;
    if (promptTemplate) updateData.promptTemplate = promptTemplate;
    
    const updatedPost = await storage.updateBlogPost(postId, updateData);
    
    // If status changed to published, update publishedAt
    if (status === 'published' && existingPost.status !== 'published') {
      await storage.publishBlogPost(postId);
    }
    
    res.json({ post: updatedPost });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Error updating blog post' });
  }
});

// DELETE /api/blog/posts/:id - Delete a blog post (authenticated)
router.delete('/posts/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const existingPost = await storage.getBlogPost(postId);
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Check if user is the author or admin
    if (existingPost.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    await storage.deleteBlogPost(postId);
    
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Error deleting blog post' });
  }
});

// POST /api/blog/posts/:id/publish - Publish a blog post (authenticated)
router.post('/posts/:id/publish', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const existingPost = await storage.getBlogPost(postId);
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Check if user is the author or admin
    if (existingPost.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to publish this post' });
    }
    
    const publishedPost = await storage.publishBlogPost(postId);
    
    res.json({ post: publishedPost });
  } catch (error) {
    console.error('Error publishing blog post:', error);
    res.status(500).json({ message: 'Error publishing blog post' });
  }
});

// POST /api/blog/posts/:id/share - Record a share (anyone)
router.post('/posts/:id/share', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const existingPost = await storage.getBlogPost(postId);
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    await storage.incrementBlogPostShare(postId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording blog post share:', error);
    res.status(500).json({ message: 'Error recording blog post share' });
  }
});

// POST /api/blog/posts/:id/vote - Vote on a blog post (authenticated)
router.post('/posts/:id/vote', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const { voteType } = req.body;
    
    if (!voteType || (voteType !== 'upvote' && voteType !== 'downvote')) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }
    
    const existingPost = await storage.getBlogPost(postId);
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Create the vote
    await storage.createBlogPostVote({
      blogPostId: postId,
      userId: req.user!.id,
      voteType
    });
    
    // Get updated post
    const updatedPost = await storage.getBlogPost(postId);
    
    res.json({ post: updatedPost });
  } catch (error) {
    console.error('Error voting on blog post:', error);
    res.status(500).json({ message: 'Error voting on blog post' });
  }
});

// POST /api/blog/posts/:id/comments - Add a comment to a blog post (authenticated)
router.post('/posts/:id/comments', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const existingPost = await storage.getBlogPost(postId);
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    const comment = await storage.createBlogComment({
      blogPostId: postId,
      userId: req.user!.id,
      content
    });
    
    // Get user info
    const user = await storage.getUser(req.user!.id);
    
    res.status(201).json({ 
      comment: {
        ...comment,
        user: {
          id: user?.id,
          username: user?.username
        }
      } 
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// GET /api/blog/categories - Get all blog categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = Object.values(blogPostCategoryEnum.enumValues);
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({ message: 'Error fetching blog categories' });
  }
});

// GET /api/blog/topics - Get blog topic ideas
router.get('/topics', async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const complexity = typeof req.query.complexity === 'string' ? req.query.complexity : undefined;
    const status = req.query.status === 'all' ? undefined : 'available';
    const pageId = req.query.pageId ? parseInt(req.query.pageId as string) : undefined;
    const symbolId = req.query.symbolId ? parseInt(req.query.symbolId as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const topics = await storage.listBlogTopicIdeas({
      category,
      complexity,
      status,
      pageId,
      symbolId,
      offset,
      limit
    });
    
    res.json({ topics });
  } catch (error) {
    console.error('Error fetching blog topic ideas:', error);
    res.status(500).json({ message: 'Error fetching blog topic ideas' });
  }
});

// POST /api/blog/topics - Create a new blog topic idea (admin only)
router.post('/topics', isAdmin, async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      category, 
      description, 
      promptTemplate, 
      complexity = 'medium',
      pageId,
      symbolId
    } = req.body;
    
    if (!title || !category || !description || !promptTemplate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const topic = await storage.createBlogTopicIdea({
      title,
      category,
      description,
      promptTemplate,
      complexity,
      pageId,
      symbolId,
      status: 'available'
    });
    
    res.status(201).json({ topic });
  } catch (error) {
    console.error('Error creating blog topic idea:', error);
    res.status(500).json({ message: 'Error creating blog topic idea' });
  }
});

// POST /api/blog/generate - Generate a blog post from a topic idea using AI (authenticated)
router.post('/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { topicId } = req.body;
    
    if (!topicId) {
      return res.status(400).json({ message: 'Topic ID is required' });
    }
    
    // Get the topic idea
    const topic = await storage.getBlogTopicIdea(topicId);
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic idea not found' });
    }
    
    if (topic.status !== 'available') {
      return res.status(400).json({ message: 'This topic has already been generated or published' });
    }
    
    // Check if user has enough credits (we'll charge 3 credits for blog generation)
    const BLOG_GENERATION_COST = 3;
    const userCredits = await storage.getUserCredits(req.user!.id);
    
    if (userCredits < BLOG_GENERATION_COST) {
      return res.status(402).json({ 
        message: 'Insufficient credits', 
        creditsNeeded: BLOG_GENERATION_COST,
        creditsAvailable: userCredits
      });
    }
    
    // Create a draft blog post
    const blogPost = await storage.autoGenerateBlogPostFromIdea(topicId, req.user!.id);
    
    // We'll implement the actual content generation in a separate step
    // Here we're just returning the draft post
    
    res.json({ 
      post: blogPost,
      message: 'Blog post draft created. Content generation is in progress.' 
    });
  } catch (error) {
    console.error('Error generating blog post:', error);
    res.status(500).json({ message: 'Error generating blog post' });
  }
});

// POST /api/blog/upload - Upload an image for a blog post (authenticated)
router.post('/upload', isAuthenticated, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    
    // Return the path to the uploaded file
    const imagePath = `/uploads/blog/${req.file.filename}`;
    
    res.json({ 
      imageUrl: imagePath,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// GET /api/blog/dashboard - Get blog dashboard stats for the authenticated user
router.get('/dashboard', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Get user's posts
    const userPosts = await storage.listBlogPosts({ userId: req.user!.id });
    
    // Count drafts, published, total views
    const stats = {
      totalPosts: userPosts.length,
      publishedPosts: userPosts.filter(p => p.status === 'published').length,
      draftPosts: userPosts.filter(p => p.status === 'draft').length,
      totalViews: userPosts.reduce((sum, post) => sum + post.viewCount, 0),
      totalShares: userPosts.reduce((sum, post) => sum + post.shareCount, 0),
      totalUpvotes: userPosts.reduce((sum, post) => sum + post.upvotes, 0),
      mostPopularPosts: userPosts
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5)
        .map(p => ({ 
          id: p.id, 
          title: p.title, 
          slug: p.slug, 
          views: p.viewCount,
          status: p.status
        }))
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching blog dashboard:', error);
    res.status(500).json({ message: 'Error fetching blog dashboard' });
  }
});

export default router;