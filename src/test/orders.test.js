import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionOrders,
  collectionOffers,
  pathOrders_Post,
  order,
  offer,
  pathOrders_Get_OrderId,
  pathOrders_Get_User,
  pathOrders_Get_MongoDBId,
  pathOrders_Delete_OrderId,
  pathOrders_Put_Complete,
  pathOrders_Get_LiquidityProvider,
} from './utils/variables.js';

chai.use(chaiHttp);

/**
 * This function creates a base order or offer in a MongoDB collection and returns the response.
 * @returns the response object from the POST request made using chai.request.
 */
async function createBaseOrderOrOffer({ path, body }) {
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
  describe('POST new order', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOrders_Post)
        .send(order);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should POST a new order', async function () {
      await createBaseOrderOrOffer({
        path: pathOrders_Post,
        body: order,
      });
    });

    it('Should POST multiple new orders with empty orderId', async function () {
      await createBaseOrderOrOffer({
        path: pathOrders_Post,
        body: { ...order, orderId: '' },
      });

      await createBaseOrderOrOffer({
        path: pathOrders_Post,
        body: { ...order, orderId: '' },
      });
    });

    it('Should POST a new order with relevant fields', async function () {
      await createBaseOrderOrOffer({
        path: pathOrders_Post,
        body: order,
      });
      const getOrder = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .query({ orderId: order.orderId })
        .set('Authorization', `Bearer ${mockedToken}`);
      // Assertions
      chai.expect(getOrder).to.have.status(200);
      chai.expect(getOrder.body).to.be.an('object');
      delete getOrder.body._id;
      delete getOrder.body.userId;
      delete getOrder.body.date;
      chai.expect(getOrder.body).to.deep.equal({
        ...order,
        isComplete: false,
        status: 'pending',
        offer: null,
      });
    });
    it('Should fail if same orderId exists', async function () {
      await createBaseOrderOrOffer({
        path: pathOrders_Post,
        body: order,
      });
      const createDuplicateResponse = await chai
        .request(app)
        .post(pathOrders_Post)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(order);
      chai.expect(createDuplicateResponse).to.have.status(404);
      chai
        .expect(createDuplicateResponse.body.msg)
        .to.be.equal('This order already exists.');
    });
  });

  describe('GET by user', async function () {
    beforeEach(async function () {
      await collectionOffers.insertOne({
        ...offer,
      });
      await collectionOffers.insertOne({
        ...offer,
        offerId: 'anotherOfferId',
      });

      await collectionOrders.insertOne({
        ...order,
        orderId: 'myOrderId1',
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
        date: new Date(),
      });
      await collectionOrders.insertOne({
        ...order,
        orderId: 'myOrderId2',
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
        date: new Date(),
      });
      await collectionOrders.insertOne({
        ...order,
        offerId: offer.offerId,
        userId: 'anotherUserId',
        date: new Date(),
      });
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get(pathOrders_Get_User);
      chai.expect(res).to.have.status(403);
    });

    it('Should return proper offer information in orders', async function () {
      const offerFromInMemoryDB = await collectionOffers.findOne({
        offerId: offer.offerId,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      res.body.orders.map((order) => {
        chai.expect(order.offer).to.deep.equal({
          ...offerFromInMemoryDB,
          _id: offerFromInMemoryDB._id.toString(),
        });
      });
    });

    it('Should sort by date', async function () {
      const orderFromInMemoryDB = await collectionOrders
        .find({
          userId: process.env.USER_ID_TEST,
        })
        .sort({ date: -1 })
        .toArray();

      const res = await chai
        .request(app)
        .get(pathOrders_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      for (let i = 0; i < res.body.orders.length; i++) {
        chai
          .expect(res.body.orders[i].date)
          .to.equal(orderFromInMemoryDB[i].date.toISOString());
      }
    });

    it('Should set a proper limit', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ limit: 1 });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.orders.length).to.equal(1);
    });

    it('Should set a proper offset', async function () {
      const orderFromInMemoryDB = await collectionOrders
        .find({
          userId: process.env.USER_ID_TEST,
        })
        .sort({ date: -1 })
        .toArray();

      const res = await chai
        .request(app)
        .get(pathOrders_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offset: 1 });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.orders.length).to.equal(1);
      chai
        .expect(res.body.orders[0]._id)
        .to.equal(orderFromInMemoryDB[1]._id.toString());
    });

    it('Should set a totalCount', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offset: 1 });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.orders.length).to.equal(1);
      chai.expect(res.body.totalCount).to.equal(2);
    });

    it('Should return only orders for the given user and proper fields', async function () {
      const offerFromInMemoryDB = await collectionOffers.findOne({
        offerId: offer.offerId,
      });
      const orderFromInMemoryDB = await collectionOrders
        .find({
          userId: process.env.USER_ID_TEST,
        })
        .sort({ date: -1 })
        .toArray();

      const res = await chai
        .request(app)
        .get(pathOrders_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        orders: [
          {
            ...orderFromInMemoryDB[0],
            _id: orderFromInMemoryDB[0]._id.toString(),
            orderId: orderFromInMemoryDB[0].orderId,
            date: orderFromInMemoryDB[0].date.toISOString(),
            offer: {
              ...offerFromInMemoryDB,
              _id: offerFromInMemoryDB._id.toString(),
            },
          },
          {
            ...orderFromInMemoryDB[1],
            _id: orderFromInMemoryDB[1]._id.toString(),
            orderId: orderFromInMemoryDB[1].orderId,
            date: orderFromInMemoryDB[1].date.toISOString(),
            offer: {
              ...offerFromInMemoryDB,
              _id: offerFromInMemoryDB._id.toString(),
            },
          },
        ],
        totalCount: 2,
      });
    });
  });

  describe('GET by orderId', async function () {
    beforeEach(async function () {
      await collectionOffers.insertOne({ ...offer });
      await collectionOffers.insertOne({ ...offer, offerId: 'anotherOfferId' });

      await collectionOrders.insertOne({
        ...order,
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
      });
      await collectionOrders.insertOne({
        ...order,
        offerId: offer.offerId,
        userId: 'anotherUserId',
      });
      await collectionOrders.insertOne({
        ...order,
        orderId: 'anotherOrderId',
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
      });
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .query({ orderId: order.orderId });
      chai.expect(res).to.have.status(403);
    });

    it('Should get the proper offer information corresponding to offerId', async function () {
      const offerFromInMemoryDB = await collectionOffers.findOne({
        offerId: offer.offerId,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ orderId: order.orderId });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offer).to.deep.equal({
        ...offer,
        _id: offerFromInMemoryDB._id.toString(),
      });
    });

    it('Should get the proper orderId', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ orderId: order.orderId });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.orderId).to.equal(order.orderId);
    });

    it('Should get the proper userId', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ orderId: order.orderId });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.userId).to.equal(process.env.USER_ID_TEST);
    });

    it('Should get an order corresponding to orderId', async function () {
      const offerFromInMemoryDB = await collectionOffers.findOne({
        offerId: offer.offerId,
      });
      const orderFromInMemoryDB = await collectionOrders.findOne({
        orderId: order.orderId,
        userId: process.env.USER_ID_TEST,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ orderId: order.orderId });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        ...order,
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
        _id: orderFromInMemoryDB._id.toString(),
        offer: {
          ...offer,
          _id: offerFromInMemoryDB._id.toString(),
        },
      });
    });

    it('Should return an empty string if no order exists', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ orderId: 'nonExistingOrderId' });
      chai.expect(res).to.have.status(200);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body).to.be.empty;
    });
  });

  describe('GET by MongoDbId', async function () {
    beforeEach(async function () {
      await collectionOffers.insertOne({ ...offer });
      await collectionOrders.insertOne({
        ...order,
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
      });

      await collectionOffers.insertOne({ ...offer });
      await collectionOffers.insertOne({ ...offer, offerId: 'anotherOfferId' });

      await collectionOrders.insertOne({
        ...order,
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
      });
      await collectionOrders.insertOne({
        ...order,
        offerId: offer.offerId,
        userId: 'anotherUserId',
      });
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .query({ id: 'mongoDbId' });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the order with the proper MongoDB id', async function () {
      const orderFromInMemoryDB = await collectionOrders.findOne({
        userId: process.env.USER_ID_TEST,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: orderFromInMemoryDB._id.toString() });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body._id).to.equal(orderFromInMemoryDB._id.toString());
    });

    it('Should return the order with the proper userId', async function () {
      const orderFromInMemoryDB = await collectionOrders.findOne({
        userId: process.env.USER_ID_TEST,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: orderFromInMemoryDB._id.toString() });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.userId).to.equal(process.env.USER_ID_TEST);
    });

    it('Should return the order with all the proper fields', async function () {
      const offerFromInMemoryDB = await collectionOffers.findOne({});
      const orderFromInMemoryDB = await collectionOrders.findOne({
        userId: process.env.USER_ID_TEST,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: orderFromInMemoryDB._id.toString() });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        ...order,
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
        _id: orderFromInMemoryDB._id.toString(),
        offer: {
          ...offer,
          _id: offerFromInMemoryDB._id.toString(),
        },
      });
    });

    it('Should return an empty object if MongoDB id doesnt exist', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: '111111111111111111111111' });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('GET by liquidity provider', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        { ...offer, userId: process.env.USER_ID_TEST },
        {
          ...offer,
          offerId: 'myDeactivateoffer',
          isActive: false,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          offerId: 'anotherOfferId',
          userId: process.env.USER_ID_TEST,
        },
        { ...offer, userId: 'anotherUserId' },
      ]);

      await collectionOrders.insertMany([
        {
          ...order,
          orderId: 'myOrderId1',
          offerId: offer.offerId,
          userId: process.env.USER_ID_TEST,
          date: new Date(),
        },
        {
          ...order,
          orderId: 'myOrderId1',
          offerId: 'myDeactivateoffer',
          userId: process.env.USER_ID_TEST,
          date: new Date(),
        },
        {
          ...order,
          orderId: 'myOrderId2',
          offerId: offer.offerId,
          userId: process.env.USER_ID_TEST,
          date: new Date(),
        },
        {
          ...order,
          orderId: 'myOrderId3',
          offerId: 'offerId1',
          userId: process.env.USER_ID_TEST,
          date: new Date(),
        },
        {
          ...order,
          orderId: 'myOrderId4',
          offerId: 'offerId2',
          userId: 'anotherUserId',
          date: new Date(),
        },
      ]);
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get(pathOrders_Get_LiquidityProvider);
      chai.expect(res).to.have.status(403);
    });

    it('Should show only orders with existing offerId in the offers collection', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      await Promise.all(
        res.body.orders.map(async (order) => {
          const offerFromInMemoryDB = await collectionOffers.findOne({
            offerId: order.offerId,
          });
          chai.expect(offerFromInMemoryDB).to.be.an('object');
          chai.expect(offerFromInMemoryDB).to.have.property('_id');
        })
      );
    });

    it('Should show orders corresponding to both active and inactive offers (if no parameter in query)', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      chai.expect(
        res.body.orders.some((order) => order.offer.isActive === true)
      ).to.be.true;
      chai.expect(
        res.body.orders.some((order) => order.offer.isActive === false)
      ).to.be.true;
    });

    it('Should show only orders corresponding to active offers if specified', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ isActiveOffers: true });
      chai.expect(res).to.have.status(200);

      res.body.orders.forEach((order) => {
        chai.expect(order.offer.isActive).to.be.true;
      });
    });

    it('Should show only orders corresponding offers created by the user', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      res.body.orders.forEach((order) => {
        chai.expect(order.offer.userId).to.equal(process.env.USER_ID_TEST);
      });
    });

    it('Should sort by date', async function () {
      const orderFromInMemoryDB = await collectionOrders
        .find({
          userId: process.env.USER_ID_TEST,
        })
        .sort({ date: -1 })
        .toArray();

      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      for (let i = 0; i < res.body.orders.length; i++) {
        chai
          .expect(res.body.orders[i].date)
          .to.equal(orderFromInMemoryDB[i].date.toISOString());
      }
    });

    it('Should set a proper limit', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ limit: 1 });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.orders.length).to.equal(1);
    });

    it('Should set a proper offset', async function () {
      const orderFromInMemoryDB = await collectionOrders
        .find({
          userId: process.env.USER_ID_TEST,
        })
        .sort({ date: -1 })
        .toArray();

      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offset: 1 });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.orders.length).to.equal(2);
      chai
        .expect(res.body.orders[0]._id)
        .to.equal(orderFromInMemoryDB[1]._id.toString());
    });

    it('Should set a totalCount', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offset: 1 });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.orders.length).to.equal(2);
      chai.expect(res.body.totalCount).to.equal(3);
    });

    it('Should show only orders with proper fields and offer information', async function () {
      const offerFromInMemoryDB = await collectionOffers.findOne({
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
      });
      const orderFromInMemoryDB = await collectionOrders.findOne({
        orderId: 'myOrderId1',
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      chai.expect(res.body.orders).to.deep.include({
        ...orderFromInMemoryDB,
        _id: orderFromInMemoryDB._id.toString(),
        orderId: orderFromInMemoryDB.orderId,
        date: orderFromInMemoryDB.date.toISOString(),
        offer: {
          ...offerFromInMemoryDB,
          _id: offerFromInMemoryDB._id.toString(),
        },
      });
    });
  });

  describe('DELETE order by orderId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .delete(pathOrders_Delete_OrderId + 'myOrderId');
      chai.expect(res).to.have.status(403);
    });
    it('Should delete one order', async function () {
      await createBaseOrderOrOffer({
        path: pathOrders_Post,
        body: order,
      });
      const deleteResponse = await chai
        .request(app)
        .delete(pathOrders_Delete_OrderId + order.orderId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai.expect(deleteResponse.body.acknowledged).to.be.true;
      chai.expect(deleteResponse.body.deletedCount).to.equal(1);
    });
    it('Should delete the appropriate order', async function () {
      const createResponse = await createBaseOrderOrOffer({
        path: pathOrders_Post,
        body: order,
      });
      chai.expect(
        await collectionOrders.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.not.be.empty;
      const deleteResponse = await chai
        .request(app)
        .delete(pathOrders_Delete_OrderId + order.orderId)
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
        .delete(pathOrders_Delete_OrderId + 'myOrderId')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No order found' });
    });
  });
  describe('PUT order as complete', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).put(pathOrders_Put_Complete).send({
        orderId: 'myOrderId',
      });
      chai.expect(res).to.have.status(403);
    });
    it('Should modify one order if the order was previously not completed', async function () {
      const createResponse = await createBaseOrderOrOffer({
        path: pathOrders_Post,
        body: order,
      });
      const res = await chai
        .request(app)
        .put(pathOrders_Put_Complete)
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
      const getOrder = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: createResponse.body.insertedId });
      chai.expect(getOrder.body.isComplete).to.be.true;
    });
    it('Should modify no order if the order was previously completed', async function () {
      await createBaseOrderOrOffer({
        path: pathOrders_Post,
        body: order,
      });
      const res = await chai
        .request(app)
        .put(pathOrders_Put_Complete)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          orderId: order.orderId,
        });
      chai.expect(res).to.have.status(200);
      const res1 = await chai
        .request(app)
        .put(pathOrders_Put_Complete)
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
        .put(pathOrders_Put_Complete)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          orderId: order.orderId,
        });
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No order found' });
    });
  });
});
