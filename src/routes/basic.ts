import { BasicModel } from './../models/basic';
import * as express from 'express';
import { Router, Request, Response } from 'express';
import { Jwt } from '../models/jwt';

import * as HttpStatus from 'http-status-codes';

const jwt = new Jwt();
const basicModel = new BasicModel();

const router: Router = Router();

router.get('/divisions', async (req: Request, res: Response) => {
  try {
    const rs: any = await basicModel.divisions(req.db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error });
  }
});



export default router;