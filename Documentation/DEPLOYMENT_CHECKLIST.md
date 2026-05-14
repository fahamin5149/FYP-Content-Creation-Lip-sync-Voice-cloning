# 📋 Deployment Checklist - Clerk-Supabase Sync

## Pre-Deployment Setup (Do These First)

### ✅ Phase 1: Supabase Setup

- [ ] **Create Supabase Project**
  - Go to: https://supabase.com
  - Create a new project
  - Wait for project to initialize

- [ ] **Run Database SQL**
  - Navigate to: SQL Editor
  - Create new query
  - Copy SQL from `SUPABASE_SETUP.md`
  - Execute query
  - Verify `users` table exists in Table Editor

- [ ] **Get Supabase Keys**
  - Go to: Settings → API
  - Copy: **Project URL**
  - Copy: **Service Role Secret** (the long JWT string)
  - ⚠️ NOT the anon key!

### ✅ Phase 2: Clerk Setup

- [ ] **Create Clerk Project**
  - Go to: https://clerk.com
  - Create a new application
  - Choose: Next.js

- [ ] **Configure Clerk**
  - Settings → API Keys
  - Copy: **Publishable Key** (`pk_test_...`)
  - Copy: **Secret Key** (`sk_test_...`)

- [ ] **Setup Clerk in Frontend**
  - Already done! `@clerk/nextjs` is installed
  - Just need environment variables

### ✅ Phase 3: Environment Variables

- [ ] **Create `.env.local`**
  - Location: Project root
  - Contents:
    ```
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
    CLERK_SECRET_KEY=sk_test_YOUR_KEY
    NEXT_PUBLIC_API_URL=http://localhost:5000
    ```

- [ ] **Create `server/.env`**
  - Location: `server` folder
  - Contents:
    ```
    CLERK_SECRET_KEY=sk_test_YOUR_KEY
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
    PORT=5000
    NODE_ENV=development
    FRONTEND_URL=http://localhost:3000
    ```

- [ ] **Verify Variables**
  - Frontend: Check `.env.local` exists
  - Backend: Check `server/.env` exists
  - ⚠️ NEVER commit .env files to git!

---

## Local Testing (Test Before Deploying)

### ✅ Phase 4: Start Services

- [ ] **Start Backend Server**
  ```bash
  cd server
  npm run dev
  ```
  - Should print: "Server running on: 5000"
  - No errors in console

- [ ] **Start Frontend Server**
  ```bash
  npm run dev
  ```
  - Should print: "ready - started server on 0.0.0.0:3000"
  - No errors in console

### ✅ Phase 5: Test User Sync

- [ ] **Sign Up Test**
  - Open: http://localhost:3000
  - Click: Sign Up
  - Fill: Email, password, name
  - Submit: Sign up form
  - Wait: 2-3 seconds for sync

- [ ] **Verify in Supabase**
  - Go to: Supabase Dashboard
  - Click: Table Editor
  - Select: `users` table
  - Check: New user row appears
  - Verify: All columns filled
    - `clerk_id`: Populated ✓
    - `email`: Matches sign-up ✓
    - `first_name`: Matches input ✓
    - `last_name`: Matches input ✓
    - `created_at`: Recent timestamp ✓

- [ ] **Test Upsert**
  - Sign up: Same email again
  - Check: User count in table (should be 1, not 2)
  - Record: Updated (not duplicated)

- [ ] **Check Logs**
  - Backend console: "User synced" message
  - No error messages
  - HTTP 200 responses

### ✅ Phase 6: Error Handling

- [ ] **Missing Email**
  - Sign up without email
  - Should: Show error or prevent submission

