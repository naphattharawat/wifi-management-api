import * as express from 'express';
import { Router, Request, Response } from 'express';
import { Jwt } from '../models/jwt';
const execSync = require('child_process').execSync
import * as HttpStatus from 'http-status-codes';
import { MemberLdapModel } from '../models/member_ldap';
import { MemberDBModel } from '../models/member_db';
import * as _ from 'lodash';
const jwt = new Jwt();

const router: Router = Router();
const memberLdapModel = new MemberLdapModel();
const memberDBModel = new MemberDBModel();



router.post('/', async (req: Request, res: Response) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const divisionId = req.body.divisionId;
    const tel = req.body.tel;
    const cid = req.body.cid;
    const type = req.body.type || 'WEB';
    const email = req.body.email;
    const encryptedPassword = execSync('slappasswd -h "{MD5}" -s ' + password).toString();
    const objDB: any = {
      username,
      first_name: firstName,
      last_name: lastName,
      type: type,
      division_id: divisionId,
      tel,
      cid,
      email,
      password: encryptedPassword
    }
    console.log(cid);

    const objLdap: any = {
      username,
      password: encryptedPassword,
      firstName: firstName,
      lastName: lastName
    }
    await memberDBModel.save(req.db, objDB).then(async (userId) => {
      objLdap.id = userId[0];
      await memberLdapModel.save(objLdap).then(() => {
        res.send({ ok: true, id: userId[0] });
      }).catch(async (err) => {
        await memberDBModel.del(req.db, objLdap.id);
        console.log(err);
        res.send({ ok: false, error: err });
      })
    }).catch((err) => {
      if (err.code == 'ER_DUP_ENTRY') {
        res.send({ ok: false, error_code: 'ER_DUP_ENTRY', error: 'username ซ้ำ' })
      } else {
        res.send({ ok: false, error_code: err.code, error: err.sqlMessage })
      }
    })

  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error });
  }
});


router.put('/cid/:cid', async (req: Request, res: Response) => {
  try {
    const cid = req.params.cid;
    if (cid) {
      const username = req.body.username;
      const password = req.body.password;
      const firstName = req.body.firstName;
      const lastName = req.body.lastName;
      const divisionId = req.body.divisionId;

      const tel = req.body.tel;
      const cid = req.body.cid;
      const email = req.body.email;
      const note = req.body.note;

      const objDB: any = {};
      username ? objDB.username = username : null;
      tel ? objDB.tel = tel : null;
      note ? objDB.note = note : null;
      cid ? objDB.cid = cid : null;
      email ? objDB.email = email : null;
      firstName ? objDB.first_name = firstName : null;
      lastName ? objDB.last_name = lastName : null;
      divisionId ? objDB.division_id = divisionId : null;
      password ? objDB.password = execSync('slappasswd -h "{MD5}" -s ' + req.body.password).toString() : null;

      const info = await memberDBModel.getInfoFromCid(req.db, cid);
      if (info.length) {
        const objLdap: any = {};
        firstName ? objLdap.first_name = firstName : null;
        lastName ? objLdap.last_name = lastName : null;
        password ? objLdap.password = execSync('slappasswd -h "{MD5}" -s ' + req.body.password).toString() : null;

        let rsUsername: any = true;
        let rsData: any = true;
        let rsDataError = '';
        if (!_.isEmpty(objLdap)) {
          try {
            rsData = await memberLdapModel.edit(info[0].username, objLdap)
          } catch (error) {
            console.log(error);
            rsDataError += error;
            rsData = false;
          }
        }
        if (username) {
          try {
            rsUsername = await memberLdapModel.editUsername(info[0].username, username);
          } catch (error) {
            console.log(error);
            rsDataError += error;
            rsUsername = false;
          }
        }
        if (rsData && rsUsername) {
          await memberDBModel.edit(req.db, info[0].id, objDB);
          res.send({ ok: true });
        } else {
          res.send({ ok: false, error: rsDataError });
        }
      } else {
        res.send({ ok: false, error: 'not found' })
      }
    } else {
      res.send({ ok: false, error: 'not found' })
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: true, error: error });

  }
});

export default router;