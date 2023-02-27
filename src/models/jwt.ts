import * as jwt from 'jsonwebtoken';

export class Jwt {
  private secretKey = process.env.SECRET_KEY;

  sign(playload: any) {
    let token = jwt.sign(playload, this.secretKey, {
      expiresIn: '1d'
    });
    return token;
  }

  decoded(token) {
    let decode = jwt.decode(token);
    return decode;
  }

  signApiKey(playload: any) {
    let token = jwt.sign(playload, this.secretKey, {
      expiresIn: '1y'
    });
    return token;
  }

  verify(token: string) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secretKey, (err, decoded) => {
        if (err) {
          reject(err)
        } else {
          resolve(decoded)
        }
      });
    });
  }

}