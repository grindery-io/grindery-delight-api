import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { Database } from '../db/conn.js';

chai.use(chaiHttp);

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
    db.collection('blockchains').drop();
  }
});

describe('Admins route', async function () {
  // Retry all tests in this suite up to 4 times
  this.retries(4);

  it('Should return 403 if no token is provided', async function () {
    chai
      .request(app)
      .get('/test/admins')
      .end(function (err, res) {
        chai.expect(res).to.have.status(403);
        chai.expect(res.body.message).to.be.equal('No credentials sent');
      });
  });

  it('Should return 200 with valid token corresponding to an admin user', async function () {
    chai
      .request(app)
      .get('/test/admins')
      .set('Authorization', `Bearer ${mockedToken}`)
      .end(function (err, res) {
        chai.expect(res).to.have.status(200);
      });
  });
});
