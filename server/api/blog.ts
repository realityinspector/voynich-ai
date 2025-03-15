import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from '../auth';
import { z } from 'zod';
import slug from 'slug';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { insertBlogPostSchema, insertBlogCommentSchema, insertBlogTopicIdeaSchema } from '../../shared/schema';

const router = Router();

// Configure file upload middleware
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'public', 'blog-images');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'blog-' + uniqueSuffix + ext);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only image files are allowed!'));
  },
});

// Get list of blog posts with pagination
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category as string;
    const tag = req.query.tag as string;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    
    const options = {
      category,
      tag,
      userId,
      status: 'published', // Only show published posts by default
      offset,
      limit
    };
    
    // If user is requesting their own posts, include drafts
    if (req.user && userId === req.user.id) {
      options.status = undefined;
    }
    
    const posts = await storage.listBlogPosts(options);
    
    // Count total for pagination
    const totalPosts = posts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    
    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalPosts
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Error fetching blog posts' });
  }
});

// Get a blog post by slug
router.get('/posts/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const post = await storage.getBlogPostBySlug(slug);
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Check if the post is not published and the user is not the author or admin
    if (post.status !== 'published' && 
        (!req.user || (req.user.id !== post.userId && req.user.role !== 'admin'))) {
      return res.status(403).json({ message: 'You do not have permission to view this post' });
    }
    
    // Increment view count
    await storage.incrementBlogPostView(post.id);
    
    // Get comments for the post
    const comments = await storage.getBlogCommentsByPost(post.id);
    
    // Get related posts
    const relatedPosts = await storage.getRelatedBlogPosts(post.id);
    
    res.json({
      post,
      comments,
      relatedPosts
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Error fetching blog post' });
  }
});

// Create a new blog post
router.post('/posts', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const postData = insertBlogPostSchema.parse({
      ...req.body,
      userId: req.user.id,
      status: req.body.status || 'draft'
    });
    
    // Generate slug from title if not provided
    if (!postData.slug) {
      postData.slug = slug(postData.title, { lower: true });
    }
    
    const post = await storage.createBlogPost(postData);
    
    res.status(201).json({ post });
  } catch (error) {
    console.error('Error creating blog post:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid post data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Error creating blog post' });
    }
  }
});

// Update an existing blog post
router.put('/posts/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const post = await storage.getBlogPost(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Only allow the author or admin to update
    if (post.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to update this post' });
    }
    
    // Update the post
    const updatedPost = await storage.updateBlogPost(id, req.body);
    
    res.json({ post: updatedPost });
  } catch (error) {
    console.error('Error updating blog post:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid post data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Error updating blog post' });
    }
  }
});

// Delete a blog post
router.delete('/posts/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const post = await storage.getBlogPost(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Only allow the author or admin to delete
    if (post.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to delete this post' });
    }
    
    await storage.deleteBlogPost(id);
    
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Error deleting blog post' });
  }
});

// Publish a blog post
router.post('/posts/:id/publish', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const post = await storage.getBlogPost(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Only allow the author or admin to publish
    if (post.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to publish this post' });
    }
    
    const publishedPost = await storage.publishBlogPost(id);
    
    res.json({ post: publishedPost });
  } catch (error) {
    console.error('Error publishing blog post:', error);
    res.status(500).json({ message: 'Error publishing blog post' });
  }
});

// Record a share action
router.post('/posts/:id/share', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    await storage.incrementBlogPostShare(id);
    
    res.json({ message: 'Share recorded successfully' });
  } catch (error) {
    console.error('Error recording share:', error);
    res.status(500).json({ message: 'Error recording share' });
  }
});

// Vote on a blog post
router.post('/posts/:id/vote', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { voteType } = req.body;
    
    if (voteType !== 'upvote' && voteType !== 'downvote') {
      return res.status(400).json({ message: 'Invalid vote type' });
    }
    
    // Check if user has already voted
    const existingVote = await storage.getBlogPostVote(id, req.user.id);
    
    if (existingVote && existingVote.voteType === voteType) {
      return res.status(400).json({ message: 'You have already voted this way' });
    }
    
    // Create or update vote
    await storage.createBlogPostVote({
      blogPostId: id,
      userId: req.user.id,
      voteType
    });
    
    // Get updated post
    const post = await storage.getBlogPost(id);
    
    res.json({ post });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ message: 'Error recording vote' });
  }
});

// Add a comment to a blog post
router.post('/posts/:id/comments', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const blogPostId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const commentData = insertBlogCommentSchema.parse({
      blogPostId,
      userId: req.user.id,
      content: content.trim()
    });
    
    const comment = await storage.createBlogComment(commentData);
    
    res.status(201).json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid comment data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Error creating comment' });
    }
  }
});

