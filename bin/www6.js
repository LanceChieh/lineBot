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
var ticket = {} ;
var unirest = require('unirest');
var API_KEY = "4qydTzwnD7xRGaTt7Hqw";
var FD_ENDPOINT = "fongyu";

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

const auth = firebase.auth();
// console.log(auth.app);

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
//webhook event
var receiverId = '';
var agent_sendTo_receiver;

// LINE bot設定
var bot = linebot({
    channelId: '1527218429',
    channelSecret: '8ac1dcba506cde0d0a84e05c0a21ed94',
    channelAccessToken: '5lOiydBqQkAbBYv7Ogo8JkGGCuZYqcN/xMomhRFOzPdbeKUGxmLTGfFUcI1azBwMu+4q2vHzJROtyQgl5jjybdLTVbagolKcBenyb/pysdqdtEthZTKmQWSI+Y54ZNkNiX5Tw+W47PaQ8tblBPBL6wdB04t89/1O/w1cDnyilFU='
});
const linebotParser = bot.parser();


// api ai setting

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


// 接收訊息
// LINE bot implement
bot.on('message', event => {
    console.log(event);
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

          console.log("sending object: ");
          console.log(obj);
          console.log("sending to local DB");
          sendToLocalDB(obj);
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
        else {
          msgObj.message = message_lineTochat;
          apiai(msgObj);
          if (message_type === 'text' && (message_lineTochat.indexOf('.com') !== -1 || message_lineTochat.indexOf('.edu') !== -1 || message_lineTochat.indexOf('.net') !== -1 || message_lineTochat.indexOf('.io') !== -1 || message_lineTochat.indexOf('.org') !== -1)) {
            let urlStr = '<a href=';
            if (message_lineTochat.indexOf('https') === -1 || message_lineTochat.indexOf('http') === -1) {
              urlStr += '"https://';
            }
            msgObj.message = urlStr + message_lineTochat + '/ target="_blank">' + message_lineTochat + '</a>';
          }
          emitIO_and_pushDB(msgObj);
        }
/*========================api.ai by FWL=============================*/
        function apiai(obj) {
          var apiai = require('apiai');
          var app = apiai('a84ed63ae3914a1fb4601f2824d4cabd');
          var request = app.textRequest(obj.message, {
              sessionId: '0896c04e-218b-4951-b75d-2d09e1ce7d4b'
          });
          request.on('response', function(response) {
            let action = response.result.action ;
            let speech = response.result.fulfillment.messages[0].speech ;
            let parameter = response.result.parameters ;
            let complete = !response.result.actionIncomplete ;
            console.log(response.result) ;
            if(action != 'input.unknown'){
              msgObj.owner = 'agent';
              msgObj.name = 'api.ai';
              if(action == 'input.welcome'||action == 'timeGreeting'){
                obj.message = '已接收選項'+"購買方案, "+"服務時段, "+'問卷調查';
                emitIO_and_pushDB(msgObj);
                event.reply({
                  "type": "template",
                  "altText": "this is a buttons template",
                  "template": {
                    "type": "buttons",
                    "title": "問題選項",
                    "text": "請選擇一個詢問主題",
                    "actions": [{
                        "type": "postback",
                        "label": "購買方案",
                        "data": "purchasePlan"
                    },{
                        "type": "message",
                        "label": "服務時段",
                        "text": "服務時段"
                    },{
                        "type": "message",
                        "label": "問卷調查",
                        "text": "問卷調查"
                    }]
                  }
                });
              }
              if(action == 'Questionnaire'){
                console.log(obj.message);
                updateProfile(obj.message);
                let type = response.result.fulfillment.messages[1].speech ;
                console.log(type);
                if(type == 'start'){
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
                  msgObj.message = '詢問客戶資料（性別）';
                  emitIO_and_pushDB(msgObj);
                }
                else if(type == 'gender'){
                  msgObj.message = '詢問客戶資料（居住地）';
                  emitIO_and_pushDB(msgObj);
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
                  return ;
                }
                else if(type == 'place'){
                  msgObj.message = '詢問客戶資料（年齡層）';
                  emitIO_and_pushDB(msgObj);
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
                  return ;
                }
                else if(type == 'age'){
                  msgObj.message = response.result.fulfillment.messages[2].speech ;
                  emitIO_and_pushDB(msgObj);
                  //bot.push(obj.id,msgObj.message);
                  event.reply({ type: 'text', text: msgObj.message });
                  return ;
                }
              }
              if(action == 'tinistart.faq'){
                let type = speech ;
                //let content = '';
                let incomplete = response.result.actionIncomplete ;
                console.log(type) ;
                if(incomplete){
                  msgObj.message = speech;
                  emitIO_and_pushDB(msgObj);
                  event.reply({ type: 'text', text: speech });
                }
                else if(type == 'principal'){
                  msgObj.message = "關於負責人";
                  emitIO_and_pushDB(msgObj);
                  event.reply({
                    "type": "template",
                    "altText": "關於負責人",
                    "template": {
                      "type": "buttons",
                      "title": "關於負責人",
                      "text": "以下是有關負責人的常見問題",
                      "actions": [{
                        "type": "postback",
                        "label": "請問什麼樣的人可以擔任負責人?",
                        "data": "1-1"                      }]
                    }
                  });

                }
                else if(type == 'money'){
                  msgObj.message = '關於資本額';
                  emitIO_and_pushDB(msgObj);
                  event.reply({
                    "type": "template",
                    "altText": "關於資本額",
                    "template": {
                      "type": "buttons",
                      "title": "關於資本額",
                      "text": "以下是有關資本額的常見問題",
                      "actions": [{
                        "type": "postback",
                        "label": "公司的資本額有最低限制嗎",
                        "data": "2-1",
                      },{
                        "type": "postback",
                        "label": "資本額要在銀行放多久才能用",
                        "data": "2-2",
                      },{
                        "type": "postback",
                        "label": "資本額一定要經過會計師簽證查核嗎",
                        "data": "2-3",
                      },{
                        "type": "postback",
                        "label": "我能請人代做資本額嗎",
                        "data": "2-4",
                      }]
                    }
                  });
                }
                else if(type == 'servies'){
                  msgObj.message = '關於附加服務';
                  emitIO_and_pushDB(msgObj);
                  event.reply({
                    "type": "template",
                    "altText": "關於附加服務",
                    "template": {
                      "type": "buttons",
                      "title": "關於附加服務",
                      "text": "以下是有關附加服務的常見問題",
                      "actions": [{
                        "type": "postback",
                        "label": "什麼是商務中心",
                        "data": "3-1",
                      },{
                        "type": "postback",
                        "label": "商務中心可以提供什麼服務",
                        "data": "3-2",
                      },{
                        "type": "postback",
                        "label": "App製作是怎麼樣的服務",
                        "data": "3-3",
                      },{
                        "type": "postback",
                        "label": "什麼樣的人適合使用商務中心",
                        "data": "3-4",
                      }]
                    }
                  });
                }
                else if(type == 'bank'){
                  msgObj.message = '關於銀行帳戶';
                  emitIO_and_pushDB(msgObj);
                  event.reply({
                    "type": "template",
                    "altText": "關於銀行帳戶",
                    "template": {
                      "type": "buttons",
                      "title": "關於銀行帳戶",
                      "text": "以下是有關銀行帳戶的常見問題",
                      "actions": [{
                        "type": "postback",
                        "label": "如何挑選辦理的銀行",
                        "data": "4-1",
                      },{
                        "type": "postback",
                        "label": "如何將公司籌備處帳戶變成正式帳戶",
                        "data": "4-2",
                      },{
                        "type": "postback",
                        "label": "我可以在不同銀行開設公司銀行帳戶嗎",
                        "data": "4-3",
                      }]
                    }
                  });
                }
                else if(type == 'starting'){
                  msgObj.message = '關於公司設立';
                  event.reply({
                    "type": "template",
                    "altText": "關於公司設立",
                    "template": {
                      "type": "carousel",
                      "columns": [
                          {
                            "text": "以下是有關公司設立的常見問題",
                            "actions": [
                                {
                                    "type": "postback",
                                    "label": "印章不見時有什麼要注意的?",
                                    "data": "5-1",
                                },
                                {
                                    "type": "postback",
                                    "label": "我可以不設立公司或行號就開始營業嗎?",
                                    "data": "5-2",
                                },
                                {
                                    "type": "postback",
                                    "label": "想用的名稱已被使用，但處於解散狀態",
                                    "data": "5-3",
                                }
                            ]
                          },{
                            "text": "以下是有關公司設立的常見問題",
                            "actions": [
                                {
                                  "type": "postback",
                                  "label": "想開小吃店或小店面還需要設立公司嗎",
                                  "data": "5-4",
                                },
                                {
                                  "type": "postback",
                                  "label": "請問我需要準備些什麼東西?",
                                  "data": "5-5",
                                },
                                {
                                  "type": "postback",
                                  "label": "沒有建物所有權狀的話要怎麼辦?",
                                  "data": "5-6",
                                }
                            ]
                          },{
                            "text": "以下是有關公司設立的常見問題",
                            "actions": [
                                {
                                  "type": "postback",
                                  "label": "如果公司大小章不見的話要怎麼處理?",
                                  "data": "5-7",
                                },
                                {
                                  "type": "postback",
                                  "label": "外國人在台灣設立公司時的步驟有什麼不同?",
                                  "data": "5-8",
                                },
                                {
                                  "type": "postback",
                                  "label": "公司申請要用的文件和資料要怎樣交給你們?",
                                  "data": "5-9",
                                }
                            ]
                          },{
                            "text": "以下是有關公司設立的常見問題",
                            "actions": [
                                {
                                  "type": "postback",
                                  "label": "我該設立有限公司還是股份有限公司?",
                                  "data": "5-10",
                                },
                                {
                                  "type": "postback",
                                  "label": "營業項目要設多少個?有限制嗎?",
                                  "data": "5-11",
                                },
                                {
                                  "type": "postback",
                                  "label": " ",
                                  "data": " ",
                                }
                            ]
                          }
                      ]
                    }
                  });
                  emitIO_and_pushDB(msgObj);
                }
                else if(type == 'business'){
                  msgObj.message = '關於營業項目';
                  emitIO_and_pushDB(msgObj);
                  event.reply({
                    "type": "template",
                    "altText": "關於營業項目",
                    "template": {
                      "type": "buttons",
                      "title": "關於營業項目",
                      "text": "以下是有關營業項目的常見問題",
                      "actions": [{
                        "type": "postback",
                        "label": "什麼是特許營業項目",
                        "data": "6-1",
                      },{
                        "type": "postback",
                        "label": "我能自行增加製造產品的項目嗎",
                        "data": "6-2",
                      }]
                    }
                  });
                }
                else if(type == 'price'){
                  msgObj.message = '關於價格方案';
                  emitIO_and_pushDB(msgObj);
                  event.reply({
                    "type": "template",
                    "altText": "關於價格方案",
                    "template": {
                      "type": "buttons",
                      "title": "關於價格方案",
                      "text": "以下是有關價格方案的常見問題",
                      "actions": [{
                        "type": "postback",
                        "label": "為什麼有特許營業項目時要另外計算費用?",
                        "data": "7-1",
                      },{
                        "type": "postback",
                        "label": "兩個方案差別在哪?",
                        "data": "7-2",
                      }]
                    }
                  });
                }
                else if(type == 'insurance'){
                  msgObj.message = '關於勞健保';
                  emitIO_and_pushDB(msgObj);
                  event.reply({
                    "type": "template",
                    "altText": "關於勞健保",
                    "template": {
                      "type": "buttons",
                      "title": "關於勞健保",
                      "text": "以下是有關勞健保的常見問題",
                      "actions": [{
                        "type": "postback",
                        "label": "我的員工很少，能不投保勞健保嗎?",
                        "data": "10-1",
                      },{
                        "type": "postback",
                        "label": "我是負責人，我要怎麼投勞保?",
                        "data": "10-2",
                      },{
                        "type": "postback",
                        "label": "我是負責人，我要怎麼投健保?",
                        "data": "10-3",
                      },{
                        "type": "postback",
                        "label": "現在加保勞健保會被追繳勞健保嗎?",
                        "data": "10-4",
                      }]
                    }
                  });
                }
                else if(type == 'other'){
                  msgObj.message = '常見問題';
                  emitIO_and_pushDB(msgObj);
                  event.reply({
                    "type": "template",
                    "altText": "常見問題",
                    "template": {
                      "type": "carousel",
                      "columns": [
                        {
                          "text": "以下是其他常見問題",
                          "actions":[
                            {
                              "type": "postback",
                              "label": "請問貴公司的提供服務的區域有哪些?",
                              "data": "8-1",
                            },
                            {
                              "type": "postback",
                              "label": "請問貴公司的服務時間?",
                              "data": "8-2",
                            },
                            {
                              "type": "postback",
                              "label": "你們怎麼幫我們進行客服代理的服務?",
                              "data": "8-3",
                            }
                          ]
                        },{
                          "text": "以下是其他常見問題",
                          "actions":[
                            {
                              "type": "postback",
                              "label": "我要怎麼向你們付費並取得正式文件?",
                              "data": "8-4",
                            },
                            {
                              "type": "postback",
                              "label": "我可以不用統一發票嗎?",
                              "data": "9-1",
                            },
                            {
                              "type": "postback",
                              "label": " ",
                              "data": " ",
                            }
                          ]
                        }
                      ]
                    }
                  });
                }
                return ;
              }
              if(action == 'ticket' ){
                ticket.email = parameter.email ;
                ticket.phone = parameter.phone ;
                ticket.goods = parameter.goods ;
                ticket.name = receiver_name ;
              }
              if(action == 'ticket.description'){
                ticket.description = parameter.any ;
                if(complete) createTicket(ticket);
              }
              //console.log(speech);
              //obj.owner = 'agent';
              //obj.name = 'api.ai';
              obj.message = speech ;
              emitIO_and_pushDB(obj) ;
              //console.log('api.ai:')
              //console.log(obj);
              bot.push(obj.id,msgObj.message);
            }
            else{console.log(action);}

          });
          request.on('error', function(error) {
              console.log(error);
          });
          request.end();

        }

        function updateProfile(text) {
          console.log(text);
          let survey = {id:'',para:'',value:''};
          if(text.indexOf('：') != -1){
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
        }

        function createTicket(obj) {
          var API_KEY = "VAxM08x35ThAOEqIgvOF";
          var FD_ENDPOINT = "fongyu";

          var PATH = "/api/v2/tickets";
          var URL =  "https://" + FD_ENDPOINT + ".freshdesk.com"+ PATH;
          //console.log('ticket:');
          //console.log(obj);
          var fields = {
            'name': obj.name,
            'email': obj.email,
            'subject': '收到_'+obj.goods+'_訂單',
            'description': obj.description,
            'phone': obj.phone,
            'status': 2,
            'priority': 1
          }
          //console.log('fields:');
          //console.log(fields);
          var Request = unirest.post(URL);

          Request.auth({
            user: API_KEY,
            pass: "X",
            sendImmediately: true
          })
          .type('json')
          .send(fields)
          .end(function(response){
            //console.log(response.body)
            console.log("Response Status : " + response.status)
            if(response.status == 201){
              console.log("Location Header : "+ response.headers['location'])
            }
            else{
              	console.log("X-Request-Id :" + response.headers['x-request-id']);
            }
            });
        }

    bot.on('postback', event =>{
      //console.log("postback event");
      let data = event.postback.data ;
      console.log(event);



      if(data == 'purchasePlan'){
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
      tinistartAns(event);

      function tinistartAns(event) {
        var gsjson = require('google-spreadsheet-to-json');

        gsjson({
            spreadsheetId: '1ZhR-f6BVHp4kIzBQL_VK9BDP4AS0KDTESYqq22RrtOA',
            // other options...
        })
        .then(function(result) {
          let ansId = event.postback.data;
          console.log(ansId);
        //  console.log(result.length);
          //console.log(result);
          for (let i in result){
            if(result[i].id == ansId){
              let ans = result[i].ans ;
              let que = result[i].question ;
              var msg = 'Q :\n'+que+'\n'+'A :\n'+ans ;
              event.reply({ type: 'text', text: msg })
              .then(function () {
                let obj ={time:nowTime};
                obj.owner = 'agent';
                obj.name = 'api.ai';
                obj.message = msg ;
                emitIO_and_pushDB(obj) ;
              });
              break;
            }
          }

        })
        .catch(function(err) {
            console.log(err.message);
            console.log(err.stack);
        });

      }

    });



  });
});

