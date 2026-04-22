import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking articles table...");
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, published_at, url')
    .order('published_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching articles:", error);
  } else if (articles) {
    articles.forEach(a => {
      console.log(`[${a.published_at}] ${a.title.slice(0, 100)}... (ID: ${a.id})`);
    });
  }

  console.log("\nChecking events table...");
  const { data: events, error: errE } = await supabase
    .from('events')
    .select('id, title, last_updated')
    .order('last_updated', { ascending: false })
    .limit(5);

  if (errE) {
    console.error("Error fetching events:", errE);
  } else if (events) {
    events.forEach(e => {
      console.log(`[${e.last_updated}] ${e.title.slice(0, 100)}... (ID: ${e.id})`);
    });
  }
}

check();
