# Migration from Groq to OpenRouter

## Changes Made

### 1. Updated API Routes
- ✅ `app/api/ai/generate-report/route.js` - Updated to use OpenRouter with google/gemini-2.0-flash-exp
- ✅ `app/api/ai/summarize/route.js` - Updated to use OpenRouter with google/gemini-2.0-flash-exp  
- ✅ `app/api/chat/route.js` - Updated to use OpenRouter with google/gemini-2.0-flash-exp

### 2. Package Dependencies
- ✅ Removed `groq-sdk` dependency
- ✅ Added `openai` dependency (v4.73.0)
- ✅ Updated package.json and package-lock.json

### 3. Model Changes
- Changed from `llama-3.3-70b-versatile` to `google/gemini-2.0-flash-exp`
- Updated API parameters to match OpenAI SDK format
- Removed deprecated parameters like `max_completion_tokens` and `stop`

## Environment Variables Required

You need to update your environment variables:

### Old Variable (Remove)
```
GROQ_API_KEY=your_groq_api_key
```

### New Variable (Add)
```
OPENROUTER_API_KEY=your_openrouter_api_key
```

## Getting OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Generate an API key from your dashboard
4. Add the key to your `.env.local` file

## Key Benefits of Migration

1. **Better Model**: Google Gemini 2.0 Flash Exp offers improved performance
2. **More Model Options**: OpenRouter provides access to many different AI models
3. **Better Reliability**: OpenRouter offers better uptime and rate limits
4. **Unified Interface**: Uses the standard OpenAI SDK interface

## Testing

After setting up your OpenRouter API key, test the following endpoints:
- `/api/chat` - Financial advisor chatbot
- `/api/ai/summarize` - NexBôt fund summaries  
- `/api/ai/generate-report` - Comprehensive investment reports

All endpoints now use streaming responses with the new model.