import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import db from '../db/conn.js';
import jwt from 'jsonwebtoken';
import { mockedToken } from './mock.js';
import { ObjectId } from 'mongodb';

chai.use(chaiHttp);
const expect = chai.expect;

const collection = db.collection('orders');

const orderId = 'myOrderId';

const order = {
  amountTokenDeposit: '0.34',
  addressTokenDeposit: '0x0',
  chainIdTokenDeposit: '13434',
  destAddr: 'mydestAddr',
  offerId: 'myOfferId',
  orderId: orderId,
  amountTokenOffer: '5433',
  hash: 'myhash',
};

describe('Orders route', () => {
  describe('POST new order', () => {
    describe('Route core', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .post('/orders')
          .send(order);
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should POST a new order', async function () {
        const createResponse = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(order);

        chai.expect(createResponse).to.have.status(200);
        chai.expect(createResponse.body).to.have.property('acknowledged').that
          .is.true;
        chai.expect(createResponse.body).to.have.property('insertedId').that.is
          .not.empty;

        const deleteResponse = await chai
          .request(app)
          .delete(`/orders/${orderId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should POST a new order with relevant fields', async function () {
        const createResponse = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(order);
        chai.expect(createResponse).to.have.status(200);

        const getOrder = await chai
          .request(app)
          .get('/orders/orderId')
          .query({ orderId: orderId })
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

        const deleteResponse = await chai
          .request(app)
          .delete(`/orders/${orderId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should fail if same orderId exists', async function () {
        const createResponse = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(order);
        chai.expect(createResponse).to.have.status(200);

        const createDuplicateResponse = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(order);
        chai.expect(createDuplicateResponse).to.have.status(404);
        chai
          .expect(createDuplicateResponse.body.msg)
          .to.be.equal('This order already exists.');

        const deleteResponse = await chai
          .request(app)
          .delete(`/orders/${orderId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });
    });
  });
});
