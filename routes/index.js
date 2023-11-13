const express = require('express');
const gremlin = require('gremlin');
const AWS = require('aws-sdk');
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const {P,t, withOptions} = gremlin.process;
const __ = gremlin.process.statics;
const neptuneConnectionString = process.env.NEPTUNE_CONNECTION_STRING;
const aws4 = require('aws4');
const router = express.Router();
const Joi = require('joi');
const {getItems} = require('../services/dynamodb');
const {getPresignedURL} = require('../services/s3');
console.log(neptuneConnectionString);

const createRemoteConnection = async () => {
  const creds = await AWS.config.credentialProvider.resolvePromise();
  const [protocol, remainder] = neptuneConnectionString.split("://");
  const [host, portPath] = remainder.split(":");
  const [port, path] = portPath.split("/");
  const opts = { host, path, service: 'neptune-db', region: 'eu-west-1'};
  const sig = aws4.sign(opts, creds);
  console.log(sig.headers);
  console.log(neptuneConnectionString);
  return new DriverRemoteConnection(neptuneConnectionString, {traversalSource: 'g', headers: sig.headers});
};

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {title: 'ID Search'});
});

router.get('/filter', function (req, res, next) {
  res.render('filter', {title: 'ID Search Filter'});
});

router.get('/historySearch/:emailid', async function (req, res, next) {
  console.log('Read history Items for ' +req.params.emailid);
  getItems(req.params.emailid).then((data) => res.send(data)).catch((err)=> {console.log(err);res.status(400).send({message: 'Please contact admin!'})});
}); 

router.get('/history/:id', function(req, res) {
  console.log(req.params.id); 
  getPresignedURL(req.params.id).then((url) =>  res.send(url)).catch((err)=> {console.log(err);res.status(400).send({message: 'Please contact admin team!'})});
});

module.exports = router;
