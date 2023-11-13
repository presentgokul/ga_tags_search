const AWS = require('aws-sdk');
const clientSocket = require('../models/clientsocket');
const {getPresignedURL} = require('./s3');
const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: 'eu-west-1'});
const dynamodbstreams = new AWS.DynamoDBStreams({ apiVersion: '2012-08-10', region: 'eu-west-1'});

const insertItem = (reqData) => {
    const params = {
        TableName : process.env.SERVICE_TABLE,
        Item:{
            "Id": reqData.request_id, "filter": reqData.filter, "description": reqData.description,"timestamp":reqData.timestamp,
            "user_id": reqData.user_id, "filters_match_mode": reqData.filters_match_mode, "filters_logic": reqData.filters_logic
        }
      }
   return ddb.put(params).promise();
}

const getItems = (emailID) => {
  const params = {
    TableName : process.env.SERVICE_TABLE,
    IndexName: "Userid_Timestamp_Index",
    KeyConditionExpression: "user_id = :emailid",
    ScanIndexForward:  false,
    Limit: 10,
    ExpressionAttributeValues: {
        ":emailid": emailID
    }
  };
  return ddb.query(params).promise();
}


const updateItem = (key , user_id) => {
    const params = {
        TableName : process.env.SERVICE_TABLE,
        Key: { "Id": key  , "user_id": user_id },
        UpdateExpression: "set job_status = :job_status, result_location = :result_location",
        ExpressionAttributeValues: {
            ":job_status": "Completed",
            ":result_location": "s3a://"+process.env.SERVICE_BUCKET+"/"+key
        }
    };
   return ddb.update(params).promise();
}

module.exports = {
    insertItem,
    getItems,
    updateItem
  }