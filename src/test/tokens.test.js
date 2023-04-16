import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import db from '../db/conn.js';
import {
  mockedToken,
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonBoolean,
  testNonMongodbId,
} from './utils.js';
import { ObjectId } from 'mongodb';

chai.use(chaiHttp);
const expect = chai.expect;

const collection = db.collection('tokens');
const tokensPath = '/tokens';
const token = {
  coinmarketcapId: '4543',
  symbol: 'BNB',
  icon: 'https://www.grindery.io/hubfs/delight-assets/icons/tokens/bnb.png',
  chainId: '544',
  address: '0x0',
  isNative: false,
  isActive: false,
};

function modifyTokenField({ field, value }) {
  it(`PUT /tokens/tokenId - ${field} - Should modify ${field}`, async function () {
    const customToken = { ...token, isNative: false, isActive: false };
    const createResponse = await chai
      .request(app)
      .post(tokensPath)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(customToken);
    chai.expect(createResponse).to.have.status(201);
    chai.expect(createResponse.body).to.have.property('acknowledged', true);
    chai.expect(createResponse.body).to.have.property('insertedId');

    const res = await chai
      .request(app)
      .put(`/tokens/${createResponse.body.insertedId}`)
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
    const tokenDB = await collection.findOne({
      _id: new ObjectId(createResponse.body.insertedId),
    });

    delete tokenDB._id;
    chai.expect(tokenDB).to.deep.equal({ ...customToken, [field]: value });

    const deleteResponse = await chai
      .request(app)
      .delete(`/tokens/${createResponse.body.insertedId}`)
      .set('Authorization', `Bearer ${mockedToken}`);
    chai.expect(deleteResponse).to.have.status(200);
  });
}

describe('Tokens route', async function () {
  describe('POST new token', () => {
    describe('Core of the route', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .post(tokensPath)
          .send(token);
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should create new token', async function () {
        const createResponse = await chai
          .request(app)
          .post(tokensPath)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(token);
        chai.expect(createResponse).to.have.status(201);
        chai.expect(createResponse.body).to.have.property('acknowledged', true);
        chai.expect(createResponse.body).to.have.property('insertedId');

        const deleteResponse = await chai
          .request(app)
          .delete(`/tokens/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should create new token with the appropriate elements', async function () {
        const createResponse = await chai
          .request(app)
          .post(tokensPath)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(token);
        chai.expect(createResponse).to.have.status(201);
        const tokenDB = await collection.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        });
        delete tokenDB._id;
        chai.expect(tokenDB).to.deep.equal(token);

        const deleteResponse = await chai
          .request(app)
          .delete(`/tokens/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should fail if token already exists', async function () {
        const createResponse = await chai
          .request(app)
          .post(tokensPath)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(token);
        chai.expect(createResponse).to.have.status(201);

        const createResponse1 = await chai
          .request(app)
          .post(tokensPath)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(token);
        chai.expect(createResponse1).to.have.status(404);
        chai
          .expect(createResponse1.body)
          .to.deep.equal({ msg: 'This token already exists.' });

        const deleteResponse = await chai
          .request(app)
          .delete(`/tokens/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
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
            path: tokensPath,
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
          path: tokensPath,
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
      const createResponse = await chai.request(app).get('/tokens/active');
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should return all active tokens', async function () {
      const createResponse = await chai
        .request(app)
        .post(tokensPath)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(token);
      chai.expect(createResponse).to.have.status(201);

      const createResponse1 = await chai
        .request(app)
        .post(tokensPath)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ ...token, chainId: 'newChainId', address: 'newAddress' });
      chai.expect(createResponse1).to.have.status(201);

      const res = await chai
        .request(app)
        .get('/tokens/active')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('array');
      const expectedArray = await collection
        .find({
          isActive: true,
        })
        .toArray();
      expectedArray.forEach((obj) => {
        obj._id = obj._id.toString();
      });
      chai.expect(res.body).to.deep.equal(expectedArray);
      chai.expect(res.body.every((obj) => obj.isActive === true)).to.be.true;

      const deleteResponse = await chai
        .request(app)
        .delete(`/tokens/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);

      const deleteResponse1 = await chai
        .request(app)
        .delete(`/tokens/${createResponse1.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse1).to.have.status(200);
    });

    it('Should return an empty array if no token available', async function () {
      const res = await chai
        .request(app)
        .get('/tokens/active')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('array').that.is.empty;
    });
  });

  describe('GET by MongoDBId', () => {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .get('/tokens/111111111111111111111111');
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should get the adequate token', async function () {
      const createResponse = await chai
        .request(app)
        .post(tokensPath)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(token);
      chai.expect(createResponse).to.have.status(201);

      const res = await chai
        .request(app)
        .get(`/tokens/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai
        .expect(res.body._id.toString())
        .to.equal(createResponse.body.insertedId);
      delete res.body._id;
      chai.expect(res.body).to.deep.equal(token);

      const deleteResponse = await chai
        .request(app)
        .delete(`/tokens/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
    });

    it('Should return an empty object if no token available', async function () {
      const res = await chai
        .request(app)
        .get('/tokens/111111111111111111111111')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });

    testNonMongodbId({
      method: 'get',
      path: '/tokens/1111111111111111',
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
          .put('/tokens/111111111111111111111111');
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
          .put('/tokens/111111111111111111111111')
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
            path: '/tokens/111111111111111111111111',
            body: {
              [testCase]: 123,
            },
            query: {},
            field: testCase,
          });
        } else {
          testNonString({
            method: 'put',
            path: '/tokens/111111111111111111111111',
            body: {
              [testCase]: 123,
            },
            query: {},
            field: testCase,
          });
        }

        testNonEmpty({
          method: 'put',
          path: '/tokens/111111111111111111111111',
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
        path: '/tokens/111111111111111111111111',
        body: {
          unexpectedField: 'unexpectedField',
        },
        query: {},
        field: 'unexpectedField',
        location: 'body',
      });

      testUnexpectedField({
        method: 'put',
        path: '/tokens/111111111111111111111111',
        body: {},
        query: { unexpectedField: 'unexpectedField' },
        field: 'unexpectedField',
        location: 'query',
      });

      testNonMongodbId({
        method: 'put',
        path: '/tokens/1111111111111111',
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
        .delete('/tokens/111111111111111111111111');
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should delete one token', async function () {
      const createResponse = await chai
        .request(app)
        .post(tokensPath)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(token);
      chai.expect(createResponse).to.have.status(201);

      const deleteResponse = await chai
        .request(app)
        .delete(`/tokens/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai
        .expect(deleteResponse.body)
        .to.deep.equal({ acknowledged: true, deletedCount: 1 });
    });

    it('Should fail if no token exists', async function () {
      const deleteResponse = await chai
        .request(app)
        .delete(`/tokens/111111111111111111111111`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(404);
      chai.expect(deleteResponse.body).to.deep.equal({ msg: 'No token found' });
    });

    testNonMongodbId({
      method: 'delete',
      path: '/tokens/1111111111111111',
      body: {},
      query: {},
      field: 'tokenId',
    });
  });
});
