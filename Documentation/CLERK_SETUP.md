# Quick Start Guide: Clerk Authentication Setup

## 🚀 Getting Started (5 minutes)

### 1. Create Clerk Account & Get API Keys

1. Visit [Clerk Dashboard](https://dashboard.clerk.com/)
2. Click "Add application" or use existing one
3. Choose your application name (e.g., "Urdu AI Video Creator")
4. Copy your API keys from the dashboard

### 2. Configure Environment Variables

Open `.env.local` and replace the placeholder values:

```env
# Replace these with your actual Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# These are already configured correctly
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 3. Configure Google OAuth (Optional but Recommended)

In Clerk Dashboard:

1. Go to **"User & Authentication"** → **"Social Connections"**
2. Enable **Google**
3. Choose **"Use Clerk's Development Keys"** for testing
   - OR configure your own Google OAuth credentials
4. Save changes

### 4. Configure Email Settings

In Clerk Dashboard:

1. Go to **"User & Authentication"** → **"Email, Phone, Username"**
2. Ensure **Email** is enabled
3. Go to **"Customization"** → **"Emails"** to customize email templates (optional)

### 5. Test Your Application

```bash
# Start the development server
pnpm dev
```

Visit `http://localhost:3000` and test:

#### Test Signup
1. Click "Sign Up" button
2. Try email/password signup
3. Check your email for verification link
4. Click verification link
5. You should be redirected to dashboard

#### Test Login
1. Click "Sign In" button
2. Enter your credentials
3. Should redirect to dashboard

#### Test Google OAuth
1. Click "Continue with Google"
2. Select your Google account
3. Should redirect to dashboard

### 6. Production Setup

Before deploying to production:

1. **Add Production Domain** in Clerk Dashboard:
   - Go to **Settings** → **Domains**
   - Add your production domain

2. **Get Production Keys**:
   - Switch to production mode in Clerk Dashboard
   - Copy production keys to your production environment variables

3. **Configure Google OAuth for Production**:
   - Use your own Google OAuth credentials (not Clerk's dev keys)
   - Add production redirect URLs

## 🔍 Troubleshooting

### Issue: "Clerk: Publishable key not found"
**Solution**: Make sure `.env.local` is in the root directory and contains the correct keys. Restart your dev server after adding keys.

### Issue: Google OAuth not working
**Solution**: 
1. Check if Google is enabled in Clerk Dashboard
2. For development, use Clerk's dev keys
3. For production, configure your own OAuth credentials

### Issue: Can't access dashboard
**Solution**: The dashboard is protected. Make sure you're logged in. Middleware will redirect you to `/login` if not authenticated.

### Issue: Email verification not working
**Solution**: 
1. Check your spam folder
2. In Clerk Dashboard, go to "Customization" → "Emails" to verify email settings
3. For development, Clerk provides a magic link in the terminal/console

## 📱 Testing Checklist

- [ ] Sign up with email/password
- [ ] Verify email
- [ ] Sign in with email/password
- [ ] Sign up with Google OAuth
- [ ] Sign in with Google OAuth
- [ ] Access dashboard (should work when logged in)
- [ ] Access dashboard without login (should redirect to /login)
- [ ] Sign out
- [ ] Forgot password flow
- [ ] User profile display in dashboard
- [ ] Mobile responsive design

## 🎯 Next Steps

1. **Customize User Profile**: Add more user fields in Clerk Dashboard → User & Authentication → Profile
2. **Add Webhooks**: Sync user data to your database (optional)
3. **Configure Multi-Factor Authentication**: Enable 2FA in Clerk Dashboard
4. **Customize Email Templates**: Brand your verification emails
5. **Add More OAuth Providers**: GitHub, Facebook, etc.

## 💡 Pro Tips

- **Development Mode**: Clerk's dev keys work great for testing Google OAuth
- **Email Templates**: Customize them to match your brand in Clerk Dashboard
- **User Metadata**: Store additional user data in Clerk's metadata fields
- **Session Management**: Clerk handles this automatically with secure JWTs
- **Rate Limiting**: Clerk provides built-in rate limiting for security

## 🆘 Need Help?

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Discord Community](https://clerk.com/discord)
- [Next.js + Clerk Guide](https://clerk.com/docs/quickstarts/nextjs)

---

**Ready to test?** Run `pnpm dev` and visit `http://localhost:3000`! 🚀
