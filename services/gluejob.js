const AWS = require('aws-sdk');
const glue = new AWS.Glue({apiVersion: '2017-03-31',region: "eu-west-1" });

const startJob = (requestID,filter,user_id) => {
let date = new Date(); date.setDate(date.getDate() - 2);
const params = {
        JobName: process.env.SERVICE_GLUE,
        Arguments: {
            '--DB_HOST_PORT': process.env.NEPTUNE_CONNECTION_STRING, 
            '--SERVICE_S3BUCKET': process.env.SERVICE_BUCKET,
            '--REQUEST_ID': requestID,
            '--GA_PREPROCESSED_DATABUCKET':process.env.GA_PREPROCESSED_DATABUCKET,
            '--Filter':filter,
            '--USER_ID':user_id,
            '--SEARCH_PATH': 'year='+date.getFullYear()+"/month="+("0" +parseInt(date.getMonth()+1)).slice(-2)+"/day="+("0" + date.getUTCDate()).slice(-2)
        }
    };
return glue.startJobRun(params).promise();
}

const getJobRun = (runID) => {
const params = { JobName: process.env.SERVICE_GLUE, RunId: runID };
return glue.getJobRun(params).promise();
}

module.exports = {
    startJob,
    getJobRun
  }