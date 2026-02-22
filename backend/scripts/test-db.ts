import postgres from 'postgres'

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...')
    const sql = postgres('postgresql://postgres:postgres@localhost:5432/postgres')
    const result = await sql`SELECT version()`
    console.log('✅ Connected to PostgreSQL!')
    console.log('Version:', result[0]?.version ?? 'Unknown')
    
    // Check if retail_erp database exists
    const dbs = await sql`SELECT datname FROM pg_database WHERE datname = 'retail_erp'`
    if (dbs.length === 0) {
      console.log('Creating retail_erp database...')
      await sql`CREATE DATABASE retail_erp`
      console.log('✅ Database retail_erp created!')
    } else {
      console.log('✅ Database retail_erp already exists')
    }
    
    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed:', error)
    process.exit(1)
  }
}

testConnection()
