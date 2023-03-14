import { Router } from 'express';
import foo from './foo.js';

const api = Router();


api.use('/foo', foo);

export default api;
