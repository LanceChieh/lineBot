#!/usr/bin/env node

/**
 * Module dependencies.
 */
var app = require('../app');
var debug = require('debug')('project-shield:server');
var http = require('http');
var firebase = require('firebase');
var linebot = require('linebot');
var apiai = require('apiai');
var fs = require('fs');

var config = {
    apiKey: "AIzaSyAqzIra9YkeE0HZZBSwXrjh4GemO7yVdmI",
    authDomain: "shield-88fd0.firebaseapp.com",
    databaseURL: "https://shield-88fd0.firebaseio.com",
    projectId: "shield-88fd0",
    storageBucket: "shield-88fd0.appspot.com",
    messagingSenderId: "376341346069"
};
firebase.initializeApp(config);

const usersRef = firebase.database().ref().child('chats/users2');
const agentsRef = firebase.database().ref().child('chats/agents2');
const newDBRef = firebase.database().ref().child('chats/Data');
const tagsRef = firebase.database().ref().child('tags');

var chatData;
newDBRef.on('value', snapshot=> {
   chatData = snapshot.val();
   console.log("chat data loading complete!");
  // ...
});

var tagsData;
tagsRef.on('value', snapshot=> {
   tagsData = snapshot.val().Data;
   console.log("tags data loading complete!");
  // ...
});
/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
/**
 * Create HTTP server.
 */
var server = http.createServer(app);
const io = require('socket.io').listen(server);
/**
 * Variables
 */
