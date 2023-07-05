import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import {
  collectionBlockchains,
  mockBlockchain,
  pathBlockchains_Get_MasterContractAddress,
} from './utils/variables.js';

/* eslint-disable no-unused-expressions */

chai.use(chaiHttp);

const nexusCallInputProviderReq = {
  params: {
    fieldData: { _grinderyChain: 'eip155:534' },
  },
};

describe('View blockchains route', async function () {
  describe('GET master smart contract address', async function () {
    beforeEach(async function () {
      await collectionBlockchains.insertMany([
        {
          ...mockBlockchain,
          usefulAddresses: {
            grtPoolAddress: 'myGrtPoolAddress',
          },
        },
      ]);
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .post(pathBlockchains_Get_MasterContractAddress)
        .send(nexusCallInputProviderReq);
      chai.expect(res).to.have.status(403);
    });

    it('Should return the master contract address', async function () {
      const res = await chai
        .request(app)
        .post(pathBlockchains_Get_MasterContractAddress)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(nexusCallInputProviderReq);

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        inputFields: [
          {
            key: '_grinderyChain',
            required: true,
            type: 'string',
            label: 'Blockchain',
          },
          {
            key: '_mercariMasterContractAddress',
            label: 'Mercari master contract address',
            type: 'string',
            required: true,
            placeholder: 'Mercari master contract address',
            computed: true,
            default: 'myGrtPoolAddress',
          },
        ],
      });
    });
  });
});
