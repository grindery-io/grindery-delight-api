import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionBlockchains,
  pathBlockchains,
  blockchain,
  usefulAddress,
} from './utils/variables.js';
import { Database } from '../db/conn.js';

chai.use(chaiHttp);

/**
 * This function modifies a specific field in a blockchain object and tests that the modification was
 * successful.
 */
function modifyBlockchainField({ field, value }) {
  it(`PUT /blockchains/blockchainId - ${field} - Should modify ${field}`, async function () {
    // Create a custom blockchain object with modified field values
    const customBlockchain = {
      ...blockchain,
      isActive: false,
      isEvm: false,
      isTestnet: false,
    };

    // Create a new blockchain entry in the database with the customBlockchain object
    const createResponse = await createBaseBlockchain(customBlockchain);

    // Send a PUT request to update the blockchain with the specified field and value
    const res = await chai
      .request(app)
      .put(`/unit-test/blockchains/${createResponse.body.insertedId}`)
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

    // Fetch the updated blockchain from the database
    const blockchainDB = await collectionBlockchains.findOne({
      _id: new ObjectId(createResponse.body.insertedId),
    });

    // Delete the _id field from the fetched blockchain object for comparison
    delete blockchainDB._id;

    // Assertions to check if the fetched blockchain matches the expected result
    chai
      .expect(blockchainDB)
      .to.deep.equal({ ...customBlockchain, [field]: value });
  });
}

/**
 * This function creates a new blockchain in a database using a POST request and expects a successful
 * response.
 * @param blockchain - The parameter `blockchain` is an object that represents the data of a blockchain
 * that will be created. It is being passed as an argument to the `createBaseBlockchain` function.
 */
async function createBaseBlockchain(blockchain) {
  const res = await chai
    .request(app)
    .post(pathBlockchains)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(blockchain);
  console.log('res.status', res.status);
  console.log('res.body', res.body);
  console.log('blockchain', blockchain);

  chai.expect(res).to.have.status(200);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
  return res;
}

