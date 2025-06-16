# Magic Slate

Magic Slate is a digital drawing and note-taking Progressive Web App (PWA) built with Next.js. It allows users to sketch, take notes, and solve equations in a modern, responsive interface. The app is installable on desktop and mobile devices, and works offline.

## Features
- ✏️ Digital drawing canvas
- 📝 Note-taking capabilities
- 🧮 Equation solver
- 📱 PWA: installable and mobile-friendly
- 🔒 Secure client-side encryption for sensitive data
- 🎨 Modern UI with Tailwind CSS

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
```bash
npm install
# or
yarn install
```

### Development
```bash
npm run dev
# or
yarn dev
```
Visit [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production
```bash
npm run build && npm start
# or
yarn build && yarn start
```

## PWA Support
- The app includes a manifest and service worker for offline support and installability.
- Icons and assets are located in the `public/` directory.

## Project Structure
- `src/app/` – Next.js app directory (pages, layout, manifest, service worker)
- `src/components/` – UI components
- `src/lib/` – Utility libraries (encryption, cookies, etc.)
- `public/` – Static assets and PWA icons

## Security Note
This app uses client-side encryption for demo purposes. Do not use hardcoded secrets in production.

## License
BSD 3 Clause license (C) Ayush Muley
