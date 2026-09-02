const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('/* supabase.from */ null')) {
        c = c.replace(/\/\* supabase\.from \*\/ null/g, 'supabase.from');
        if (!c.includes('import { supabase }')) {
          c = "import { supabase } from '@/integrations/supabase/client';\n" + c;
        }
        fs.writeFileSync(p, c);
        console.log('Reverted', p);
      }
    }
  }
}

walk('./src');
