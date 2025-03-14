# Voynich Manuscript Research Platform - API Documentation

This document provides comprehensive documentation for the Voynich Manuscript Research Platform API, which allows external systems to integrate with our platform for advanced manuscript analysis.

## Authentication

All API requests require authentication using API keys. To authenticate your requests:

1. Create an API key in your account dashboard
2. Add the API key to the Authorization header in your requests:

```
Authorization: Bearer YOUR_API_KEY
```

### API Key Management

API keys can be managed from the dashboard. Each key has:
- A name for identification purposes
- Creation timestamp
- Last used timestamp
- Usage statistics

## Base URL

All API endpoints are relative to the base URL of the platform:

```
https://your-instance-url.com/api/external
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "data": { ... },  // The requested data
  "pagination": {   // Optional pagination info for list endpoints
    "offset": 0,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "error": {
    "message": "Error description",
    "code": "error_code",
    "status": 400,
    "details": [ ... ]  // Optional detailed error information
  }
}
```

## Common Error Codes

| Code | Description |
|------|-------------|
| `auth_error` | Authentication error (invalid or missing API key) |
| `not_found` | Requested resource not found |
| `invalid_input` | Invalid request parameters |
| `server_error` | Internal server error |
| `rate_limit` | Rate limit exceeded |

## Endpoints

### Manuscript Pages

#### List Manuscript Pages

```
GET /pages
```

Retrieves a paginated list of manuscript pages.

