import { validationResult, body } from 'express-validator';

/**
 * This function validates the result of a request and returns an array of errors if any are found.
 * @param req - req stands for request and it is an object that contains information about the HTTP
 * request that was made by the client. It includes information such as the request method, URL,
 * headers, and any data that was sent in the request body. In this code snippet, the req parameter is
 * used to validate the
 * @param res - `res` is the response object that is sent back to the client by the server. It contains
 * information such as the status code, headers, and the response body. In this specific code snippet,
 * `res` is not used directly, but it is likely being passed in as a parameter to a
 * @returns If there are validation errors in the `req` object, an array of error objects will be
 * returned. Otherwise, an empty array will be returned.
 */
export const validateResult = (req, res) => {
  const errors = validationResult(req);
  return errors.isEmpty() ? [] : errors.array();
};

/**
 * This function validates if the received fields are allowed or not based on the allowed fields list
 * and throws an error if any unknown fields are found.
 * @param req - The `req` parameter is an object that contains the fields to be validated.
 * @param allowedFields - An array of strings representing the fields that are allowed in the request.
 * @param location - The `location` parameter in the `validateFields` function refers to the location
 * of the fields being validated, such as "request body", "query parameters", or "URL parameters". It
 * is used in the error message to indicate where the invalid fields were found.
 */
export const validateFields = (req, allowedFields, location) => {
  const unknownFields = Object.keys(req).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length) {
    throw new Error(
      `The following fields are not allowed in ${location}: ${unknownFields.join(
        ', '
      )}`
    );
  }
};