// Get available categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    // We have hardcoded categories in the database schema
    const categories = [
      'research', 
      'analysis', 
      'history', 
      'cryptography', 
      'language', 
      'manuscript_features', 
      'community'
    ];
    
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get topic ideas
router.get('/topics', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const complexity = req.query.complexity as string;
    const status = 'available'; // Only show available topics
    
    const options = {
      category,
      complexity,
      status
    };
    
    const topics = await storage.listBlogTopicIdeas(options);
    
    res.json({ topics });
  } catch (error) {
    console.error('Error fetching topic ideas:', error);
    res.status(500).json({ message: 'Error fetching topic ideas' });
  }
});

// Create a new topic idea (admin only)
router.post('/topics', isAdmin, async (req: Request, res: Response) => {
  try {
    const topicData = insertBlogTopicIdeaSchema.parse({
      ...req.body,
      userId: req.user.id,
      status: 'available'
    });
    
    const topic = await storage.createBlogTopicIdea(topicData);
    
    res.status(201).json({ topic });
  } catch (error) {
    console.error('Error creating topic idea:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid topic data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Error creating topic idea' });
    }
  }
});

// Generate blog post from topic idea
router.post('/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { topicId } = req.body;
    
    if (!topicId) {
      return res.status(400).json({ message: 'Topic ID is required' });
    }
    
    // Parse the topic ID to an integer
    const parsedTopicId = parseInt(topicId);
    
    // Use the storage method that handles all the blog post generation logic
    // This will create a well-structured post with tags, excerpts, etc.
    const post = await storage.autoGenerateBlogPostFromIdea(parsedTopicId, req.user.id);
    
    // Return the generated post
    res.json({ post });
  } catch (error) {
    console.error('Error generating blog post:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: `Error generating blog post: ${error.message}` });
    } else {
      res.status(500).json({ message: 'Error generating blog post' });
    }
  }
});

// Upload an image for a blog post
router.post('/upload', isAuthenticated, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    
    const imageUrl = `/blog-images/${req.file.filename}`;
    
    res.json({
      url: imageUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Get dashboard stats for a user's blog activity
router.get('/dashboard', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Get user's blog posts
    const allPosts = await storage.listBlogPosts({ userId });
    
    // Group posts by status
    const published = allPosts.filter(post => post.status === 'published');
    const drafts = allPosts.filter(post => post.status === 'draft');
    const archived = allPosts.filter(post => post.status === 'archived');
    
    // Calculate total views and shares
    const totalViews = allPosts.reduce((sum, post) => sum + post.viewCount, 0);
    const totalShares = allPosts.reduce((sum, post) => sum + post.shareCount, 0);
    const totalUpvotes = allPosts.reduce((sum, post) => sum + post.upvotes, 0);
    
    // Get most viewed posts (top 5)
    const mostViewed = [...allPosts]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);
    
    // Get most upvoted posts (top 5)
    const mostUpvoted = [...allPosts]
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 5);
    
    res.json({
      stats: {
        totalPosts: allPosts.length,
        published: published.length,
        drafts: drafts.length,
        archived: archived.length,
        totalViews,
        totalShares,
        totalUpvotes
      },
      mostViewed,
      mostUpvoted
    });
  } catch (error) {
    console.error('Error fetching blog dashboard:', error);
    res.status(500).json({ message: 'Error fetching blog dashboard' });
  }
});

