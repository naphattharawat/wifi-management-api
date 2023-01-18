import e = require('express');
import * as Knex from 'knex';
const LDAP = require('napi-ldap');
export class MemberDBModel {

  getList(db: Knex, query = '', limit, offset) {
    const q = `%${query}%`;
    const sql = db('users as u')
      .select('u.id', 'u.username', 'u.first_name', 'u.last_name', 'u.type', 'u.division_id',
        'u.tel', 'u.cid', 'u.email', 'u.is_deleted', 'u.is_actived', 'u.note'
        , 'd.name as division_name')
      .leftJoin('divisions as d', 'd.id', 'u.division_id')
      .where('u.is_deleted', 'N')
      .limit(+limit)
      .offset(+offset);
    if (query.length) {
      sql.where((w) => {
        w.orWhere('u.username', 'like', q)
        w.orWhere('u.first_name', 'like', q)
        w.orWhere('u.last_name', 'like', q)
        w.orWhere('u.cid', 'like', q)
        w.orWhere('d.name', 'like', q)
        w.orWhere('u.email', 'like', q)
      })
    }
    return sql;
  }

  getTotal(db: Knex, query = '') {
    const q = `%${query}%`;
    const sql = db('users as u')
      .count('* as count')
      .leftJoin('divisions as d', 'd.id', 'u.division_id')
      .where('u.is_deleted', 'N')
    if (query.length) {
      sql.where((w) => {
        w.orWhere('u.username', 'like', q)
        w.orWhere('u.first_name', 'like', q)
        w.orWhere('u.last_name', 'like', q)
        w.orWhere('u.cid', 'like', q)
        w.orWhere('d.name', 'like', q)
        w.orWhere('u.email', 'like', q)
      })
    }
    return sql;
  }

  getInfo(db: Knex, id) {
    return db('users')
      .where('id', id);
  }
  del(db: Knex, id) {
    return db('users')
      .where('id', id).del();
  }

  edit(db: Knex, id, data) {
    return db('users')
      .where('id', id)
      .update(data);
  }

  save(db: Knex, data) {
    return db('users')
      .insert(data, 'id');
  }
}