- [ ] **Network Error**
  - Stop backend server
  - Try signing up
  - Should: Show "Failed to sync" error
  - ✓ User still created in Clerk (don't lose them!)

- [ ] **Invalid Token**
  - Manually call `/api/users/sync`
  - With: Invalid Bearer token
  - Should: Return 401 Unauthorized

---

## Production Deployment

### ✅ Phase 7: Production Environment

#### Frontend (Vercel / Netlify / etc.)

- [ ] **Set Environment Variables**
  - Go to: Hosting dashboard
  - Add environment variables:
    ```
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
    CLERK_SECRET_KEY=sk_live_...
    NEXT_PUBLIC_API_URL=https://your-backend-domain.com
    ```
  - ⚠️ Use PRODUCTION keys (pk_live_, sk_live_)

- [ ] **Deploy Frontend**
  - Commit code to main branch
  - Hosting automatically deploys
  - Verify: Site loads without errors

#### Backend (Render / Railway / Heroku / etc.)

- [ ] **Set Environment Variables**
  - Go to: Hosting dashboard
  - Add environment variables:
    ```
    CLERK_SECRET_KEY=sk_live_...
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
    PORT=5000
    NODE_ENV=production
    FRONTEND_URL=https://your-frontend-domain.com
    ```

- [ ] **Update CORS**
  - Edit: `server/src/index.ts`
  - Change CORS origin to production domain
  - Or use: `process.env.FRONTEND_URL`

- [ ] **Deploy Backend**
  - Push code to deployment service
  - Verify: Service runs without errors
  - Check: `/test` endpoint returns 200

### ✅ Phase 8: Production Testing

- [ ] **Sign Up Test (Production)**
  - Go to: Your production frontend
  - Sign up: New user
  - Wait: 3-5 seconds
  - Check: Supabase table
  - Verify: User appears

- [ ] **Monitor Logs**
  - Backend logs: Watch for errors
  - Sentry or similar: Setup error tracking
  - Check: No 500 errors

- [ ] **Performance**
  - Sign up: Track response time
  - Should be: < 5 seconds
  - Check: No database slowdowns

- [ ] **Security**
  - Verify: HTTPS on both domains
  - Check: .env files NOT in git
  - Confirm: Service Role Key not exposed

---

## Post-Deployment

### ✅ Phase 9: Monitoring

- [ ] **Setup Monitoring**
  - Error tracking: Sentry / DataDog
  - Database monitoring: Supabase dashboard
  - Uptime monitoring: UptimeRobot

- [ ] **Set Alerts**
  - Backend crashes
  - Database connection errors
  - High error rates
  - Unusual activity

- [ ] **Document Deployment**
  - Save: Backend URL
  - Save: Frontend URL
  - Document: Environment variable list
  - Record: Deployment date & time

- [ ] **User Communication**
  - Email: "New account sync feature live"
  - Status page: Update deployment status
  - Support: Brief team on new flow

### ✅ Phase 10: Backup & Recovery

- [ ] **Database Backups**
  - Supabase: Auto-enables backups
  - Verify: Backups are running
  - Test: Restore from backup (in test environment)

- [ ] **Recovery Plan**
  - Document: How to rollback deployment
  - Document: How to restore database
  - Test: Recovery procedure

---

## Troubleshooting During Deployment

### Common Issues

| Issue | Solution |
|-------|----------|
| "Service Role Key missing" | Check `server/.env` exists with key |
| CORS error | Verify `FRONTEND_URL` matches frontend domain |
| User not syncing | Check backend logs for errors |
| "Invalid token" | Verify CLERK_SECRET_KEY is correct |
| Database not updating | Verify SQL was executed in Supabase |
| Slow sync | Check database indexes |
| 502 Bad Gateway | Check backend is running |

### Debug Commands

```bash
# Check backend is running
curl http://localhost:5000/test

# Check token is valid
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/users/sync

# View backend logs
npm run dev (shows all logs)

# Test database connection
# In Supabase: SQL Editor → Run: SELECT COUNT(*) FROM users;
```

---

## Rollback Plan

If something goes wrong:

### Step 1: Stop the Deployment
- Revert code to last known good version
- Rollback environment variables if changed

### Step 2: Check Logs
- Backend: Look for error messages
- Frontend: Check browser console
- Database: Verify connection

### Step 3: Restore
- Database: Restore from backup (Supabase dashboard)
- Code: Deploy previous version
- Notify: Users of any data loss

### Step 4: Fix & Redeploy
- Identify root cause
- Fix issue locally
- Test thoroughly
- Deploy again

---

## Success Criteria ✅

Your deployment is successful when:

- [x] Frontend loads without errors
- [x] Backend server running on production URL
- [x] Clerk sign-up works
- [x] User appears in Supabase within 5 seconds
- [x] All fields populated correctly
- [x] No error messages in logs
- [x] Users can sign in and use app
- [x] Monitoring & alerts are active
- [x] Backup system is working
- [x] Team is trained on new system

---

## Quick Reference

### Important URLs
- Supabase Dashboard: https://app.supabase.com
- Clerk Dashboard: https://dashboard.clerk.com
- Your Frontend: https://[frontend-domain]
- Your Backend API: https://[backend-domain]/api
- Your Backend Test: https://[backend-domain]/test

### Important Files
- `server/.env` - Backend configuration
- `.env.local` - Frontend configuration
- `server/src/index.ts` - Backend entry point
- `lib/api.ts` - Frontend API functions

### Key Environment Variables
```
Frontend:
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  CLERK_SECRET_KEY
  NEXT_PUBLIC_API_URL

Backend:
  CLERK_SECRET_KEY
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  PORT
  FRONTEND_URL
```

---

## Contact & Support

If something goes wrong:

1. Check `CLERK_SUPABASE_SYNC_GUIDE.md` for detailed guides
2. Review `INTEGRATION_EXAMPLES.md` for code examples
3. Check server logs for error messages
4. Verify all environment variables are set
5. Test locally before deploying again

---

**Last Updated:** December 5, 2025  
**Status:** Ready for Production Deployment  
**Estimated Setup Time:** 15-30 minutes  

🚀 **Good luck with your deployment!**
