import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import {
  mockedToken,
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonBoolean,
  testNonMongodbId,
  deleteElementsAfterTest,
} from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionTokens,
  pathTokens,
  token,
  toDeleteDb,
} from './utils/variables.js';

chai.use(chaiHttp);

/**
 * The function modifies a token field and tests the modification using Chai and MongoDB.
 */
function modifyTokenField({ field, value }) {
  it(`PUT /tokens/tokenId - ${field} - Should modify ${field}`, async function () {
    const customToken = { ...token, isNative: false, isActive: false };
    const createResponse = await chai
      .request(app)
      .post(pathTokens)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(customToken);
    chai.expect(createResponse).to.have.status(201);
    chai.expect(createResponse.body).to.have.property('acknowledged', true);
    chai.expect(createResponse.body).to.have.property('insertedId');

    const res = await chai
      .request(app)
      .put(`/test/tokens/${createResponse.body.insertedId}`)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send({ [field]: value });
    chai.expect(res).to.have.status(200);
    chai.expect(res.body).to.deep.equal({
      acknowledged: true,
      modifiedCount: 1,
      upsertedId: null,
      upsertedCount: 0,
      matchedCount: 1,
    });
    const tokenDB = await collectionTokens.findOne({
      _id: new ObjectId(createResponse.body.insertedId),
    });

    delete tokenDB._id;
    chai.expect(tokenDB).to.deep.equal({ ...customToken, [field]: value });

    const deleteResponse = await chai
      .request(app)
      .delete(`/test/tokens/${createResponse.body.insertedId}`)
      .set('Authorization', `Bearer ${mockedToken}`);
    chai.expect(deleteResponse).to.have.status(200);
  });
}

/**
 * This function creates a base token in a database and returns the response.
 * @param token - The `token` parameter is an object that will be sent as the request body in the POST
 * request to the `pathTokens` endpoint. It is used to create a new token in the database.
 * @returns the response object from the POST request made to the `pathTokens` endpoint with the
 * provided `token` data. The response object is also being stored in an array `toDeleteDb` for later
 * cleanup. The function is also performing some assertions on the response object using the Chai
 * library.
 */
async function createBaseToken(token) {
  const res = await chai
    .request(app)
    .post(pathTokens)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(token);
  toDeleteDb.push({
    collection: collectionTokens,
    id: res.body.insertedId,
  });
  chai.expect(res).to.have.status(201);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
  return res;
}

afterEach(async function () {
  await deleteElementsAfterTest(toDeleteDb);
  toDeleteDb.length = 0;
});

