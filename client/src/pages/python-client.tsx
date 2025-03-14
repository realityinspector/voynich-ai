import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Github } from "lucide-react";
import { Link } from "wouter";
import { CopyBlock, atomOneLight } from "react-code-blocks";
import { useState } from "react";

export default function PythonClient() {
  const [activeTab, setActiveTab] = useState('client');
  
  const pythonClientCode = `#!/usr/bin/env python3
"""
Voynich Manuscript Research Platform - API Client

This script provides a Python client for interacting with the Voynich Manuscript Research Platform API.
It can be used to test API functionality and as a starting point for custom integrations.

Usage:
    python voynich_api_client.py <command> [options]

Commands:
    list-pages           List manuscript pages
    get-page <id>        Get a specific manuscript page
    list-symbols <pageId> List symbols for a page
    create-symbol        Create a new symbol
    list-annotations <pageId> List annotations for a page
    create-annotation    Create a new annotation
    vote <id> <type>     Vote on an annotation (upvote/downvote)
    activity             Get activity feed
    leaderboard          Get leaderboard data
    usage                Get API usage statistics
"""

import argparse
import json
import os
import sys
import requests
from typing import Dict, Any, Optional, List, Union


class VoynichApiClient:
    """Client for interacting with the Voynich Manuscript Research Platform API."""

    def __init__(self, base_url: str, api_key: str):
        """
        Initialize the API client.

        Args:
            base_url (str): Base URL of the API (without trailing slash)
            api_key (str): API key for authentication
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    def _make_request(self, method: str, endpoint: str, params: Optional[Dict] = None, 
                     data: Optional[Dict] = None) -> Dict:
        """
        Make an HTTP request to the API.

        Args:
            method (str): HTTP method (GET, POST, etc.)
            endpoint (str): API endpoint (without leading slash)
            params (Dict, optional): Query parameters
            data (Dict, optional): Request body data

        Returns:
            Dict: Response data

        Raises:
            Exception: If the request fails
        """
        url = f"{self.base_url}/api/external/{endpoint.lstrip('/')}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=self.headers, params=params)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            # Handle response
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            print(f"API request error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    print(f"Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Status code: {e.response.status_code}")
                    print(f"Response body: {e.response.text}")
            raise

    def list_pages(self, offset: int = 0, limit: int = 20) -> Dict:
        """
        List manuscript pages.

        Args:
            offset (int, optional): Number of items to skip. Defaults to 0.
            limit (int, optional): Number of items to return. Defaults to 20.

        Returns:
            Dict: List of manuscript pages
        """
        return self._make_request('GET', 'pages', params={'offset': offset, 'limit': limit})

    def get_page(self, page_id: int) -> Dict:
        """
        Get a specific manuscript page.

        Args:
            page_id (int): ID of the manuscript page

        Returns:
            Dict: Manuscript page data
        """
        return self._make_request('GET', f'pages/{page_id}')

    def list_symbols(self, page_id: int) -> Dict:
        """
        List symbols for a specific page.

        Args:
            page_id (int): ID of the manuscript page

        Returns:
            Dict: List of symbols
        """
        return self._make_request('GET', f'symbols/page/{page_id}')

    def create_symbol(self, page_id: int, x: int, y: int, width: int, height: int, 
                     category: Optional[str] = None, metadata: Optional[Dict] = None) -> Dict:
        """
        Create a new symbol.

        Args:
            page_id (int): ID of the manuscript page
            x (int): X coordinate of the symbol
            y (int): Y coordinate of the symbol
            width (int): Width of the symbol
            height (int): Height of the symbol
            category (str, optional): Symbol category
            metadata (Dict, optional): Additional metadata

        Returns:
            Dict: Created symbol data
        """
        data = {
            'pageId': page_id,
            'x': x,
            'y': y,
            'width': width,
            'height': height
        }
        
        if category:
            data['category'] = category
        
        if metadata:
            data['metadata'] = metadata
        
        return self._make_request('POST', 'symbols', data=data)

    def list_annotations(self, page_id: int) -> Dict:
        """
        List annotations for a specific page.

        Args:
            page_id (int): ID of the manuscript page

        Returns:
            Dict: List of annotations
        """
        return self._make_request('GET', f'annotations/page/{page_id}')

    def create_annotation(self, page_id: int, x: int, y: int, width: int, height: int, 
                         content: str, is_public: bool = True) -> Dict:
        """
        Create a new annotation.

        Args:
            page_id (int): ID of the manuscript page
            x (int): X coordinate of the annotation
            y (int): Y coordinate of the annotation
            width (int): Width of the annotation area
            height (int): Height of the annotation area
            content (str): Annotation text content
            is_public (bool, optional): Whether the annotation is public. Defaults to True.

        Returns:
            Dict: Created annotation data
        """
        data = {
            'pageId': page_id,
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'content': content,
            'isPublic': is_public
        }
        
        return self._make_request('POST', 'annotations', data=data)

    def vote_on_annotation(self, annotation_id: int, vote_type: str) -> Dict:
        """
        Vote on an annotation.

        Args:
            annotation_id (int): ID of the annotation
            vote_type (str): Type of vote ('upvote' or 'downvote')

        Returns:
            Dict: Updated annotation data
        """
        if vote_type not in ['upvote', 'downvote']:
            raise ValueError("Vote type must be 'upvote' or 'downvote'")
        
        data = {
            'voteType': vote_type
        }
        
        return self._make_request('POST', f'annotations/{annotation_id}/vote', data=data)

    def get_activity_feed(self, limit: int = 20, offset: int = 0) -> Dict:
        """
        Get activity feed.

        Args:
            limit (int, optional): Number of items to return. Defaults to 20.
            offset (int, optional): Number of items to skip. Defaults to 0.

        Returns:
            Dict: Activity feed data
        """
        return self._make_request('GET', 'activity-feed', params={'limit': limit, 'offset': offset})

    def get_leaderboard(self, timeframe: str = 'weekly') -> Dict:
        """
        Get leaderboard data.

        Args:
            timeframe (str, optional): Timeframe for leaderboard data. 
                Valid values: 'daily', 'weekly', 'monthly', 'alltime'.
                Defaults to 'weekly'.

        Returns:
            Dict: Leaderboard data
        """
        valid_timeframes = ['daily', 'weekly', 'monthly', 'alltime']
        if timeframe not in valid_timeframes:
            raise ValueError(f"Timeframe must be one of: {', '.join(valid_timeframes)}")
        
        return self._make_request('GET', 'leaderboard', params={'timeframe': timeframe})

    def get_usage(self) -> Dict:
        """
        Get API usage statistics.

        Returns:
            Dict: API usage statistics
        """
        return self._make_request('GET', 'usage')`;

  const exampleUsageCode = `#!/usr/bin/env python3
"""
Voynich Manuscript Research Platform - API Usage Example

This script demonstrates a practical example of using the Voynich API client
to perform a series of operations that might be part of a research workflow.

Scenario: A researcher wants to:
1. Retrieve a specific manuscript page
2. Get all symbols on that page
3. Create an annotation for an interesting symbol
4. Get the activity feed to see recent platform activity

Usage:
    python example_api_usage.py --api-key YOUR_API_KEY [--base-url URL]
"""

import argparse
import json
import sys
from typing import Dict, Any
from voynich_api_client import VoynichApiClient


def print_section(title: str) -> None:
    """Print a formatted section title."""
    print("\\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\\n")


def print_json(data: Dict[str, Any]) -> None:
    """Print JSON data in a formatted way."""
    print(json.dumps(data, indent=2))
    print()


def run_example(api_key: str, base_url: str) -> None:
    """Run the example workflow."""
    # Initialize the API client
    client = VoynichApiClient(base_url, api_key)
    
    # Step 1: Retrieve a specific manuscript page (using page_id=1 as an example)
    print_section("Step 1: Retrieving manuscript page (ID: 1)")
    try:
        page_result = client.get_page(1)
        print("Successfully retrieved page data:")
        print_json(page_result)
    except Exception as e:
        print(f"Error retrieving page: {e}")
        return
    
    # Get the page ID for subsequent operations
    page_id = page_result.get('page', {}).get('id')
    if not page_id:
        print("Error: Could not get page ID from response")
        return
    
    # Step 2: Get all symbols on the page
    print_section(f"Step 2: Retrieving symbols for page {page_id}")
    try:
        symbols_result = client.list_symbols(page_id)
        symbol_count = len(symbols_result.get('symbols', []))
        print(f"Found {symbol_count} symbols on page {page_id}:")
        print_json(symbols_result)
    except Exception as e:
        print(f"Error retrieving symbols: {e}")
        return
    
    # Step 3: Create an annotation for an interesting area on the page
    print_section(f"Step 3: Creating an annotation on page {page_id}")
    try:
        # Define an annotation (coordinates are just an example)
        annotation_result = client.create_annotation(
            page_id=page_id,
            x=100,
            y=150,
            width=200,
            height=100,
            content="This section contains interesting plant-like symbols that may correspond to herbal remedies",
            is_public=True
        )
        print("Successfully created annotation:")
        print_json(annotation_result)
    except Exception as e:
        print(f"Error creating annotation: {e}")
        return
    
    # Step 4: Get the activity feed to see recent platform activity
    print_section("Step 4: Retrieving recent activity")
    try:
        activity_result = client.get_activity_feed(limit=5)
        print("Recent activity on the platform:")
        print_json(activity_result)
    except Exception as e:
        print(f"Error retrieving activity feed: {e}")
        return
    
    print_section("Example Workflow Complete")
    print("You have successfully completed the example workflow!")
    print("This example demonstrated the basic operations available through the Voynich API client.")
    print("\\nNext steps:")
    print("1. Explore other API endpoints like leaderboard, AI analysis, etc.")
    print("2. Integrate the client into your own research tools")
    print("3. Contribute to the Voynich Manuscript research community")


def main():
    """Main function to parse arguments and run the example."""
    parser = argparse.ArgumentParser(description='Voynich API Example Usage')
    parser.add_argument('--api-key', required=True, help='Your API key')
    parser.add_argument('--base-url', default='https://voynich-research.replit.app',
                        help='Base URL of the API (default: https://voynich-research.replit.app)')
    
    args = parser.parse_args()
    
    run_example(args.api_key, args.base_url)


if __name__ == '__main__':
    sys.exit(main())`;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/api-docs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to API Docs
          </Button>
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Python API Client</h1>
        <p className="text-muted-foreground">
          A Python client for interacting with the Voynich Manuscript Research Platform API. 
          Use this client to test API functionality or as a starting point for your own integrations.
        </p>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="client">Client Code</TabsTrigger>
          <TabsTrigger value="example">Example Usage</TabsTrigger>
          <TabsTrigger value="installation">Installation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="client" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>voynich_api_client.py</CardTitle>
              <CardDescription>
                The main API client class with methods for each API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-muted/30 p-0 overflow-auto">
              <CopyBlock
                text={pythonClientCode}
                language="python"
                theme={atomOneLight}
                showLineNumbers={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="example" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>example_api_usage.py</CardTitle>
              <CardDescription>
                Example of how to use the API client in a research workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-muted/30 p-0 overflow-auto">
              <CopyBlock
                text={exampleUsageCode}
                language="python"
                theme={atomOneLight}
                showLineNumbers={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="installation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Installation & Setup</CardTitle>
              <CardDescription>
                How to install and use the Python API client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Prerequisites</h3>
                <p className="text-muted-foreground mb-3">
                  The client requires Python 3.6+ and the following packages:
                </p>
                <div className="bg-muted/30 p-4 rounded-md font-mono text-sm">
                  pip install requests
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Setup</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Download the <code className="text-xs font-mono bg-muted/50 px-1 py-0.5 rounded">voynich_api_client.py</code> file</li>
                  <li>Save it to your project directory or Python path</li>
                  <li>Get an API key from the <Link href="/api-docs?tab=keys" className="text-primary hover:underline">API Keys tab</Link> in the API documentation</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Command-line Usage</h3>
                <p className="text-muted-foreground mb-3">
                  The client can be run directly from the command line:
                </p>
                <div className="bg-muted/30 p-4 rounded-md font-mono text-sm overflow-auto">
                  python voynich_api_client.py --api-key YOUR_API_KEY list-pages
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Integration Usage</h3>
                <p className="text-muted-foreground mb-3">
                  Import the client in your Python code:
                </p>
                <div className="bg-muted/30 p-4 rounded-md font-mono text-sm mb-4">
                  {`from voynich_api_client import VoynichApiClient

# Initialize the client
client = VoynichApiClient(
    base_url="https://voynich-research.replit.app",
    api_key="YOUR_API_KEY"
)

# Use the client
pages = client.list_pages()
print(pages)`}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button className="sm:w-auto gap-2">
                  <Download className="h-4 w-4" />
                  Download Python Client
                </Button>
                <Button variant="outline" className="sm:w-auto gap-2">
                  <Github className="h-4 w-4" />
                  View on GitHub
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}