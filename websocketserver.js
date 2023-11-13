const clientSocket = require("./models/clientsocket");
const {startJob} = require("./services/gluejob");
const {insertItem} = require("./services/dynamodb");
const {readKinesisStream} = require("./services/kinesis");
const {filterSearchSchema} = require('./schemas/filterrequest');
const {verifyOneTime} = require('./routes/auth');
const WebSocket = require('ws');

const getCookie = (cookie) => {
    return cookie.split(";").reduce((prev, item) => {
        const [key, value] = item.split("=").map(_ => _.trim());
        prev[key] = decodeURIComponent(value);
        return prev;
      }, {})
}

exports.initialiseWebsockets = function(server)
{
  console.log("Initializing WSS and Socket List");
  const wss = new WebSocket.Server({server})
  clientSocket.init();
  wss.on('connection', function connection(ws,req) {
    const cookie = req.headers.cookie ? getCookie(req.headers.cookie) :""
    if(!(cookie && verifyOneTime(cookie["X-one-time-token"]))) {ws.send(JSON.stringify({ statusmsg: 'Error', status:401, message: 'Unauthorized client error'})); ws.close()}
    ws.on('message', function incoming(data) {
      if (data === "ping"){
        ws.send("pong");
      }
      else{
        const reqData = JSON.parse(data);
        if(reqData.socket_user_id)  {clientSocket.addClient(reqData.socket_user_id,ws); return;}
        console.log('Received Search Request from Client : %s', data);
        const result = filterSearchSchema.validate(reqData);
        if (!result.error){
          ws.send(JSON.stringify({ statusmsg: 'Recieved', request_id:reqData.request_id, status:200, message: 'Request Taken , Processing Now'}));
          let putObjectPromise = insertItem(reqData)
            .then((resolvedata) =>  startJob(reqData.request_id,reqData.filter,reqData.user_id))
            .catch((err) => {
              const error = { statusmsg: 'Error', request_id:reqData.request_id, status:500,message: 'Could not process your request try later' }
              ws.send(JSON.stringify(error));
            });
        }
        else{
          const err = { statusmsg: 'Error', request_id:reqData.request_id, status:500,message: 'Invalid request data', description: result.error }
          ws.send(JSON.stringify(err));
        }
      }
    });
    ws.on('close', function close(data) {
      console.log('Client connection has been closed successfully.');
    });
  });
  readKinesisStream();
};
