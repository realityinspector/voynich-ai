# Voynich Manuscript Research Platform

## About the Project
The Voynich Manuscript Research Platform is an advanced AI-powered tool designed to facilitate deep scholarly analysis of the Voynich Manuscript through cutting-edge technological integrations. This platform brings together machine learning, computer vision, and a collaborative research environment to help scholars unravel the mysteries of one of history's most enigmatic documents.

## Key Features

### 📚 Manuscript Visualization
- High-resolution manuscript page viewer
- Intuitive navigation between folios
- Detailed page metadata and section categorization
- Section-based filtering (herbal, astronomical, biological, etc.)

### 🔍 Symbol Extraction & Analysis
- Automated symbol extraction using computer vision algorithms
- Customizable extraction parameters for different manuscript sections
- Symbol frequency analysis and pattern recognition
- Symbol categorization and annotation capabilities

### 🤖 AI-Powered Analysis
- Together AI integration for advanced pattern recognition
- Custom AI prompts for specialized research questions
- AI-assisted translation attempts and pattern analysis
- Save, share, and collaborate on analysis results

### ✏️ Collaborative Research Tools
- User-created annotations on manuscript pages
- Upvoting/downvoting system for community verification
- Research notes with selective sharing options
- Activity feed showing community contributions
- Leaderboard to recognize top contributors

### 🔑 API Access
- API keys for programmatic access to manuscript data
- Comprehensive API documentation
- Usage tracking and management

### 👥 User Roles and Access Tiers
- **Researchers**: The default role for new users. Can browse the manuscript, view symbols, and read public annotations. Focus on research consumption.
- **Contributors**: Can create annotations, notes, and run basic analysis. Enables active participation in the research community.
- **Administrators**: Have full access to upload pages, extract symbols, and manage the platform. Limited to designated users like "realityinspector".

## Technical Architecture
- TypeScript/Node.js backend with Express
- React frontend with modern UI components
- PostgreSQL database for structured data storage
- Computer vision algorithms for symbol extraction
- AI integration for advanced analysis features

## Getting Started
1. Register for an account to gain access to the platform
2. Browse the manuscript pages in the viewer
3. Explore existing symbols and annotations
4. Create your own annotations and notes
5. Use AI tools to analyze patterns and propose interpretations

## Administrator Setup
To grant administrator privileges to a user (e.g., "realityinspector"):

```bash
# Run the admin setup script
node scripts/set-admin.js realityinspector
```

This script will update the user's role to "admin" in the database, allowing them to:
- Upload new manuscript pages
- Extract symbols from pages using computer vision
- Access administrative settings
- Manage user permissions

## Join the Research Community
The Voynich Manuscript has puzzled scholars for centuries. By joining our platform, you become part of a collaborative effort to decode this mysterious document through the combined power of human expertise and artificial intelligence.