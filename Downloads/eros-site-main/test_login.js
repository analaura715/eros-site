import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ejlcknlgvnfqynlhovlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqbGNrbmxndm5mcXlubGhvdmxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTIzMjkyNiwiZXhwIjoyMTAwODA4OTI2fQ.VTx0x1VajtjRynxhRlHoWyYjslohaXCKpXBqkf3yFeU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const data = await res.json();
  console.log(data);
}
check();
