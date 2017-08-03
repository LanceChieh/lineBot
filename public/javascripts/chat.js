$(document).ready(function() {
    var socket = io.connect();
    var users = $('#users');
    var nicknameForm = $('#setNick');
    var nicknameError = $('#nickError');
    var nicknameInput = $('#nickname');
    var messageForm = $('#send-message');
    var messageInput = $('#message');
    var messageContent = $('#chat');
    var clients = $('#clients');
    var name_list = ['test'];
    var newUsers = $('#newUsers');
    var printAgent = $('#printAgent');
    var canvas = $("#canvas");
    var canvas1 = $("#canvas1");
    var canvas2 = $("#canvas2");
    var canvas3 = $("#canvas3");
    var canvas4 = $("#canvas4");
    var user1 = $("#user1_inn");
    var user2 = $("#user2_inn");
    var user3 = $("#user3_inn");
    var user4 = $("#user4_inn");
    var user5 = $("#user5_inn");
    var user6 = $("#user6_inn");
    var user7 = $("#user7_inn");
    var user_list = [];
    $(document).on('click', '#signout-btn', logout); //登出

    if (window.location.pathname === '/chat') {
        setTimeout(agentName, 100);
        setTimeout(loadMsg, 100);

    } // set agent name

    /*  =========================================================  */
    function loadMsg(usernumber) {
        $('#clients').empty();
        $('#canvas').empty();
        database.ref('chats/users').on('value', snap => {
            let dataArray = [];
            let testVal = snap.val();
            let myIds = Object.keys(testVal);
            // console.log(testVal);
            function aaa(){
                let arr6 = dataArray.filter(user6 => {
                    return user6.user == 'U976afdecc6ba7f25bc04c9c520e5490e';
                });
                var a =arr6[arr6.length-2].message;
                canvas1.append("<p>" + a + "<br/></p>")
                  console.log(a);
            }

            for (var i = 0; i < myIds.length; i++) {

                dataArray.push(snap.child(myIds[i]).val());
                // var namefound = (user_list.indexOf(dataArray[i].user) > -1); //if client exists
                //
                // if (namefound) {
                //
                //     if (dataArray[i].user == 'U8322eb28b5b3c1f5b2d101620daa71ed') {
                //         console.log('user1 found');
                //         user1.append(
                //             '<tr>' +
                //             '<td>' + dataArray[i].message + '</td>' +
                //             '<td>' + dataArray[i].messageTime + '</td>' +
                //             '</tr>'
                //         );
                //     } else if (dataArray[i].user == 'U376b6ec748e32f594cf2f6248800d094') {
                //
                //         user2.append(
                //             '<tr>' +
                //             '<td>' + dataArray[i].message + '</td>' +
                //             '<td>' + dataArray[i].messageTime + '</td>' +
                //             '</tr>'
                //         );
                //     } else if (dataArray[i].user == 'Udeadbeefdeadbeefdeadbeefdeadbeef') {
                //         user3.append(
                //             '<tr>' +
                //             '<td>' + dataArray[i].message + '</td>' +
                //             '<td>' + dataArray[i].messageTime + '</td>' +
                //             '</tr>'
                //         );
                //     } else if (dataArray[i].user == 'U3919284a3de4cd0c0b570090c3dc9943') {
                //         user4.append(
                //             '<tr>' +
                //             '<td>' + dataArray[i].message + '</td>' +
                //             '<td>' + dataArray[i].messageTime + '</td>' +
                //             '</tr>'
                //         );
                //     } else if (dataArray[i].user == 'U39dc316178dbca5a9e85f4a10aa4210e') {
                //
                //         user5.append(
                //             '<tr>' +
                //             '<td>' + dataArray[i].message + '</td>' +
                //             '<td>' + dataArray[i].messageTime + '</td>' +
                //             '</tr>'
                //         );
                //     }
                //
                // } //namefound
                // else {
                //     $('#clients').append(
                //         '<tr>' +
                //         '<td><button id="' + dataArray[i].user + '" class="tablinks"><b>' + dataArray[i].user + '</b></button></td>' + '</tr>'
                //     );
                //
                //
                //     user_list.push(dataArray[i].user);
                //
                //
                // } //else

            } // for loop

            // user1
            // let arr1 = dataArray.filter(user1 => {
            //     return user1.user == 'U52b2014e2905721d4072e65407653235';
            // });
            // // console.log(arr1.length);
            // for (let j = 0; j < arr1.length; j++) {
            //     user1.prepend(
            //         '<tr>' +
            //         '<td>U52b2014e2905721d4072e65407653235: ' + arr1[j].message + '</td>' +
            //         // '<td>' + arr1[j].messageTime + '</td>' +
            //         '</tr>'
            //     );
            //
            // }
            //
            // // user2
            // let arr2 = dataArray.filter(user2 => {
            //     return user2.user == 'U376b6ec748e32f594cf2f6248800d094';
            // });
            // // console.log(arr1.length);
            // for (let j = 0; j < arr2.length; j++) {
            //     user2.prepend(
            //         '<tr>' +
            //         '<td>U376b6ec748e32f594cf2f6248800d094: ' + arr2[j].message + '</td>' +
            //         // '<td>' + arr1[j].messageTime + '</td>' +
            //         '</tr>'
            //     );
            //
            // }
            //
            // // user3
            // let arr3 = dataArray.filter(user3 => {
            //     return user3.user == 'Udeadbeefdeadbeefdeadbeefdeadbeef';
            // });
            // // console.log(arr1.length);
            // for (let j = 0; j < arr3.length; j++) {
            //     user3.prepend(
            //         '<tr>' +
            //         '<td>Udeadbeefdeadbeefdeadbeefdeadbeef: ' + arr3[j].message + '</td>' +
            //         // '<td>' + arr1[j].messageTime + '</td>' +
            //         '</tr>'
            //     );
            //
            // }
            //
            // // user4
            // let arr4 = dataArray.filter(user4 => {
            //     return user4.user == 'U3919284a3de4cd0c0b570090c3dc9943';
            // });
            // // console.log(arr1.length);
            // for (let j = 0; j < arr4.length; j++) {
            //     user4.prepend(
            //         '<tr>' +
            //         '<td>U3919284a3de4cd0c0b570090c3dc9943: ' + arr4[j].message + '</td>' +
            //         // '<td>' + arr1[j].messageTime + '</td>' +
            //         '</tr>'
            //     );
            //
            // }

            // user5
            let arr5 = dataArray.filter(user5 => {
                return user5.user == 'U4e3b69ddf12deb947762211284478e1d';
            });
            // console.log(arr1.length);
            for (let j = 0; j < arr5.length; j++) {
                canvas3.append(
                    "<p>" + arr5[j].message + "<br/></p>"
                );

            }
/*
            let arr6 = dataArray.filter(user6 => {
                return user6.user == 'U976afdecc6ba7f25bc04c9c520e5490e';
            });
            // console.log(arr1.length);

            for (let j = 0; j < arr6.length; j++) {
                canvas1.append(
                "<p>" + arr6[j].message + "<br/></p>"
               )
            }
*/

            let arr7 = dataArray.filter(user7 => {
                return user7.user == 'U3919284a3de4cd0c0b570090c3dc9943';
            });
            // console.log(arr1.length);
            for (let j = 0; j < arr7.length; j++) {
                canvas2.append(
                    "<p>" + arr7[j].message + "<br/></p>"
                );
            }

        }); //database

    } //function

    $(document).on('click', "#U8322eb28b5b3c1f5b2d101620daa71ed", function() {
        user1.show();
        user2.hide();
        user3.hide();
        user4.hide();
        user5.hide();
        canvas1.hide();
        canvas2.hide();
        canvas3.hide()
    });
    $(document).on('click', "#U376b6ec748e32f594cf2f6248800d094", function() {
        user2.show();
        user1.hide();
        user3.hide();
        user4.hide();
        user5.hide();
        canvas1.hide();
        canvas2.hide();
        canvas3.hide()
    });
    $(document).on('click', "#Udeadbeefdeadbeefdeadbeefdeadbeef", function() {
        user3.show();
        user2.hide();
        user1.hide();
        user4.hide();
        user5.hide();
        canvas1.hide();
        canvas2.hide();
        canvas3.hide()
    });
    $(document).on('click', "#U3919284a3de4cd0c0b570090c3dc9943", function() {
        user4.show();
        user2.hide();
        user3.hide();
        user1.hide();
        user5.hide();
        canvas1.hide();
        canvas2.hide();
        canvas3.hide()
    });
    $(document).on('click', "#U39dc316178dbca5a9e85f4a10aa4210e", function() {
        user5.show();
        user2.hide();
        user3.hide();
        user4.hide();
        user1.hide();
        canvas1.hide();
        canvas2.hide();
        canvas3.hide()
    });
    /*  ==================================================  */

    function agentName() {
        var person = prompt("Please enter your name");
        if (person != null) {
          socket.emit('new user', person, (data) => {
            if(data){
            } else {
              nicknameError.html('username is already taken');
            }
          });
            printAgent.append("Welcome <b>" + person + "</b>! You're now on board.");
        } //'name already taken'功能未做、push agent name 未做
    }


    messageForm.submit((e) => {
        e.preventDefault();
        socket.emit('send message', messageInput.val(), (data) => {
            messageContent.append('<span class="error">' + data + "</span><br/>");
        });
        messageInput.val('');
    });

    socket.on('new message', (data) => {
        displayMessage(data);
        displayClient(data);
    });

    function displayMessage(data) {
        var i = data.name;
        var namefound = (name_list.indexOf(i) > -1); //if client exists

        if(i.indexOf('Agent') !== -1 && data.id !== undefined){
          if(data.id === 'U3919284a3de4cd0c0b570090c3dc9943') { //me
            canvas2.append("<p>" + data.msg + "<br/></p>");
          } else if(data.id === 'U976afdecc6ba7f25bc04c9c520e5490e') { //wwy
            canvas3.append("<p>" + data.msg + "<br/></p>");
          } else if(data.id === 'U4e3b69ddf12deb947762211284478e1d') { //xfj
            canvas1.append("<p>" + data.msg + "<br/></p>");
          } else {
            canvas4.append("<p>" + data.msg + "<br/></p>");
          }
        } else {


          if (namefound) {
              //append new msg in existed window

              console.log('namefound');

              if (i == 'U976afdecc6ba7f25bc04c9c520e5490e') { //xfj
                  console.log('found1');

                  canvas1.append("<p>" + data.msg + "<br/></p>");


              } else if (i == 'U3919284a3de4cd0c0b570090c3dc9943') { //me

                  console.log('found2');
                  console.log(data.msg);
                  canvas2.append("<p>" + data.msg + "<br/></p>");


              } else if (i == 'U4e3b69ddf12deb947762211284478e1d') { //wwy

                  console.log('found3');
                  canvas3.append("<p>" + data.msg + "<br/></p>");


              } else {
                canvas4.append("<p>" + data.msg + "<br/></p>");
              }

          } //close if
          else {

              console.log('new msg received');

              if (i == 'U976afdecc6ba7f25bc04c9c520e5490e') {
                  console.log('append msg to canvas1');
                  canvas1.append(
                      "<span onclick=\"this.parentElement.style.display=\'none\'\" class=\"topright\">x</span>" +
                      "<div id=\"" + data.name + "\">" +
                      "<h7>" +
                      "<strong>" + data.name + ":</strong></h7><br/><p>" + data.msg + "<br/></p></div>"


                  );
              } else if (i == 'U4e3b69ddf12deb947762211284478e1d') {
                  canvas3.append(
                      "<span onclick=\"this.parentElement.style.display=\'none\'\" class=\"topright\">x</span>" +
                      "<div id=\"" + data.name + "\">" +
                      "<p>" +
                      "<strong>" + data.name + ": </strong><br/>" + data.msg + "<br/></p></div>"
                  );


              } else if (i == 'U3919284a3de4cd0c0b570090c3dc9943') {
                  console.log('append msg to canvas2');

                  canvas2.append(
                      "<span onclick=\"this.parentElement.style.display=\'none\'\" class=\"topright\">x</span>" +
                      "<div id=\"" + data.name + "\">" +
                      "<p>" +
                      "<strong>" + data.name + ": </strong><br/>" + data.msg + "<br/></p></div>"
                  );

              } else {
                  canvas4.append(
                    "<span onclick=\"this.parentElement.style.display=\'none\'\" class=\"topright\">x</span>" +
                    "<div id=\"" + data.name + "\">" +
                    "<p>" +
                    "<strong>" + data.name + ": </strong><br/>" + data.msg + "<br/></p></div>");

              }
          } //else
        }



    } //function

    function displayClient(data) {
        var i = data.name;
        var namefound = (name_list.indexOf(i) > -1);

        if(i.indexOf('Agent') !== -1 && data.id !== undefined){
          // if(data.id === 'Ue369116591fbd2d13a7eb5f0ff12547b') {
          //   canvas2.append("<p>" + data.msg + "<br/></p>");
          // }
        } else {
          if (namefound) {
              console.log('user existed');
          } else if (i == 'notice') {
              console.log('notice sent');
          } else {
              clients.append("<b><button id=\"" + data.name + "\" class=\"tablinks\"> " + data.name + "</button></b>");
              name_list.push(data.name);
              console.log(name_list);
          }

          $(document).on('click', "#U976afdecc6ba7f25bc04c9c520e5490e", function() {
              canvas1.show();
              canvas2.hide();
              canvas3.hide();
              user1.hide();
              user2.hide();
              user3.hide();
              user4.hide();
              user5.hide()
          });
          $(document).on('click', "#U3919284a3de4cd0c0b570090c3dc9943", function() {
              canvas2.show();
              canvas1.hide();
              canvas3.hide();
              user1.hide();
              user2.hide();
              user3.hide();
              user4.hide();
              user5.hide()
          });
          $(document).on('click', "#U4e3b69ddf12deb947762211284478e1d", function() {
              canvas3.show();
              canvas1.hide();
              canvas2.hide();
              user3.hide();
              user2.hide();
              user1.hide();
              user4.hide();
              user5.hide()
          });
          // $(document).on('click', "#U4e3b69ddf12deb947762211284478e1d", function() {
          //     canvas3.show();
          //     canvas1.hide();
          //     canvas2.hide();
          //     user3.hide();
          //     user2.hide();
          //     user1.hide();
          //     canvas4.hide();
          //     user5.hide()
          // });

      }

        }


}); //document ready close tag
