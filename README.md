# Full-Stack React + Express Application

A modern full-stack application built with React, Vite, Express, and TypeScript. Features a chat interface with text-to-speech capabilities.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management
- **Shadcn UI** + Radix UI for accessible components
- **Tailwind CSS** for styling

### Backend
- **Express.js** for API endpoints
- **Drizzle ORM** with PostgreSQL support
- **In-memory storage** (development) with database option (production)
- **Murf.ai** integration for text-to-speech

## Project Structure

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and configurations
│   │   └── hooks/       # Custom React hooks
├── server/              # Backend Express application
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   └── storage.ts       # Data storage interface
├── shared/              # Shared code between client and server
│   └── schema.ts        # Database schemas and types
├── netlify/             # Netlify serverless functions
│   └── functions/
│       └── api.mts      # Express app as serverless function
└── dist/                # Production build output
```

## Local Development

### Prerequisites
- Node.js 20 or higher
- npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (optional):
```bash
# Create a .env file in the root directory
MURF_API_KEY=your_murf_api_key_here
DATABASE_URL=your_postgres_connection_string
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Deployment to Netlify

### Option 1: Deploy via Netlify CLI (Recommended)

1. Install Netlify CLI globally:
```bash
npm install -g netlify-cli
```

2. Build the project:
```bash
npm run build
```

3. Initialize Netlify (first time only):
```bash
netlify init
```
Follow the prompts to:
- Authorize Netlify
- Create a new site or link to an existing one
- Configure build settings (already in netlify.toml)

4. Deploy to production:
```bash
netlify deploy --prod
```

### Option 2: Deploy via Git Integration

1. Push your code to GitHub, GitLab, or Bitbucket

2. Go to [Netlify Dashboard](https://app.netlify.com)

3. Click "Add new site" → "Import from Git"

4. Select your repository

5. Netlify will auto-detect the build settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist/public`
   - Functions directory: `netlify/functions`

6. Click "Deploy site"

### Environment Variables on Netlify

Add environment variables in the Netlify dashboard:

1. Go to Site Configuration → Environment Variables
2. Add the following variables:
   - `MURF_API_KEY` - Your Murf.ai API key (if using TTS)
   - `DATABASE_URL` - Your PostgreSQL connection string (if using database)

### Testing Locally with Netlify Dev

Test the serverless functions locally:

```bash
netlify dev
```

This will start both the Vite dev server and Netlify Functions at `http://localhost:8888`

## Build Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build locally
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes

## API Endpoints

All API endpoints are prefixed with `/api`:

- `GET /api/chat-sessions` - List all chat sessions
- `POST /api/chat-sessions` - Create a new chat session
- `GET /api/chat-sessions/:id` - Get a specific chat session
- `DELETE /api/chat-sessions/:id` - Delete a chat session
- `GET /api/chat-sessions/:id/messages` - Get messages for a session
- `POST /api/chat-sessions/:id/messages` - Add messages to a session
- `POST /api/tts` - Generate text-to-speech audio

## Features

- Chat interface with session management
- Text-to-speech integration with Murf.ai
- Responsive design with dark/light mode support
- In-memory storage for development
- PostgreSQL support for production
- Serverless deployment on Netlify

## Notes

- The application uses in-memory storage by default for simplicity
- For production, configure `DATABASE_URL` to use PostgreSQL
- The Express backend is converted to serverless functions for Netlify deployment
- All routes starting with `/api` are handled by serverless functions
- The frontend is built as a static site with client-side routing

## License

MIT
