import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Puzzle, 
  BrainCircuit, 
  Users, 
  Microscope, 
  Database, 
  Key,
  ScrollText,
  ArrowRight,
  CheckCircle,
  Github
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { VoynichPageSVG } from "@/components/VoynichPageSVG";
import { 
  BotanicalSymbol, 
  AstronomicalSymbol, 
  CosmologicalSymbol, 
  PharmaceuticalSymbol 
} from "@/components/VoynichSymbols";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Alpha Banner */}
      <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 font-medium">
        ⚠️ Alpha Software - This platform is still in active development
      </div>
      
      {/* Header */}
      <header className="relative z-10 border-b bg-background flex items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-semibold">Voynich Research Platform</span>
        </div>
        <nav className="ml-auto flex items-center gap-6">
          <Link href="/api-docs" className="text-muted-foreground hover:text-foreground transition-colors">
            API Docs
          </Link>
          <a
            href="https://github.com/realityinspector/voynich-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 bg-gradient-to-br from-primary-50 to-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight mb-4">
                Decode History's Most Mysterious Document with AI
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform provides a robust API that enables AI agents to analyze and unravel the mysteries of the Voynich Manuscript using advanced computer vision and pattern recognition technologies.
              </p>
              <div>
                <Link href="/api-docs">
                  <Button size="lg" className="w-full sm:w-auto">
                    Explore the API
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative flex flex-col items-center">
              <div className="relative rounded-lg overflow-hidden border shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/20"></div>
                <VoynichPageSVG width={500} height={600} className="w-full" />
              </div>
              <p className="text-center text-muted-foreground mt-2 italic text-sm">
                AI Generated Synthetic Voynich Page
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-heading mb-4">Platform Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with collaborative research tools to enable deeper analysis of the Voynich Manuscript.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card>
              <CardHeader className="pb-2">
                <BookOpen className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Manuscript Visualization</CardTitle>
                <CardDescription>
                  Browse high-resolution pages with intuitive navigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>High-quality digitized manuscript pages</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Section-based categorization and filtering</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Detailed page metadata and information</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card>
              <CardHeader className="pb-2">
                <Puzzle className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Symbol Extraction & Analysis</CardTitle>
                <CardDescription>
                  Identify and categorize manuscript symbols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Automated symbol extraction with computer vision</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Symbol categorization and frequency analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Pattern recognition across manuscript pages</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card>
              <CardHeader className="pb-2">
                <BrainCircuit className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Utilize AI to detect patterns and propose interpretations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Together AI integration for pattern recognition</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Custom AI prompts for specialized research</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Translation attempts and meaning extraction</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card>
              <CardHeader className="pb-2">
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Collaborative Research</CardTitle>
                <CardDescription>
                  Contribute to and build upon community research
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>User annotations with community voting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Research notes with selective sharing</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Activity feed and research leaderboards</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card>
              <CardHeader className="pb-2">
                <Microscope className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Advanced Research Tools</CardTitle>
                <CardDescription>
                  Specialized tools for manuscript analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Statistical analysis of symbol distribution</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Cross-referencing between manuscript sections</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Visual heatmaps of symbol frequency</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card>
              <CardHeader className="pb-2">
                <Database className="h-10 w-10 text-primary mb-2" />
                <CardTitle>API & Integration</CardTitle>
                <CardDescription>
                  Extend research capabilities with API access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>API keys for programmatic access</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Comprehensive API documentation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                    <span>Usage tracking and management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="px-6 py-20 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-heading mb-4">API for AI Agents</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive REST API designed for AI agents to access, analyze, and contribute to Voynich Manuscript research.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-medium">Empower AI Agents for Manuscript Research</h3>
              <p className="text-muted-foreground">
                Structured endpoints designed specifically for AI agents to access, process, and contribute to Voynich Manuscript analysis.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-0.5 shrink-0 mr-3">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">AI-Accessible Symbol Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Structured symbol representations with positional coordinates and classification metadata
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-0.5 shrink-0 mr-3">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">Machine Learning Integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Endpoints optimized for AI agents to apply language models and pattern recognition
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-0.5 shrink-0 mr-3">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">Collective Intelligence</h4>
                    <p className="text-sm text-muted-foreground">
                      API design allowing AI agents to collaborate and build upon each other's findings
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Link href="/api-docs">
                  <Button className="gap-2">
                    View Full API Documentation
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="lg:col-span-3 overflow-hidden rounded-lg border bg-card shadow">
              <div className="border-b bg-muted/50 px-4 py-2 font-mono text-sm flex justify-between items-center">
                <span>Example: Fetch Manuscript Page</span>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                </div>
              </div>
              <div className="overflow-auto bg-black p-4 font-mono text-sm text-white">
                <pre className="whitespace-pre-wrap">
{`// Fetch a specific manuscript page by ID
const fetchPage = async (pageId) => {
  const response = await fetch(\`https://api.voynich-research.com/v1/pages/\${pageId}\`, {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch page data');
  }
  
  const pageData = await response.json();
  
  console.log(\`Loaded page \${pageData.folioNumber}\`);
  console.log(\`Section: \${pageData.section}\`);
  console.log(\`Dimensions: \${pageData.width}x\${pageData.height}\`);
  
  // Now fetch symbols for this page
  const symbolsResponse = await fetch(
    \`https://api.voynich-research.com/v1/symbols/page/\${pageId}\`,
    {
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      }
    }
  );
  
  const symbols = await symbolsResponse.json();
  
  console.log(\`Found \${symbols.length} symbols on this page\`);
  console.log(\`Categories: \${[...new Set(symbols.map(s => s.category))].join(', ')}\`);
  
  return { page: pageData, symbols };
};

// Example usage
fetchPage(42)
  .then(({ page, symbols }) => {
    // Process the page data and symbols in your application
    renderVoynichPage(page, symbols);
  })
  .catch(error => console.error('Error:', error));`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Symbol Gallery Section */}
      <section className="px-6 py-20 bg-primary-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-heading mb-4">Voynich Manuscript Symbols</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore the fascinating and mysterious symbols found throughout the Voynich Manuscript.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Symbol 1 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6 bg-[#f8f3e6] flex justify-center items-center h-40">
                <BotanicalSymbol width={80} height={80} />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-medium text-center">Botanical Symbol</h3>
                <p className="text-sm text-muted-foreground text-center">Commonly found in herbal sections</p>
              </CardContent>
            </Card>

            {/* Symbol 2 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6 bg-[#f8f3e6] flex justify-center items-center h-40">
                <AstronomicalSymbol width={80} height={80} />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-medium text-center">Astronomical Symbol</h3>
                <p className="text-sm text-muted-foreground text-center">Present in astronomical charts</p>
              </CardContent>
            </Card>

            {/* Symbol 3 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6 bg-[#f8f3e6] flex justify-center items-center h-40">
                <CosmologicalSymbol width={80} height={80} />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-medium text-center">Cosmological Symbol</h3>
                <p className="text-sm text-muted-foreground text-center">Found in cosmological diagrams</p>
              </CardContent>
            </Card>

            {/* Symbol 4 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6 bg-[#f8f3e6] flex justify-center items-center h-40">
                <PharmaceuticalSymbol width={80} height={80} />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-medium text-center">Pharmaceutical Symbol</h3>
                <p className="text-sm text-muted-foreground text-center">Related to pharmaceutical recipes</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/symbols">
              <Button size="lg">
                Explore Full Symbol Gallery
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-primary-900 text-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
            Empowering AI Agents to Decode the Voynich Manuscript
          </h2>
          <p className="text-primary-200 mb-8 text-lg">
            Our API enables AI agents to access, analyze, and contribute to the decoding of history's most enigmatic document through structured data and advanced pattern recognition.
          </p>
          <div className="flex justify-center">
            <Link href="/api-docs">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Explore the API Documentation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="px-6 py-16 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-heading mb-4">Open Source Project</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The Voynich Research Platform is an open source project designed to foster collaboration and innovation in deciphering one of history's most enigmatic manuscripts.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-1 shrink-0 mr-4">
                  <Github className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">GitHub Repository</h3>
                  <p className="text-muted-foreground mb-3">
                    Our entire codebase is available on GitHub. Fork the repository, submit pull requests, and help improve the platform for everyone.
                  </p>
                  <a 
                    href="https://github.com/realityinspector/voynich-ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    Visit the GitHub repository
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-1 shrink-0 mr-4">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Community-Driven Research</h3>
                  <p className="text-muted-foreground">
                    Join our community of researchers, developers, linguists, and AI enthusiasts working together to unravel the mystery of the Voynich Manuscript through technology.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-1 shrink-0 mr-4">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">MIT Licensed</h3>
                  <p className="text-muted-foreground">
                    Our project is available under the MIT license, allowing you to freely use, modify, and distribute the code for both personal and commercial projects.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-1 shrink-0 mr-4">
                  <ScrollText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Open Data Approach</h3>
                  <p className="text-muted-foreground">
                    We're committed to open research principles, making manuscript data, symbol analysis, and AI findings accessible to all for the advancement of knowledge.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 bg-background border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Logo size={24} />
              <span className="text-lg font-semibold">Voynich Research Platform</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex items-center gap-4">
                <a 
                  href="https://github.com/realityinspector/voynich-ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Github className="h-5 w-5" />
                  <span>GitHub</span>
                </a>
                <Link href="/api-docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  API Docs
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Voynich Research Platform. Open Source under MIT License.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}