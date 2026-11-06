# Mr Balloon - Premium Event Decoration Booking System

A dual-platform (Responsive Web & Mobile App) event decoration booking system for custom balloon decor and stage styling.

## 🎯 Features

- **Client Experience**: Browse packages, customize orders, book with interactive forms
- **Owner Dashboard**: Real-time order management, accept/reject/quote workflows
- **Animations**: Floating balloon background with touch burst effects
- **Notifications**: WhatsApp, SMS, Push notifications
- **Maps Integration**: Google Maps venue picker
- **Payments**: Razorpay integration for advance payments

## 🛠 Tech Stack

- **Web**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (Phone OTP, Email, Social)
- **Real-time**: Supabase Realtime + FCM
- **Maps**: Google Maps JavaScript API
- **Notifications**: WhatsApp Cloud API, Twilio SMS, FCM
- **Forms**: React Hook Form + Zod
- **UI**: Radix UI primitives + custom components

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Google Cloud account (Maps API)
- Meta Developer account (WhatsApp)
- Twilio account (SMS)
- Firebase project (Push notifications)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd mr-balloon
npm install

# Set up environment
cp .env.example .env.local
# Fill in your credentials

# Start Supabase (if using local)
npx supabase start

# Run database migrations
npx supabase db push

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for all required variables.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── (auth)/            # Auth pages
│   ├── admin/             # Owner dashboard
│   ├── booking/           # Booking flow
│   └── explore/           # Package browsing
├── components/
│   ├── ui/                # Base UI components
│   ├── booking/           # Booking form components
│   └── admin/             # Admin dashboard components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── notifications.ts   # Notification service
│   └── utils.ts           # Utility functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── styles/                # Global styles
```

## 🎨 Design System

### Colors
- **Silver**: Primary metallic (`#C0C0C0`)
- **Gunmetal**: Dark metallic (`#848482`)
- **Platinum**: Light metallic (`#E5E4E2`)
- **Accents**: Coral, Gold, Mint, Sky, Rose, Lavender

### Components
- Glassmorphism cards with backdrop blur
- Metallic gradient buttons
- Event type selection pills
- Floating balloon animations
- Touch ripple effects

## 📱 Mobile App (Expo)

```bash
cd mobile
npm install
npx expo start
```

## 🧪 Testing

```bash
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run lint          # ESLint
npm run type-check    # TypeScript
```

## 🚀 Deployment

### Vercel (Web)
```bash
vercel deploy
```

### Supabase
```bash
npx supabase db push --linked
```

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ by the Mr Balloon team# mr-balloon
# mr-balloon
