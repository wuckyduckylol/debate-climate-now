// Supabase configuration with fallback values for deployments
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://zlgxgnradjjjcwfznehr.supabase.co',
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ3hnbnJhZGpqamN3ZnpuZWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTYyMzIsImV4cCI6MjA3NTY5MjIzMn0.Mv1ZXHMbat06WgFKtOyVPXNYlLJCoyUstbib7E1jH8M',
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || 'zlgxgnradjjjcwfznehr'
};
