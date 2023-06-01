import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionBlockchains,
  pathBlockchains_Post_NewBlockchain,
  mockBlockchain,
  usefulAddress,
  pathBlockchains_Get_MongoDBId,
  pathBlockchains_Put_MongoDBId,
  pathBlockchains_Get_Active,
  validMongoDBId,
  pathBlockchains_Delete_MongoDBId,
  pathBlockchains_Put_UsefulAddress_MongoDBId,
  pathBlockchains_Delete_UsefulAddress_MongoDBId,
} from './utils/variables.js';

chai.use(chaiHttp);

/**
 * This function modifies a specific field in a mockBlockchain object and tests that the modification was
 * successful.
 */
function modifyBlockchainField({ field, value }) {
  it(`PUT /blockchains/blockchainId - ${field} - Should modify ${field}`, async function () {
    // Create a custom mockBlockchain object with modified field values
    const customBlockchain = {
      ...mockBlockchain,
      isActive: false,
      isEvm: false,
      isTestnet: false,
    };

    // Create a new mockBlockchain entry in the database with the customBlockchain object
    const createResponse = await createBaseBlockchain(customBlockchain);

    // Send a PUT request to update the mockBlockchain with the specified field and value
    const res = await chai
      .request(app)
      .put(pathBlockchains_Put_MongoDBId + createResponse.body.insertedId)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send({ [field]: value });

    // Assertions to check the response status and body
    chai.expect(res).to.have.status(200);
    chai.expect(res.body).to.deep.equal({
      acknowledged: true,
      modifiedCount: 1,
      upsertedId: null,
      upsertedCount: 0,
      matchedCount: 1,
    });

    // Fetch the updated mockBlockchain from the database
    const blockchainDB = await collectionBlockchains.findOne({
      _id: new ObjectId(createResponse.body.insertedId),
    });

    // Delete the _id field from the fetched mockBlockchain object for comparison
    delete blockchainDB._id;

    // Assertions to check if the fetched mockBlockchain matches the expected result
    chai
      .expect(blockchainDB)
      .to.deep.equal({ ...customBlockchain, [field]: value });
  });
}

/**
 * This function creates a new mockBlockchain in a database using a POST request and expects a successful
 * response.
 * @param mockBlockchain - The parameter `mockBlockchain` is an object that represents the data of a mockBlockchain
 * that will be created. It is being passed as an argument to the `createBaseBlockchain` function.
 */
async function createBaseBlockchain(mockBlockchain) {
  const res = await chai
    .request(app)
    .post(pathBlockchains_Post_NewBlockchain)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(mockBlockchain);
  chai.expect(res).to.have.status(200);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
  return res;
}