describe('Tokens route', async function () {
  describe('POST new token', () => {
    describe('Core of the route', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .post(pathTokens)
          .send(token);
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should create new token', async function () {
        await createBaseToken(token);
      });

      it('Should create new token with the appropriate elements', async function () {
        const createResponse = await createBaseToken(token);

        const tokenDB = await collectionTokens.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        });
        delete tokenDB._id;
        chai.expect(tokenDB).to.deep.equal(token);
      });

      it('Should fail if token already exists', async function () {
        const createResponse = await createBaseToken(token);

        const createResponse1 = await chai
          .request(app)
          .post(pathTokens)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(token);
        chai.expect(createResponse1).to.have.status(404);
        chai
          .expect(createResponse1.body)
          .to.deep.equal({ msg: 'This token already exists.' });
      });
    });

    describe('Validators', () => {
      const testCases = [
        'coinmarketcapId',
        'symbol',
        'icon',
        'chainId',
        'address',
        'isNative',
        'isActive',
      ];

      for (const testCase of testCases) {
        if (testCase !== 'isNative' && testCase !== 'isActive') {
          testNonString({
            method: 'post',
            path: pathTokens,
            body: {
              ...token,
              [testCase]: 123,
            },
            query: {},
            field: testCase,
          });
        }

        testNonEmpty({
          method: 'post',
          path: pathTokens,
          body: {
            ...token,
            [testCase]: '',
          },
          query: {},
          field: testCase,
        });
      }
    });
  });

  describe('GET active tokens', () => {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai.request(app).get('/test/tokens/active');
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should return all active tokens', async function () {
      await createBaseToken(token);
      await createBaseToken({
        ...token,
        chainId: 'newChainId',
        address: 'newAddress',
      });

      const res = await chai
        .request(app)
        .get('/test/tokens/active')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('array');
      const expectedArray = await collectionTokens
        .find({
          isActive: true,
        })
        .toArray();
      expectedArray.forEach((obj) => {
        obj._id = obj._id.toString();
      });
      chai.expect(res.body).to.deep.equal(expectedArray);
      chai.expect(res.body.every((obj) => obj.isActive === true)).to.be.true;
    });
  });

  describe('GET by MongoDBId', () => {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .get('/test/tokens/111111111111111111111111');
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should get the adequate token', async function () {
      const createResponse = await createBaseToken(token);

      const res = await chai
        .request(app)
        .get(`/test/tokens/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai
        .expect(res.body._id.toString())
        .to.equal(createResponse.body.insertedId);
      delete res.body._id;
      chai.expect(res.body).to.deep.equal(token);
    });

    it('Should return an empty object if no token available', async function () {
      const res = await chai
        .request(app)
        .get('/test/tokens/111111111111111111111111')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });

    testNonMongodbId({
      method: 'get',
      path: '/test/tokens/1111111111111111',
      body: {},
      query: {},
      field: 'tokenId',
    });
  });

  describe('PUT by MongoDBId', () => {
    describe('Core of the route', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .put('/test/tokens/111111111111111111111111');
        chai.expect(createResponse).to.have.status(403);
      });

      modifyTokenField({
        field: 'coinmarketcapId',
        value: 'modifiedcoinmarketcapId',
      });

      modifyTokenField({
        field: 'symbol',
        value: 'modifiedsymbol',
      });

      modifyTokenField({
        field: 'icon',
        value: 'modifiedicon',
      });

      modifyTokenField({
        field: 'chainId',
        value: 'modifiedchainId',
      });

      modifyTokenField({
        field: 'address',
        value: 'modifiedaddress',
      });

      modifyTokenField({
        field: 'isNative',
        value: true,
      });

      modifyTokenField({
        field: 'isActive',
        value: true,
      });

      it('Should fail if no token found', async function () {
        const res = await chai
          .request(app)
          .put('/test/tokens/111111111111111111111111')
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(404);
        chai.expect(res.body).to.deep.equal({ msg: 'No token found' });
      });
    });

    describe('Validators', () => {
      const testCases = [
        'coinmarketcapId',
        'symbol',
        'icon',
        'chainId',
        'address',
        'isNative',
        'isActive',
      ];

      for (const testCase of testCases) {
        if (testCase === 'isActive' || testCase === 'isNative') {
          testNonBoolean({
            method: 'put',
            path: '/test/tokens/111111111111111111111111',
            body: {
              [testCase]: 123,
            },
            query: {},
            field: testCase,
          });
        } else {
          testNonString({
            method: 'put',
            path: '/test/tokens/111111111111111111111111',
            body: {
              [testCase]: 123,
            },
            query: {},
            field: testCase,
          });
        }

        testNonEmpty({
          method: 'put',
          path: '/test/tokens/111111111111111111111111',
          body: {
            ...token,
            [testCase]: '',
          },
          query: {},
          field: testCase,
        });
      }

      testUnexpectedField({
        method: 'put',
        path: '/test/tokens/111111111111111111111111',
        body: {
          unexpectedField: 'unexpectedField',
        },
        query: {},
        field: 'unexpectedField',
        location: 'body',
      });

      testUnexpectedField({
        method: 'put',
        path: '/test/tokens/111111111111111111111111',
        body: {},
        query: { unexpectedField: 'unexpectedField' },
        field: 'unexpectedField',
        location: 'query',
      });

      testNonMongodbId({
        method: 'put',
        path: '/test/tokens/1111111111111111',
        body: {},
        query: {},
        field: 'tokenId',
      });
    });
  });

  describe('DELETE by MongoDBId', () => {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .delete('/test/tokens/111111111111111111111111');
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should delete one token', async function () {
      const createResponse = await createBaseToken(token);

      const deleteResponse = await chai
        .request(app)
        .delete(`/test/tokens/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai
        .expect(deleteResponse.body)
        .to.deep.equal({ acknowledged: true, deletedCount: 1 });
    });

    it('Should fail if no token exists', async function () {
      const deleteResponse = await chai
        .request(app)
        .delete(`/test/tokens/111111111111111111111111`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(404);
      chai.expect(deleteResponse.body).to.deep.equal({ msg: 'No token found' });
    });

    testNonMongodbId({
      method: 'delete',
      path: '/test/tokens/1111111111111111',
      body: {},
      query: {},
      field: 'tokenId',
    });
  });
});
