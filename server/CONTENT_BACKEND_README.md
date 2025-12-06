# Content Creation Backend - Implementation Guide

## Overview
This backend implementation provides comprehensive API endpoints for AI-powered content script generation, refinement, and feedback-based iteration using OpenRouter's LLM services.

## Features Implemented

### 🎯 Core Functionality
- **Script Generation**: AI-powered script creation with customizable parameters
- **Simple Refinement**: One-click script improvement with professional editing
- **Custom Refinement**: Refinement with specific user instructions
- **Feedback Refinement**: Iterative improvements based on user feedback
- **Version History**: Track all script iterations with feedback
- **Draft Management**: Save and retrieve script drafts

### 🔒 Security
- Clerk authentication on all routes
- Row-Level Security (RLS) in Supabase
- User-specific data isolation
- Service role for backend operations

### 📊 Database
- PostgreSQL via Supabase
- JSONB for flexible parameters and version storage
- Automatic timestamps with triggers
- Foreign key constraints for data integrity

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── openrouter.ts          # OpenRouter API configuration
│   ├── controllers/
│   │   └── contentController.ts   # Content creation logic
│   ├── db/
│   │   └── supabase.ts            # Supabase client
│   ├── middleware/
│   │   └── auth.ts                # Clerk authentication
│   ├── prompts/
│   │   ├── scriptGeneration.ts    # 1500-word generation prompt
│   │   ├── scriptRefinement.ts    # 1000-word refinement prompts
│   │   └── feedbackRefinement.ts  # 1200-word feedback prompt
│   ├── routes/
│   │   └── content.ts             # API route definitions
│   ├── types/
│   │   └── database.types.ts      # TypeScript interfaces
│   └── index.ts                   # Express server entry
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── CREATE_SCRIPTS_TABLE.sql       # Database schema
└── package.json
```

## Installation & Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

Dependencies installed:
- `axios` - HTTP client for OpenRouter API
- `uuid` - Generate unique script IDs
- `@types/uuid` - TypeScript types for uuid

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update `.env` with your credentials:
```env
# OpenRouter (Get key from https://openrouter.ai/)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxx

