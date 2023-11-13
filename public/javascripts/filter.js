let ws = new WebSocket('wss://'+window.location.host);
var emailValue;
async function initClient(googleUser) {
    const profile = googleUser.getBasicProfile();
    emailValue = profile.getEmail();
    loadHistory();
    ws.send(JSON.stringify({"socket_user_id":emailValue}));
};

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

async function searchFilter(){  
  displayResult("#",false); 

  var request = {
    "filter" : document.getElementById('tag').value,
    "description" : document.getElementById('description').value,
    "request_id" : uuidv4(),
    "user_id" : emailValue,
    "filters_match_mode" : "EXACTLY_MATCHES",
    "filters_logic" : "and",
    "timestamp": Date.now()
  }
  ws.send(JSON.stringify(request)); 
}
ws.addEventListener('open', function open() {
  console.log("IM CLIENT IM CONNECTED TO SERVEER");
  setInterval(()=>{ ws.send("ping");return false }, 3000);
}); 

ws.addEventListener('message', (response) => {
  if(response.data === "pong") return;
  console.log("Recieving Message thro WS in client : "+response.data);
  if(response.data.startsWith("http")){
    displayResult(response.data,true);
    loadHistory();
  }
  else{
    const data = JSON.parse(response.data);
    if(200 == data.status) {loadHistory(); notifyAlert("msgSuccessalert","Success!! "+data.message);clearInputs();}
    else notifyAlert( "msgFailurealert","Failure!! "+data.message);
  }
  //alert(response.data);
});

ws.addEventListener('close', () => {
  console.log("Websocket Closed");
}); 

const loadHistory = async () => {
    let html = '';
    let response = await fetch('historySearch/'+emailValue);
    let result = await response.json();
    $.map(result.Items, (value, key) => html += '<TR><TD>'+value['filter']+'</TD><TD>'+value['description']+'</TD><TD>'+(value['job_status'] || "Inprogress")+'</TD><TD><input type="button" onclick=downloadHistoryItem("'+value['Id']+'") value="Download" class="btn btn-secondary" '+(value['job_status'] !== "Completed"? "disabled":"")+'/></TD></TR>');
    document.getElementById("tblbody_history").innerHTML =html;
  }

const downloadHistoryItem = async (requestId) => {
  console.log(requestId);
  let response = await fetch('history/'+requestId);
  let data = await response.text();
  console.log(data);
  downloadResult(data);
}

const displayResult = (dataurl,isDisplay) => {
  document.getElementById("downloadlink").href = dataurl;
  if(isDisplay) document.getElementById("resultdiv").classList.remove("invisible");
  else document.getElementById("resultdiv").classList.add("invisible");
}

const downloadResult = (dataurl) => {
  var a = document.createElement("a");
  a.href = dataurl;
  a.setAttribute("download", "result.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  }

  const notifyAlert = (id,message,notifyType) => {
    const alertEle= document.getElementById(id);
    alertEle.innerText = message;
    alertEle.classList.remove("invisible");
    setTimeout(function(){
      alertEle.classList.add("invisible"); 
    }, 5000);
  }

  const clearInputs = () => {
    document.getElementById("tag").value = "";
    document.getElementById("description").value = "";
  }
  
  setInterval(loadHistory, 90000);

