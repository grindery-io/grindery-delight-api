import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.ATLAS_URI || '';
const client = new MongoClient(connectionString);

let conn;
try {
  conn = await client.connect();
} catch (e) {
  console.error(e);
}
let db = conn.db(
  process.env.NODE_ENV === 'test'
    ? 'grindery-delight-tests'
    : 'grindery-delight'
);
export default db;
