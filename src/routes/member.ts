import { MemberDBModel } from './../models/member_db';
import * as express from 'express';
import { Router, Request, Response } from 'express';
import { Jwt } from '../models/jwt';
import { MemberLdapModel } from '../models/member_ldap';
import * as _ from 'lodash';
import * as HttpStatus from 'http-status-codes';
const execSync = require('child_process').execSync

const jwt = new Jwt();
const memberLdapModel = new MemberLdapModel();
const memberDBModel = new MemberDBModel();
const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const query = req.query.query;
    const limit = req.query.limit;
    const offset = req.query.offset;
    const rs: any = await memberDBModel.getList(req.db, query, limit, offset);
    console.log(rs);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error });
  }
});
router.get('/total', async (req: Request, res: Response) => {
  try {
    const query = req.query.query;
    const rs: any = await memberDBModel.getTotal(req.db, query);
    console.log(rs);
    res.send({ ok: true, count: rs[0].count });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const infoDB: any = await memberDBModel.getInfo(req.db, id);
    const infoLdap: any = await memberLdapModel.getInfo(id);
    if (infoDB.length) {
      const obj = infoDB[0];
      if (infoLdap.length) {
        obj.cn = infoLdap[0].cn[0]
        obj.cn = infoLdap[0].dn
        res.send({ ok: true, rows: obj });
      } else {
        res.send({ ok: false, error: 'not found2' });
      }
    } else {
      res.send({ ok: false, error: 'not found' });
    }

  } catch (error) {
    console.log(error);
  }
});

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

router.put('/active/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (id) {
      const isActived = req.body.isActived;
      const info = await memberDBModel.getInfo(req.db, id);
      if (info.length) {
        if (isActived == 'Y') {
          const objLdap: any = {
            username: info[0].username,
            password: info[0].password,
            firstName: info[0].first_name,
            lastName: info[0].last_name
          }
          const rs: any = await memberLdapModel.save(objLdap);
          if (rs.ok) {
            await memberDBModel.edit(req.db, id, { 'is_actived': 'Y' })
          } else {
            res.send({ ok: false, error: rs.error });
          }
        } else {
          const rs: any = await memberLdapModel.remove(info[0].username);
          if (rs.ok) {
            await memberDBModel.edit(req.db, id, { 'is_actived': 'Y' })
          } else {
            res.send({ ok: false, error: rs.error });
          }
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

// router.put('/rename/:username', async (req: Request, res: Response) => {
//   try {
//     const username = req.params.username;
//     if (username) {
//       // const info = await memberDBModel.getInfo(req.db, id);
//       // if (info.length) {
//       if (username) {
//         await memberLdapModel.editUsername(username, `mymoph_${username}`).then((result) => {
//           console.log(result);
//           res.send({ ok: true });
//         }).catch((err) => {
//           res.send({ ok: false, error: err });
//         });;

//       }
//       // } else {
//       //   res.send({ ok: false, error: 'not found' })
//       // }
//     } else {
//       res.send({ ok: false, error: 'not found' })
//     }
//   } catch (error) {
//     console.log(error);
//     res.send({ ok: true, error: error });

//   }
// });

router.put('/cid/:cid', async (req: Request, res: Response) => {
  try {
    const cidParam = req.params.cid;
    if (cidParam) {
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

      const info = await memberDBModel.getInfoFromCid(req.db, cidParam);
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

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (id) {
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

      const info = await memberDBModel.getInfo(req.db, id);
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
          await memberDBModel.edit(req.db, id, objDB);
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

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (id) {
      const info = await memberDBModel.getInfo(req.db, id);
      if (info.length) {
        await memberLdapModel.remove(info[0].username).then(async (result) => {
          await memberDBModel.edit(req.db, id, { 'is_deleted': 'Y' });
          res.send({ ok: true })
        }).catch((err) => {
          res.send({ ok: false, error: err });
        });
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