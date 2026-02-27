const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://x:x@x.neon.tech/neondb' // this is hidden, but neon works via remote
});
