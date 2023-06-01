import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionTokens,
  pathTokens_Delete_MongoDBId,
  pathTokens_Get_Active,
  pathTokens_Get_MongoDBId,
  pathTokens_Post,
  pathTokens_Put_MongoDBId,
  mockToken,
  validMongoDBId,
} from './utils/variables.js';

/* eslint-disable no-unused-expressions */

chai.use(chaiHttp);

/**
 * The function modifies a mockToken field and tests the modification using Chai and MongoDB.
 */
function modifyTokenField({ field, value }) {
  it(`PUT /tokens/tokenId - ${field} - Should modify ${field}`, async function () {
    const customToken = { ...mockToken, isNative: false, isActive: false };
    const createResponse = await chai
      .request(app)
      .post(pathTokens_Post)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(customToken);
    chai.expect(createResponse).to.have.status(201);
    chai.expect(createResponse.body).to.have.property('acknowledged', true);
    chai.expect(createResponse.body).to.have.property('insertedId');

    const res = await chai
      .request(app)
      .put(pathTokens_Delete_MongoDBId + createResponse.body.insertedId)
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
  });
}

/**
 * This function creates a base mockToken in a database and returns the response.
 * @param mockToken - The `mockToken` parameter is an object that will be sent as the request body in the POST
 * request to the `pathTokens_Post` endpoint. It is used to create a new mockToken in the database.
 * @returns the response object from the POST request made to the `pathTokens_Post` endpoint with the
 * provided `mockToken` data. The function is also performing some assertions on the response object using the Chai
 * library.
 */
async function createBaseToken(mockToken) {
  const res = await chai
    .request(app)
    .post(pathTokens_Post)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(mockToken);
  chai.expect(res).to.have.status(201);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
  return res;
}

describe('Tokens route', async function () {
  describe('POST new mockToken', async function () {
    it('Should return 403 if no mockToken is provided', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathTokens_Post)
        .send(mockToken);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should create new mockToken', async function () {
      await createBaseToken(mockToken);
    });

    it('Should create new mockToken with the appropriate elements', async function () {
      const createResponse = await createBaseToken(mockToken);

      const tokenDB = await collectionTokens.findOne({
        _id: new ObjectId(createResponse.body.insertedId),
      });
      delete tokenDB._id;
      chai.expect(tokenDB).to.deep.equal(mockToken);
    });

    it('Should fail if mockToken already exists', async function () {
      await createBaseToken(mockToken);

      const createResponse1 = await chai
        .request(app)
        .post(pathTokens_Post)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(mockToken);
      chai.expect(createResponse1).to.have.status(404);
      chai
        .expect(createResponse1.body)
        .to.deep.equal({ msg: 'This token already exists.' });
    });
  });

  describe('GET active tokens', async function () {
    it('Should not fail if no mockToken is provided', async function () {
      const res = await chai.request(app).get(pathTokens_Get_Active);
      chai.expect(res).to.have.status(200);
    });

    it('Should return all active tokens', async function () {
      await createBaseToken(mockToken);
      await createBaseToken({
        ...mockToken,
        chainId: 'newChainId',
        address: 'newAddress',
      });

      const res = await chai
        .request(app)
        .get(pathTokens_Get_Active)
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

  describe('GET by MongoDBId', async function () {
    it('Should return 403 if no mockToken is provided', async function () {
      const createResponse = await chai
        .request(app)
        .get(pathTokens_Get_MongoDBId + validMongoDBId);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should get the adequate mockToken', async function () {
      const createResponse = await createBaseToken(mockToken);

      const res = await chai
        .request(app)
        .get(pathTokens_Delete_MongoDBId + createResponse.body.insertedId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai
        .expect(res.body._id.toString())
        .to.equal(createResponse.body.insertedId);
      delete res.body._id;
      chai.expect(res.body).to.deep.equal(mockToken);
    });

    it('Should return an empty object if no mockToken available', async function () {
      const res = await chai
        .request(app)
        .get(pathTokens_Get_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('PUT by MongoDBId', async function () {
    it('Should return 403 if no mockToken is provided', async function () {
      const createResponse = await chai
        .request(app)
        .put(pathTokens_Put_MongoDBId + validMongoDBId);
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

    it('Should fail if no mockToken found', async function () {
      const res = await chai
        .request(app)
        .put(pathTokens_Put_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No token found' });
    });
  });

  describe('DELETE by MongoDBId', async function () {
    it('Should return 403 if no mockToken is provided', async function () {
      const createResponse = await chai
        .request(app)
        .delete(pathTokens_Delete_MongoDBId + validMongoDBId);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should delete one mockToken', async function () {
      const createResponse = await createBaseToken(mockToken);

      const deleteResponse = await chai
        .request(app)
        .delete(pathTokens_Delete_MongoDBId + createResponse.body.insertedId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai
        .expect(deleteResponse.body)
        .to.deep.equal({ acknowledged: true, deletedCount: 1 });
    });

    it('Should fail if no mockToken exists', async function () {
      const deleteResponse = await chai
        .request(app)
        .delete(pathTokens_Delete_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(404);
      chai.expect(deleteResponse.body).to.deep.equal({ msg: 'No token found' });
    });
  });
});
