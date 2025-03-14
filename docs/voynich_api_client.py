#!/usr/bin/env python3
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
        return self._make_request('GET', 'usage')


def format_json_output(data: Dict) -> str:
    """Format JSON data for display."""
    return json.dumps(data, indent=2)


def main():
    """Main function for command-line interface."""
    parser = argparse.ArgumentParser(description='Voynich Manuscript Research Platform API Client')
    parser.add_argument('--base-url', default=os.environ.get('VOYNICH_API_URL', 'http://localhost:3000'),
                        help='Base URL of the API (default: from VOYNICH_API_URL env var or http://localhost:3000)')
    parser.add_argument('--api-key', default=os.environ.get('VOYNICH_API_KEY', ''),
                        help='API key for authentication (default: from VOYNICH_API_KEY env var)')
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # List Pages
    list_pages_parser = subparsers.add_parser('list-pages', help='List manuscript pages')
    list_pages_parser.add_argument('--offset', type=int, default=0, help='Number of items to skip')
    list_pages_parser.add_argument('--limit', type=int, default=20, help='Number of items to return')
    
    # Get Page
    get_page_parser = subparsers.add_parser('get-page', help='Get a specific manuscript page')
    get_page_parser.add_argument('id', type=int, help='ID of the manuscript page')
    
    # List Symbols
    list_symbols_parser = subparsers.add_parser('list-symbols', help='List symbols for a page')
    list_symbols_parser.add_argument('page_id', type=int, help='ID of the manuscript page')
    
    # Create Symbol
    create_symbol_parser = subparsers.add_parser('create-symbol', help='Create a new symbol')
    create_symbol_parser.add_argument('--page-id', type=int, required=True, help='ID of the manuscript page')
    create_symbol_parser.add_argument('--x', type=int, required=True, help='X coordinate')
    create_symbol_parser.add_argument('--y', type=int, required=True, help='Y coordinate')
    create_symbol_parser.add_argument('--width', type=int, required=True, help='Width')
    create_symbol_parser.add_argument('--height', type=int, required=True, help='Height')
    create_symbol_parser.add_argument('--category', help='Symbol category')
    create_symbol_parser.add_argument('--metadata', type=json.loads, help='Additional metadata (JSON)')
    
    # List Annotations
    list_annotations_parser = subparsers.add_parser('list-annotations', help='List annotations for a page')
    list_annotations_parser.add_argument('page_id', type=int, help='ID of the manuscript page')
    
    # Create Annotation
    create_annotation_parser = subparsers.add_parser('create-annotation', help='Create a new annotation')
    create_annotation_parser.add_argument('--page-id', type=int, required=True, help='ID of the manuscript page')
    create_annotation_parser.add_argument('--x', type=int, required=True, help='X coordinate')
    create_annotation_parser.add_argument('--y', type=int, required=True, help='Y coordinate')
    create_annotation_parser.add_argument('--width', type=int, required=True, help='Width')
    create_annotation_parser.add_argument('--height', type=int, required=True, help='Height')
    create_annotation_parser.add_argument('--content', required=True, help='Annotation text content')
    create_annotation_parser.add_argument('--public', action='store_true', default=True, help='Whether the annotation is public')
    
    # Vote on Annotation
    vote_parser = subparsers.add_parser('vote', help='Vote on an annotation')
    vote_parser.add_argument('id', type=int, help='ID of the annotation')
    vote_parser.add_argument('type', choices=['upvote', 'downvote'], help='Type of vote')
    
    # Activity Feed
    activity_parser = subparsers.add_parser('activity', help='Get activity feed')
    activity_parser.add_argument('--limit', type=int, default=20, help='Number of items to return')
    activity_parser.add_argument('--offset', type=int, default=0, help='Number of items to skip')
    
    # Leaderboard
    leaderboard_parser = subparsers.add_parser('leaderboard', help='Get leaderboard data')
    leaderboard_parser.add_argument('--timeframe', choices=['daily', 'weekly', 'monthly', 'alltime'], 
                                  default='weekly', help='Timeframe for leaderboard data')
    
    # API Usage
    usage_parser = subparsers.add_parser('usage', help='Get API usage statistics')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    if not args.api_key:
        print("Error: API key is required. Provide it with --api-key or set the VOYNICH_API_KEY environment variable.")
        return

    # Initialize API client
    client = VoynichApiClient(args.base_url, args.api_key)
    
    try:
        # Execute command
        if args.command == 'list-pages':
            result = client.list_pages(args.offset, args.limit)
        
        elif args.command == 'get-page':
            result = client.get_page(args.id)
        
        elif args.command == 'list-symbols':
            result = client.list_symbols(args.page_id)
        
        elif args.command == 'create-symbol':
            result = client.create_symbol(
                args.page_id, args.x, args.y, args.width, args.height,
                args.category, args.metadata
            )
        
        elif args.command == 'list-annotations':
            result = client.list_annotations(args.page_id)
        
        elif args.command == 'create-annotation':
            result = client.create_annotation(
                args.page_id, args.x, args.y, args.width, args.height,
                args.content, args.public
            )
        
        elif args.command == 'vote':
            result = client.vote_on_annotation(args.id, args.type)
        
        elif args.command == 'activity':
            result = client.get_activity_feed(args.limit, args.offset)
        
        elif args.command == 'leaderboard':
            result = client.get_leaderboard(args.timeframe)
        
        elif args.command == 'usage':
            result = client.get_usage()
        
        # Print result
        print(format_json_output(result))
    
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0


if __name__ == '__main__':
    sys.exit(main())