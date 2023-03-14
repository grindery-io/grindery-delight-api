const express = require('express'),
  foo = require('./foo');

const api = express.Router();

api.use('/foo', foo);

module.exports = api;
