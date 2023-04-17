import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.ATLAS_URI || '';
const client = new MongoClient(connectionString);

const getDBConnection = async (req) => {
  let conn;
  try {
    conn = await client.connect();
  } catch (e) {
    console.error(e);
  }

  if (req.originalUrl.includes('/test/')) {
    return conn.db('grindery-delight-tests');
  }

  return conn.db('grindery-delight');
};

export default getDBConnection;
