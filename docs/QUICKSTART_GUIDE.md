# Voynich Manuscript Research Platform - API Quickstart Guide

This guide provides a quick introduction to using the Voynich Manuscript Research Platform API with the provided Python client library.

## Prerequisites

- Python 3.6 or higher
- `requests` library (`pip install requests`)
- API key from the Voynich Manuscript Research Platform

## Setting Up

1. Download the API client files from the `docs` directory:
   - `voynich_api_client.py` - The main client library
   - `example_api_usage.py` - An example script demonstrating usage

2. Set your API key as an environment variable:

   ```bash
   # Linux/macOS
   export VOYNICH_API_KEY="your_api_key_here"
   
   # Windows (Command Prompt)
   set VOYNICH_API_KEY=your_api_key_here
   
   # Windows (PowerShell)
   $env:VOYNICH_API_KEY="your_api_key_here"
   ```

   Alternatively, you can pass your API key directly when running the scripts.

3. Set the base URL for your Voynich Manuscript Research Platform instance:

   ```bash
   # Linux/macOS
   export VOYNICH_API_URL="https://your-instance-url.com"
   
   # Windows (Command Prompt)
   set VOYNICH_API_URL=https://your-instance-url.com
   
   # Windows (PowerShell)
   $env:VOYNICH_API_URL="https://your-instance-url.com"
   ```

   If not set, the client defaults to `http://localhost:3000`.

## Quick Test

Run a simple test to verify your setup:

```bash
python voynich_api_client.py usage --api-key YOUR_API_KEY
```

This should return your API usage statistics.

## Using the Command-Line Interface

The client includes a command-line interface for common operations:

### List Manuscript Pages

```bash
python voynich_api_client.py list-pages --limit 5
```

### Get a Specific Manuscript Page

```bash
python voynich_api_client.py get-page 1
```

### List Symbols on a Page

```bash
python voynich_api_client.py list-symbols 1
```

### Create an Annotation

```bash
python voynich_api_client.py create-annotation \
  --page-id 1 \
  --x 100 \
  --y 150 \
  --width 50 \
  --height 40 \
  --content "This symbol appears to be a plant with distinctive leaf structure"
```

### Get the Leaderboard

```bash
python voynich_api_client.py leaderboard --timeframe weekly
```

## Running the Example Workflow

To run the complete example workflow, which demonstrates a realistic research scenario:

```bash
python example_api_usage.py --api-key YOUR_API_KEY
```

This script will:
1. Retrieve a manuscript page
2. Get symbols from that page
3. Create an annotation
4. Upvote the annotation
5. Check the activity feed
6. View the leaderboard
7. Check API usage statistics

## Integrating Into Your Own Code

To use the client in your own Python code:

```python
from voynich_api_client import VoynichApiClient

# Initialize the client
client = VoynichApiClient(
    base_url="https://your-instance-url.com",
    api_key="your_api_key_here"
)

# Example: Get a list of manuscript pages
pages_result = client.list_pages(limit=10)
pages = pages_result.get('data', [])

for page in pages:
    print(f"Page ID: {page['id']}, Folio: {page['folioNumber']}")

# Example: Create an annotation
annotation_result = client.create_annotation(
    page_id=1,
    x=100,
    y=150,
    width=50,
    height=40,
    content="This appears to be a unique symbol not seen elsewhere in the manuscript.",
    is_public=True
)

print(f"Created annotation with ID: {annotation_result['data']['id']}")
```

## Next Steps

- Review the [API Documentation](API_DOCUMENTATION.md) for a complete list of endpoints
- Check the [API Client README](API_CLIENT_README.md) for more detailed usage instructions
- Explore the [User Guide](USER_GUIDE.md) to understand the platform's features

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify your API key is correct
   - Ensure you're including the correct Authorization header

2. **Connection Errors**:
   - Check that the base URL is correct
   - Verify your network connection

3. **Rate Limiting**:
   - If you receive a 429 error, you've exceeded the rate limit
   - Implement backoff/retry logic for production applications

### Getting Help

If you encounter any issues, please contact api-support@voynich-research.com for assistance.