describe('Blockchains route', async function () {
  // Retry all tests in this suite up to 4 times
  this.retries(4);

  describe('POST new blockchain', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathBlockchains)
        .send(blockchain);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should create a new blockchain', async function () {
      const res = await chai
        .request(app)
        .post(pathBlockchains)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(blockchain);
      console.log('res.status special', res.status);
      console.log('res.body special', res.body);
      console.log('blockchain special', blockchain);

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.have.property('acknowledged').that.is.true;
      chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
      return res;
    });

    it('Should create a new blockchain with the proper fields', async function () {
      const createResponse = await createBaseBlockchain(blockchain);
      const res = await chai
        .request(app)
        .get(`/unit-test/blockchains/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      delete res.body._id;
      chai.expect(res.body).to.deep.equal(blockchain);
    });

    it('Should create a new blockchain with the proper fields', async function () {
      await createBaseBlockchain(blockchain);
      const createResponse1 = await chai
        .request(app)
        .post(pathBlockchains)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(blockchain);
      chai.expect(createResponse1).to.have.status(404);
      chai
        .expect(createResponse1.body)
        .to.deep.equal({ msg: 'This blockchain already exists.' });
    });
  });

  describe('GET active blockchains', async function () {
    it('Should not fail if no token is provided', async function () {
      await createBaseBlockchain(blockchain);
      await createBaseBlockchain({
        ...blockchain,
        caipId: 'eip155:45',
        isActive: false,
      });
      const res = await chai.request(app).get('/unit-test/blockchains/active');
      chai.expect(res).to.have.status(200);
    });

    it('Should return all active blockchains', async function () {
      await createBaseBlockchain(blockchain);
      await createBaseBlockchain({
        ...blockchain,
        caipId: 'eip155:45',
        isActive: false,
      });
      const res = await chai
        .request(app)
        .get('/unit-test/blockchains/active')
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

  describe('GET blockchain by MongoDBId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get('/unit-test/blockchains/1234');
      chai.expect(res).to.have.status(403);
    });

    it('Should return blockchain with the proper blockchainId', async function () {
      const createResponse = await createBaseBlockchain(blockchain);
      const res = await chai
        .request(app)
        .get(`/unit-test/blockchains/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai
        .expect(res.body._id.toString())
        .to.be.equal(createResponse.body.insertedId);
    });
    it('Should return null if no blockchain found', async function () {
      const res = await chai
        .request(app)
        .get('/unit-test/blockchains/111111111111111111111111')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('PUT blockchain', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).put('/unit-test/blockchains/1234');
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
        .put('/unit-test/blockchains/111111111111111111111111')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No blockchain found' });
    });
  });

  describe('DELETE blockchain', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .delete('/unit-test/blockchains/11111111111111111111');
      chai.expect(res).to.have.status(403);
    });
    it('Should delete one blockchain', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathBlockchains)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(blockchain);

      chai.expect(createResponse).to.have.status(200);
      chai.expect(createResponse.body).to.have.property('acknowledged', true);
      chai.expect(createResponse.body).to.have.property('insertedId');
      const deleteResponse = await chai
        .request(app)
        .delete(`/unit-test/blockchains/${createResponse.body.insertedId}`)
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
        .put('/unit-test/blockchains/useful-address/1234');
      chai.expect(res).to.have.status(403);
    });

    it('Should return 404 if blockchain is not found', async function () {
      const response = await chai
        .request(app)
        .put(`/unit-test/blockchains/useful-address/111111111111111111111111`)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(usefulAddress);
      chai.expect(response).to.have.status(404);
      chai.expect(response.body).to.deep.equal({
        msg: 'No blockchain found',
      });
    });

    it('Should create a new useful address with the proper fields', async function () {
      const createResponse = await createBaseBlockchain(blockchain);
      const newUsefulAddress = await chai
        .request(app)
        .put(
          `/unit-test/blockchains/useful-address/${createResponse.body.insertedId}`
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
        .get(`/unit-test/blockchains/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      delete res.body._id;
      chai.expect(res.body.usefulAddresses).to.deep.equal({
        ...blockchain.usefulAddresses,
        [usefulAddress.contract]: usefulAddress.address,
      });
    });

    it('Should update a useful address with the proper fields', async function () {
      const createResponse = await createBaseBlockchain(blockchain);
      const updateUsefulAddress = await chai
        .request(app)
        .put(
          `/unit-test/blockchains/useful-address/${createResponse.body.insertedId}`
        )
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          contract: blockchain.usefulAddresses.myUsefulAddress1,
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
        .get(`/unit-test/blockchains/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      delete res.body._id;
      chai.expect(res.body.usefulAddresses).to.deep.equal({
        ...blockchain.usefulAddresses,
        [blockchain.usefulAddresses.myUsefulAddress1]: 'modifiedAddress',
      });
    });
  });

  describe('DELETE useful address', async function () {
    it('Should return 403 if no token is not provided', async function () {
      const res = await chai
        .request(app)
        .delete('/unit-test/blockchains/useful-address/1234');
      chai.expect(res).to.have.status(403);
    });

    it('Should return 404 if useful address is not found', async function () {
      const createResponse = await createBaseBlockchain(blockchain);

      const deleteResponse = await chai
        .request(app)
        .delete(
          `/unit-test/blockchains/useful-address/${createResponse.body.insertedId}`
        )
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ contract: usefulAddress.contract });
      chai.expect(deleteResponse).to.have.status(404);
      chai.expect(deleteResponse.body).to.deep.equal({
        msg: 'No blockchain found or contract doesnt exist',
      });
    });

    it('Should return 404 if blockchain is not found', async function () {
      const deleteResponse = await chai
        .request(app)
        .delete(
          '/unit-test/blockchains/useful-address/111111111111111111111111'
        )
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ contract: blockchain.usefulAddresses.myUsefulAddress1 });
      chai.expect(deleteResponse).to.have.status(404);
      chai.expect(deleteResponse.body).to.deep.equal({
        msg: 'No blockchain found or contract doesnt exist',
      });
    });

    it('Should delete useful address', async function () {
      const createResponse = await createBaseBlockchain(blockchain);

      const deleteResponse = await chai
        .request(app)
        .delete(
          `/unit-test/blockchains/useful-address/${createResponse.body.insertedId}`
        )
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ contract: Object.keys(blockchain.usefulAddresses)[0] });
      chai.expect(deleteResponse).to.have.status(200);
    });
  });
});
