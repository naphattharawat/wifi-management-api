/// <reference path="../../typings.d.ts" />

import * as express from 'express';
import { Router, Request, Response } from 'express';
import * as HttpStatus from 'http-status-codes';
import * as crypto from 'crypto';

import { Login } from '../models/login';

import { Jwt } from '../models/jwt';
import e = require('express');

const loginModel = new Login();
const jwt = new Jwt();

const router: Router = Router();

router.post('/', async (req: Request, res: Response) => {
  let code: string = req.body.code;
  let db = req.db;
  try {
    // let encPassword = crypto.createHash('md5').update(password).digest('hex');
    let rs: any = await loginModel.login(code);
    if (rs.access_token) {
      const info: any = await loginModel.getProfile(rs.access_token);
      if (info.ok) {
        // check admin
        const check = await loginModel.checkDB(db, info.user.CID)
        if (check.length) {
          const obj = {
            cid: info.user.CID,
            access_token: rs.access_token,
            refresh_token: rs.refresh_token,
          }
          let token = jwt.sign(obj);
          res.send({ ok: true, token: token });
        } else {
          res.send({ ok: false, error: 'Login failed!', code: HttpStatus.UNAUTHORIZED });
        }
      } else {
        res.send({ ok: false, error: 'Login failed!', code: HttpStatus.UNAUTHORIZED });
      }

    } else {
      res.send({ ok: false, error: 'Login failed!', code: HttpStatus.UNAUTHORIZED });
    }
  } catch (error) {
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

export default router;