describe('Blockchains route', async function () {
  describe('POST new mockBlockchain', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathBlockchains_Post_NewBlockchain)
        .send(mockBlockchain);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should create a new mockBlockchain', async function () {
      await createBaseBlockchain(mockBlockchain);
    });

    it('Should create a new mockBlockchain with the proper fields', async function () {
      const createResponse = await createBaseBlockchain(mockBlockchain);
      const res = await chai
        .request(app)
        .get(pathBlockchains_Get_MongoDBId + createResponse.body.insertedId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      delete res.body._id;
      chai.expect(res.body).to.deep.equal(mockBlockchain);
    });

    it('Should fail if the mockBlockchain already exists', async function () {
      await createBaseBlockchain(mockBlockchain);
      const createResponse1 = await chai
        .request(app)
        .post(pathBlockchains_Post_NewBlockchain)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(mockBlockchain);
      chai.expect(createResponse1).to.have.status(404);
      chai
        .expect(createResponse1.body)
        .to.deep.equal({ msg: 'This blockchain already exists.' });
    });
  });

  describe('GET active blockchains', async function () {
    it('Should not fail if no token is provided', async function () {
      await createBaseBlockchain(mockBlockchain);
      await createBaseBlockchain({
        ...mockBlockchain,
        caipId: 'eip155:45',
        isActive: false,
      });
      const res = await chai.request(app).get(pathBlockchains_Get_Active);
      chai.expect(res).to.have.status(200);
    });

    it('Should return all active blockchains', async function () {
      await createBaseBlockchain(mockBlockchain);
      await createBaseBlockchain({
        ...mockBlockchain,
        caipId: 'eip155:45',
        isActive: false,
      });
      const res = await chai
        .request(app)
        .get(pathBlockchains_Get_Active)
        .set('Authorization', `Bearer ${mockedToken}`);

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('array');
      const expectedArray = await collectionBlockchains
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

  describe('GET mockBlockchain by MongoDBId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathBlockchains_Get_MongoDBId + validMongoDBId);
      chai.expect(res).to.have.status(403);
    });

    it('Should return mockBlockchain with the proper blockchainId', async function () {
      const createResponse = await createBaseBlockchain(mockBlockchain);
      const res = await chai
        .request(app)
        .get(pathBlockchains_Get_MongoDBId + createResponse.body.insertedId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai
        .expect(res.body._id.toString())
        .to.be.equal(createResponse.body.insertedId);
    });
    it('Should return null if no mockBlockchain found', async function () {
      const res = await chai
        .request(app)
        .get(pathBlockchains_Get_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('PUT mockBlockchain', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchains_Put_MongoDBId + validMongoDBId);
      chai.expect(res).to.have.status(403);
    });

    modifyBlockchainField({ field: 'chainId', value: 'modifiedChainId' });
    modifyBlockchainField({ field: 'caipId', value: 'eip155:343' });
    modifyBlockchainField({ field: 'label', value: 'newLabel' });
    modifyBlockchainField({ field: 'icon', value: 'newIcon' });
    modifyBlockchainField({
      field: 'rpc',
      value: [
        'https://new.goerli.blockpi.network/v1/rpc/public',
        'https://new.rpc.ankr.com/eth_goerli',
        'https://new.eth-goerli.public.blastapi.io',
      ],
    });
    modifyBlockchainField({
      field: 'nativeTokenSymbol',
      value: 'newNativeTokenSymbol',
    });
    modifyBlockchainField({ field: 'isEvm', value: true });
    modifyBlockchainField({
      field: 'isTestnet',
      value: true,
    });
    modifyBlockchainField({ field: 'isActive', value: true });
    modifyBlockchainField({
      field: 'transactionExplorerUrl',
      value: 'https://new.goerli.etherscan.io/tx/{hash}',
    });
    modifyBlockchainField({
      field: 'addressExplorerUrl',
      value: 'https://new.goerli.etherscan.io/address/{hash}',
    });

    it('Should fail if no blockchain found', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchains_Put_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No blockchain found' });
    });
  });

  describe('DELETE mockBlockchain', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .delete(pathBlockchains_Delete_MongoDBId + validMongoDBId);
      chai.expect(res).to.have.status(403);
    });
    it('Should delete one mockBlockchain', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathBlockchains_Post_NewBlockchain)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(mockBlockchain);

      chai.expect(createResponse).to.have.status(200);
      chai.expect(createResponse.body).to.have.property('acknowledged', true);
      chai.expect(createResponse.body).to.have.property('insertedId');

      const deleteResponse = await chai
        .request(app)
        .delete(
          pathBlockchains_Delete_MongoDBId + createResponse.body.insertedId
        )
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai
        .expect(deleteResponse.body)
        .to.deep.equal({ acknowledged: true, deletedCount: 1 });
      chai.expect(
        await collectionBlockchains.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.be.null;
    });
  });

  describe('POST useful address', async function () {
    it('Should return 403 if no token is not provided', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchains_Put_UsefulAddress_MongoDBId + validMongoDBId);
      chai.expect(res).to.have.status(403);
    });

    it('Should return 404 if mockBlockchain is not found', async function () {
      const response = await chai
        .request(app)
        .put(pathBlockchains_Put_UsefulAddress_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(usefulAddress);
      chai.expect(response).to.have.status(404);
      chai.expect(response.body).to.deep.equal({
        msg: 'No blockchain found',
      });
    });

    it('Should create a new useful address with the proper fields', async function () {
      const createResponse = await createBaseBlockchain(mockBlockchain);
      const newUsefulAddress = await chai
        .request(app)
        .put(
          pathBlockchains_Put_UsefulAddress_MongoDBId +
            createResponse.body.insertedId
        )
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(usefulAddress);
      chai.expect(newUsefulAddress).to.have.status(200);
      chai.expect(newUsefulAddress.body).to.deep.equal({
        acknowledged: true,
        modifiedCount: 1,
        upsertedId: null,
        upsertedCount: 0,
        matchedCount: 1,
      });
      const res = await chai
        .request(app)
        .get(pathBlockchains_Get_MongoDBId + createResponse.body.insertedId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      delete res.body._id;
      chai.expect(res.body.usefulAddresses).to.deep.equal({
        ...mockBlockchain.usefulAddresses,
        [usefulAddress.contract]: usefulAddress.address,
      });
    });

    it('Should update a useful address with the proper fields', async function () {
      const createResponse = await createBaseBlockchain(mockBlockchain);
      const updateUsefulAddress = await chai
        .request(app)
        .put(
          pathBlockchains_Put_UsefulAddress_MongoDBId +
            createResponse.body.insertedId
        )
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          contract: mockBlockchain.usefulAddresses.myUsefulAddress1,
          address: 'modifiedAddress',
        });
      chai.expect(updateUsefulAddress).to.have.status(200);
      chai.expect(updateUsefulAddress.body).to.deep.equal({
        acknowledged: true,
        modifiedCount: 1,
        upsertedId: null,
        upsertedCount: 0,
        matchedCount: 1,
      });
      const res = await chai
        .request(app)
        .get(pathBlockchains_Get_MongoDBId + createResponse.body.insertedId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      delete res.body._id;
      chai.expect(res.body.usefulAddresses).to.deep.equal({
        ...mockBlockchain.usefulAddresses,
        [mockBlockchain.usefulAddresses.myUsefulAddress1]: 'modifiedAddress',
      });
    });
  });

  describe('DELETE useful address', async function () {
    it('Should return 403 if no token is not provided', async function () {
      const res = await chai
        .request(app)
        .delete(
          pathBlockchains_Delete_UsefulAddress_MongoDBId + validMongoDBId
        );
      chai.expect(res).to.have.status(403);
    });

    it('Should return 404 if useful address is not found', async function () {
      const createResponse = await createBaseBlockchain(mockBlockchain);

      const deleteResponse = await chai
        .request(app)
        .delete(
          pathBlockchains_Delete_UsefulAddress_MongoDBId +
            createResponse.body.insertedId
        )
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ contract: usefulAddress.contract });
      chai.expect(deleteResponse).to.have.status(404);
      chai.expect(deleteResponse.body).to.deep.equal({
        msg: 'No blockchain found or contract doesnt exist',
      });
    });

    it('Should return 404 if mockBlockchain is not found', async function () {
      const deleteResponse = await chai
        .request(app)
        .delete(pathBlockchains_Delete_UsefulAddress_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ contract: mockBlockchain.usefulAddresses.myUsefulAddress1 });
      chai.expect(deleteResponse).to.have.status(404);
      chai.expect(deleteResponse.body).to.deep.equal({
        msg: 'No blockchain found or contract doesnt exist',
      });
    });

    it('Should delete useful address', async function () {
      const createResponse = await createBaseBlockchain(mockBlockchain);

      const deleteResponse = await chai
        .request(app)
        .delete(
          pathBlockchains_Delete_UsefulAddress_MongoDBId +
            createResponse.body.insertedId
        )
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ contract: Object.keys(mockBlockchain.usefulAddresses)[0] });
      chai.expect(deleteResponse).to.have.status(200);
    });
  });
});