app.post('/webhook/', linebotParser);
/**
 * Socket.io
 */
//連接

//==================ticket=======================
var viewContact;
var viewAgent;
var viewTicket;

function getTicketfromFD() {

  var URL_ticket =  "https://" + FD_ENDPOINT + ".freshdesk.com/api/v2/tickets";
  var URL_agent = "https://" + FD_ENDPOINT + ".freshdesk.com/api/v2/agents"
  var URL_contact = "https://" + FD_ENDPOINT + ".freshdesk.com/api/v2/contacts"

  var viewRequest_contact = unirest.get(URL_contact);

  viewRequest_contact.auth({
    user: API_KEY,
    pass: "X",
    sendImmediately: true
  }).end(function(response){
    viewContact = response.body;
        // console.log(viewContact);
        // {
        //   active: false,
        //   address: null,
        //   company_id: null,
        //   description: null,
        //   email: 'hwt.hwang@gmail.com',
        //   id: 33001006222,
        //   job_title: null,
        //   language: 'en',
        //   mobile: null,
        //   name: 'test1',
        //   phone: null,
        //   time_zone: 'Eastern Time (US & Canada)',
        //   twitter_id: null,
        //   custom_fields: {},
        //   created_at: '2017-08-14T06:30:19Z',
        //   updated_at: '2017-08-14T06:30:19Z'
        // }
    console.log("Contact Response Status : " + response.status)
    if(response.status != 200){
      console.log("X-Request-Id :" + response.headers['x-request-id']);
    }
  });


  var viewRequest_agent = unirest.get(URL_agent);

  viewRequest_agent.auth({
    user: API_KEY,
    pass: "X",
    sendImmediately: true
  }).end(function(response){
    viewAgent = response.body;
    // console.log(viewAgent);
    // {
    //   available: false,
    //   occasional: false,
    //   id: 33001006166, // agent id
    //   signature: '<div dir="ltr">\n<p><br></p>\r\n</div>',
    //   ticket_scope: 1,
    //   created_at: '2017-08-14T06:19:37Z',
    //   updated_at: '2017-08-16T07:43:16Z',
    //   available_since: null,
    //   contact: {
    //     active: true,
    //     email: 'wtfong@fongyuinvest.com',
    //     job_title: 'Founder',
    //     language: 'en',
    //     last_login_at: null,
    //     mobile: '',
    //     name: 'Tom Fong',
    //     phone: '',
    //     time_zone: 'Eastern Time (US & Canada)',
    //     created_at: '2017-08-14T06:19:37Z',
    //     updated_at: '2017-08-16T07:43:23Z'
    //   }
    // }
    console.log("Agent Response Status : " + response.status)
    if(response.status != 200){
      console.log("X-Request-Id :" + response.headers['x-request-id']);
    }
  });


  var viewRequest_ticket = unirest.get(URL_ticket);

  viewRequest_ticket.auth({
    user: API_KEY,
    pass: "X",
    sendImmediately: true
  }).end(function(response){
    // console.log(response.body[0].subject)
    viewTicket = response.body;
    // console.log(viewTicket);
    // {
    //   cc_emails: [],
    //   fwd_emails: [],
    //   reply_cc_emails: [],
    //   fr_escalated: false,
    //   spam: false,
    //   email_config_id: null,
    //   group_id: null,
    //   priority: 1,
    //   requester_id: 33001062381, // agent id
    //   responder_id: null,
    //   source: 2,
    //   company_id: null,
    //   status: 2,
    //   subject: 'case4',
    //   to_emails: null,
    //   product_id: null,
    //   id: 7, // ticket id
    //   type: null,
    //   due_by: '2017-08-19T08:11:39Z',
    //   fr_due_by: '2017-08-17T08:11:39Z',
    //   is_escalated: false,
    //   description: '<div>Ticket description.</div>', // content in html
    //   description_text: 'Ticket description.', // content in text
    //   custom_fields: {},
    //   created_at: '2017-08-16T08:11:39Z',
    //   updated_at: '2017-08-16T08:11:39Z'
    // }
    console.log("Ticket Response Status : " + response.status)
    if(response.status != 200){
      console.log("X-Request-Id :" + response.headers['x-request-id']);
    }
  });
}
//-----------------------ticket---------------------*/


