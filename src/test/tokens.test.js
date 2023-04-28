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
  token,
  validMongoDBId,
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
 * This function creates a base token in a database and returns the response.
 * @param token - The `token` parameter is an object that will be sent as the request body in the POST
 * request to the `pathTokens_Post` endpoint. It is used to create a new token in the database.
 * @returns the response object from the POST request made to the `pathTokens_Post` endpoint with the
 * provided `token` data. The function is also performing some assertions on the response object using the Chai
 * library.
 */
async function createBaseToken(token) {
  const res = await chai
    .request(app)
    .post(pathTokens_Post)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(token);
  chai.expect(res).to.have.status(201);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
  return res;
}

describe('Tokens route', async function () {
  describe('POST new token', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathTokens_Post)
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
        .post(pathTokens_Post)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(token);
      chai.expect(createResponse1).to.have.status(404);
      chai
        .expect(createResponse1.body)
        .to.deep.equal({ msg: 'This token already exists.' });
    });
  });

  describe('GET active tokens', async function () {
    it('Should not fail if no token is provided', async function () {
      const res = await chai.request(app).get(pathTokens_Get_Active);
      chai.expect(res).to.have.status(200);
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
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .get(pathTokens_Get_MongoDBId + validMongoDBId);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should get the adequate token', async function () {
      const createResponse = await createBaseToken(token);

      const res = await chai
        .request(app)
        .get(pathTokens_Delete_MongoDBId + createResponse.body.insertedId)
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
        .get(pathTokens_Get_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('PUT by MongoDBId', async function () {
    it('Should return 403 if no token is provided', async function () {
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

    it('Should fail if no token found', async function () {
      const res = await chai
        .request(app)
        .put(pathTokens_Put_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No token found' });
    });
  });

  describe('DELETE by MongoDBId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .delete(pathTokens_Delete_MongoDBId + validMongoDBId);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should delete one token', async function () {
      const createResponse = await createBaseToken(token);

      const deleteResponse = await chai
        .request(app)
        .delete(pathTokens_Delete_MongoDBId + createResponse.body.insertedId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai
        .expect(deleteResponse.body)
        .to.deep.equal({ acknowledged: true, deletedCount: 1 });
    });

    it('Should fail if no token exists', async function () {
      const deleteResponse = await chai
        .request(app)
        .delete(pathTokens_Delete_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(404);
      chai.expect(deleteResponse.body).to.deep.equal({ msg: 'No token found' });
    });
  });
});
