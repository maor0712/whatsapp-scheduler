'use strict'
document.addEventListener('DOMContentLoaded', () => {  
    checkStatusAndFetch()
})

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve,ms))
}


//wait for status to be true and then fetch 
async function checkStatusAndFetch(){
  let readyStatus =   await getReadyStatus()
  while(!readyStatus.status){
  await sleep(3000)
  if (readyStatus.windowClose) {
    alert('The whatsapp window been closed. Would you like to re-open it?');
    fetchToWhatsapp(true)
  }
    readyStatus =   await getReadyStatus()
  }
  await fetchToApp('http://localhost:5000/bot/chats')
  await fetchMessages()
  document.querySelector("#loading-screen").style.display = 'none'
}

//check if ready status is true
async function getReadyStatus(){
    const response = await fetch('http://localhost:5000/bot/status',{method: 'GET'})
    const data = await response.json()
    return data;
}


//send to functions expected and sent messages using fetchToApp()
async function fetchMessages() {
    const messageArr = await fetchToApp('http://localhost:5000/bot/messages');
    createList(messageArr);
    createHistoryList(messageArr);
}


//connect to server with get method
async function fetchToApp(url){
    const response = await fetch(url,{method: 'GET'})
    const data = await response.json()
    return data
}


//send messages to server with post method
async function fetchPost(chat,text,theDay,theMounth,theMinute,theHour) {

    fetch('http://localhost:5000/bot/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
        body: JSON.stringify({  
                                 nameChat : chat,
                                 content : text,
                                 day :parseInt(theDay),
                                 mounth :parseInt(theMounth),
                                 minutes :parseInt(theMinute),
                                 hour :parseInt(theHour)
                                 })
        });
    
    }

//send delete request to server and render messages list
async function deleteObj(path,objId){
    if(!objId){
    await fetch(`http://localhost:5000/bot/${path}`,{method: 'DELETE'});
    } else {
    await fetch(`http://localhost:5000/bot/${path}/${objId}`,{method: 'DELETE'});
}
    fetchMessages()
}

//get input value and send it to fetchToApp()
async function showChats(){
    let value = document.querySelector("#chats").value;
    let bool;
    if (value === ""){
        bool = false;
    } else{
        bool = true;
    }
    const url = `http://localhost:5000/bot/chats/search?term=${value}`
    const isExist = await fetchToApp(url);
    valid(isExist,bool)
}

//make dropdown with the founded chats
function valid(chatsFound,bool){
    const element = document.querySelector("#options");
    element.style.display = "none";

    if(chatsFound.length > 0 && bool){
        element.style.display = "block";
    let html = "<div id='dropDown'>";
    chatsFound.forEach(chat => {
        const encodedChat = encodeURIComponent(chat).replace("'", "\\'");
        html += `<div id="${chat}" class="found" onclick="selected('${encodedChat}')">`;
        html += `<h4>${chat}</h4></div>`
    });
    html += '</div>'
    element.innerHTML = html;
    }   
}

//change ipute value to selected chat
function selected(selectedChat){
    document.querySelector('#chats').value =decodeURIComponent(selectedChat);
    document.querySelector("#options").style.display = 'none'
}

//get all values from the form and sned them with fetchPost()
async function getValuesAndSetArr(){
    let chat = document.querySelector('#chats').value;
    let clearChat = chat;
    if (chat.includes("+")) {
        clearChat = chat.replace(/\+/g, '%2B');
      }
    const url = `http://localhost:5000/bot/chats/search?term=${clearChat}`
    const isExist = await fetchToApp(url);
    let message = document.querySelector('#message').value;
    const now = new Date();

    //time valuse
    let date = document.querySelector('#date').value
    let time = document.querySelector('#time').value

    let minutes = time.split(':')[1];
    let hour = time.split(':')[0];

    let day = date.split('-')[2];
    let mounth = date.split('-')[1];

    const userTime = new Date(now.getFullYear(), mounth - 1, day, hour, minutes);
    
    if(chat !== isExist[0]){
        alert("לא נמצא צ'ט")
    }else if(userTime.getTime() < now.getTime()){
        alert('You can set only future time')
    } else{
    
    if((chat !== '') && (message !== '') && (day !== '') && (mounth !== '') && (minutes !== '') && (hour !== '')){
    fetchPost(chat,message,day,mounth,minutes,hour)
    fetchMessages()
    window.location.reload()
    } else{
        alert('יש למלא את כל השדות')
    }

}
     
}


//create list of expected send messages
function createList(arr) {
    let listDiv = document.querySelector("#messagesL");
    const waitingMesArr = arr.filter(obj => (obj.sent === false));


const currentDate = new Date();

const filteredData = waitingMesArr.filter(item => {
  const itemDate = new Date(currentDate.getFullYear(), item.mounth -1, item.day, item.hour, item.minutes);
  return itemDate > currentDate;
});

const unsentMessages = waitingMesArr.filter(item => {
    const itemDate = new Date(currentDate.getFullYear(), item.mounth -1, item.day, item.hour, item.minutes);
    return itemDate < currentDate;
  });

  unsentMessages.forEach( async obj => {
   await deleteObj('messages',obj._id)
  })


    let html = '';
    filteredData.forEach(element => {

        let day = element.day.toString().padStart(2,'0'); 
        let mounth = element.mounth.toString().padStart(2,'0'); 
        let hour = element.hour.toString().padStart(2,'0'); 
        let minute = element.minutes.toString().padStart(2,'0'); 
        
        html += `<div id=${element._id}><h5>${element.nameChat}</h5>`;
        html += `<p>${element.content}</p>`;
        html += `<p>${day}/${mounth} ${hour}:${minute}</p>`;
        html += `<button class="btn btn-outline-success" onclick="deleteObj('messages','${element._id}')"> <i class="bi bi-trash3-fill"></i> </button> <hr> </div>`;
    })
    html;

    if(html === ''){
        html = '<div id="pEmpty" class=" position-absolute top-50 start-50 translate-middle">'
        html += '<p class="fs-3 text-center">Messages list is empty</p>  </div>' 
    }
    listDiv.innerHTML = html;
}

//create list of sent messages
function createHistoryList(arr){
    let listDiv = document.querySelector(".modal-body");
    const waitingMesArr = arr.filter(obj => (obj.sent === true));

    let html = '';
    waitingMesArr.forEach(element => {

        let day = element.day.toString().padStart(2,'0'); 
        let mounth = element.mounth.toString().padStart(2,'0'); 
        let hour = element.hour.toString().padStart(2,'0'); 
        let minute = element.minutes.toString().padStart(2,'0'); 

        html += `<div class="history-mes" id=${element._id}-history><h5>${element.nameChat}</h5>`;
        html += `<p>${element.content}</p>`;
        html += `<p>${day}/${mounth} ${hour}:${minute}</p>`;
        html += `<button class="btn btn-outline-success btn-his" onclick="deleteObj('sent','${element._id}')"> <i class="bi bi-trash3-fill"></i> </button><hr> </div>`;
    })
    html;

    if(html === ''){
        html = '<div id="pEmpty" class=" position-absolute top-50 start-50 translate-middle">'
        html += '<p class="fs-3 text-center">History is empty</p></div>' 
    }
    listDiv.innerHTML = html;

}

//start the app
async function fetchToWhatsapp(){

    await fetch('http://localhost:5000/bot/whatsapp',{method: 'GET'})
}

async function relodeWhatsapp(){

        await fetch('http://localhost:5000/bot/close',{method: 'GET'}) 
    
    window.location.reload()
    await fetchToWhatsapp()
}