# URLs
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Server
PORT=5000
```

### 3. Create Database Table

1. Go to your Supabase project → SQL Editor
2. Run the SQL from `CREATE_SCRIPTS_TABLE.sql`
3. Verify the table was created successfully

This creates:
- `scripts` table with proper schema
- Indexes for performance
- RLS policies for security
- Foreign key to users table
- Automatic updated_at trigger

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### 1. Generate Script
**POST** `/api/content/generate-script`

Generate a new script from scratch with AI.

**Headers:**
```
Authorization: Bearer <clerk_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "language": "English",
  "topic": "Introduction to AI",
  "scriptType": "Educational",
  "tone": "Professional",
  "targetAudience": "beginners",
  "duration": 2,
  "pacing": "medium",
  "keyPoints": "What is AI, types of AI, real-world applications",
  "introStyle": "Direct",
  "includeHook": true,
  "includeCTA": true,
  "includeTransitions": true,
  "includeQuestions": true,
  "specialRequirements": "Avoid technical jargon"
}
```

**Required Fields:**
- `language` - Script language (e.g., "English", "Urdu")
- `topic` - Main topic/subject
- `duration` - Duration in minutes
- `pacing` - "slow", "medium", or "fast"

**Optional Fields:**
- `scriptType` - Type of content (Educational, Tutorial, etc.)
- `tone` - Professional, Casual, Humorous, etc.
- `targetAudience` - Who the content is for
- `keyPoints` - Main points to cover
- `introStyle` - Direct, Story-based, Question-based
- `includeHook` - Add attention-grabbing opening
- `includeCTA` - Include call-to-action
- `includeTransitions` - Add section transitions
- `includeQuestions` - Include rhetorical questions
- `specialRequirements` - Any special instructions

**Response:**
```json
{
  "scriptId": "uuid-here",
  "content": "Generated script content...",
  "metadata": {
    "wordCount": 280,
    "estimatedDuration": 2.0,
    "scriptType": "Educational",
    "tone": "Professional"
  }
}
```

### 2. Refine Script
**POST** `/api/content/refine-script`

Refine an existing script with simple or custom instructions.

**Request Body:**
```json
{
  "originalScript": "Your raw script here...",
  "refinementType": "simple",
  "language": "English",
  "duration": 2,
  "pacing": "medium"
}
```

For custom refinement:
```json
{
  "originalScript": "Your raw script here...",
  "refinementType": "custom",
  "customInstructions": "Make it more engaging, add humor, simplify technical terms",
  "language": "English",
  "duration": 2,
  "pacing": "medium"
}
```

**Required Fields:**
- `originalScript` - The script to refine
- `refinementType` - "simple" or "custom"
- `language` - Script language
- `duration` - Target duration in minutes
- `pacing` - "slow", "medium", or "fast"
- `customInstructions` - Required if refinementType is "custom"

**Response:**
```json
{
  "scriptId": "uuid-here",
  "content": "Refined script content...",
  "metadata": {
    "wordCount": 275,
    "estimatedDuration": 1.96
  }
}
```

### 3. Refine with Feedback
**POST** `/api/content/refine-with-feedback`

Iterate on a script based on user feedback.

**Request Body:**
```json
{
  "scriptId": "existing-script-uuid",
  "currentScript": "Current version of the script...",
  "feedback": "Make the introduction more engaging and shorten the conclusion",
  "language": "English",
  "duration": 2,
  "pacing": "medium"
}
```

**Required Fields:**
- `scriptId` - ID of the existing script
- `currentScript` - Current script content
- `feedback` - User's feedback/instructions
- `language` - Script language
- `duration` - Target duration
- `pacing` - Delivery speed

**Response:**
```json
{
  "scriptId": "same-uuid",
  "content": "Refined script based on feedback...",
  "metadata": {
    "wordCount": 270,
    "estimatedDuration": 1.93
  },
  "version": 2
}
```

**Note:** This endpoint adds the new version to the `versions` array in the database, maintaining full version history.

### 4. Get Script by ID
**GET** `/api/content/script/:scriptId`

Retrieve a specific script with all its versions.

**Response:**
```json
{
  "id": "database-uuid",
  "script_id": "script-uuid",
  "user_id": "clerk-user-id",
  "language": "English",
  "method": "generated",
  "content": "Latest script content...",
  "parameters": {
    "topic": "Introduction to AI",
    "duration": 2,
    "pacing": "medium"
  },
  "versions": [
    {
      "versionNumber": 1,
      "content": "First refined version...",
      "feedback": "Make it more engaging",
      "createdAt": "2025-12-07T10:00:00Z"
    }
  ],
  "status": "draft",
  "metadata": {
    "wordCount": 280,
    "estimatedDuration": 2.0
  },
  "created_at": "2025-12-07T09:00:00Z",
  "updated_at": "2025-12-07T10:00:00Z"
}
```

### 5. Save Draft
**POST** `/api/content/save-draft`

Save manual edits to a script.

**Request Body:**
```json
{
  "scriptId": "existing-script-uuid",
  "content": "Manually edited script content...",
  "parameters": {
    "duration": 2,
    "pacing": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "draftId": "script-uuid"
}
```

## System Prompts

### Script Generation Prompt
- **Size**: ~1500 words
- **Features**: 
  - Comprehensive guidance for all script types
  - Tone and audience customization
  - Language-specific instructions (English/Urdu)
  - Quality verification checklist
  - Word count precision targeting

### Script Refinement Prompts
- **Simple Refinement**: ~1000 words
  - Grammar and clarity improvements
  - Engagement optimization
  - Video content optimization
  - Structure refinement

- **Custom Refinement**: ~1000 words
  - User-instruction focused
  - Maintains quality standards
  - Preserves original intent

### Feedback Refinement Prompt
- **Size**: ~1200 words
- **Features**:
  - Version-aware refinement
  - Feedback pattern recognition
  - Strategic revision approach
  - Quality preservation

## Database Schema

### Scripts Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| script_id | TEXT | Unique script identifier |
| user_id | TEXT | Clerk user ID (foreign key) |
| language | TEXT | Script language |
| method | TEXT | 'generated' or 'refinement' |
| content | TEXT | Current script content |
| parameters | JSONB | Generation/refinement parameters |
| versions | JSONB | Array of previous versions |
| status | TEXT | 'draft', 'approved', or 'in_progress' |
| metadata | JSONB | Word count, duration, etc. |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Indexes
- `idx_scripts_user_id` - Fast user lookups
- `idx_scripts_script_id` - Fast script ID lookups
- `idx_scripts_status` - Filter by status

## TypeScript Types

All types are defined in `src/types/database.types.ts`:

- `Database` - Supabase database schema
- `Script` - Script row interface
- `ScriptParameters` - Parameters for generation/refinement
- `ScriptVersion` - Version history entry
- `ScriptMetadata` - Word count and duration

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad request (missing/invalid parameters)
- `401` - Unauthorized (missing/invalid auth token)
- `404` - Script not found
- `429` - Rate limit exceeded (OpenRouter)
- `500` - Server error

All errors return JSON:
```json
{
  "error": "Error message here"
}
```

## OpenRouter Configuration

The system uses OpenRouter for LLM access with:
- **Default Model**: `anthropic/claude-3.5-sonnet`
- **Max Tokens**: 4000
- **Temperature**: 0.7
- **Timeout**: 60 seconds

You can change the model via `OPENROUTER_MODEL` environment variable.

### Supported Models
- `anthropic/claude-3.5-sonnet` (Recommended)
- `openai/gpt-4-turbo`
- `google/gemini-pro-1.5`
- `meta-llama/llama-3-70b`

## Testing

### Test with curl:

```bash
# Generate Script
curl -X POST http://localhost:5000/api/content/generate-script \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "language": "English",
    "topic": "Introduction to AI",
    "scriptType": "Educational",
    "tone": "Professional",
    "targetAudience": "beginners",
    "duration": 2,
    "pacing": "medium"
  }'