var users = {};
var type_sticker = 0;
var agent_nickname = 'agent';
//webhook event
var receiverId = '';
var agent_sendTo_receiver;
// LINE bot設定
var bot = linebot({
    channelId: '1526051164',
    channelSecret: '1f9ae458218fc325e98dbf7db4605a07',
    channelAccessToken: 'RUStzbie3C1mTpE3Y2IHgeD9HVZZdrSnESjiGPjtLyLZPbxg4Ibt4Rx/wmCvRECZotk9XWRg/tx0tGpf+6O0FcoPpWYO/kNs54kh4pHdH8AR/KLky9R8OpMQelQOzZqWd5MYLF3xZxhrbnnvq6rslQdB04t89/1O/w1cDnyilFU='
});
const linebotParser = bot.parser();
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
// 接收訊息
// LINE bot implement
bot.on('message', event => {
    let message_type = event.message.type;
    let message_lineTochat = event.message.text;
    let receiverId = event.source.userId;
    let receiver_name;
    let nowTime = Date.now();

    event.source.profile().then(function(profile) {
        receiver_name = profile.displayName;
        if( receiver_name==undefined ) receiver_name = "userName_undefined";

        // var msgObj = {    //MsgObj
        //   userName: receiver_name,
        //   id: receiverId,
        //   messageTime: nowTime,
        //   message: "default message"
        // }
        var msgObj = {
          owner: "user",
          name: receiver_name,
          time: nowTime
        };
        function emitIO_and_pushDB(obj) {
          // console.log("sending to io sockets...");
          // io.sockets.emit('new message', obj);
          // console.log("io sockets sent!");
          // console.log("sending to old firebase database...");
          // usersRef.push(obj);
          // console.log("DB sent!");

          console.log("sending object user: ");
          console.log(obj);
          // console.log("sending to local DB");
          // sendToLocalDB(obj);
          console.log("sending to new firebase database");
          sendToNewFb(obj);
          console.log("sending to new io sockets...");
          sendToFrontSocket(obj);
          console.log("All sent!");
        }
        function sendToFrontSocket(obj) {
          obj.id = receiverId;
          io.sockets.emit('new message2', obj);
        }
        function sendToNewFb(obj){
          let flag = true;
          for( let prop in chatData ) {
            if(chatData[prop].Profile.userId == receiverId) {
              console.log("find user " + receiverId + " in database");
              let length = chatData[prop].Messages.length;
              let updateObj = {};
              updateObj['/'+prop+'/Messages/'+length] = obj;
              newDBRef.update(updateObj);
              newDBRef.child(prop).child("Profile").update({
                unRead: true,
                photo: profile.pictureUrl
              });
              flag = false;
              break;
            }
          }
          if( flag ) {
            console.log("new user come in");
            let newData = {
              Profile: {
                nickname: receiver_name,
                userId: receiverId,
                age: -1,
                telephone: "",
                address: "",
                firstChat: nowTime,
                recentChat: nowTime,
                totalChat: 1,
                avgChat: 1,
                unRead: true
              },
              Messages: [obj]
            };
            newDBRef.push(newData);
          }
        }
        function sendToLocalDB(obj) {
          let DATA = JSON.parse(fs.readFileSync('chatMsg.json'));
          let i=0;
          for( i=0; i<DATA.length; i++ ) {
            if( DATA[i].Profile.userId == receiverId ) {
              DATA[i].Messages.push(obj);
              break;
            }
          }
          if( i==DATA.length ) {
            console.log("new user come in");
            let newData = {
              Profile: {
                nickname: receiver_name,
                userId: receiverId,
                age: -1,
                telephone: "",
                address: "",
                firstChat: nowTime,
                recentChat: nowTime,
                totalChat: 1,
                avgChat: 1
              },
              Messages: [obj]
            };
            DATA.push(newData);
          }
          fs.writeFileSync('chatMsg.json', JSON.stringify(DATA, null, 2));
          console.log("send to local DB success");
        }

        // from wenyen
        //  ===================  KINDS ====================
        if (message_type === 'sticker') {
          let packageId = event.message.packageId;
          let stickerId = event.message.stickerId;
          msgObj.message = 'Sticker packageId = ('+packageId+', '+stickerId+')';
          emitIO_and_pushDB(msgObj);
          type_sticker += 1;  ///what is this var QQ

        }
        else if (message_type === 'location') {
          msgObj.message = 'Location received: ';
          emitIO_and_pushDB(msgObj);

          msgObj.message = event.message.address;
          emitIO_and_pushDB(msgObj);


          event.message.content().then(function(content) {
            /*'base64'是圖片的編碼*/
            console.log(content.toString('base64'));
            /*把編碼轉換成圖片(image/png)做成連結的方式*/
            let latitude = event.message.latitude;
            let longitude = event.message.longitude;
            msgObj.message = '<a target="_blank" href=" https://www.google.com.tw/maps/place/' + content.toString('base64')
             + '/@' + latitude + ',' + longitude + ',15z/data=!4m5!3m4!1s0x0:0x496596e7748a5757!8m2!3d'
              + latitude + '!4d' + longitude + '">LOCATION LINK</a>';
            emitIO_and_pushDB(msgObj);
          }).catch(function(error) {
            // error
          });

        }
        else if (message_type === 'image') {
          msgObj.message = 'Image received. Please wait for the link below';
          emitIO_and_pushDB(msgObj);

          event.message.content().then(function(content) {
            /*'base64'是圖片的編碼*/
            console.log(content.toString('base64'));
            /*把編碼轉換成圖片(image/png)做成連結的方式*/
            msgObj.message = '<a href="data:image/png;base64,' + content.toString('base64') + '" ' +
            ' target="_blank" ><img src="data:image/png;base64,' + content.toString('base64') + '" ' +
            'width="20%" alt="image embedded using base64 encoding!"/></a>';
            emitIO_and_pushDB(msgObj);

          }).catch(function(error) {
            // error
            console.log(error);
          });

        }
        else if (message_type === 'audio') {
          msgObj.message = 'Audio received. Please wait for the link below.';
          emitIO_and_pushDB(msgObj);

          event.message.content().then(function(content) {
            console.log(content.toString('base64'));
            msgObj.message = '<audio controls><source src="data:audio/mp4;base64,' + content.toString('base64') + '" ' +
              '" type="audio/mp4"></audio>';
            emitIO_and_pushDB(msgObj);

          }).catch(function(error) {
            // error
            console.log(error);
          });
        }
        else if (message_type === 'video') {
          msgObj.message = 'Video received. Please wait for the link below.';
          emitIO_and_pushDB(msgObj);

          event.message.content().then(function(content) {
            console.log(content.toString('base64'));
            msgObj.message = '<video width="20%" controls><source src="data:video/mp4;base64,' + content.toString('base64') + '" ' +
              '" type="video/mp4"></video>';
            emitIO_and_pushDB(msgObj);

          }).catch(function(error) {
            // error
            console.log(error);
          });
        }
        else if (message_type === 'text' && (message_lineTochat.indexOf('.com') !== -1 || message_lineTochat.indexOf('.edu') !== -1 || message_lineTochat.indexOf('.net') !== -1 || message_lineTochat.indexOf('.io') !== -1 || message_lineTochat.indexOf('.org') !== -1)) {
          let urlStr = '<a href=';
          if (message_lineTochat.indexOf('https') === -1 || message_lineTochat.indexOf('http') === -1) {
            urlStr += '"https://';
          }
          msgObj.message = urlStr + message_lineTochat + '/" target="_blank">' + message_lineTochat + '</a>';
          emitIO_and_pushDB(msgObj);
        }
        else if (message_type === 'text' && message_lineTochat.trim() === '購買方案') {
          msgObj.message = '已接收購買方案'+"4小時方案  "+"8小時方案  "+"16小時方案  ";
          emitIO_and_pushDB(msgObj);
          event.reply({
            "type": "template",
            "altText": "購買方案說明",    //text that customer see at chat list
            "template": {
              "type": "buttons",
              "title": "購買方案說明",
              "text": "請選擇一個方案",
              "actions": [{
                "type": "message",
                "label": "4小時方案",
                "text": "4小時方案"
              },{
                "type": "message",
                "label": "8小時方案",
                "text": "8小時方案"
              },{
                "type": "message",
                "label": "16小時方案",
                "text": "16小時方案"
              }]
            }
          });

        }
        else if (message_type === 'text' && message_lineTochat.trim() === '你好'||message_lineTochat.trim().toLowerCase() ==='hi'||message_lineTochat.trim().toLowerCase() ==='hello') {
          msgObj.message = message_lineTochat.trim();
          emitIO_and_pushDB(msgObj);

          msgObj.message = '已接收選項'+"購買方案, "+"服務時段";
          emitIO_and_pushDB(msgObj);

          event.reply({
            "type": "template",
            "altText": "this is a buttons template",
            "template": {
              "type": "buttons",
              "title": "問題選項",
              "text": "請選擇一個詢問主題",
              "actions": [{
                  "type": "message",
                  "label": "購買方案",
                  "text": "購買方案"
              },{
                  "type": "message",
                  "label": "服務時段",
                  "text": "服務時段"
              },{
                  "type": "message",
                  "label": "問券調查",
                  "text": "問券調查"
              }]
            }
          });
        }
        else if (message_type === 'text' && message_lineTochat.trim() === '服務時段') {
            msgObj.message = '已發送服務時段: '+"「0700~1100」"+"「1100~1500」"+"「1500~1900」"+"「1900~2300」";
            emitIO_and_pushDB(msgObj);

            let service_time = '「0700~1100」 \n 「1100~1500」 \n 「1500~1900」 \n 「1900~2300」 \n 兩個時段必須是「連續的」 \n 「0700~1100」及「1100~1500」 \n 「1100~1500」及「1500~1900」 \n 「1500~1900」及「1900~2300」。';
            event.reply({
              type: 'text',
              text: 'BOT:\n' + service_time
            });

        }
        else if (message_type === 'text' && message_lineTochat.trim() === '4小時方案') {
          msgObj.message = '已發送服務時段: ' + '4小時方案 \n 15,888 元 \n 4小時方案/每天 \n $15,888每月';
          emitIO_and_pushDB(msgObj);

          let four = '4小時方案 \n 15,888 元 \n 4小時方案/每天 \n $15,888每月';
          event.reply({
            type: 'text',
            text: four
          });
        }
        else if (message_type === 'text' && message_lineTochat.trim() === '8小時方案') {
          msgObj.message = '已發送服務時段: ' + '4小時方案 \n 15,888 元 \n 4小時方案/每天 \n $15,888每月';
          emitIO_and_pushDB(msgObj);

          let eight = '8小時方案 \n 21,888 元 \n 8小時方案/每天 \n $21,888每月';
          event.reply({
            type: 'text',
            text: eight
          });
        }
        else if (message_type === 'text' && message_lineTochat.trim() === '16小時方案') {
          msgObj.message = '已發送服務時段: ' + '16小時方案 \n 39,888 元 \n 16小時方案/每天 \n $39,888每月';
          emitIO_and_pushDB(msgObj);

          let sixteen = '16小時方案 \n 39,888 元 \n 16小時方案/每天 \n $39,888每月';
          event.reply({               //to customer
            type: 'text',
            text: 'BOT:' + sixteen
          });
        }
        else if (event.message.type === 'text' && message_lineTochat.trim() === '問券調查') {
          setTimeout(() => {
            msgObj.message = '詢問客戶資料（性別）';
            msgObj.owner = 'agent';//test
            msgObj.name = 'autoreply' ;//test
            emitIO_and_pushDB(msgObj);
          }, 1000)

          event.reply({
            "type": "template",
            "altText": "問券調查part1",
            "template": {
              "type": "buttons",
              "title": "問券調查：性別",
              "text": "請選擇您的性別",
              "actions": [{
                "type": "message",
                "label": "性別：男",
                "text": "性別：男"
              },{
                "type": "message",
                "label": "性別：女",
                "text": "性別：女"
              }]
            }
          });

        }
        else if (event.message.type === 'text' && (message_lineTochat.trim() === '性別：女' || message_lineTochat.trim() === '性別：男')) {
          msgObj.message = message_lineTochat.trim();
          emitIO_and_pushDB(msgObj);

          updateProfile(event);
          console.log('update success!');

          setTimeout(() => {
            msgObj.message = '詢問客戶資料（居住地）';
            msgObj.owner = 'agent';//test
            msgObj.name = 'autoreply' ;//test
            emitIO_and_pushDB(msgObj);
          }, 1000)

          event.reply({
            "type": "template",
            "altText": "問券調查",
            "template": {
              "type": "buttons",
              "title": "問券調查：地區",
              "text": "請選擇您的性別",
              "actions": [{
                "type": "message",
                "label": "地區：北部",
                "text": "地區：北部"
              },{
                "type": "message",
                "label": "地區：中部",
                "text": "地區：中部"
              },{
                "type": "message",
                "label": "地區：南部",
                "text": "地區：南部"
              },{
                "type": "message",
                "label": "地區：東部",
                "text": "地區：東部"
              }]
            }
          });


        }
        else if (event.message.type === 'text' && (message_lineTochat.trim() === '地區：北部' || message_lineTochat.trim() === '地區：中部' || message_lineTochat.trim() === '地區：南部' || message_lineTochat.trim() === '地區：東部')) {
          msgObj.message = message_lineTochat.trim();
          emitIO_and_pushDB(msgObj);

          updateProfile(event);
          console.log('update success!');

          setTimeout(() => {
            msgObj.message = '詢問客戶資料（年齡層）';
            msgObj.owner = 'agent';//test
            msgObj.name = 'autoreply' ;//test
            emitIO_and_pushDB(msgObj);
          }, 1000)

          event.reply({
            "type": "template",
            "altText": "問券調查part2",
            "template": {
              "type": "carousel",
              "columns": [
                {
                  "text": "您的年齡層。請左右滑動並選擇您的年齡層",
                  "actions": [
                    {
                      "type": "message",
                      "label": "年齡：20以下",
                      "text": "年齡：20以下"
                    },
                    {
                      "type": "message",
                      "label": "年齡：21-30",
                      "text": "年齡：21-30"
                    },
                    {
                      "type": "message",
                      "label": "年齡：31-40",
                      "text": "年齡：31-40"
                    }
                  ]
                },
                {
                  "text": "您的年齡層。請左右滑動並選擇您的年齡層",
                  "actions": [
                    {
                      "type": "message",
                      "label": "年齡：41-50",
                      "text": "年齡：41-50"
                    },
                    {
                      "type": "message",
                      "label": "年齡：51-64",
                      "text": "年齡：51-64"
                    },
                    {
                      "type": "message",
                      "label": "年齡：65以上",
                      "text": "年齡：65以上"
                    }
                  ]
                }
              ]
            }
          });

        }
        else if (event.message.type === 'text' && (message_lineTochat.trim() === '年齡：20以下' || message_lineTochat.trim() === '年齡：21-30' || message_lineTochat.trim() === '年齡：31-40' || message_lineTochat.trim() === '年齡：41-50' || message_lineTochat.trim() === '年齡：51-64' || message_lineTochat.trim() === '年齡：65以上')) {
          msgObj.message = message_lineTochat.trim();
          emitIO_and_pushDB(msgObj);

          updateProfile(event);
          console.log('update success!');

          setTimeout(() => {
            msgObj.message = '感謝您填寫問卷！';
            msgObj.owner = 'agent';//test
            msgObj.name = 'autoreply' ;//test
            emitIO_and_pushDB(msgObj);
          }, 1000);


          event.reply({
            type: 'text',
            text: '感謝您填寫問卷！'
          });

        }
        else {
          msgObj.message = message_lineTochat;
          apiai(msgObj);
          emitIO_and_pushDB(msgObj);
        }

        function apiai(obj) {
          var apiai = require('apiai');
          var app = apiai('5e29c1d48227420789ac915597c0f025');
          var request = app.textRequest(obj.message, {
              sessionId: '9ceb250a-dbcc-463e-98dd-e2a5e56649b0'
          });
          request.on('response', function(response) {
            let action = response.result.action ;
            let speech = response.result.fulfillment.speech ;
            if(action != 'input.unknown'){
              console.log(speech);
              obj.owner = 'agent';
              obj.name = 'api.ai';
              obj.message = response.result.fulfillment.speech ;
              emitIO_and_pushDB(obj) ;
              console.log('api.ai:')
              console.log(obj);
              bot.push(obj.id,obj.message);
              if(action == 'test' ){
                event.reply({
                  "type": "template",
                  "altText": "this is a buttons template",
                  "template": {
                    "type": "buttons",
                    "title": "問題選項",
                    "text": "請選擇一個詢問主題",
                    "actions": [{
                        "type": "message",
                        "label": "購買方案",
                        "text": "購買方案"
                    },{
                        "type": "message",
                        "label": "服務時段",
                        "text": "服務時段"
                    },{
                        "type": "message",
                        "label": "問券調查",
                        "text": "問券調查"
                    }]
                  }
                });
              }
            }else{console.log(action);}

          });
          request.on('error', function(error) {
              console.log(error);
          });
          request.end();

        }
//test*/
        function updateProfile(event) {
          let survey = {id:'',para:'',value:''};
          let pos = event.message.text.indexOf('：');
          let para = event.message.text.substring(0,pos);
          let value = event.message.text.substring(pos+1);
          survey.id = event.source.userId;
          survey.para = para;
          survey.value = value ;
          console.log(survey);
          for( let i in chatData ) {
            if( chatData[i].Profile.userId == survey.id ) {
              console.log('match!updating profile...')
              let obj = {};
              obj['/'+survey.para] = survey.value;
              newDBRef.child(i).child("Profile").update(obj);
              break;
            }
          }
        }
  });
});
app.post('/webhook/', linebotParser);
/**
 * Socket.io
 */
