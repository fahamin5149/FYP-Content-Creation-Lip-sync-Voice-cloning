# Urdu AI Video Creator

A Next.js application for creating AI-powered videos with Urdu language support, featuring lip-sync, voice cloning, and content generation capabilities.

## 🔐 Authentication (Recently Updated!)

This application now uses **Clerk** for authentication, providing enterprise-grade security and modern authentication features.

### Quick Setup

1. **Get Clerk API Keys**
   - Visit [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create a new application
   - Copy your API keys

2. **Configure Environment**
   ```bash
   # Copy .env.example to .env.local
   cp .env.example .env.local
   
   # Add your Clerk keys to .env.local
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   CLERK_SECRET_KEY=your_secret_key
   ```

3. **Run the Application**
   ```bash
   pnpm install
   pnpm dev
   ```

4. **Visit** `http://localhost:3000`

📚 **Detailed Setup Guide**: See [CLERK_SETUP.md](./CLERK_SETUP.md)

## 🚀 Features

### Authentication
- ✅ Email/Password signup and login
- ✅ Google OAuth integration
- ✅ Automatic email verification
- ✅ Password reset functionality
- ✅ Protected dashboard routes
- ✅ Secure JWT-based sessions
- ✅ User profile management

### Content Creation (Coming Soon)
- 🎬 AI Video Generation
- 🗣️ Voice Cloning
- 💋 Lip-sync Technology
- 📝 Text Enhancement
- 🎙️ Audio Upload & Processing
- 🎥 Video Upload & Processing

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with ClerkProvider
│   ├── page.tsx            # Landing page
│   ├── login/              # Login page (Clerk)
│   ├── signup/             # Signup page (Clerk)
│   ├── dashboard/          # Protected dashboard
│   └── api/                # API routes
├── components/
│   ├── dashboard/          # Dashboard components
│   ├── ui/                 # Reusable UI components
│   └── ...
├── middleware.ts           # Route protection
└── ...
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 🔧 Installation

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FYP-Content-Creation-Lip-sync-Voice-cloning
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your Clerk keys (see CLERK_SETUP.md)
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

5. **Build for production**
   ```bash
   pnpm build
   pnpm start
   ```

## 📖 Documentation

We've created comprehensive documentation for the authentication system:

- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - TL;DR quick start guide
- **[CLERK_SETUP.md](./CLERK_SETUP.md)** - Detailed 5-minute setup guide
- **[MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md)** - Migration overview
- **[CLERK_MIGRATION.md](./CLERK_MIGRATION.md)** - Technical migration details
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Testing checklist
- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Visual architecture comparison

## 🎨 Design System

- **Primary Color**: `#e78a53` (Orange)
- **Background**: Black with zinc accents
- **Theme**: Dark mode
- **Effects**: Glassmorphism, backdrop blur
- **Typography**: Inter font family

## 🔐 Security

- Enterprise-grade authentication via Clerk
- Automatic CSRF protection
- Secure JWT-based sessions
- Rate limiting built-in
- Bot protection enabled
- SOC 2 Type II compliant (via Clerk)

## 🧪 Testing

### Authentication Flows

```bash
# After setting up Clerk keys:
pnpm dev
```

Test these scenarios:
1. Sign up with email/password → Verify email → Login
2. Sign up with Google OAuth → Dashboard access
3. Login with email/password
4. Login with Google OAuth
5. Forgot password flow
6. Dashboard route protection
7. Sign out functionality

See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for complete testing guide.

## 📝 Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 🌐 Deployment

### Vercel (Recommended)

1. **Set environment variables** in Vercel dashboard
2. **Add production domain** in Clerk Dashboard
3. **Configure Google OAuth** with production redirect URLs
4. **Deploy**

```bash
vercel deploy
```

### Other Platforms

1. Build the application: `pnpm build`
2. Set environment variables in your platform
3. Update Clerk Dashboard with production domain
4. Deploy the `.next` directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Clerk keys not found | Check `.env.local` and restart server |
| Google OAuth not working | Enable Google in Clerk Dashboard |
| Build errors | Run `pnpm install` again |
| Can't access dashboard | Ensure you're logged in |

### Getting Help

- **Documentation**: Check the docs in this repository
- **Clerk Support**: [Clerk Documentation](https://clerk.com/docs)
- **Community**: [Clerk Discord](https://clerk.com/discord)

## 🎯 Roadmap

- [x] Authentication system with Clerk
- [x] User dashboard
- [ ] AI Video generation
- [ ] Voice cloning integration
- [ ] Lip-sync technology
- [ ] Text enhancement
- [ ] Audio/Video processing
- [ ] Payment integration
- [ ] Multi-language support

## 📊 Project Status

**Current Version**: 0.1.0  
**Status**: Active Development  
**Last Updated**: December 5, 2025

### Recent Updates
- ✅ Migrated authentication from PostgreSQL to Clerk
- ✅ Implemented protected routes with middleware
- ✅ Added Google OAuth support
- ✅ Customized authentication UI
- ✅ Created comprehensive documentation

## 👥 Team

Created by: Amin

## 🙏 Acknowledgments

- [Clerk](https://clerk.com) - Authentication platform
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Radix UI](https://radix-ui.com) - UI components
- [Framer Motion](https://framer.com/motion) - Animations

---

**Ready to get started?** Follow the [Quick Setup Guide](./CLERK_SETUP.md)! 🚀
