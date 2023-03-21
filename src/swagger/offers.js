/**
 * GET /offers
 *
 * @summary Get Offers
 * @description Getting the offers from the database
 * @tags Offers
 * @return {object} 200 - Success response
 * @return {object} 401 - Authentication error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * [{
 *  "_id": "6413280d273bbc2ed3c9c98b",
 *  "chain": 55,
 *  "min": "1",
 *  "max": "100",
 *  "tokenId": "1",
 *  "token": "GRT",
 *  "tokenAddress": "123",
 *  "isActive": false,
 *  "date": "2023-03-16T14:30:37.727Z",
 *  "userId": "eip155:1:0xCbDf3d0C2C255d4582171Fc652E8BdCF043b13fE"
 * },
 * {
 *  "_id": "6413280d273bbc2ed3c9c98b",
 *  "chain": 55,
 *  "min": "1",
 *  "max": "100",
 *  "tokenId": "1",
 *  "token": "GRT",
 *  "tokenAddress": "123",
 *  "isActive": false,
 *  "date": "2023-03-16T14:30:37.727Z",
 *  "userId": "eip155:1:0xCbDf3d0C2C255d4582171Fc652E8BdCF043b13fE"
 * }]
 * @example response - 401 - Authentication error response example
 * {
 *   "message": "Request failed with status code 400"
 * }
 */

/**
 * GET /offers/user
 *
 * @summary Get Offers by user
 * @description This is a get request that is looking user offers
 * @tags Offers
 * @return {object} 200 - Success response
 * @return {object} 401 - Authentication error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * [{
 *  "_id": "6413280d273bbc2ed3c9c98b",
 *  "chain": 55,
 *  "min": "1",
 *  "max": "100",
 *  "tokenId": "1",
 *  "token": "GRT",
 *  "tokenAddress": "123",
 *  "isActive": false,
 *  "date": "2023-03-16T14:30:37.727Z",
 *  "userId": "eip155:1:0xCbDf3d0C2C255d4582171Fc652E8BdCF043b13fE"
 * },
 * {
 *  "_id": "6413280d273bbc2ed3c9c98b",
 *  "chain": 55,
 *  "min": "1",
 *  "max": "100",
 *  "tokenId": "1",
 *  "token": "GRT",
 *  "tokenAddress": "123",
 *  "isActive": false,
 *  "date": "2023-03-16T14:30:37.727Z",
 *  "userId": "eip155:1:0xCbDf3d0C2C255d4582171Fc652E8BdCF043b13fE"
 * }]
 * @example response - 401 - Authentication error response example
 * {
 *   "message": "Request failed with status code 400"
 * }
 */

/**
 * GET /offers/:idOffers
 *
 * @summary Get Offers by id
 * @description This is a get request that is looking for a specific offer
 * @tags Offers
 * @return {object} 200 - Success response
 * @return {object} 401 - Authentication error response
 * @return {object} 404 - Not found error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * {
 *  "_id": "6413280d273bbc2ed3c9c98b",
 *  "chain": 55,
 *  "min": "1",
 *  "max": "100",
 *  "tokenId": "1",
 *  "token": "GRT",
 *  "tokenAddress": "123",
 *  "isActive": false,
 *  "date": "2023-03-16T14:30:37.727Z",
 *  "userId": "eip155:1:0xCbDf3d0C2C255d4582171Fc652E8BdCF043b13fE"
 * }
 * @example response - 401 - Authentication error response example
 * {
 *   "message": "Request failed with status code 400"
 * }
 * @example response - 404 - Not found error response
 * {
 *   "message": "Not Found"
 * }
 */

/**
 * Create Offer
 * @typedef {object} CreateOffer
 * @property {number} chain - chain id
 * @property {string} min - min amount
 * @property {string} max - max amount
 * @property {string} tokenId - token id
 * @property {string} tokenAddress - token address
 * @property {boolean} isActive - offer status flag
 */
/**
 * POST /offers
 *
 * @summary Create new Offer
 * @description Creating a new document in the database
 * @tags Offers
 * @param {CreateOffer} request.body
 * @return {object} 200 - Success response
 * @return {object} 400 - Error response
 * @return {object} 401 - Authentication error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * {
 *   "success": true,
 *   "id": "123"
 * }
 * @example response - 400 - Error response example
 * {
 *   "message": "Error message"
 * }
 * @example response - 401 - Authentication error response example
 * {
 *   "message": "Request failed with status code 400"
 * }
 */

/**
 * DELETE /offers/:offerId
 *
 * @summary Delete Offer
 * @description Deleting an entry from the database
 * @tags Offers
 * @return {object} 200 - Success response
 * @return {object} 400 - Error response
 * @return {object} 403 - Authentication error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * {
 *   "success": true,
 *   "id": "123"
 * }
 * @example response - 400 - Error response example
 * {
 *   "message": "Error message"
 * }
 * @example response - 403 - Authentication error response
 * {
 *   "message": "No credentials sent"
 * }
 */

/**
 * Update /offers/:offerId
 *
 * @summary Update Offer
 * @description Updating an offer document from the database
 * @tags Offers
 * @return {object} 200 - Success response
 * @return {object} 400 - Error response
 * @return {object} 403 - Authentication error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * {
 *   "success": true,
 *   "id": "123"
 * }
 * @example response - 400 - Error response example
 * {
 *   "message": "Error message"
 * }
 * @example response - 403 - Authentication error response
 * {
 *   "message": "No credentials sent"
 * }
 */
