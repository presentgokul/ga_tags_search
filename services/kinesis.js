const AWS = require('aws-sdk');
const {getJobRun} = require('./gluejob');
const {updateItem} = require('./dynamodb');
const kinesis = new AWS.Kinesis({region: "eu-west-1"});
const clientSocket = require('../models/clientsocket');
const {getPresignedURL} = require('./s3');

const waitTimeout = (milliseconds) => {
  return new Promise(((resolve) => {
    setTimeout(resolve, milliseconds);
  }));
};

const handleRecord = (responses) =>{
    return Promise.all(responses.Records.map(item => {
        const glueInfo = JSON.parse(item.Data.toString('utf-8'));
        console.log("Glue Events to be Fetched "+item.Data.toString('utf-8'));
        return getJobRun(glueInfo.detail.jobRunId).then(data => {
            if(data.JobRun.Arguments){
              const reqId= data.JobRun.Arguments["--REQUEST_ID"]
              const userId= data.JobRun.Arguments["--USER_ID"]
              getPresignedURL(reqId).then((url) =>  clientSocket.postMessageToClient(userId,url))
              return updateItem(reqId,userId);
            }
        }).catch(e => console.log(e));
        //return Promise.resolve("success");
    }));
};

const getNextShardIterators = async (shardIterators) => {
  const nextShardIterators = await Promise.all(shardIterators.map(iterator => {
    return kinesis.getRecords({ShardIterator: iterator}).promise().then(data => {
      return handleRecord(data).then(_ => {
        return data.NextShardIterator;
      });
    }).catch(e => console.log(e));
  })).catch(e => console.log(e));
  waitTimeout(500).then(_ =>
    getNextShardIterators(nextShardIterators.filter(_ => !!_))
  );
};

exports.readKinesisStream = async () => {
const streamName = process.env.KINESIS_STREAM_NAME;
  const shards = await kinesis.listShards({StreamName: streamName}).promise();
  console.log(shards);
  const shardIterators = await Promise.all(shards.Shards.map(shard => {
    return kinesis.getShardIterator({
      ShardId: shard.ShardId,
      ShardIteratorType: "TRIM_HORIZON",
      StreamName: streamName
    }).promise().then(_ => _.ShardIterator)
  })).catch(e => console.log(e));
  getNextShardIterators(shardIterators);
};