**Query Parameters:**
- `offset` (number, optional): Number of items to skip (default: 0)
- `limit` (number, optional): Number of items to return (default: 20)

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "folioNumber": "f1r",
      "filename": "pages-123456789.png",
      "width": 800,
      "height": 1200,
      "section": "herbal",
      "metadata": { ... },
      "createdAt": "2025-03-10T12:00:00Z"
    },
    ...
  ],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 250
  }
}
```

#### Get Manuscript Page

```
GET /pages/:id
```

Retrieves a specific manuscript page by ID.

**Path Parameters:**
- `id` (number, required): The ID of the manuscript page

**Example Response:**
```json
{
  "data": {
    "id": 1,
    "folioNumber": "f1r",
    "filename": "pages-123456789.png",
    "width": 800,
    "height": 1200,
    "section": "herbal",
    "metadata": { ... },
    "createdAt": "2025-03-10T12:00:00Z"
  }
}
```

### Symbols

#### Get Symbols for Page

```
GET /symbols/page/:pageId
```

Retrieves all symbols for a specific manuscript page.

**Path Parameters:**
- `pageId` (number, required): The ID of the manuscript page

**Example Response:**
```json
{
  "data": [
    {
      "id": 101,
      "pageId": 1,
      "image": "/uploads/symbols/symbol_abc123.png",
      "x": 150,
      "y": 200,
      "width": 50,
      "height": 40,
      "category": "herbal",
      "metadata": { ... },
      "createdAt": "2025-03-10T12:05:00Z"
    },
    ...
  ]
}
```

#### Create Symbol

```
POST /symbols
```

Creates a new symbol for a manuscript page.

**Request Body:**
```json
{
  "pageId": 1,
  "x": 150,
  "y": 200,
  "width": 50,
  "height": 40,
  "category": "herbal",
  "metadata": { ... }
}
```

**Example Response:**
```json
{
  "data": {
    "id": 101,
    "pageId": 1,
    "image": "/uploads/symbols/symbol_abc123.png",
    "x": 150,
    "y": 200,
    "width": 50,
    "height": 40,
    "category": "herbal",
    "metadata": { ... },
    "createdAt": "2025-03-14T15:30:00Z"
  }
}
```

### Annotations

#### Get Annotations for Page

```
GET /annotations/page/:pageId
```

Retrieves all annotations for a specific manuscript page.

**Path Parameters:**
- `pageId` (number, required): The ID of the manuscript page

**Example Response:**
```json
{
  "data": [
    {
      "id": 201,
      "pageId": 1,
      "userId": 5,
      "x": 300,
      "y": 400,
      "width": 120,
      "height": 80,
      "content": "This appears to be a plant with distinct leaf patterns...",
      "upvotes": 5,
      "downvotes": 1,
      "isPublic": true,
      "createdAt": "2025-03-11T09:20:00Z"
    },
    ...
  ]
}
```

#### Create Annotation

```
POST /annotations
```

Creates a new annotation for a manuscript page.

**Request Body:**
```json
{
  "pageId": 1,
  "x": 300,
  "y": 400,
  "width": 120,
  "height": 80,
  "content": "This appears to be a plant with distinct leaf patterns...",
  "isPublic": true
}
```

**Example Response:**
```json
{
  "data": {
    "id": 201,
    "pageId": 1,
    "userId": 5,
    "x": 300,
    "y": 400,
    "width": 120,
    "height": 80,
    "content": "This appears to be a plant with distinct leaf patterns...",
    "upvotes": 0,
    "downvotes": 0,
    "isPublic": true,
    "createdAt": "2025-03-14T15:35:00Z"
  }
}
```

#### Vote on Annotation

```
POST /annotations/:id/vote
```

Casts a vote (upvote or downvote) on an annotation.

**Path Parameters:**
- `id` (number, required): The ID of the annotation

**Request Body:**
```json
{
  "voteType": "upvote"  // or "downvote"
}
```

**Example Response:**
```json
{
  "data": {
    "id": 201,
    "pageId": 1,
    "userId": 5,
    "x": 300,
    "y": 400,
    "width": 120,
    "height": 80,
    "content": "This appears to be a plant with distinct leaf patterns...",
    "upvotes": 6,
    "downvotes": 1,
    "isPublic": true,
    "createdAt": "2025-03-11T09:20:00Z"
  }
}
```

### Activity Feed

#### Get Public Activity Feed

```
GET /activity-feed
```

Retrieves public activities on the platform.

**Query Parameters:**
- `offset` (number, optional): Number of items to skip (default: 0)
- `limit` (number, optional): Number of items to return (default: 20)

**Example Response:**
```json
{
  "data": [
    {
      "id": 301,
      "userId": 5,
      "username": "researcher1",
      "type": "annotation_created",
      "entityId": 201,
      "entityType": "annotation",
      "metadata": {
        "pageId": 1
      },
      "createdAt": "2025-03-11T09:20:00Z"
    },
    ...
  ],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 150
  }
}
```

### Leaderboard

#### Get Leaderboard

```
GET /leaderboard
```

Retrieves leaderboard data for user contributions.

**Query Parameters:**
- `timeframe` (string, optional): Timeframe for leaderboard data. Valid values: "daily", "weekly", "monthly", "alltime" (default: "weekly")

**Example Response:**
```json
{
  "data": {
    "timeframe": "weekly",
    "date": "2025-03-14T00:00:00Z",
    "entries": [
      {
        "userId": 5,
        "username": "researcher1",
        "score": 250,
        "annotationCount": 15,
        "upvotesReceived": 35,
        "rank": 1
      },
      ...
    ]
  }
}
```

### API Usage

#### Get API Usage Statistics

```
GET /usage
```

Retrieves usage statistics for your API key.

**Example Response:**
```json
{
  "data": {
    "totalRequests": 100,
    "requestsToday": 10,
    "requestsThisWeek": 50,
    "requestsThisMonth": 100,
    "tokensUsed": 5000
  }
}
```

## Rate Limiting

API requests are subject to rate limiting to ensure fair usage. Current limits:

- 1000 requests per day
- 100 requests per hour
- 10 requests per second

When a rate limit is exceeded, the API will respond with a 429 status code and a `rate_limit` error.

## Best Practices

1. Use appropriate pagination parameters for list endpoints to avoid retrieving unnecessary data
2. Cache responses where appropriate to reduce API usage
3. Implement proper error handling to gracefully handle API errors
4. Use a timeframe parameter in leaderboard requests that matches your application's needs
5. Monitor your API usage to avoid hitting rate limits

## Tools and SDKs

For easier integration, we provide client libraries in several programming languages:

- Python: [voynich-api-python](https://github.com/voynich-research/voynich-api-python)
- JavaScript: [voynich-api-js](https://github.com/voynich-research/voynich-api-js)

## Support

For API support or to report issues, please contact our development team at api-support@voynich-research.com.