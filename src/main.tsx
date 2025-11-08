
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { supabase } from "./lib/supabase";

  // Test Supabase connection on app load
  console.log('🔍 Testing Supabase Connection...');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Test fetching modules
  supabase
    .from('learning_modules')
    .select('*')
    .limit(5)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error fetching modules:', error.message);
      } else {
        console.log('✅ Successfully connected! Found', data?.length, 'modules');
        if (data && data.length > 0) {
          console.log('📚 Sample modules:', data.map(m => m.title).join(', '));
        }
      }
    });

  createRoot(document.getElementById("root")!).render(<App />);
  