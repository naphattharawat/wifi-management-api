import e = require('express');
import * as Knex from 'knex';
const LDAP = require('napi-ldap');
const execSync = require('child_process').execSync
export class MemberLdapModel {

  getList() {
    return new Promise<void>((resolve, reject) => {
      var ldap = new LDAP({
        uri: process.env.LDAP_URL,
        base: `ou=people,${process.env.LDAP_BASE}`,
      }, function (err) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          const searchOptions = {
            // base: 'dc=com',
            // scope: LDAP.SUBTREE,
            filter: '(objectClass=person)',
            attrs: 'cn,dn,uid'
          }
          ldap.search(searchOptions, function (err, data) {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              console.log(data);
              resolve(data);
            }
          });
        }
        // connected and ready    
      });
    });

  }

  getInfo(uid) {
    return new Promise<void>((resolve, reject) => {
      var ldap = new LDAP({
        uri: process.env.LDAP_URL,
        base: `ou=people,${process.env.LDAP_BASE}`,
      }, function (err) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          const searchOptions = {
            // base: 'dc=com',
            // scope: LDAP.SUBTREE,
            filter: `(employeeNumber=${uid})`,
            attrs: 'cn,dn,employeeNumber'
          }
          ldap.search(searchOptions, function (err, data) {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve(data);
            }
          });
        }
        // connected and ready    
      });
    });

  }

  save(data) {
    try {

      return new Promise<any>((resolve, reject) => {
        var ldap = new LDAP({
          uri: process.env.LDAP_URL,
          base: process.env.LDAP_BASE,
        }, function (err) {
          if (err) {
            console.log(err);
            reject(err)
          } else {
            ldap.bind({
              binddn: `cn=${process.env.LDAP_ADMIN},${process.env.LDAP_BASE}`,
              password: process.env.LDAP_PASSWORD
            }, function (err, res) {
              if (err) {
                console.log('err1: ', err);
                reject(err)
              } else {
                // var encryptedPassword = execSync('slappasswd -h "{MD5}" -s ' + data.password).toString();
                var attrs = [
                  {
                    attr: 'objectClass', vals: ['organizationalPerson', 'inetOrgPerson', 'person', 'top', 'shadowAccount']
                  },
                  { attr: 'givenName', vals: [data.username] },
                  { attr: 'sn', vals: [data.lastName ? data.lastName : 'null'] },
                  { attr: 'uid', vals: [data.username] },
                  { attr: 'employeeNumber', vals: [data.id.toString()] },
                  { attr: 'userPassword', vals: [data.password] },

                ];
                // console.log(attrs);

                var dn = `cn=${data.username},ou=people,dc=moph,dc=go,dc=th`;
                ldap.add(dn, attrs, function (err2) {
                  // if (err2 == 'Already exists') {

                  // }
                  if (err2) {
                    console.log('err2: ', err2);
                    reject(err2)
                  } else {
                    console.log('add success');
                    resolve(true);
                  }
                });
              }
            });
          }
        });
      });
    } catch (error) {
      console.log('catch', error);
      return error;

    }
  }

  edit(username, data) {
    try {
      return new Promise<any>((resolve, reject) => {
        var ldap = new LDAP({
          uri: process.env.LDAP_URL,
          base: process.env.LDAP_BASE,
        }, function (err) {
          if (err) {
            console.log(err);
            reject(err)
          } else {
            ldap.bind({
              binddn: `cn=${process.env.LDAP_ADMIN},${process.env.LDAP_BASE}`,
              password: process.env.LDAP_PASSWORD
            }, function (err, res) {
              if (err) {
                console.log('err1: ', err);
                reject(err)
              } else {
                var changes = [];
                if (data.password) {
                  // const encryptedPassword = execSync('slappasswd -h "{MD5}" -s ' + data.password).toString();
                  changes.push({
                    op: 'replace',
                    attr: 'userPassword',
                    vals: [data.password]
                  });
                } else if (data.firstName) {
                  changes.push({
                    op: 'replace',
                    attr: 'givenName',
                    vals: [data.firstName]
                  });
                } else if (data.lastName) {
                  changes.push({
                    op: 'replace',
                    attr: 'sn',
                    vals: [data.lastName]
                  });
                }

                const dn = `cn=${username},ou=people,dc=moph,dc=go,dc=th`;
                ldap.modify(dn, changes, function (err2) {
                  if (err2) {
                    console.log('err2: ', err2);
                    reject(err2)
                  } else {
                    console.log('edit data success');
                    resolve(true);
                  }
                });
              }
            });
          }
        });
      });
    } catch (error) {
      console.log('catch:', error);
      return error;

    }
  }

  editUsername(oldUsername, newUsername) {
    try {
      return new Promise<any>((resolve, reject) => {
        var ldap = new LDAP({
          uri: process.env.LDAP_URL,
          base: process.env.LDAP_BASE,
        }, function (err) {
          if (err) {
            console.log(err);
            reject(err)
          } else {
            ldap.bind({
              binddn: `cn=${process.env.LDAP_ADMIN},${process.env.LDAP_BASE}`,
              password: process.env.LDAP_PASSWORD
            }, function (err, res) {
              if (err) {
                console.log('err1: ', err);
                reject(err)
              } else {
                const dn = `cn=${oldUsername},ou=people,dc=moph,dc=go,dc=th`;
                const newDn = `cn=${newUsername}`;
                ldap.rename(dn, newDn, function (err2) {
                  if (err2) {
                    console.log('err2: ', err2);
                    reject(err2)
                  } else {
                    console.log('edit success');
                    resolve(true);
                  }
                });
              }
            });
          }
        });
      });
    } catch (error) {
      console.log('catch:', error);
      return error;

    }
  }

  remove(username) {
    try {
      return new Promise<any>((resolve, reject) => {
        var ldap = new LDAP({
          uri: process.env.LDAP_URL,
          base: process.env.LDAP_BASE,
        }, function (err) {
          if (err) {
            console.log(err);
            reject(err)
          } else {
            ldap.bind({
              binddn: `cn=${process.env.LDAP_ADMIN},${process.env.LDAP_BASE}`,
              password: process.env.LDAP_PASSWORD
            }, function (err, res) {
              if (err) {
                console.log('err1: ', err);
                reject(err)
              } else {
                const dn = `cn=${username},ou=people,dc=moph,dc=go,dc=th`;
                ldap.remove(dn, function (err2) {
                  if (err2) {
                    console.log('err2: ', err2);
                    reject(err2)
                  } else {
                    console.log('edit success');
                    resolve(true);
                  }
                });
              }
            });
          }
        });
      });
    } catch (error) {
      console.log('catch:', error);
      return error;

    }
  }
}