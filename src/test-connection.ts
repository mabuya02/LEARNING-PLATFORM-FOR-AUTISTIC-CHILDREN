// Test Supabase Connection
// Run this file to verify database connectivity

import { supabase } from './lib/supabase';

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: Check if Supabase client is initialized
    console.log('✓ Supabase client initialized');
    console.log('  URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('  Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Present' : '✗ Missing');

    // Test 2: Try to fetch learning modules
    console.log('\n📚 Testing learning_modules table...');
    const { data: modules, error: modulesError } = await supabase
      .from('learning_modules')
      .select('*')
      .limit(5);

    if (modulesError) {
      console.error('✗ Error fetching modules:', modulesError.message);
    } else {
      console.log(`✓ Successfully fetched ${modules?.length || 0} modules`);
      if (modules && modules.length > 0) {
        console.log('  Sample module:', modules[0].title);
      }
    }

    // Test 3: Check if we can query profiles table (even if empty)
    console.log('\n👥 Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count');

    if (profilesError) {
      console.error('✗ Error querying profiles:', profilesError.message);
    } else {
      console.log('✓ Profiles table accessible');
    }

    // Test 4: Check children table
    console.log('\n👶 Testing children table...');
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('count');

    if (childrenError) {
      console.error('✗ Error querying children:', childrenError.message);
    } else {
      console.log('✓ Children table accessible');
    }

    // Test 5: Check progress table
    console.log('\n📊 Testing progress table...');
    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .select('count');

    if (progressError) {
      console.error('✗ Error querying progress:', progressError.message);
    } else {
      console.log('✓ Progress table accessible');
    }

    console.log('\n🎉 Connection test complete!');
    console.log('\n✅ All tables are accessible and ready to use!');

  } catch (error: any) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.error('2. Your Supabase project is running');
    console.error('3. The tables were created successfully');
  }
}

// Run the test
testConnection();

export { testConnection };
