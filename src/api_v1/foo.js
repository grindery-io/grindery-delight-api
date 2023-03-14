import { Router } from 'express';
import isRequired from '../utils/auth-utils.js';

const foo = Router();

/**
 * GET /api/v1/foo
 *
 * @summary Get foo
 * @description Get list of supported foo
 * @tags foo
 * @security BearerAuth
 * @param {string} environment.query - One of `production` or `staging`. Default is `production`.
 * @return {object} 200 - Success response
 * @return {object} 400 - Error response
 * @return {object} 403 - Authentication error response
 * @foo response - 200 - Success response foo
 * {
 *   "result": []
 * }
 * @foo response - 400 - Error response foo
 * {
 *   "message": "Error message"
 * }
 * @foo response - 403 - Authentication error response
 * {
 *   "message": "No credentials sent"
 * }
 */
foo.get('/', isRequired, async (req, res) => {
  return res.json({ result: 'success' });
});

export default foo;
