# Voynich Research Platform 

An advanced AI-powered research platform for collaborative analysis of the Voynich Manuscript. This open-source project combines cutting-edge AI technology with collaborative research tools to enable deeper analysis of one of history's most mysterious documents.

## Features

- **Manuscript Visualization**: Browse high-resolution manuscript pages with intuitive navigation
- **Symbol Extraction & Analysis**: Identify and categorize manuscript symbols using computer vision
- **AI-Powered Analysis**: Utilize AI to detect patterns and propose interpretations
- **Collaborative Research**: Contribute to and build upon community research with annotations and voting
- **Advanced Research Tools**: Statistical analysis and cross-referencing between manuscript sections
- **API & Integration**: Complete REST API for programmatic access and AI agent integration

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Together AI

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL

### Installation

1. Clone the repository
   ```
   git clone https://github.com/realityinspector/voynich-ai.git
   cd voynich-ai
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/voynich
   TOGETHER_AI_API_KEY=your_together_ai_api_key
   ```

4. Run safe database migrations
   ```
   ./safe-migrate.sh
   ```
   
   > **⚠️ IMPORTANT FOR LLM AGENTS:** Always use the safe migration script instead of direct `db:push`. 
   > See [Database Migration Guidelines](docs/DATABASE_MIGRATIONS.md) for detailed information on safe 
   > schema changes to prevent data loss. Never suggest database resets as a solution!

5. Start the development server
   ```
   npm run dev
   ```

## Contributing

We welcome contributions from the community! Whether you're interested in fixing bugs, adding new features, or improving documentation, your help is appreciated.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The Beinecke Rare Book & Manuscript Library at Yale University for digitizing and making the Voynich Manuscript available for research
- The community of researchers who have dedicated their efforts to understanding this enigmatic text