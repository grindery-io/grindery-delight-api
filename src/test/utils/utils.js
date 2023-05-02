import dotenv from 'dotenv';
import axios from 'axios';
import chai from 'chai';
import app from '../../index.js';

dotenv.config();

/**
 * The function retrieves an access token using a refresh token and returns it, or returns null if
 * there is an error.
 * @returns The `getAccessToken` function is returning a Promise that resolves to the `access_token`
 * value from the response data of a POST request to the specified URL. If there is an error, it will
 * return `null`. The `mockedToken` variable is assigned the resolved value of the Promise returned by
 * `getAccessToken` using the `await` keyword.
 */
async function getAccessToken() {
  try {
    const res = await axios.post(
      'https://orchestrator.grindery.org/oauth/token',
      {
        grant_type: 'refresh_token',
        refresh_token: process.env.GRINDERY_NEXUS_REFRESH_TOKEN,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data.access_token;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const mockedToken = await getAccessToken();

/**
 * This is a test function that checks if a specific field in a request is not a string and returns an
 * error message.
 */
export const testNonString = ({ method, path, body, query, field }) => {
  it(`${method.toUpperCase()} ${path} - ${field} - Should fail if ${field} is not a string`, async function () {
    const res = await chai
      .request(app)
      [method](path)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(body)
      .query(query);
    chai.expect(res).to.have.status(400);
    chai.expect(res.body).to.be.an('array');
    chai.expect(
      res.body.some(
        (err) => err.msg === 'must be string value' && err.param === field
      )
    ).to.be.true;
  });
};

/**
 * This is a test function that checks if a given field is a boolean value and returns an error message
 * if it is not.
 */
export const testNonBoolean = ({ method, path, body, query, field }) => {
  it(`${method.toUpperCase()} ${path} - ${field} - Should fail if ${field} is not a boolean`, async function () {
    const res = await chai
      .request(app)
      [method](path)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(body)
      .query(query);
    chai.expect(res).to.have.status(400);
    chai.expect(res.body).to.be.an('array');
    chai.expect(
      res.body.some(
        (err) => err.msg === 'must be boolean value' && err.param === field
      )
    ).to.be.true;
  });
};

/**
 * This is a test function that checks if a specific field in a request is empty and expects a 400
 * status code and an error message.
 */
export const testNonEmpty = ({ method, path, body, query, field }) => {
  it(`${method.toUpperCase()} ${path} - ${field} - Should fail if ${field} is empty`, async function () {
    const res = await chai
      .request(app)
      [method](path)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(body)
      .query(query);
    chai.expect(res).to.have.status(400);
    chai.expect(res.body).to.be.an('array');
    chai.expect(
      res.body.some(
        (err) => err.msg === 'must not be empty' && err.param === field
      )
    ).to.be.true;
  });
};

/**
 * This is a test function that checks if there is an unexpected field in a request and returns an
 * error message.
 */
export const testUnexpectedField = ({
  method,
  path,
  body,
  query,
  field,
  location,
}) => {
  it(`${method.toUpperCase()} ${path} - Should fail if unexpected field in ${location}`, async function () {
    const res = await chai
      .request(app)
      [method](path)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(body)
      .query(query);
    chai.expect(res).to.have.status(400);
    chai.expect(
      res.body.some(
        (err) =>
          err.msg ===
            `The following fields are not allowed in ${location}: ${field}` &&
          err.location === location
      )
    ).to.be.true;
  });
};

/**
 * This function tests if a given field is in CAIP-2 format and returns an error if it is not.
 */
export const testNonCaipId = ({ method, path, body, query, field }) => {
  it(`${method.toUpperCase()} ${path} - ${field} - Should fail if ${field} is not caipId format`, async function () {
    const res = await chai
      .request(app)
      [method](path)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(body)
      .query(query);
    chai.expect(res).to.have.status(400);
    chai.expect(res.body).to.be.an('array');
    chai.expect(
      res.body.some(
        (err) =>
          err.msg ===
            'caipId field does not match the CAIP-2 specifications.' &&
          err.param === field
      )
    ).to.be.true;
  });
};

/**
 * This is a test function that checks if a given field is a valid URL.
 */
export const testNonURL = ({ method, path, body, query, field }) => {
  it(`${method.toUpperCase()} ${path} - ${field} - Should fail if ${field} is not URL`, async function () {
    const res = await chai
      .request(app)
      [method](path)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(body)
      .query(query);
    chai.expect(res).to.have.status(400);
    chai.expect(res.body).to.be.an('array');
    chai.expect(
      res.body.some((err) => err.msg === 'must be URL' && err.param === field)
    ).to.be.true;
  });
};

/**
 * This function tests if a given field is a MongoDB ID and returns an error if it is not.
 */
export const testNonMongodbId = ({ method, path, body, query, field }) => {
  it(`${method.toUpperCase()} ${path} - ${field} - Should fail if ${field} is not MongoDBId`, async function () {
    const res = await chai
      .request(app)
      [method](path)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(body)
      .query(query);
    chai.expect(res).to.have.status(400);
    chai.expect(res.body).to.be.an('array');
    chai.expect(
      res.body.some(
        (err) => err.msg === 'must be mongodb id' && err.param === field
      )
    ).to.be.true;
  });
};
