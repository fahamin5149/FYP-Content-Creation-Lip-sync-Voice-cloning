#!/bin/bash

# AI Content Creation Platform - Environment Setup Script

echo "🚀 Setting up AI Content Creation Platform Environment..."

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Create .env.local file
cat > .env.local << EOF
# AI Service API Keys - Replace with your actual API keys
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Firebase Configuration (already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC_ZHlfCGlpbcjGd_iKwyf97QpeJtFNDKs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fyp-urduvideoai.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fyp-urduvideoai
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fyp-urduvideoai.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=694395601911
NEXT_PUBLIC_FIREBASE_APP_ID=1:694395601911:web:8aceef8ba0c51a9579e4f2
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-84KZ55L6XY

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF

echo "✅ Environment file created: .env.local"
echo ""
echo "📝 Next steps:"
echo "1. Get your OpenAI API key from: https://platform.openai.com/api-keys"
echo "2. Get your ElevenLabs API key from: https://elevenlabs.io/app/settings/api-keys"
echo "3. Replace 'your_openai_api_key_here' with your actual OpenAI API key"
echo "4. Replace 'your_elevenlabs_api_key_here' with your actual ElevenLabs API key"
echo ""
echo "🔧 To edit the file:"
echo "   nano .env.local"
echo "   # or"
echo "   code .env.local"
echo ""
echo "🚀 Once configured, run: npm run dev"
echo ""
echo "📖 For detailed instructions, see: SETUP_INSTRUCTIONS.md"

