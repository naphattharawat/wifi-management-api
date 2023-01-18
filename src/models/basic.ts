import * as Knex from 'knex';

export class BasicModel {
  divisions(db: Knex) {
    return db('divisions');
  }
}