# Refine Script
curl -X POST http://localhost:5000/api/content/refine-script \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "originalScript": "Your script here",
    "refinementType": "simple",
    "language": "English",
    "duration": 2,
    "pacing": "medium"
  }'
```

### Test with Postman or Thunder Client:
1. Create a new request
2. Set method to POST
3. Add Authorization header with Clerk JWT
4. Add request body as JSON
5. Send request

## Word Count Calculation

Scripts are precisely targeted based on:
- **Slow pacing**: 120 words/minute
- **Medium pacing**: 140 words/minute  
- **Fast pacing**: 160 words/minute

The system allows ±10% variance from target word count.

## Language Support

### English
- Natural, conversational tone
- Professional quality
- Optimized for video delivery

### Urdu
- Natural Urdu grammar and flow
- Culturally appropriate references
- Authentic spoken delivery
- Minimal English mixing (unless contextually appropriate)

## Best Practices

1. **Authentication**: Always include valid Clerk JWT token
2. **Error Handling**: Check response status and handle errors
3. **Word Count**: Trust the AI to hit target word counts (±10%)
4. **Feedback**: Be specific in feedback for better refinements
5. **Version History**: Use version history to track changes
6. **Draft Saving**: Save drafts before major changes

## Troubleshooting

### OpenRouter Errors
- **401**: Check your `OPENROUTER_API_KEY`
- **429**: Rate limit exceeded, wait and retry
- **Timeout**: Increase timeout or reduce complexity

### Database Errors
- **Insert fails**: Check Supabase connection and RLS policies
- **Foreign key error**: Ensure user exists in `users` table
- **Permission denied**: Verify service role key

### Authentication Errors
- **401 Unauthorized**: Check Clerk token is valid and not expired
- **Token format**: Ensure format is `Bearer <token>`

## Development Workflow

1. Start the server: `npm run dev`
2. Test endpoints with Postman/curl
3. Check logs for errors
4. Verify database records in Supabase
5. Iterate on prompts as needed

## Production Deployment

1. Set production environment variables
2. Use production Supabase instance
3. Enable rate limiting
4. Add request logging
5. Set up error monitoring
6. Configure CORS for production domain

## Next Steps

- [ ] Add rate limiting middleware
- [ ] Implement request logging
- [ ] Add script analytics
- [ ] Create batch generation endpoint
- [ ] Add script export formats (PDF, DOCX)
- [ ] Implement script sharing
- [ ] Add collaborative editing

## Support

For issues or questions:
1. Check this README
2. Review error messages
3. Check Supabase logs
4. Verify environment variables
5. Test with minimal request body

---

**Implementation Complete!** ✅

All backend functionality for content creation is now ready to use.
