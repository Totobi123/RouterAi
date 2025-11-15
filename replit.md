# AI Chat Application

## Overview

This is a full-stack AI chat application that provides a conversational interface powered by DeepSeek AI through OpenRouter. The application features a clean, minimal design inspired by modern chat interfaces like ChatGPT and Claude, with a focus on readability and user experience. Users can engage in conversations with an AI assistant, with the interface displaying message history and providing suggested prompts for new users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for lightweight client-side routing with a simple two-page structure (Home and NotFound).

**UI Component System**: Shadcn UI with Radix UI primitives, providing a comprehensive set of accessible, customizable components. The design system uses the "new-york" style variant with Tailwind CSS for styling.

**State Management**: React Query (@tanstack/react-query) for server state management and API data fetching. Local component state is managed with React hooks (useState, useRef, useEffect).

**Styling Approach**: Tailwind CSS with a custom design system featuring:
- CSS custom properties for theming (light/dark mode support)
- Consistent spacing primitives (2, 4, 6, 8 units)
- Max-width constraint (max-w-3xl) for optimal reading experience
- Typography hierarchy using Inter/system-ui font stack
- Custom elevation system for depth and hover effects

**Design Patterns**:
- Component composition with clear separation between presentational and container components
- Custom hooks for cross-cutting concerns (useToast, useIsMobile)
- Responsive design with mobile-first approach
- Accessibility-first component design through Radix UI

### Backend Architecture

**Runtime**: Node.js with Express.js framework providing RESTful API endpoints.

**API Structure**: Single POST endpoint (`/api/chat`) that:
- Accepts an array of messages with role-based validation (user, assistant, system)
- Proxies requests to OpenRouter API using DeepSeek chat model
- Returns streaming or complete AI responses
- Implements error handling for missing API keys and invalid message formats

**Server Configuration**:
- Development mode with Vite middleware integration for HMR
- Production mode serving static files from built assets
- Request/response logging with performance metrics
- JSON body parsing with raw body capture for webhooks

**Build Process**: Uses esbuild to bundle the server code into a single ESM module for production deployment.

### Data Storage Solutions

**Current Implementation**: In-memory storage using a Map-based storage class (MemStorage) for user data. This is a development/prototype setup.

**Database Configuration**: Drizzle ORM configured for PostgreSQL with:
- Schema definition for users table (id, username, password)
- Migration support through drizzle-kit
- Connection via @neondatabase/serverless for serverless PostgreSQL
- Schema location: `shared/schema.ts` for code sharing between client and server

**Data Models**:
- User schema with UUID primary key, unique username constraint
- Zod validation schemas generated from Drizzle schemas
- Type-safe database operations through TypeScript inference

**Rationale**: The database setup is prepared but not actively used, allowing for easy transition from in-memory to persistent storage when needed. This provides flexibility during development while maintaining production-ready database infrastructure.

### Authentication and Authorization

**Current State**: Basic user schema is defined but authentication is not implemented in the active chat flow. The storage interface includes methods for user retrieval and creation, suggesting future authentication plans.

**Design**: The architecture supports future session-based or token-based authentication through the existing user management infrastructure.

## External Dependencies

### Third-Party APIs

**OpenRouter API**: Primary AI service integration
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Model: `deepseek/deepseek-chat`
- Authentication: Bearer token via `OPENROUTER_API_KEY` environment variable
- Request format: OpenAI-compatible chat completions API
- Headers include HTTP-Referer and X-Title for attribution

### Database Services

**Neon Database**: Serverless PostgreSQL provider
- Connection via `@neondatabase/serverless` package
- Connection string stored in `DATABASE_URL` environment variable
- Supports edge runtime and serverless environments

### UI Component Libraries

**Radix UI**: Headless UI component primitives providing:
- Accessible component behaviors
- Keyboard navigation
- Focus management
- ARIA attributes
- Extensive set of components (Dialog, Dropdown, Tooltip, etc.)

**Shadcn UI**: Component collection built on Radix UI with:
- Pre-styled, customizable components
- Tailwind CSS integration
- Copy-paste component approach
- Consistent design system

### Development Tools

**Vite**: Build tool and dev server providing:
- Fast HMR (Hot Module Replacement)
- Optimized production builds
- ESM-first approach
- Plugin ecosystem for React and TypeScript

**Replit Plugins**: Development environment enhancements
- Runtime error overlay for better debugging
- Cartographer for code navigation
- Dev banner for development mode indication

### Styling and Design

**Tailwind CSS**: Utility-first CSS framework with:
- Custom configuration for brand colors
- Extended border radius values
- CSS custom properties for theming
- PostCSS for processing

**Google Fonts**: Web font delivery for:
- Architects Daughter (decorative)
- DM Sans (sans-serif)
- Fira Code (monospace)
- Geist Mono (monospace alternative)

### Form Handling

**React Hook Form**: Form state management with:
- @hookform/resolvers for validation schema integration
- Drizzle-zod for type-safe form validation
- Integration with Shadcn UI form components