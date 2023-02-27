import * as Knex from 'knex';

export class Login {
  login(code) {
    const request = require('request');
    const options = {
      method: 'POST',
      url: 'https://auth.moph.go.th/v1/oauth2/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:4200/callback',
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET
      }
    };
    return new Promise<void>((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) {
          reject(error)
        } else {
          resolve(JSON.parse(body));
        }
      });
    });

  }
  getProfile(token) {
    const request = require('request');
    const options = {
      method: 'GET',
      url: 'https://members.moph.go.th/api/v1/info',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`
      }
    };
    return new Promise<void>((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) {
          reject(error)
        } else {
          resolve(JSON.parse(body));
        }
      });
    });

  }

  checkDB(db: Knex, cid) {
    return db('admin').where('cid', cid)
  }
}