import { MongoMemoryServer } from 'mongodb-memory-server';

export const disconnect = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('uri: ' + uri);
  /* eslint-disable no-new */
  /* eslint-disable no-undef */
  new MongoClient(uri);
  await mongod.stop();
};
