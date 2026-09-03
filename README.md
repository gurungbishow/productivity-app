# My Routine - Productivity App

My Routine is a beautifully designed, premium productivity web application built to help users manage their daily schedules, track focus sessions (Pomodoro), and stay motivated with daily curated Nepali Shayaris. It features a sleek glassmorphism UI with a dark theme.

## Features

- **Custom Daily Routines**: Build and track your daily schedule slot by slot. Save a personalized "Default Routine" to quickly load every day.
- **Pomodoro Focus Timer**: Integrated timer for work sprints and breaks with visual progress rings.
- **Dynamic Dashboard**: View your current task, up next, and daily completion stats in a glanceable dashboard.
- **Shayari Motivation**: Daily updating motivational quotes (Shayaris) with a favorite system.
- **Authentication**: Secure login and sign-up powered by Supabase.
- **Premium UI**: Crafted with modern web aesthetics—glassmorphism, vivid gradients, and smooth micro-animations.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API + LocalStorage
- **Authentication**: [Supabase Auth](https://supabase.com/)

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your machine.

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Project Structure

- `app/` - Next.js app router pages and global layout.
- `components/` - Reusable UI components grouped by feature (dashboard, schedule, auth, settings).
- `lib/` - State management (`store.tsx`), types, schedule engine logic, and Supabase client.
- `public/` - Static assets and icons.
