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
  CheckCircle
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
      {/* Header */}
      <header className="relative z-10 border-b bg-background flex items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-semibold">Voynich Research Platform</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline">Log In</Button>
          </Link>
          <Link href="/register">
            <Button>Register</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 bg-gradient-to-br from-primary-50 to-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight mb-4">
                Decode History's Most Mysterious Document
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Join our collaborative platform to analyze and unravel the mysteries of the Voynich Manuscript using advanced AI and computer vision technologies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Join the Research
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden border shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/20"></div>
              <VoynichPageSVG width={500} height={600} className="w-full" />
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
            Join the Quest to Decipher the Voynich Manuscript
          </h2>
          <p className="text-primary-200 mb-8 text-lg">
            Become part of the global research community working to unlock the secrets of history's most mysterious document.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-primary-200 text-white hover:bg-primary-800 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
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
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Voynich Research Platform. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}