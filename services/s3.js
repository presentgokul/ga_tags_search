const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

exports.getPresignedURL = async (prefix) => {
    const resolveddata = await s3.listObjectsV2({ Bucket: process.env.SERVICE_BUCKET , MaxKeys: 1 , Prefix: prefix}).promise()
    const objContent = resolveddata.Contents.shift();
    const s3ObjUrl = "s3://"+process.env.SERVICE_BUCKET+"/"+objContent.Key;
    console.log(s3ObjUrl);
    var params = {Bucket: process.env.SERVICE_BUCKET, Key: objContent.Key, Expires: 6000};
    var url = s3.getSignedUrl('getObject', params);
    console.log(url);
    return url;
}