import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL || 'https://zlgxgnradjjjcwfznehr.supabase.co'
    ),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ3hnbnJhZGpqamN3ZnpuZWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTYyMzIsImV4cCI6MjA3NTY5MjIzMn0.Mv1ZXHMbat06WgFKtOyVPXNYlLJCoyUstbib7E1jH8M'
    ),
    'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify(
      process.env.VITE_SUPABASE_PROJECT_ID || 'zlgxgnradjjjcwfznehr'
    ),
  },
}));
