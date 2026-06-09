# BukCare Frontend

This is the React-based frontend for the BukCare Appointment System, built with Vite and Tailwind CSS.

## Prerequisites

- **Node.js 18+**
- **npm** or **yarn**

## Local Setup

1. **Navigate to the Frontend directory:**
   ```bash
   cd FrontEnd
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Create a `.env` file in the `FrontEnd` directory.
   - Required variables usually include:
     - `VITE_API_URL` (Point this to your Backend API, e.g., `http://localhost:8000/v1`)
     - `VITE_GOOGLE_CLIENT_ID` (For Google OAuth)

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Build for Production

```bash
npm run build
```
This generates a `dist` folder ready to be served by a web server like Nginx.

## Key Technologies

- **React 19:** UI library.
- **Vite:** Next-generation frontend tooling.
- **Tailwind CSS 4:** Utility-first CSS framework.
- **Framer Motion & GSAP:** Smooth animations.
- **Lucide React:** Icon set.
- **React Router Dom:** Navigation and routing.
- **Axios:** HTTP client for API requests.
