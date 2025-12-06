# Quick Start Guide - Content Creation Backend

## 🚀 Get Started in 5 Minutes

### Step 1: Environment Variables (2 min)
```bash
cd server
cp .env.example .env
```

Edit `.env` and add your keys:
```env
OPENROUTER_API_KEY=sk-or-v1-xxxxx    # Get from https://openrouter.ai/
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here
CLERK_SECRET_KEY=sk_test_xxxxx
```

### Step 2: Database Setup (1 min)
1. Open Supabase → SQL Editor
2. Copy contents from `CREATE_SCRIPTS_TABLE.sql`
3. Paste and run
4. ✅ Done!

### Step 3: Start Server (1 min)
```bash
npm run dev
```

You should see:
```
Server running on: 5000
All files loaded successfully!
```

### Step 4: Test It (1 min)
```bash
# Healthcheck
curl http://localhost:5000/test
```

Expected response:
```json
{
  "message": "Server is working!",
  "database": "Supabase connected",
  "auth": "Clerk"
}
```

---

## 📝 First API Call

### Get a Clerk Token
1. Sign in to your frontend app
2. Open DevTools → Console
3. Run: `await window.Clerk.session.getToken()`
4. Copy the token

### Generate Your First Script
```bash
curl -X POST http://localhost:5000/api/content/generate-script \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "language": "English",
    "topic": "My First AI Script",
    "duration": 1,
    "pacing": "medium"
  }'
```

---

## 🎯 All Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/content/generate-script` | Generate new script |
| POST | `/api/content/refine-script` | Refine existing script |
| POST | `/api/content/refine-with-feedback` | Iterate based on feedback |
| GET | `/api/content/script/:id` | Get script by ID |
| POST | `/api/content/save-draft` | Save manual edits |

---

## 🔑 Required Fields

### Generate Script
```json
{
  "language": "English or Urdu",
  "topic": "Your topic",
  "duration": 1-10,
  "pacing": "slow/medium/fast"
}
```

### Refine Script
```json
{
  "originalScript": "Your script",
  "refinementType": "simple or custom",
  "language": "English or Urdu",
  "duration": 1-10,
  "pacing": "slow/medium/fast"
}
```

### Refine with Feedback
```json
{
  "scriptId": "uuid",
  "currentScript": "Current version",
  "feedback": "Your feedback",
  "language": "English or Urdu",
  "duration": 1-10,
  "pacing": "slow/medium/fast"
}
```

---

## 📚 More Info

- Full API docs: `CONTENT_BACKEND_README.md`
- Implementation details: `IMPLEMENTATION_CHECKLIST.md`
- Database schema: `CREATE_SCRIPTS_TABLE.sql`

---

## ⚡ Pro Tips

1. **Word Count**: AI targets specific word counts based on duration and pacing
2. **Versions**: Feedback refinements save version history automatically
3. **Languages**: Full support for English and Urdu with cultural awareness
4. **Models**: Change LLM via `OPENROUTER_MODEL` env variable

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check Clerk token is valid |
| 500 Database Error | Verify Supabase connection |
| OpenRouter Error | Check API key and credits |
| Timeout | Reduce complexity or increase timeout |

---

**You're ready to go!** 🎉

Start generating amazing scripts with AI!
