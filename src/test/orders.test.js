import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionOrders,
  collectionOffers,
  pathOrders,
  order,
  offer,
} from './utils/variables.js';
import { Database } from '../db/conn.js';

chai.use(chaiHttp);

/**
 * This function creates a base order or offer in a MongoDB collection and returns the response.
 * @returns the response object from the POST request made using chai.request.
 */
async function createBaseOrderOrOffer({ collection, path, body }) {
  const res = await chai
    .request(app)
    .post(path)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(body);
  chai.expect(res).to.have.status(200);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
  return res;
}

describe('Orders route', async function () {
  /* The above code is setting up a test environment for a JavaScript application. It is using the
`beforeEach` function to run some code before each test case. */
  beforeEach(async function () {
    const db = await Database.getInstance({});
    const collectionAdmin = db.collection('admins');
    await collectionAdmin.insertOne({
      userId: process.env.USER_ID_TEST,
    });
  });

  /* The above code is a test cleanup function that runs after each test. It gets an instance of a
database and checks if the namespace is 'grindery-delight-test-server'. If it is, it drops the
'blockchains' collection from the database. This ensures that the database is cleaned up after each
test and is ready for the next test. */
  afterEach(async function () {
    const db = await Database.getInstance({});
    if (db.namespace === 'grindery-delight-test-server') {
      db.dropDatabase();
    }
  });

  // Retry all tests in this suite up to 4 times
  this.retries(4);

  describe('POST new order', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOrders)
        .send(order);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should POST a new order', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders,
        body: order,
      });
    });

    it('Should POST a new order with relevant fields', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders,
        body: order,
      });

      const getOrder = await chai
        .request(app)
        .get('/unit-test/orders/orderId')
        .query({ orderId: order.orderId })
        .set('Authorization', `Bearer ${mockedToken}`);

      // Assertions
      chai.expect(getOrder).to.have.status(200);
      chai.expect(getOrder.body).to.be.an('object');
      chai
        .expect(getOrder.body.amountTokenDeposit)
        .to.equal(order.amountTokenDeposit);
      chai
        .expect(getOrder.body.addressTokenDeposit)
        .to.equal(order.addressTokenDeposit);
      chai
        .expect(getOrder.body.chainIdTokenDeposit)
        .to.equal(order.chainIdTokenDeposit);
      chai.expect(getOrder.body.destAddr).to.equal(order.destAddr);
      chai.expect(getOrder.body.offerId).to.equal(order.offerId);
      chai.expect(getOrder.body.orderId).to.equal(order.orderId);
      chai
        .expect(getOrder.body.amountTokenOffer)
        .to.equal(order.amountTokenOffer);
      chai.expect(getOrder.body.hash).to.equal(order.hash);
      chai.expect(getOrder.body.isComplete).to.equal(false);
    });

    it('Should fail if same orderId exists', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders,
        body: order,
      });

      const createDuplicateResponse = await chai
        .request(app)
        .post(pathOrders)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(order);
      chai.expect(createDuplicateResponse).to.have.status(404);
      chai
        .expect(createDuplicateResponse.body.msg)
        .to.be.equal('This order already exists.');
    });
  });

  describe('GET by user', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get('/unit-test/orders/user');
      chai.expect(res).to.have.status(403);
    });

    it('Should return only orders for the given user', async function () {
      const customOrder = { ...order };
      const nbrOrders = 1;
      let userId = '';
      for (let i = 0; i < nbrOrders; i++) {
        customOrder.orderId = `orderId-number${i}`;

        const createResponse = await createBaseOrderOrOffer({
          collection: collectionOrders,
          path: pathOrders,
          body: customOrder,
        });

        if (i === 0) {
          userId = (
            await collectionOrders.findOne({
              _id: new ObjectId(createResponse.body.insertedId),
            })
          ).userId;
        }
      }

      const res = await chai
        .request(app)
        .get('/unit-test/orders/user')
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      for (const order of res.body) {
        chai.expect(order.userId).to.equal(userId);
      }
    });
  });

  describe('GET by orderId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get('/unit-test/orders/orderId')
        .query({ orderId: order.orderId });
      chai.expect(res).to.have.status(403);
    });

    it('Should get an order corresponding to orderId', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders,
        body: order,
      });

      const res = await chai
        .request(app)
        .get('/unit-test/orders/orderId')
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ orderId: order.orderId });
      chai.expect(res).to.have.status(200);

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body.orderId).to.equal(order.orderId);
    });

    it('Should return an empty string if no order exists', async function () {
      const res = await chai
        .request(app)
        .get('/unit-test/orders/orderId')
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ orderId: order.orderId });
      chai.expect(res).to.have.status(200);

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body).to.be.empty;
    });
  });

  describe('GET by MongoDbId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get('/unit-test/orders/id')
        .query({ id: 'mongoDbId' });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the order with the proper MongoDB id', async function () {
      const createResponse = await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders,
        body: order,
      });

      const res = await chai
        .request(app)
        .get('/unit-test/orders/id')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: createResponse.body.insertedId });

      delete res.body._id;
      delete res.body.date;
      delete res.body.userId;
      delete res.body.isComplete;

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body).to.deep.equal(order);

      const deleteResponse = await chai
        .request(app)
        .delete(`/unit-test/orders/${order.orderId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
    });

    it('Should return the order with the proper userId', async function () {
      const createResponse = await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders,
        body: order,
      });

      const userId = (
        await collectionOrders.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).userId;

      const res = await chai
        .request(app)
        .get('/unit-test/orders/id')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: createResponse.body.insertedId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.userId).to.equal(userId);

      const deleteResponse = await chai
        .request(app)
        .delete(`/unit-test/orders/${order.orderId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
    });

    it('Should return an empty object if MongoDB id doesnt exist', async function () {
      const res = await chai
        .request(app)
        .get('/unit-test/orders/id')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: '111111111111111111111111' });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('GET by liquidity provider', async function () {
    it('Should show only orders with existing offerId in the offers collection', async function () {
      const customOffer = { ...offer };
      const customOrder = { ...order };
      const nbrOffersOrders = 1;
      let customOfferIds = [];
      for (let i = 0; i < nbrOffersOrders; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;

        customOfferIds.push(customOffer.offerId);

        await createBaseOrderOrOffer({
          collection: collectionOffers,
          path: '/unit-test/offers',
          body: customOffer,
        });

        customOrder.orderId = `orderId-number${i}`;
        customOrder.offerId = customOffer.offerId;
        await createBaseOrderOrOffer({
          collection: collectionOrders,
          path: pathOrders,
          body: customOrder,
        });
      }

      const res = await chai
        .request(app)
        .get('/unit-test/orders/liquidity-provider')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      const offerIds = res.body.map((order) => order.offerId);

      chai.expect(offerIds.every((offerId) => customOfferIds.includes(offerId)))
        .to.be.true;
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get('/unit-test/orders/liquidity-provider');
      chai.expect(res).to.have.status(403);
    });

    it('Should show only orders corresponding to active offers', async function () {
      const customOffer = { ...offer };
      const customOrder = { ...order };
      const nbrOffersOrders = 1;
      for (let i = 0; i < nbrOffersOrders; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;

        await createBaseOrderOrOffer({
          collection: collectionOffers,
          path: '/unit-test/offers',
          body: customOffer,
        });

        customOrder.orderId = `orderId-number${i}`;
        customOrder.offerId = customOffer.offerId;
        await createBaseOrderOrOffer({
          collection: collectionOrders,
          path: pathOrders,
          body: customOrder,
        });
      }

      const res = await chai
        .request(app)
        .get('/unit-test/orders/liquidity-provider')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      const offers = await collectionOffers
        .find({ offerId: { $in: res.body.map((order) => order.offerId) } })
        .toArray();

      chai.expect(offers).to.be.an('array');
      offers.forEach((offer) => {
        chai.expect(offer.isActive).to.be.true;
      });
    });

    it('Should show only orders corresponding offers created by the user', async function () {
      const customOffer = { ...offer };
      const customOrder = { ...order };
      const nbrOffersOrders = 1;
      let userId = '';
      for (let i = 0; i < nbrOffersOrders; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;

        await createBaseOrderOrOffer({
          collection: collectionOffers,
          path: '/unit-test/offers',
          body: customOffer,
        });

        customOrder.orderId = `orderId-number${i}`;
        customOrder.offerId = customOffer.offerId;
        const newOrder = await createBaseOrderOrOffer({
          collection: collectionOrders,
          path: pathOrders,
          body: customOrder,
        });

        if (i === 0) {
          userId = (
            await collectionOrders.findOne({
              _id: new ObjectId(newOrder.body.insertedId),
            })
          ).userId;
        }
      }

      const res = await chai
        .request(app)
        .get('/unit-test/orders/liquidity-provider')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      const offers = await collectionOffers
        .find({ offerId: { $in: res.body.map((order) => order.offerId) } })
        .toArray();

      chai.expect(offers).to.be.an('array');
      offers.forEach((offer) => {
        chai.expect(offer.userId).to.equal(userId);
      });
    });
  });

  describe('DELETE order by orderId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).delete('/unit-test/orders/myOrderId');
      chai.expect(res).to.have.status(403);
    });

    it('Should delete one order', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders,
        body: order,
      });

      const deleteResponse = await chai
        .request(app)
        .delete(`/unit-test/orders/${order.orderId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai.expect(deleteResponse.body.acknowledged).to.be.true;
      chai.expect(deleteResponse.body.deletedCount).to.equal(1);
    });

    it('Should delete the appropriate order', async function () {
      const createResponse = await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders,
        body: order,
      });

      chai.expect(
        await collectionOrders.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.not.be.empty;

      const deleteResponse = await chai
        .request(app)
        .delete(`/unit-test/orders/${order.orderId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai.expect(
        await collectionOrders.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.be.null;
    });

    it('Should return 404 with message if no order found', async function () {
      const res = await chai
        .request(app)
        .delete('/unit-test/orders/myOrderId')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No order found' });
    });
  });

  describe('PUT order as complete', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .put('/unit-test/orders/complete')
        .send({
          orderId: 'myOrderId',
        });
      chai.expect(res).to.have.status(403);
    });

    it('Should modify one order if the order was previously not completed', async function () {
      const createResponse = await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders,
        body: order,
      });

      const res = await chai
        .request(app)
        .put('/unit-test/orders/complete')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          orderId: order.orderId,
        });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        acknowledged: true,
        modifiedCount: 1,
        upsertedId: null,
        upsertedCount: 0,
        matchedCount: 1,
      });
    });

    it('Should modify no order if the order was previously completed', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders,
        body: order,
      });

      const res = await chai
        .request(app)
        .put('/unit-test/orders/complete')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          orderId: order.orderId,
        });
      chai.expect(res).to.have.status(200);

      const res1 = await chai
        .request(app)
        .put('/unit-test/orders/complete')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          orderId: order.orderId,
        });
      chai.expect(res1).to.have.status(200);
      chai.expect(res1.body).to.deep.equal({
        acknowledged: true,
        modifiedCount: 0,
        upsertedId: null,
        upsertedCount: 0,
        matchedCount: 1,
      });
    });

    it('Should fail if no order exists', async function () {
      const res = await chai
        .request(app)
        .put('/unit-test/orders/complete')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          orderId: order.orderId,
        });
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No order found.' });
    });
  });
});
