import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import {
  mockedToken,
  testNonString,
  testNonEmpty,
  testNonBoolean,
  testUnexpectedField,
  deleteElementsAfterTest,
} from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionOffers,
  pathOffers,
  offer,
  toDeleteDb,
} from './utils/variables.js';

chai.use(chaiHttp);

/**
 * This function creates a base offer by sending a POST request to a specified path with authorization
 * and expects a 200 status code and certain properties in the response.
 * @param offer - The `offer` parameter is an object that contains the data for creating a new offer.
 * It is being sent as the request body in the POST request to the `pathOffers` endpoint.
 */
async function createBaseOffer(offer) {
  const res = await chai
    .request(app)
    .post(pathOffers)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(offer);
  toDeleteDb.push({
    collection: collectionOffers,
    id: res.body.insertedId,
  });
  chai.expect(res).to.have.status(200);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
}

afterEach(async function () {
  await deleteElementsAfterTest(toDeleteDb);
  toDeleteDb.length = 0;
});

describe('Offers route', async function () {
  // Retry all tests in this suite up to 4 times
  this.retries(4);

  describe('POST new offer', async function () {
    describe('Route core', async function () {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .post(pathOffers)
          .send(offer);
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should POST a new offer if all fields are completed and no existing offer', async function () {
        await createBaseOffer(offer);
      });

      it('Should POST a new offer if all fields are completed and no existing offer (with correct fields)', async function () {
        await createBaseOffer(offer);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .query({ offerId: offer.offerId })
          .set('Authorization', `Bearer ${mockedToken}`);

        // Assertions
        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.be.an('object');
        chai.expect(getOffer.body.chainId).to.equal(offer.chainId);
        chai.expect(getOffer.body.min).to.equal(offer.min);
        chai.expect(getOffer.body.max).to.equal(offer.max);
        chai.expect(getOffer.body.tokenId).to.equal(offer.tokenId);
        chai.expect(getOffer.body.token).to.equal(offer.token);
        chai.expect(getOffer.body.tokenAddress).to.equal(offer.tokenAddress);
        chai.expect(getOffer.body.hash).to.equal(offer.hash);
        chai.expect(getOffer.body.offerId).to.equal(offer.offerId);
        chai.expect(getOffer.body.isActive).to.equal(offer.isActive);
        chai.expect(getOffer.body.estimatedTime).to.equal(offer.estimatedTime);
        chai.expect(getOffer.body.exchangeRate).to.equal(offer.exchangeRate);
        chai.expect(getOffer.body.exchangeToken).to.equal(offer.exchangeToken);
        chai
          .expect(getOffer.body.exchangeChainId)
          .to.equal(offer.exchangeChainId);
        chai.expect(getOffer.body.provider).to.equal(offer.provider);
        chai.expect(getOffer.body.title).to.equal(offer.title);
        chai.expect(getOffer.body.image).to.equal(offer.image);
        chai.expect(getOffer.body.amount).to.equal(offer.amount);
      });

      it('Should fail if same offerId exists', async function () {
        await createBaseOffer(offer);

        const createDuplicateResponse = await chai
          .request(app)
          .post(pathOffers)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createDuplicateResponse).to.have.status(404);
        chai
          .expect(createDuplicateResponse.body.msg)
          .to.be.equal('This offer already exists.');
      });
    });

    describe('Validators', async function () {
      it('Should fail validation if min is greater than max', async function () {
        const invalidOffer = {
          chainId: '1',
          min: '30',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post(pathOffers)
          .set({ Authorization: `Bearer ${mockedToken}` })
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].location).to.equal('body');
        chai.expect(res.body[0].msg).to.equal('min must be less than max');
      });

      // Test scenarios for validators
      const testCases = [
        'chainId',
        'min',
        'max',
        'tokenId',
        'token',
        'tokenAddress',
        'hash',
        'offerId',
        'isActive',
        'estimatedTime',
        'exchangeRate',
        'exchangeToken',
        'exchangeChainId',
        'provider',
        'title',
        'image',
        'amount',
      ];

      for (const testCase of testCases) {
        if (testCase !== 'isActive') {
          testNonString({
            method: 'post',
            path: pathOffers,
            body: {
              ...offer,
              [testCase]: 123,
            },
            query: {},
            field: testCase,
          });
        }

        if (
          testCase !== 'title' &&
          testCase !== 'image' &&
          testCase !== 'amount' &&
          testCase !== 'provider'
        ) {
          testNonEmpty({
            method: 'post',
            path: pathOffers,
            body: {
              ...offer,
              [testCase]: '',
            },
            query: {},
            field: testCase,
          });
        }
      }

      testNonBoolean({
        method: 'post',
        path: pathOffers,
        body: {
          ...offer,
          isActive: 123,
        },
        query: {},
        field: 'isActive',
      });

      testUnexpectedField({
        method: 'post',
        path: pathOffers,
        body: {
          ...offer,
          unexpectedField: 'Unexpected field',
        },
        query: {},
        field: 'unexpectedField',
        location: 'body',
      });

      testUnexpectedField({
        method: 'post',
        path: pathOffers,
        body: {
          ...offer,
        },
        query: { unexpectedField: 'Unexpected field' },
        field: 'unexpectedField',
        location: 'query',
      });
    });
  });

  describe('GET all offers', async function () {
    it('Should return an array with the correct MongoDB elements', async function () {
      // Transform each item in mongoData
      const formattedData = (await collectionOffers.find({}).toArray()).map(
        (item) => {
          // Return a new object with the formatted fields
          return {
            ...item,
            _id: item._id.toString(),
            date: item.date.toISOString(),
          };
        }
      );

      const res = await chai
        .request(app)
        .get(pathOffers)
        .set({ Authorization: `Bearer ${mockedToken}` });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal(formattedData);
    });
  });

  describe('GET all active offers with filters', async function () {
    it('Should return an array of active offers', async function () {
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 1;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;
        await createBaseOffer(customOffer);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/test/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);
      chai.expect(Array.isArray(res.body)).to.be.true;

      for (const offer of res.body) {
        chai.expect(offer.isActive).to.be.true;
      }
    });

    it('Should return only offers with proper exchangeChainId', async function () {
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 1;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;
        await createBaseOffer(customOffer);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/test/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        chai.expect(offer.exchangeChainId).to.equal(offer.exchangeChainId);
      }
    });

    it('Should return only offers with proper exchangeToken', async function () {
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 1;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;
        await createBaseOffer(customOffer);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/test/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        chai.expect(offer.exchangeToken).to.equal(offer.exchangeToken);
      }
    });

    it('Should return only offers with proper chainId', async function () {
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 1;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;
        await createBaseOffer(customOffer);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/test/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        chai.expect(offer.chainId).to.equal(offer.chainId);
      }
    });

    it('Should return only offers with proper token', async function () {
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 1;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;
        await createBaseOffer(customOffer);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/test/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        chai.expect(offer.token).to.equal(offer.token);
      }
    });

    it('Should return only offers with min less than depositAmount/exchangeRate', async function () {
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 1;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;
        await createBaseOffer(customOffer);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/test/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        const rateAmount = query.depositAmount / offer.exchangeRate;
        chai.expect(Number(offer.min)).to.be.at.most(rateAmount);
      }
    });

    it('Should return only offers with max greater than depositAmount/exchangeRate', async function () {
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 1;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;
        await createBaseOffer(customOffer);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/test/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        const rateAmount = query.depositAmount / offer.exchangeRate;
        chai.expect(Number(offer.max)).to.be.at.least(rateAmount);
      }
    });

    it('Should return an empty array if no offer match', async function () {
      const res = await chai
        .request(app)
        .get('/test/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: '232323232323232323',
          exchangeToken: offer.exchangeToken,
          chainId: offer.chainId,
          token: offer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('array').that.is.empty;
    });
  });

  describe('GET all offers for a user', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get('/test/offers/user');
      chai.expect(res).to.have.status(403);
    });

    it('Should return only offers for the given user', async function () {
      const customOffer = { ...offer };
      const nbrOffers = 1;
      let userId = '';
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;

        const createResponse = await chai
          .request(app)
          .post(pathOffers)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(customOffer);
        toDeleteDb.push({
          collection: collectionOffers,
          id: createResponse.body.insertedId,
        });
        chai.expect(createResponse).to.have.status(200);

        if (i === 0) {
          userId = (
            await collectionOffers.findOne({
              _id: new ObjectId(createResponse.body.insertedId),
            })
          ).userId;
        }
      }

      const res = await chai
        .request(app)
        .get('/test/offers/user')
        .set({ Authorization: `Bearer ${mockedToken}` });

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        chai.expect(offer.userId).to.equal(userId);
      }
    });
  });

  describe('GET offer by offerId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get('/test/offers/offerId')
        .query({ offerId: offer.offerId });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the offer with the proper offerId', async function () {
      await createBaseOffer(offer);

      const res = await chai
        .request(app)
        .get('/test/offers/offerId')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: offer.offerId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body.offerId).to.equal(offer.offerId);
    });

    it('Should return an empty object if offerId doesnt exist', async function () {
      const res = await chai
        .request(app)
        .get('/test/offers/offerId')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: '111111111111111111111111' });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('GET offer by MongoDB id', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get('/test/offers/id')
        .query({ id: '643471eaaceeded45b420be6' });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the offer with the proper MongoDB id', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOffers)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      toDeleteDb.push({
        collection: collectionOffers,
        id: createResponse.body.insertedId,
      });
      chai.expect(createResponse).to.have.status(200);

      const res = await chai
        .request(app)
        .get('/test/offers/id')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: createResponse.body.insertedId });

      delete res.body._id;
      delete res.body.date;
      delete res.body.userId;

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body).to.deep.equal(offer);
    });

    it('Should return the offer with the proper userId', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOffers)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      toDeleteDb.push({
        collection: collectionOffers,
        id: createResponse.body.insertedId,
      });
      chai.expect(createResponse).to.have.status(200);

      const userId = (
        await collectionOffers.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).userId;

      const res = await chai
        .request(app)
        .get('/test/offers/id')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: createResponse.body.insertedId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.userId).to.equal(userId);
    });

    it('Should return an empty object if MongoDB id doesnt exist', async function () {
      const res = await chai
        .request(app)
        .get('/test/offers/id')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: '111111111111111111111111' });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('DELETE offer by offerId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).delete('/test/offers/myOfferId');
      chai.expect(res).to.have.status(403);
    });

    it('Should delete one offer', async function () {
      await createBaseOffer(offer);

      const deleteResponse = await chai
        .request(app)
        .delete(`/test/offers/${offer.offerId}`)
        .set('Authorization', `Bearer ${mockedToken}`);

      chai.expect(deleteResponse).to.have.status(200);
      chai.expect(deleteResponse.body.acknowledged).to.be.true;
      chai.expect(deleteResponse.body.deletedCount).to.equal(1);
    });

    it('Should delete the appropriate offer', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOffers)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      toDeleteDb.push({
        collection: collectionOffers,
        id: createResponse.body.insertedId,
      });
      chai.expect(createResponse).to.have.status(200);

      chai.expect(
        await collectionOffers.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.not.be.empty;

      const deleteResponse = await chai
        .request(app)
        .delete(`/test/offers/${offer.offerId}`)
        .set('Authorization', `Bearer ${mockedToken}`);

      chai.expect(deleteResponse).to.have.status(200);

      chai.expect(
        await collectionOffers.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.be.null;
    });

    it('Should return 404 with message if no offer found', async function () {
      const res = await chai
        .request(app)
        .delete('/test/offers/myOfferId')
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No offer found' });
    });
  });

  describe('PUT offer by offerId', async function () {
    describe('Modify an offer', async function () {
      it('Should return 403 if no token is provided', async function () {
        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .send({ chainId: '232323' });
        chai.expect(modifyOffer).to.have.status(403);
      });

      it('Should return 404 if offer doesnt exist', async function () {
        const modifyOffer = await chai
          .request(app)
          .put('/test/offers/myFalseOfferId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ chainId: '232323' });
        chai.expect(modifyOffer).to.have.status(404);
        chai.expect(modifyOffer.body).to.deep.equal({ msg: 'No offer found' });
      });

      it('Should modify only one offer', async function () {
        await createBaseOffer(offer);

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ chainId: '232323' });

        chai.expect(modifyOffer).to.have.status(200);
        chai.expect(modifyOffer.body).to.deep.equal({
          acknowledged: true,
          modifiedCount: 1,
          upsertedId: null,
          upsertedCount: 0,
          matchedCount: 1,
        });
      });

      it('Should modify all offer fields', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          chainId: '76',
          min: '10',
          max: '100',
          tokenId: 'token-id',
          token: 'token',
          tokenAddress: 'token-address',
          isActive: false,
          exchangeRate: '2',
          exchangeToken: 'exchange-token',
          exchangeChainId: 'exchange-chain-id',
          estimatedTime: '1 day',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: '50',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);
        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...modifiedOffer,
          hash: offer.hash,
          offerId: offer.offerId,
        });
      });

      it('Should modify only the chainId field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          chainId: '76',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          ...modifiedOffer,
        });
      });

      it('Should modify only min field of an offer', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          min: '10',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          min: modifiedOffer.min,
        });
      });

      it('Should modify only max field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          max: '500',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          max: modifiedOffer.max,
        });
      });

      it('Should modify only tokenId field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          tokenId: 'new-token-id',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          tokenId: modifiedOffer.tokenId,
        });
      });

      it('Should modify only the token field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          token: 'modified-token',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          token: modifiedOffer.token,
        });
      });

      it('Should modify only tokenAddress field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          tokenAddress: '0x1234567890123456789012345678901234567890',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          tokenAddress: modifiedOffer.tokenAddress,
        });
      });

      it('Should modify isActive field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          isActive: false,
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ isActive: modifiedOffer.isActive });

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          isActive: modifiedOffer.isActive,
        });
      });

      it('Should modify the exchangeRate field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          exchangeRate: '3',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          exchangeRate: modifiedOffer.exchangeRate,
        });
      });

      it('Should modify the exchangeToken field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          exchangeToken: 'modified-exchange-token',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          exchangeToken: modifiedOffer.exchangeToken,
        });
      });

      it('Should modify the exchangeChainId field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          exchangeChainId: 'modified-exchange-chain-id',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          exchangeChainId: modifiedOffer.exchangeChainId,
        });
      });

      it('Should modify only estimatedTime field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          estimatedTime: 'modified-estimated-time',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          estimatedTime: modifiedOffer.estimatedTime,
        });
      });

      it('Should modify only provider field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          provider: 'new-provider',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          provider: modifiedOffer.provider,
        });
      });

      it('Should modify the title field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          title: 'Modified Offer Title',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          title: modifiedOffer.title,
        });
      });

      it('Should modify only the image field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          image: 'modified-image',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          image: modifiedOffer.image,
        });
      });

      it('Should modify the amount field', async function () {
        await createBaseOffer(offer);

        const modifiedOffer = {
          amount: '2',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/test/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/test/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          amount: modifiedOffer.amount,
        });
      });
    });

    describe('Validators', async function () {
      const testCases = [
        'chainId',
        'min',
        'max',
        'tokenId',
        'token',
        'tokenAddress',
        'isActive',
        'estimatedTime',
        'exchangeRate',
        'exchangeChainId',
        'provider',
        'title',
        'image',
        'amount',
      ];

      for (const testCase of testCases) {
        if (testCase !== 'isActive') {
          testNonString({
            method: 'put',
            path: '/test/offers/1234',
            body: {
              [testCase]: 123,
            },
            query: {},
            field: testCase,
          });
        }

        if (
          testCase !== 'title' &&
          testCase !== 'image' &&
          testCase !== 'amount'
        ) {
          testNonEmpty({
            method: 'put',
            path: '/test/offers/1234',
            body: {
              [testCase]: '',
            },
            query: {},
            field: testCase,
          });
        }
      }

      testUnexpectedField({
        method: 'put',
        path: '/test/offers/1234',
        body: {
          unexpectedField: 'Unexpected field',
        },
        query: {},
        field: 'unexpectedField',
        location: 'body',
      });

      testUnexpectedField({
        method: 'put',
        path: '/test/offers/1234',
        body: {
          chainId: '3434',
        },
        query: { unexpectedField: 'Unexpected field' },
        field: 'unexpectedField',
        location: 'query',
      });
    });
  });
});
