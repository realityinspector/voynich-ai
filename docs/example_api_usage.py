#!/usr/bin/env python3
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

import os
import sys
import argparse
import json
import time
from typing import Dict, Any

# Import the VoynichApiClient class from the client script
from voynich_api_client import VoynichApiClient


def print_section(title: str) -> None:
    """Print a formatted section title."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_json(data: Dict[str, Any]) -> None:
    """Print JSON data in a formatted way."""
    print(json.dumps(data, indent=2))


def run_example(api_key: str, base_url: str) -> None:
    """Run the example workflow."""
    
    # Initialize the API client
    client = VoynichApiClient(base_url, api_key)
    
    try:
        # Step 1: Get a specific manuscript page
        print_section("STEP 1: Retrieving a manuscript page")
        print("Fetching manuscript page with ID 1...")
        
        page_result = client.get_page(1)
        print("Retrieved page data:")
        print_json(page_result)
        
        page_id = page_result['data']['id']
        folio_number = page_result['data']['folioNumber']
        print(f"\nWorking with page ID {page_id} (Folio {folio_number})")
        
        # Step 2: Get all symbols on the page
        print_section("STEP 2: Retrieving symbols for the page")
        print(f"Fetching symbols for page ID {page_id}...")
        
        symbols_result = client.list_symbols(page_id)
        symbols = symbols_result.get('data', [])
        symbol_count = len(symbols)
        
        print(f"Found {symbol_count} symbols on page {folio_number}")
        if symbol_count > 0:
            print("\nFirst few symbols:")
            # Print just the first 2 symbols to keep output manageable
            for symbol in symbols[:2]:
                print_json(symbol)
                print()
        
        # Step 3: Create an annotation for an interesting area on the page
        print_section("STEP 3: Creating an annotation")
        
        # Use coordinates that would be valid for the page
        # In a real scenario, these would be chosen based on analysis of the image
        annotation_x = 200
        annotation_y = 300
        annotation_width = 100
        annotation_height = 80
        annotation_content = (
            "This area contains what appears to be a characteristic plant drawing with "
            "distinct leaf structures typical of the herbal section. The curved stems "
            "and detailed root system are particularly noteworthy."
        )
        
        print(f"Creating annotation at coordinates ({annotation_x}, {annotation_y}) "
              f"with dimensions {annotation_width}x{annotation_height}...")
        
        try:
            annotation_result = client.create_annotation(
                page_id=page_id,
                x=annotation_x,
                y=annotation_y,
                width=annotation_width,
                height=annotation_height,
                content=annotation_content,
                is_public=True
            )
            
            print("Annotation created successfully:")
            print_json(annotation_result)
            
            # Store the annotation ID for future use
            annotation_id = annotation_result['data']['id']
            print(f"\nCreated annotation with ID: {annotation_id}")
            
            # Optional: Add a small delay to ensure the annotation is processed
            time.sleep(1)
            
            # Step 3b: Upvote the annotation we just created
            print("\nUpvoting the annotation...")
            vote_result = client.vote_on_annotation(annotation_id, 'upvote')
            print("Upvote successful:")
            print_json(vote_result)
            
        except Exception as e:
            print(f"Error creating or upvoting annotation: {e}")
            # Continue with the example even if this step fails
        
        # Step 4: Get the activity feed to see recent platform activity
        print_section("STEP 4: Retrieving activity feed")
        print("Fetching the latest platform activity...")
        
        activity_result = client.get_activity_feed(limit=5)  # Just get the 5 most recent activities
        activities = activity_result.get('data', [])
        
        print(f"Retrieved {len(activities)} recent activities:")
        for activity in activities:
            print_json(activity)
            print()
        
        # Step 5: Get leaderboard data
        print_section("STEP 5: Retrieving leaderboard data")
        print("Fetching weekly leaderboard...")
        
        leaderboard_result = client.get_leaderboard(timeframe='weekly')
        print("Weekly leaderboard data:")
        print_json(leaderboard_result)
        
        # Step 6: Check API usage statistics
        print_section("STEP 6: Checking API usage statistics")
        print("Fetching API usage statistics...")
        
        usage_result = client.get_usage()
        print("API usage statistics:")
        print_json(usage_result)
        
        print_section("EXAMPLE WORKFLOW COMPLETED SUCCESSFULLY")
    
    except Exception as e:
        print(f"\nERROR: {e}")
        print("\nExample workflow did not complete successfully.")
        return 1
    
    return 0


def main():
    """Main function to parse arguments and run the example."""
    parser = argparse.ArgumentParser(description='Voynich API Usage Example')
    parser.add_argument('--api-key', default=os.environ.get('VOYNICH_API_KEY', ''),
                        help='API key for authentication (default: from VOYNICH_API_KEY env var)')
    parser.add_argument('--base-url', default=os.environ.get('VOYNICH_API_URL', 'http://localhost:3000'),
                        help='Base URL of the API (default: from VOYNICH_API_URL env var or http://localhost:3000)')
    
    args = parser.parse_args()
    
    if not args.api_key:
        print("Error: API key is required. Provide it with --api-key or set the VOYNICH_API_KEY environment variable.")
        return 1
    
    return run_example(args.api_key, args.base_url)


if __name__ == '__main__':
    sys.exit(main())