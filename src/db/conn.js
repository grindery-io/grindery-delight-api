import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
dotenv.config();

const connectionString = process.env.ATLAS_URI || '';
const client = new MongoClient(connectionString);

export class Database {
  static instance;
  constructor() {}

  static async getInstance(req) {
    if (!Database.instance) {
      if (process.env.NODE_ENV !== 'test') {
        let conn;
        try {
          conn = await client.connect();
        } catch (e) {
          console.error(e);
        }

        if (req.originalUrl.includes('/test/')) {
          Database.instance = conn.db('grindery-delight-tests');
        }

        Database.instance = conn.db('grindery-delight');
      } else {
        // This will create an new instance of "MongoMemoryServer" and automatically start it
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        const clientMemory = new MongoClient(uri);
        const connMemory = await clientMemory.connect();
        const dbTest = connMemory.db('grindery-delight-test-server');

        Database.instance = dbTest;

        // const collectionAdmin = dbTest.collection('admins');
        // await collectionAdmin.insertOne({
        //   userId: process.env.USER_ID_TEST,
        // });
      }
    }
    return Database.instance;
  }
}

const getDBConnection = async (req) => {
  // if (process.env.NODE_ENV !== 'test') {
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
  // }

  // return undefined;

  // // This will create an new instance of "MongoMemoryServer" and automatically start it
  // const mongod = await MongoMemoryServer.create();
  // const uri = mongod.getUri();
  // const clientMemory = new MongoClient(uri);
  // const connMemory = await clientMemory.connect();
  // const dbTest = connMemory.db('grindery-delight-test-server');

  // const collectionAdmin = dbTest.collection('admins');
  // await collectionAdmin.insertOne({
  //   userId: process.env.USER_ID_TEST,
  // });

  // return dbTest;

  // await mongod.connect();

  // console.log(mongod.db('tototo'));

  // console.log('mongod', mongod);
  // console.log('process.env.ATLAS_URI ', process.env.ATLAS_URI);
  // console.log('uri', uri);
};

export default getDBConnection;
