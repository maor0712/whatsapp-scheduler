const { Client, LocalAuth } = require('whatsapp-web.js');
const { default: mongoose } = require('mongoose');
const cron = require('node-cron');
const express = require('express');
const app = express.Router();
const cors = require('cors');
const bodyParser = require('body-parser');


const connect = require('../data/database');
const messagesArr = require('../model/messages') 
const {authChat} = require('../middleware/authentication')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

let readyStatus;
let windowClose;
let needRelode;
let chatNames

app.use((req,res,next)=>{
  req.chatNames = chatNames
  return next()
})

const client = new Client({
  
  puppeteer: {
    executablePath: '/usr/bin/brave-browser-stable',
  },
  authStrategy: new LocalAuth({
    clientId: "client-one"
  }),
  puppeteer: {
    headless: false,
  }

});

app.get('/whatsapp',(req,res)=>{
    readyStatus = false;
    windowClose = false;
    needRelode = false;
    
/* const client = new Client({
  
    puppeteer: {
      executablePath: '/usr/bin/brave-browser-stable',
    },
    authStrategy: new LocalAuth({
      clientId: "client-one"
    }),
    puppeteer: {
      headless: false,
    }

  }); */

  //authenticationc 
client.on('authenticated', (session) => {
    console.log('WHATSAPP WEB => Authenticated');
  });


client.on('ready', () => {
    console.log('Client is ready!');


    chatNames = req.chatNames
     // Function to retrieve chat names
   async function getChatNames() {
    const chats = await client.getChats();
    let mapChats = chats.map(chat => chat.name);
      return mapChats;
    }
/*     getChatNames().then(() => {
      // Chat names are updated
      readyStatus = true; // Set readyStatus to true
    }).catch(error => {
      // Handle any errors that occurred during chat retrieval
      console.error(error);
    }); */

   async function main(){
      try{
      chatNames = await getChatNames();
        readyStatus = true;
      }catch(error){
        console.log(error);
      }
    }
    main()
    
    app.get('/chats', (req, res) => {
      res.status(200).json(chatNames);
    });
    

      
    app.get('/chats/search', (req,res) => {
            
            const term = req.query.term;
       /*      let cleanedTerm = term;
            if (term.startsWith(' ')) {
              cleanedTerm = term.substring(1); // Remove the '+' sign
            } */
            const foundChats = chatNames.filter( chat => chat && chat.toLowerCase().includes(term) );
            
            if (foundChats.length > 0) {
                res.status(200).json(foundChats);
            } else {
                res.status(404).json({message: `Couldn't find posts that contain your serach term (${term}) !`});
            }       
        })

        let allMessages;

  app.post('/messages',authChat, (req, res) => {
          allMessages = ''
          let {nameChat, content, day, mounth, minutes, hour} = req.body;
          console.log(req.body);
  
          const newMessageArr = new messagesArr({
                        nameChat : nameChat,
                        content : content,
                        day : day,
                        mounth : mounth,
                        minutes : minutes,
                        hour : hour,
                        sent : false
          })

          newMessageArr.save().then(() => {
            console.log('+ new message added successfully');
            res
            .status(200)
            .json({
              message: 'successfully added',
              inserted: newMessageArr
            })
        }).then(() => {  messagesArr.find({}).sort({day:1,mounth:1,hour:1,minutes:1}).exec((err, messages) => {
          if (err) {
             console.log(err);
          } else {
              allMessages = messages;
              for(let i = 0; i < allMessages.length; i++){
                allMessages[i].cron = cron.schedule(`${allMessages[i].minutes} ${allMessages[i].hour} ${allMessages[i].day} ${allMessages[i].mounth} *`,() => {
                       console.log(`running at ${allMessages[i].hour}:${allMessages[i].minutes}`);
                       client.getChats().then((chat)=>{
                           const myGroup = chat.find((chat) => chat.name === allMessages[i].nameChat);  
                           try {
                            client.sendMessage(myGroup.id._serialized, allMessages[i].content);
                          } catch (error) {
                            // Handle the error
                            console.error('An error occurred while sending the message:', error);
                          }
                           messagesArr.updateOne({_id: allMessages[i]._id}, {$set: {sent: true}}, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(`Successfully updated message ${i} sent status.`);
                            }
                        });
                       })
                   }, {
                  })
               }
         } }
    )
        })
 });
allMessages;

        app.get('/messages', (req,res) =>{
                messagesArr.find({}, function(err,doc){   
                if(err){
                  return res.status(500).send(err);
                }
                return res.status(200).json(doc);
              })
          
        })
        

      app.delete('/messages/:id', (req,res) => {
        const id = req.params.id;
      

        messagesArr.findById(id, (err, message) => {
          if (err) {
            console.log(err);
            return res.status(500).json({error: err.message});
          }
      
          if (!message) {
            console.log(`- error deleting, couldn't find id '${id}'`);
            return res
              .status(404)
              .json({error: `error deleting- id '${id}' not found`});
          }
      

          const job = allMessages.find((msg) => msg._id.toString() === id);
          if (job) {
            job.cron.stop();
            allMessages = allMessages.filter(obj => obj._id != id); 
            console.log(`- stopped cron job for message id '${id}'`);
          }
      

          message.remove((err, doc) => {
            if (err) {
              console.log(err);
              return res.status(500).json({error: err.message});
            }
            console.log(`+ message deleted successfully, id: '${id}'`);
            return res
              .status(200)
              .json({
                message: 'successfully deleted',
                deleted: doc
              });
          });
        });
      });

      app.delete('/sent/:id', (req,res) =>{
        const id = req.params.id;
      

        messagesArr.findById(id, (err, message) => {
          if (err) {
            console.log(err);
            return res.status(500).json({error: err.message});
          }
      
          if (!message) {
            console.log(`- error deleting, couldn't find id '${id}'`);
            return res
              .status(404)
              .json({error: `error deleting- id '${id}' not found`});
          }
          message.remove((err, doc) => {
            if (err) {
              console.log(err);
              return res.status(500).json({error: err.message});
            }
            console.log(`+ message deleted successfully, id: '${id}'`);
            return res
              .status(200)
              .json({
                message: 'successfully deleted',
                deleted: doc
              });
          });
        });
      })

      app.delete('/allSent', (req,res)=>{
        messagesArr.deleteMany({ sent: true }, (err, doc) => {
          if (err) {
            console.log(err);
            return res.status(500).json({error: err.messageArr});
          } 
          console.log('All messages with {sent = true} have been deleted');
          return res
            .status(200)
            .json({
              message: 'successfully deleted',
              deleted: doc
            });
  
        });
      })

    })
  
   
     app.get('/close', (req,res) => {
      client.destroy();
      readyStatus = false;
      windowClose = true;
      needRelode = true;
      res.json({message:'app been closed'})
    }) 

  
    app.get('/status', (req,res) => {
        res.status(200).json({
          status : readyStatus,
          windowClose: windowClose,
          needRelode: needRelode });
      }) 


/*       async function runClient() {
        try {
          windowClose = false;
          await client.initialize();

        } catch (error) {
          console.error('Initialization error:', error);
          windowClose = true;
          // Handle the initialization error
        }
      } */
      
      runClient();

      res.send('connected!')
      })

      async function runClient() {
        try {
          windowClose = false;
          await client.initialize();

        } catch (error) {
          console.error('Initialization error:', error);
          windowClose = true;
          // Handle the initialization error
        }
      }

module.exports = {app}; 