io.sockets.on('connection', (socket) => {

    // 新使用者
    socket.on('new user', (data, callback) => {
        // if(nicknames.indexOf(data) != -1){
        //console.log(data);
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
      var DATA = JSON.parse(fs.readFileSync('chatMsg.json'));
      io.sockets.emit('push json to front', chatData);
    })
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
      console.log("update chat time");
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
          // updateObj['/'+i+'/Profile/avgChat'] = {data.avgTime};
          // updateObj['/'+i+'/Profile/totalChat'] = {data.totalTime};
          // updateObj['/'+i+'/Profile/recentChat'] = {data.recentTime};
          newDBRef.child(i).child("Profile").update({
            "avgChag": data.avgTime,
            "totalChat": data.totalTime,
            "recentChat": data.recentTime
          });
          break;
        }
      }
      // if( i==DATA.length ) console.log("408 impossible!!!");
      // fs.writeFileSync('chatMsg.json', JSON.stringify(DATA, null, 2));

    });

    // 從SHIELD chat傳送訊息
    socket.on('send message', (data, callback) => {
        //console.log(data);
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
                packageId: parseInt(msg.substr(9)),
                stickerId: parseInt(msg.substr(11))
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

        var msgObj = {
          agentName: socket.nickname,
          id: agent_sendTo_receiver,
          messageTime: Date.now()
        }
        function emitIO_and_pushDB(obj) {
          console.log("sending object: ");
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

        }
        else if (msg.includes('/audio')) {
          msgObj.message = 'Send audio to user';
          emitIO_and_pushDB(msgObj);

        }
        else if (msg.includes('/video')) {
          msgObj.message = 'Send video to user';
          emitIO_and_pushDB(msgObj);

        }
        else if (msg.indexOf('.com') !== -1 || msg.indexOf('.edu') !== -1 || msg.indexOf('.net') !== -1 || msg.indexOf('.io') !== -1 || msg.indexOf('.org') !== -1) {
            let urlStr = '<a href=';
            if (msg.indexOf('https') !== -1 || msg.indexOf('http') !== -1) {
              urlStr += '"https://';
            }
            msgObj.message = urlStr + msg + '/" target="_blank">' + msg + '</a>';
            emitIO_and_pushDB(msgObj);

        }
        else if (msg.includes('/sticker')) {
          msgObj.message = 'Send sticker to user';
          emitIO_and_pushDB(msgObj);

        }
        else {
          msgObj.message = msg;
          emitIO_and_pushDB(msgObj);
        }
    });//sent message
    socket.on('send message2', (data, callback) => {
        console.log(data);
        var msg = data.msg.trim();
        agent_sendTo_receiver = data.id.trim();
        console.log(agent_sendTo_receiver);

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
        console.log(socket.nickname);
        var msgObj = {
          owner: "agent",
          name: socket.nickname,
          time: nowTime,
        };
        function emitIO_and_pushDB(obj) {

          console.log("sending object: ");
          console.log(obj);

          console.log("sending to new firebase database");
          sendToNewFb(obj);
          console.log("sending to local DB");
          sendToLocalDB(obj);
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

        }
        else if (msg.includes('/audio')) {
          msgObj.message = 'Send audio to user';
          emitIO_and_pushDB(msgObj);

        }
        else if (msg.includes('/video')) {
          msgObj.message = 'Send video to user';
          emitIO_and_pushDB(msgObj);

        }
        else if (msg.indexOf('.com') !== -1 || msg.indexOf('.edu') !== -1 || msg.indexOf('.net') !== -1 || msg.indexOf('.io') !== -1 || msg.indexOf('.org') !== -1) {
            let urlStr = '<a href=';
            if (msg.indexOf('https') !== -1 || msg.indexOf('http') !== -1) {
              urlStr += '"https://';
            }
            msgObj.message = urlStr + msg + '/" target="_blank">' + msg + '</a>';
            emitIO_and_pushDB(msgObj);

        }
        else if (msg.includes('/sticker')) {
          msgObj.message = 'Send sticker to user';
          emitIO_and_pushDB(msgObj);

        }
        else {
          msgObj.message = msg;
          emitIO_and_pushDB(msgObj);
        }
    });//sent message

    socket.on('disconnect', (data) => {
        if (!socket.nickname) return;
        delete users[socket.nickname];
        // nicknames.splice(nicknames.indexOf(socket.nickname), 1);
    });

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
          newDBRef.child(i).child("Profile").update({
          //  "address": data.address,      //can edit to what u want to update
          //  "age": data.age,
            "nickname": data.nickname,
            "telephone": data.telephone,
            "性別": data.性別,
            "地區": data.地區,
            "年齡": data.年齡
          });
          break;
        }
      }
    });

  //test
    socket.on('send template',(data, callback )=> {
      console.log(data) ;
      bot.push(data.id,{
          "type": "template",
          "altText": "this is button",
          "template": {
            "type": "buttons",
            "title": data.title,
            "text": data.title,
            "actions": [{
              "type": "message",
              "label": data.text1,
              "text": data.text1
            },{
              "type": "message",
              "label": data.text2,
              "text": data.text2
            },{
              "type": "message",
              "label": data.text3,
              "text": data.text3
            }]
          }
        });
    });
    //*/
  //test ticket

    getTicketfromFD();
    socket.emit('clear ticket table',{}) ;
    setTimeout(function () {socket.emit('all tickets info', viewTicket);},1000);

    socket.emit('all agents info', viewAgent);
    socket.emit('all contacts info', viewContact);

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

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}
