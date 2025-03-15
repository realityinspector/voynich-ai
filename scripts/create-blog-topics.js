/**
 * Script to create sample blog topic ideas for the Voynich Manuscript Analysis Platform
 * 
 * This script creates a set of predefined topics in various categories to 
 * serve as starting points for AI-generated blog posts. Each topic includes
 * a title, description, category, complexity, and a prompt template for AI.
 */

import { storage } from '../server/storage.js';

const blogTopics = [
  // Research category
  {
    title: "Linguistic Patterns in the Voynich Manuscript",
    description: "Exploration of recurring linguistic patterns found in the manuscript and how they might relate to known historical languages.",
    category: "research",
    complexity: "high",
    status: "available",
    promptTemplate: "Analyze the linguistic patterns found in the Voynich Manuscript. Consider letter frequency, word patterns, and any statistically significant linguistic structures. Compare these to known historical languages from the presumed period (15th century). Include what these patterns might suggest about the manuscript's origin and purpose. Cite relevant academic research and explain language analysis methodologies used in Voynich studies."
  },
  {
    title: "Statistical Analysis of Voynich Script Distribution",
    description: "Statistical breakdown of characters and symbols throughout the manuscript, examining frequency and positional tendencies.",
    category: "research",
    complexity: "medium",
    status: "available",
    promptTemplate: "Perform a statistical analysis of the Voynich script distribution. Include frequency analysis of characters, positional tendencies (beginning/end of lines), and how the distribution compares to natural languages. Discuss what these statistics might reveal about the manuscript's structure. Include tables or describe visualizations showing the most common characters and combinations. Relate these findings to contemporary theories about the manuscript's nature."
  },
  
  // Analysis category
  {
    title: "The Herbal Section: Plant Identification Theories",
    description: "Analysis of the plants depicted in the herbal section and the various theories about their identification.",
    category: "analysis",
    complexity: "medium",
    status: "available",
    promptTemplate: "Analyze the plant illustrations in the Voynich Manuscript's herbal section. Discuss the major theories about plant identification, including both mainstream and alternative viewpoints. Examine the artistic style of the plant illustrations and how they compare to other medieval herbals. Consider what the botanical depictions might tell us about the manuscript's purpose and origin. Include examples of specific plants and the debates surrounding their identification."
  },
  {
    title: "Astronomical Diagrams: Celestial Connections",
    description: "Detailed analysis of the astronomical diagrams in the manuscript and their potential connections to medieval astronomy.",
    category: "analysis",
    complexity: "high",
    status: "available",
    promptTemplate: "Analyze the astronomical diagrams in the Voynich Manuscript. Compare these to known medieval astronomical practices and illustrations. Examine the circular diagrams that appear to represent celestial bodies and consider their accuracy or symbolic nature. Discuss theories about whether these represent actual astronomical observations, astrological symbolism, or something else entirely. Include how these diagrams might help date or locate the manuscript's origin."
  },
  
  // History category
  {
    title: "The Journey of the Voynich Manuscript: A Timeline",
    description: "Chronological history of the manuscript's known provenance from its creation to modern times.",
    category: "history",
    complexity: "low",
    status: "available",
    promptTemplate: "Create a comprehensive timeline of the Voynich Manuscript's journey through history. Begin with theories about its creation (around 1400-1450 CE) and trace its path through various owners. Include key figures like Emperor Rudolf II, Georg Baresch, Athanasius Kircher, Wilfrid Voynich, and its current home at Yale University. For each historical period, discuss what was happening with the manuscript and any attempts to decipher it. Conclude with how modern technology has been used to study the manuscript in recent decades."
  },
  
  // Cryptography category
  {
    title: "Decryption Attempts: Methods and Failures",
    description: "Overview of the various cryptographic approaches attempted to decode the manuscript and why they have failed.",
    category: "cryptography",
    complexity: "high",
    status: "available",
    promptTemplate: "Detail the major decryption attempts applied to the Voynich Manuscript throughout history. Analyze cryptographic methods from simple substitution ciphers to modern computational approaches. Explain why these methods have failed and what these failures tell us about the nature of the text. Discuss specific researchers like William Friedman, John Tiltman, and recent computational linguists. Examine the evidence for and against the manuscript being: an elaborate hoax, an encrypted text, a constructed language, or a natural language written in a unique script."
  },
  
  // Language category
  {
    title: "Constructed Languages vs. Natural Languages in the Voynich Text",
    description: "Analysis of whether the Voynich text displays characteristics of natural or artificially constructed languages.",
    category: "language",
    complexity: "medium",
    status: "available",
    promptTemplate: "Compare the linguistic features of the Voynich Manuscript with characteristics of both natural and constructed languages. Analyze the manuscript's text for properties like Zipf's Law distribution, consistent grammar structures, and information entropy. Discuss how these features relate to known natural languages versus constructed or artificial languages. Consider historical constructed languages from the medieval period that might have influenced the manuscript. Evaluate theories suggesting the manuscript represents glossolalia, a hoax language, or an encoded natural language."
  },
  
  // Manuscript Features category
  {
    title: "The Curious Case of the Voynich Illustrations",
    description: "Detailed analysis of the illustration style, techniques, and peculiarities that make the Voynich artwork unique.",
    category: "manuscript_features",
    complexity: "medium",
    status: "available",
    promptTemplate: "Analyze the unique artistic style of the Voynich Manuscript's illustrations. Examine the techniques used for the botanical, astronomical, biological, and other drawings. Compare these to contemporary medieval manuscript traditions in Europe and elsewhere. Discuss the color palette, drawing methods, and stylistic choices. Address theories about why some illustrations appear so unusual or botanically impossible. Consider what the artistic style might tell us about the creator's background, training, and cultural influences."
  },
  
  // Community category
  {
    title: "The Voynich Community: Amateur Researchers Making Major Contributions",
    description: "Showcase of how non-academic enthusiasts have contributed significantly to Voynich manuscript research.",
    category: "community",
    complexity: "low",
    status: "available",
    promptTemplate: "Explore the vibrant community of amateur researchers who have made significant contributions to Voynich Manuscript studies. Discuss how the internet age has democratized research on this enigmatic document. Highlight specific contributions from non-academic researchers that have advanced our understanding. Examine online forums, collaboration tools, and citizen science projects focused on the manuscript. Consider the relationship between academic and amateur research in this field, including both tensions and productive collaborations. Conclude with how new technologies are enabling even broader participation in Voynich research."
  },
  
  // History + Cryptography
  {
    title: "Medieval Ciphers and the Voynich Manuscript",
    description: "Comparison of known medieval encryption methods with the potential encryption used in the Voynich manuscript.",
    category: "cryptography",
    complexity: "high",
    status: "available",
    promptTemplate: "Compare the Voynich Manuscript with documented medieval cryptographic systems. Describe encryption methods known to exist in Europe between 1400-1600, including those used by monastic orders, alchemists, and royal courts. Analyze specific medieval ciphers like the Trithemius cipher, diplomatic codes, and early polyalphabetic substitutions. For each method, evaluate whether it could potentially explain the Voynich text's properties. Consider historical context: who might have had cryptographic knowledge during this period, and for what purposes were codes typically used? Discuss whether the manuscript's physical characteristics support any particular encryption theory."
  },
  
  // Analysis + Language
  {
    title: "The Voynich Script: Character Formation and Writing System Analysis",
    description: "Detailed examination of how the characters in the Voynich script are formed and what type of writing system they might represent.",
    category: "language",
    complexity: "medium",
    status: "available",
    promptTemplate: "Analyze the character formation and writing system of the Voynich Manuscript's script. Examine the distinct character shapes, stroke patterns, and how they combine into words. Determine whether the script appears to be alphabetic, syllabic, logographic, or another system entirely. Compare the script to contemporaneous writing systems from around the world. Analyze character distribution patterns, word lengths, and repetition patterns. Discuss what these aspects might reveal about the underlying language, whether it might be phonetic or symbolic, and what linguistic tradition it might belong to."
  }
];

async function createBlogTopics() {
  try {
    console.log('Starting to create blog topic ideas...');
    
    // Check if we have any users with admin role to assign as the creator
    const hasUsers = await storage.hasAnyUsers();
    if (!hasUsers) {
      console.log('No users found in the database. Please create at least one admin user first.');
      process.exit(1);
    }
    
    // Use the first admin user as the creator
    const allUsers = await storage.db.select().from(storage.users).where(eq(storage.users.role, 'admin'));
    if (allUsers.length === 0) {
      console.log('No admin users found. Please create an admin user first.');
      process.exit(1);
    }
    
    const adminUser = allUsers[0];
    
    for (const topic of blogTopics) {
      console.log(`Creating topic: ${topic.title}`);
      
      await storage.createBlogTopicIdea({
        ...topic,
        userId: adminUser.id
      });
    }
    
    console.log('Successfully created all blog topic ideas!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating blog topic ideas:', error);
    process.exit(1);
  }
}

createBlogTopics();