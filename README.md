Musora Open 2026

A web application built for the Musora Open 2026 golf tournament.

This project is built with:

* TanStack Start
* Convex
* React
* TypeScript
* shadcn/ui

The project was originally forked from a family golf game project and adapted for the Musora Open tournament.

Features

* Real-time data powered by Convex
* Modern React application architecture using TanStack Start
* Type-safe backend and frontend development
* Responsive UI built with shadcn/ui
* Fast deployment and development workflow

Getting Started

Prerequisites

* Node.js 20+
* npm, pnpm, or bun
* A Convex account and deployment

Installation

Clone the repository:

git clone https://github.com/JedBorseth/musora-open-2026.git
cd musora-open-2026

Install dependencies:

npm install

Environment Variables

Create a .env.local file in the project root:

CONVEX_DEPLOYMENT=
VITE_CONVEX_URL=
VITE_CONVEX_SITE_URL=

Variable	Description
CONVEX_DEPLOYMENT	Your Convex deployment identifier
VITE_CONVEX_URL	Convex deployment URL used by the frontend
VITE_CONVEX_SITE_URL	Public site URL for the application

Running Locally

Start the Convex development environment:

npx convex dev

In another terminal, start the application:

npm run dev

The application will be available at:

http://localhost:3000

Tech Stack

* Frontend: TanStack Start, React, TypeScript
* Backend: Convex
* UI Components: shadcn/ui
* Styling: Tailwind CSS

Deployment

Deploy the frontend using your preferred hosting provider and deploy the Convex backend using the Convex CLI.

npx convex deploy

License

This project is licensed under the MIT License.