// Content regeneration endpoint
router.post('/regenerate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { postId, section, currentData } = req.body;
    
    if (!postId || !section || !currentData) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Get the existing post to verify ownership
    const post = await storage.getBlogPost(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Check if the user owns the post or is an admin
    if (post.userId !== (req.user as any).id && (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to regenerate content for this post' });
    }
    
    // Generate content based on the section requested
    let prompt = '';
    let generatedContent = '';
    
    // Prepare the appropriate prompt based on the section
    const { title, content, category, tags } = currentData;
    
    switch (section) {
      case 'intro':
        prompt = `Generate an engaging introduction for a scholarly blog post titled "${title}" in the category of ${category}. 
                  The post is about the Voynich Manuscript and falls into these topics: ${tags.join(', ')}.
                  Write only the introduction paragraph (with HTML formatting), and make it compelling and scholarly.`;
        break;
      case 'conclusion':
        prompt = `Generate a thoughtful conclusion for a scholarly blog post titled "${title}" in the category of ${category}. 
                  The post is about the Voynich Manuscript and covers these topics: ${tags.join(', ')}.
                  Write only the conclusion paragraph (with HTML formatting), summarizing key points and offering final thoughts.`;
        break;
      case 'body':
        prompt = `Generate the main content section for a scholarly blog post titled "${title}" in the category of ${category}. 
                  The post is about the Voynich Manuscript and covers these topics: ${tags.join(', ')}.
                  Write 2-3 well-structured paragraphs (with HTML formatting) that would form the main body of the article.
                  Include relevant scholarly analysis and insights.`;
        break;
      case 'all':
      default:
        prompt = `Generate a complete scholarly blog post titled "${title}" in the category of ${category}. 
                  The post is about the Voynich Manuscript and should cover these topics: ${tags.join(', ')}.
                  Structure the content with proper HTML formatting (<p>, <h2>, <h3>, <ul>, <li> tags, etc.)
                  Include an engaging introduction, 3-4 main content sections with headings, and a thoughtful conclusion.
                  The tone should be academic but accessible, and the content should be informative and insightful.`;
        break;
    }
    
    // Use an AI service to generate the content based on the prompt
    // This is a mock implementation. In a real app, you would use an AI API
    // like OpenAI or a similar service to generate the content
    
    // Example format for a complete blog post
    if (section === 'all') {
      generatedContent = `
<h2>Introduction to ${title}</h2>
<p>The Voynich Manuscript continues to be one of history's most enduring enigmas. This article explores ${tags.join(', ')} in relation to this mysterious text, providing new insights into its complex nature.</p>

<h2>Historical Context</h2>
<p>The manuscript, dating from the early 15th century, has defied conventional analysis for generations. Scholars from various disciplines have attempted to decode its unusual script and understand its elaborate illustrations.</p>

<h3>Prior Research</h3>
<p>Previous studies in ${category} have established several important baselines for understanding the manuscript. However, many questions remain unanswered, particularly regarding the ${tags[0] || 'symbology'} found throughout the text.</p>

<h2>Key Findings</h2>
<p>Recent analysis reveals fascinating patterns in the manuscript's structure. The frequency and distribution of certain symbols suggest a sophisticated system of representation that may be tied to ${tags[1] || 'medieval scientific knowledge'}.</p>
<ul>
  <li>The manuscript contains repeating patterns that appear too structured to be random</li>
  <li>Certain symbol combinations appear exclusively in specific sections</li>
  <li>The visual elements show remarkable consistency throughout</li>
</ul>

<h2>Implications for Understanding the Manuscript</h2>
<p>These observations have significant implications for how we interpret the Voynich Manuscript. Rather than dismissing it as a hoax or an indecipherable curiosity, this analysis suggests it represents a coherent system of knowledge, albeit one encoded in an unfamiliar notation system.</p>

<h2>Conclusion</h2>
<p>While complete translation remains elusive, this examination of ${title} provides valuable context for future research. By continuing to apply interdisciplinary methods and advanced analytical techniques, we move closer to understanding this remarkable artifact and its place in the history of human knowledge.</p>`;
    } else if (section === 'intro') {
      generatedContent = `<h2>Introduction to ${title}</h2>
<p>The Voynich Manuscript continues to be one of history's most enduring enigmas. This article explores ${tags.join(', ')} in relation to this mysterious text, providing new insights into its complex nature. Scholars have long been fascinated by the manuscript's unusual characteristics, and this investigation contributes to the ongoing scholarly conversation by examining specific aspects that have received less attention in previous studies.</p>`;
    } else if (section === 'conclusion') {
      generatedContent = `<h2>Conclusion</h2>
<p>While complete translation remains elusive, this examination of ${title} provides valuable context for future research. By continuing to apply interdisciplinary methods and advanced analytical techniques, we move closer to understanding this remarkable artifact and its place in the history of human knowledge. The convergence of ${tags.join(', ')} approaches may ultimately yield the breakthrough that researchers have sought for centuries.</p>`;
    } else if (section === 'body') {
      generatedContent = `<h2>Key Findings</h2>
<p>Recent analysis reveals fascinating patterns in the manuscript's structure. The frequency and distribution of certain symbols suggest a sophisticated system of representation that may be tied to ${tags[1] || 'medieval scientific knowledge'}.</p>
<ul>
  <li>The manuscript contains repeating patterns that appear too structured to be random</li>
  <li>Certain symbol combinations appear exclusively in specific sections</li>
  <li>The visual elements show remarkable consistency throughout</li>
</ul>

<h2>Implications for Understanding the Manuscript</h2>
<p>These observations have significant implications for how we interpret the Voynich Manuscript. Rather than dismissing it as a hoax or an indecipherable curiosity, this analysis suggests it represents a coherent system of knowledge, albeit one encoded in an unfamiliar notation system.</p>`;
    }
    
    res.json({ content: generatedContent, section });
    
  } catch (error) {
    console.error('Error regenerating content:', error);
    res.status(500).json({ message: 'Error regenerating content' });
  }
});

export default router;