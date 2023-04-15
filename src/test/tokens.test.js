import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import db from '../db/conn.js';
import {
  mockedToken,
  testNonString,
  testNonEmpty,
  testUnexpectedField,
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
  isNative: true,
  isActive: true,
};

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
});
