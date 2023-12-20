import { Pool } from 'pg'
import GracefulShutdownHandler from '../'
 
const pool = new Pool()
const handler = new GracefulShutdownHandler();
handler.addCallback(async () => {
  console.log("closing database connection...")
  await pool.end();
  console.log("database connection closed")
})