import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllAccounts() {
  console.log('='.repeat(80));
  console.log('CHECKING ALL ACCOUNTS IN DATABASE');
  console.log('='.repeat(80));

  try {
    // 1. Check all profiles
    console.log('\n📋 ALL PROFILES:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.table(profiles);
      console.log(`Total profiles: ${profiles?.length || 0}`);
    }

    // 2. Check all children records
    console.log('\n👶 ALL CHILDREN RECORDS:');
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: false });

    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError);
    } else {
      console.table(children);
      console.log(`Total children: ${children?.length || 0}`);
    }

    // 3. Count by role
    console.log('\n📊 PROFILES BY ROLE:');
    const roleCounts = profiles?.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {});
    console.table(roleCounts);

    // 4. Check for orphaned child profiles (child role without children record)
    console.log('\n⚠️ ORPHANED CHILD PROFILES (child role but no children record):');
    const childProfiles = profiles?.filter(p => p.role === 'child') || [];
    const childrenIds = new Set(children?.map(c => c.id) || []);
    const orphanedChildren = childProfiles.filter(p => !childrenIds.has(p.id));
    
    if (orphanedChildren.length > 0) {
      console.table(orphanedChildren);
      console.log(`⚠️ Found ${orphanedChildren.length} orphaned child profiles!`);
    } else {
      console.log('✅ No orphaned child profiles found');
    }

    // 5. Check profiles with missing children records
    console.log('\n🔍 DETAILED ANALYSIS:');
    const analysis = {
      totalProfiles: profiles?.length || 0,
      totalChildren: children?.length || 0,
      childRoleProfiles: childProfiles.length,
      orphanedChildProfiles: orphanedChildren.length,
      parentProfiles: profiles?.filter(p => p.role === 'parent').length || 0,
      educatorProfiles: profiles?.filter(p => p.role === 'educator').length || 0,
      adminProfiles: profiles?.filter(p => p.role === 'admin').length || 0,
    };
    console.table(analysis);

    // 6. Show parent-child relationships
    console.log('\n👨‍👩‍👧 PARENT-CHILD RELATIONSHIPS:');
    const parentsWithChildren = profiles?.filter(p => p.role === 'parent' && p.child_id);
    if (parentsWithChildren && parentsWithChildren.length > 0) {
      parentsWithChildren.forEach(parent => {
        const child = profiles?.find(p => p.id === parent.child_id);
        console.log(`  Parent: ${parent.name} (${parent.email}) → Child: ${child?.name || 'NOT FOUND'}`);
      });
    } else {
      console.log('  No parent-child links found');
    }

    // 7. Show children with parents
    console.log('\n👶➡️👨 CHILDREN WITH PARENT_ID:');
    if (children && children.length > 0) {
      children.forEach(child => {
        const parent = profiles?.find(p => p.id === child.parent_id);
        console.log(`  Child: ${child.name} (age ${child.age}) → Parent: ${parent?.name || child.parent_id || 'NONE'}`);
      });
    } else {
      console.log('  No children records found');
    }

    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the check
checkAllAccounts();
