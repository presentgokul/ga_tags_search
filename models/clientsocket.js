const WebSocket = require('ws');
let clientSocketsMap;

const init = () => clientSocketsMap = new Map();
const getClientSocketMap = () =>  clientSocketsMap;

const addClient = (userId, clientSocket) => {
    const arr = clientSocketsMap.get(userId) || [];
    Array.prototype.push.apply(arr, [clientSocket])
    clientSocketsMap.set(userId,arr);
}

const postMessageToClient = (userId, data) => {
    const arrClientSocket = clientSocketsMap.get(userId);
    if(arrClientSocket){
        arrClientSocket.map((clientSocket)=> {
            if(clientSocket && clientSocket.readyState === WebSocket.OPEN){
            console.log('Sending data to client through WS for ' + userId);
            clientSocket.send(data);
            }
        })
    }
}

const removeClosedClients = () => {
    console.log("Cleaning up closed sockets")
    clientSocketsMap.forEach((clients, userid) => {
        const arrClientSocket = clients.filter(clientSocket => clientSocket && clientSocket.readyState === WebSocket.OPEN)
        clientSocketsMap.set(userid,arrClientSocket);
      });
}

setInterval(removeClosedClients, 14400000); //Every 4 hour cleanup sockets

module.exports = {
    init,
    addClient,
    getClientSocketMap,
    postMessageToClient
  }