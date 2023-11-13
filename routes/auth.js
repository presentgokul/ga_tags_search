const express = require('express');
const router = express.Router();
const {OAuth2Client} = require('google-auth-library');
const {v4: uuidv4} = require('uuid');
const sha256 = require('crypto-js/sha256');

const secret = 'XXXX';
const CLIENT_ID = 'YYYY.apps.googleusercontent.com';
const randomHash = "XZZZZZXXXXX&SSSSS";
const client = new OAuth2Client(CLIENT_ID);

const verifyOneTime = (token) => {
  const [oneTime, uuid] = Buffer.from(token, 'base64').toString('utf-8').split('|');
  return oneTime === sha256(randomHash + uuid).toString();
};

const verify = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  const userid = payload['sub'];
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
  return payload;
};

router.get('/login', function(req,res, next) {
  res.render('login', { title: 'Login to GA Search' });
});

router.post('/authenticate', function(req, res, next) {
  return verify(req.body.idtoken).then(resp => {
    console.log(resp);
    if(resp['hd'] === 'gmail.com'){
      const uuid = uuidv4();
      const oneTime = sha256(randomHash + uuid).toString();
      console.log(uuid, oneTime);
      res.cookie("X-one-time-token", Buffer.from(`${oneTime}|${uuid}`, 'utf-8').toString('base64')).json({});
    } else res.status(403).json({});
  }).catch(err => {
    console.log(err);
    res.status(403).json({});
  })
});

module.exports = {router, verifyOneTime};
