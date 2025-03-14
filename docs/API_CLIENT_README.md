# Voynich Manuscript Research Platform - Python API Client

This directory contains Python client utilities for interacting with the Voynich Manuscript Research Platform API. These tools are designed for researchers and developers who want to integrate with the platform programmatically.

## Contents

- `voynich_api_client.py` - A comprehensive Python client library for the API
- `example_api_usage.py` - Example script demonstrating a realistic research workflow
- `API_DOCUMENTATION.md` - Complete API reference documentation
- `USER_GUIDE.md` - General user guide for the platform

## Installation

### Prerequisites

- Python 3.6 or higher
- `requests` library

If you don't have the `requests` library installed, you can install it with:

```bash
pip install requests
```

### Setting Up

1. Download the `voynich_api_client.py` and other files in this directory
2. Place them in your project directory or Python path
3. Import the client in your code:

```python
from voynich_api_client import VoynichApiClient
```

## Configuration

You'll need an API key to use the client. You can set this up in two ways:

1. **Environment variable**: 
   ```bash
   export VOYNICH_API_KEY="your_api_key_here"
   ```

2. **Pass directly to the client**:
   ```python
   client = VoynichApiClient(base_url="https://your-instance-url.com", api_key="your_api_key_here")
   ```

You can obtain an API key from your account settings on the Voynich Manuscript Research Platform.

## Basic Usage

Here's a simple example of using the client to fetch manuscript pages:

```python
from voynich_api_client import VoynichApiClient

# Initialize the client
client = VoynichApiClient(
    base_url="https://your-instance-url.com",
    api_key="your_api_key_here"
)

# List the first 10 manuscript pages
pages_result = client.list_pages(limit=10)
pages = pages_result.get('data', [])

for page in pages:
    print(f"Page ID: {page['id']}, Folio: {page['folioNumber']}")

# Get details for a specific page
page_result = client.get_page(1)
page = page_result.get('data', {})
print(f"Retrieved page: {page['folioNumber']}")

# List symbols on a page
symbols_result = client.list_symbols(page['id'])
symbols = symbols_result.get('data', [])
print(f"Found {len(symbols)} symbols on page {page['folioNumber']}")
```

## Command Line Interface

The client also includes a command-line interface for quick testing and automation:

```bash
# List manuscript pages
python voynich_api_client.py list-pages --api-key YOUR_API_KEY

# Get a specific manuscript page
python voynich_api_client.py get-page 1 --api-key YOUR_API_KEY

# List symbols for a page
python voynich_api_client.py list-symbols 1 --api-key YOUR_API_KEY

# Create an annotation
python voynich_api_client.py create-annotation --page-id 1 --x 100 --y 200 --width 50 --height 40 --content "Interesting plant symbol" --api-key YOUR_API_KEY

# Vote on an annotation
python voynich_api_client.py vote 123 upvote --api-key YOUR_API_KEY

# Get API usage statistics
python voynich_api_client.py usage --api-key YOUR_API_KEY
```

For a comprehensive list of available commands:

```bash
python voynich_api_client.py --help
```

## Example Workflow

The `example_api_usage.py` script demonstrates a real-world research workflow using the API:

```bash
python example_api_usage.py --api-key YOUR_API_KEY
```

This script:
1. Retrieves a specific manuscript page
2. Gets all symbols on that page
3. Creates an annotation for an interesting area
4. Upvotes the annotation
5. Retrieves the activity feed to see recent platform activity
6. Checks leaderboard data
7. Reviews API usage statistics

Use this as a template for creating your own research automation scripts.

## Error Handling

The client includes robust error handling with detailed error messages:

```python
try:
    result = client.get_page(999999)  # Invalid page ID
except Exception as e:
    print(f"Error: {e}")
    # The error will include the HTTP status code and response body
```

## API Reference

For a complete list of available API endpoints and methods, refer to:

1. The docstrings in `voynich_api_client.py`
2. The comprehensive [API Documentation](API_DOCUMENTATION.md)

## Support

If you encounter any issues or have questions about using the API client, please contact the development team at api-support@voynich-research.com.