//連接
io.sockets.on('connection', (socket) => {

    // 新使用者
    socket.on('new user', (data, callback) => {
        // if(nicknames.indexOf(data) != -1){
        // agent_nickname
        console.log(data);
        if (data in users) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
        }
    });

    socket.on('get tags from chat', data => {
      io.sockets.emit('push tags to chat', tagsData);
    });
    socket.on('get tags from tags', data => {
      io.sockets.emit('push tags to tags', tagsData);
    });

    socket.on('update tags', data => {
      console.log(data);
      let updateObj = {};
      updateObj['/Data'] = data;
      tagsRef.update(updateObj);
    });

    socket.on('get json from back', (data, callback) => {
      // var DATA = JSON.parse(fs.readFileSync('chatMsg.json'));
      io.sockets.emit('push json to front', chatData);
    });
    socket.on('read message', (data) => {
      console.log("agent read message of user "+data.id);
      for( let i in chatData ) {
        if( chatData[i].Profile.userId == data.id ) {
          newDBRef.child(i).child("Profile").update({
            "unRead": false,
          });
          break;
        }
      }
    });
    socket.on('update chat time', (data, callback) => {
      console.log("update chat time! id = "+data.id);
      // let DATA = JSON.parse(fs.readFileSync('chatMsg.json'));
      // let i=0;
      // for( i=0; i<DATA.length; i++ ) {
      //   if( DATA[i].Profile.userId == data.id ) {
      //     DATA[i].Profile.avgChat = data.avgTime;
      //     DATA[i].Profile.totalChat = data.totalTime;
      //     DATA[i].Profile.recentChat = data.recentTime;
      //     break;
      //   }
      // }
      // if( i==DATA.length ) console.log("408 impossible!!!");
      // fs.writeFileSync('chatMsg.json', JSON.stringify(DATA, null, 2));


      for( let i in chatData ) {
        if( chatData[i].Profile.userId == data.id ) {
          let updateObj = {};
          newDBRef.child(i).child("Profile").update({
            "avgChat": data.avgTime,
            "totalChat": data.totalTime,
            "chatTimeCount": data.chatTimeCount,
            // "recentChat": data.recentTime
            "recentChat": data.recentTime,
            "平均每次聊天時間": data.avgTime,
            "總共聊天時間": data.totalTime,
            "聊天次數": data.chatTimeCount,
            "上次聊天時間": data.recentTime
          });
          break;
        }
      }
      // if( i==DATA.length ) console.log("408 impossible!!!");
      // fs.writeFileSync('chatMsg.json', JSON.stringify(DATA, null, 2));

    });

    // 從SHIELD chat傳送訊息
    socket.on('send message', (data, callback) => {
        console.log(data);
        var msg = data.msg.trim();
        agent_sendTo_receiver = data.id.trim();
        console.log(agent_sendTo_receiver);

        var message;
        let d = Date.now();
        let date = new Date(d);

        if(msg.includes('/image')){
          let link = msg.substr(7);
          // console.log(link);
          message = {
            type: "image",
            originalContentUrl: link,
            previewImageUrl: link
          };
        } else if(msg.includes('/audio')){
          let link = msg.substr(7);
          // console.log(link);
          message = {
            type: "audio",
            originalContentUrl: link,
            duration: 6000
          };
        } else if(msg.includes('/video')){
          let link = msg.substr(7);
          // console.log(link);
          message = {
            type: "video",
            originalContentUrl: link,
            previewImageUrl: "https://www.movienewsguide.com/wp-content/uploads/2016/03/Phoenix-Suns.jpg"
          };
        } else if (msg.includes('/sticker')) {
            message = {
                type: "sticker",
                packageId: parseInt(msg.substr(9)),
                stickerId: parseInt(msg.substr(11))
            };
        } else {
            message = {
                type: "text",
                text: msg
            };
        }

        // 訊息傳到LINE
        if (agent_sendTo_receiver !== undefined) {
          bot.push(agent_sendTo_receiver, message);
        }
        else {
            console.log("agent_sendTo_receiver undefined!");
        }

        var msgObj = {
          agentName: socket.nickname,
          id: agent_sendTo_receiver,
          messageTime: Date.now()
        }
        function emitIO_and_pushDB(obj) {
          console.log("sending object agent1: ");
          console.log(obj);

          // 訊息傳到後台介面上
          console.log("sending to io sockets...");
          io.sockets.emit('new message', obj);
          console.log("io sockets sent!");

          // 訊息儲存到firebase資料庫
          console.log("sending to firebase database...");
          agentsRef.push(obj);
          console.log("DB sent!");
        }

        if (msg.includes('/image')) {
          msgObj.message = 'Send image to user';
          emitIO_and_pushDB(msgObj);

        } else if (msg.includes('/audio')) {
          msgObj.message = 'Send audio to user';
          emitIO_and_pushDB(msgObj);

        } else if (msg.includes('/video')) {
          msgObj.message = 'Send video to user';
          emitIO_and_pushDB(msgObj);

        } else if (msg.indexOf('.com') !== -1 || msg.indexOf('.edu') !== -1 || msg.indexOf('.net') !== -1 || msg.indexOf('.io') !== -1 || msg.indexOf('.org') !== -1) {
            let urlStr = '<a href=';
            if (msg.indexOf('https') !== -1 || msg.indexOf('http') !== -1) {
              urlStr += '"https://';
            }
            msgObj.message = urlStr + msg + '/" target="_blank">' + msg + '</a>';
            emitIO_and_pushDB(msgObj);

        } else if (msg.includes('/sticker')) {
          msgObj.message = 'Send sticker to user';
          emitIO_and_pushDB(msgObj);

        } else {
          msgObj.message = msg;
          emitIO_and_pushDB(msgObj);
        }
    });//sent message

    socket.on('send message2', (data, callback) => {
        // console.log(data);
        let msg = data.msg.trim();
        agent_sendTo_receiver = data.id.trim();
        let msg_time = data.msgtime;
        console.log(agent_sendTo_receiver);
        if(socket.nickname !== undefined){
          agent_nickname = socket.nickname;
        } else {
          agent_nickname = 'agent';
        }

        var message;
        let nowTime = Date.now();

        if(msg.includes('/image')){
          let link = msg.substr(7);
          // console.log(link);
          message = {
            type: "image",
            originalContentUrl: link,
            previewImageUrl: link
          };
        }
        else if(msg.includes('/audio')){
          let link = msg.substr(7);
          // console.log(link);
          message = {
            type: "audio",
            originalContentUrl: link,
            duration: 6000
          };
        }
        else if(msg.includes('/video')){
          let link = msg.substr(7);
          // console.log(link);
          message = {
            type: "video",
            originalContentUrl: link,
            previewImageUrl: "https://www.movienewsguide.com/wp-content/uploads/2016/03/Phoenix-Suns.jpg"
          };
        }
        else if (msg.includes('/sticker')) {
            message = {
                type: "sticker",
                packageId: parseInt(msg.substr(msg.indexOf(' '))),
                stickerId: parseInt(msg.substr(msg.lastIndexOf(' ')))
            };
        }
        else {
            message = {
                type: "text",
                text: msg
            };
        }

        // 訊息傳到LINE
        if (agent_sendTo_receiver !== undefined) {
          bot.push(agent_sendTo_receiver, message);
        }
        else {
            console.log("agent_sendTo_receiver undefined!");
        }

        // var msgObj = {
        //   agentName: socket.nickname,
        //   id: agent_sendTo_receiver,
        //   messageTime: nowTime
        // }
        var msgObj = {
          owner: "agent",
          name: agent_nickname,
          time: nowTime,
        };
        function emitIO_and_pushDB(obj) {
          // console.log("sending to io sockets...");
          // io.sockets.emit('new message', obj);
          // console.log("io sockets sent!");
          // console.log("sending to old firebase database...");
          // agentsRef.push(obj);
          // console.log("DB sent!");
          console.log("sending object agent2: ");
          console.log(obj);

          console.log("sending to new firebase database");
          sendToNewFb(obj);
          // console.log("sending to local DB");
          // sendToLocalDB(obj);
          console.log("sending to new io sockets...");
          sendToFrontSocket(obj);
          console.log("All sent!");
        }

        function sendToNewFb(obj){
          let flag = true;
          for( let prop in chatData ) {
            console.log("find next user data");
            if(chatData[prop].Profile.userId == agent_sendTo_receiver) {
              console.log("find the same user");
              let length = chatData[prop].Messages.length;
              let updateObj = {};
              updateObj['/'+prop+'/Messages/'+length] = obj;
              newDBRef.update(updateObj);
              flag = false;
              break;
            }
          }
          if( flag ) {
            console.log("new user come in, impossible!!!");
            let newData = {
              Profile: {
                nickname: "undefined name at www.line.669",
                userId: agent_sendTo_receiver,
                age: -1,
                telephone: "",
                address: "",
                firstChat: nowTime,
                recentChat: nowTime,
                totalChat: 1,
                avgChat: 1
              },
              Messages: [obj]
            };
            newDBRef.push(newData);
          }
        }

        function sendToFrontSocket(obj) {
          obj.id = agent_sendTo_receiver;
          io.sockets.emit('new message2', obj);
        }
        function sendToLocalDB(obj) {
          let DATA = JSON.parse(fs.readFileSync('chatMsg.json'));
          let i=0;
          for( i=0; i<DATA.length; i++ ) {
            if( DATA[i].Profile.userId == agent_sendTo_receiver ) {
              DATA[i].Messages.push(obj);
              break;
            }
          }
          if( i==DATA.length ) {
            console.log("new user come in");
            let newData = {
              Profile: {
                nickname: "unknown nickname",
                userId: agent_sendTo_receiver,
                age: -1,
                telephone: "",
                address: "",
                firstChat: nowTime,
                recentChat: nowTime,
                totalChat: 1,
                avgChat: 1
              },
              Messages:[obj]
            };
            DATA.push(newData);
          }
          fs.writeFileSync('chatMsg.json', JSON.stringify(DATA, null, 2));
          console.log("send to local DB success");
        }


        if (msg.includes('/image')) {
          msgObj.message = 'Send image to user';
          emitIO_and_pushDB(msgObj);

        } else if (msg.includes('/audio')) {
          msgObj.message = 'Send audio to user';
          emitIO_and_pushDB(msgObj);

        } else if (msg.includes('/video')) {
          msgObj.message = 'Send video to user';
          emitIO_and_pushDB(msgObj);

        } else if (msg.indexOf('.com') !== -1 || msg.indexOf('.edu') !== -1 || msg.indexOf('.net') !== -1 || msg.indexOf('.io') !== -1 || msg.indexOf('.org') !== -1) {
            let urlStr = '<a href=';
            if (msg.indexOf('https') !== -1 || msg.indexOf('http') !== -1) {
              urlStr += '"https://';
            }
            msgObj.message = urlStr + msg + '/" target="_blank">' + msg + '</a>';
            emitIO_and_pushDB(msgObj);

        } else if (msg.includes('/sticker')) {
          msgObj.message = 'Send sticker to user';
          emitIO_and_pushDB(msgObj);

        } else {
          msgObj.message = msg;
          emitIO_and_pushDB(msgObj);
        }
    });//sent message

    socket.on('get profile', (data, callback) => {
      console.log("get profile");
      console.log(data.id);
        for( let i in chatData ) {
          if( chatData[i].Profile.userId == data.id ) {
            console.log("match!");
            socket.emit('show profile',chatData[i].Profile);
          }
        }
    });
    socket.on('update profile', (data, callback) => {
      console.log("update profile");
      for( let i in chatData ) {
        if( chatData[i].Profile.userId == data.userId ) {
          let updateObj = {};
          for( let prop in data ) {
            updateObj[prop] = data[prop];
          }
          console.log(updateObj);
          newDBRef.child(i).child("Profile").update(updateObj);
          break;
        }
      }
    });

    socket.on('disconnect', (data) => {
        if (!socket.nickname) return;
        delete users[socket.nickname];
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ?
        'pipe ' + addr :
        'port ' + addr.port;
    debug('Listening on ' + bind);
}

// if get user message
//   use {
//     userName, //user's nickname
//     id, //user's receiverId
//     messageTime, //time
//     message //can be url, audio code ect
//   } to deliver to DB & socket
// else if get agent message
//     use {
//       agentName, //agent's nickname
//       id, //receiverId of the user whom agent want to chat with
//       messageTime, //time
//       message //can be url, audio code ect
//     } to deliver to DB & socket
// then we can use hasOwnProperty(obj) to determine user & agent
