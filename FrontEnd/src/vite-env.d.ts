/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // add more VITE_ variables here if you have others
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
