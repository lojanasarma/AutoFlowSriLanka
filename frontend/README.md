# AutoFlow frontend

React 19 and Vite client for AutoFlow Sri Lanka.

## Commands

- `npm install` installs dependencies.
- `npm run dev` starts the development server.
- `npm run build` creates a production build in `dist/`.
- `npm run lint` runs Oxlint.

## Configuration

Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend API base
URL. Local `.env` files are ignored and must not contain committed secrets.

Runtime images, icons, and media belong in `public/`. Application code belongs
in `src/`, grouped by API, components, layouts, pages, and services.
