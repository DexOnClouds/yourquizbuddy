# ValCard - Valentine's Card Creator

A beautiful web application for creating and sharing Valentine's cards with a magical touch.

## Features

- 🎨 Modern, responsive UI with a dark theme
- 🔒 Secure token-based authentication
- ✨ Interactive card creation (coming soon)
- 🎵 Background music integration (coming soon)

## Tech Stack

- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- Supabase
- Shadcn/ui Components

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/valcard.git
cd valcard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

This app is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add the environment variables in Vercel's project settings
4. Deploy!

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT License - feel free to use this project for your own Valentine's Day celebrations! ❤️
