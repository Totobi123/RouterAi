# Design Guidelines: AI Chat Application

## Design Approach
**Reference-Based Approach** - Drawing inspiration from ChatGPT, Claude, and Linear's clean interfaces. Focus on conversation clarity and minimal distraction.

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 (e.g., p-4, gap-6, m-8)

**Core Structure**:
- Full-height viewport layout (h-screen) with fixed conversation container
- Max-width constraint: max-w-3xl centered for optimal reading (45-75 characters per line)
- Two-section vertical split: Chat messages area (flex-1) + Input area (fixed bottom)
- Messages scroll independently while input remains anchored

## Typography Hierarchy

**Font Stack**: 
- Primary: Inter or system-ui for clean readability
- Monospace: JetBrains Mono or Fira Code for code blocks

**Scale**:
- App title/header: text-xl font-semibold (if included)
- User messages: text-base font-medium
- AI responses: text-base font-normal
- Timestamps/metadata: text-sm
- Input placeholder: text-base

## Component Library

### Chat Message Bubbles
- User messages: Right-aligned, rounded-2xl, px-4 py-3, max-w-[80%]
- AI responses: Left-aligned, rounded-2xl, px-4 py-3, full width within container
- Clear visual distinction through layout positioning
- Add subtle rounded corners (rounded-2xl) for modern feel
- Include 16px gap (gap-4) between consecutive messages
- Avatar indicators: 32px circles (w-8 h-8) with initials or icons

### Input Component
- Fixed bottom position with backdrop blur effect
- Container: px-4 py-6, border-t
- Text area: Expanding (min-h-12, max-h-32), rounded-xl, px-4 py-3
- Send button: Positioned absolute right side or as icon button, rounded-lg, p-2
- Character count or typing indicator space reserved

### Header (Minimal)
- Fixed top: px-6 py-4, border-b
- App title on left, optional settings/clear chat on right
- Height: h-16

### Loading States
- Typing indicator: Three animated dots (8px each, gap-1)
- Pulse animation on AI message container while generating
- Skeleton screens for initial load

## Icons
**Library**: Heroicons (via CDN)
- Send: paper-airplane icon
- Settings: cog-6-tooth icon  
- Clear chat: trash icon
- User avatar: user-circle icon
- AI avatar: sparkles or cpu-chip icon

## Visual Structure

**Vertical Rhythm**:
- Header: 64px fixed height
- Message spacing: gap-4 (16px) between messages
- Section padding: py-6 for input area
- Container padding: px-4 on mobile, px-6 on desktop

**Message Threading**:
- Group consecutive messages from same sender with reduced gap (gap-2)
- Timestamp every 5 messages or 5-minute intervals
- Clear conversation flow with subtle dividers for new sessions

## Responsive Behavior

**Mobile** (base):
- Single column, px-4
- Input area sticky bottom with safe-area-inset-bottom
- Messages max-w-full (remove 80% constraint)
- Reduce padding to p-3 for messages

**Desktop** (lg:):
- Centered conversation: max-w-3xl mx-auto
- Generous padding: px-6
- Message bubbles max-w-[80%] for better scanning

## Interaction Patterns

**Input Handling**:
- Auto-focus on mount
- Shift+Enter for new line, Enter to send
- Disable send button when empty or loading
- Clear input after successful send

**Message Display**:
- Smooth scroll to bottom on new messages
- Scroll behavior: smooth
- Auto-scroll only for new messages, preserve scroll position when reviewing history

**Empty State**:
- Centered content with icon, headline, example prompts
- 3-4 suggested starter questions as clickable pills
- Example: "Try asking: 'Explain quantum computing simply'"

## Accessibility
- Semantic HTML: <main>, <form>, <button>
- ARIA labels on icon buttons
- Focus visible states on all interactive elements
- Keyboard navigation: Tab through interface, Enter to send
- Screen reader announcements for new AI responses

## Key Design Principles
1. **Conversation First**: Maximize space for messages, minimize chrome
2. **Instant Clarity**: Clear visual distinction between user and AI without color dependency
3. **Distraction-Free**: No animations except essential loading states
4. **Performance**: Virtualize long conversations (100+ messages)