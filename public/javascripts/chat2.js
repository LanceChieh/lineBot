$(document).ready(function() {
    var socket = io.connect();

    var messageForm = $('#send-message');
    var messageInput = $('#message');
    var clients = $('#clients');
    var room_space = $('#chat-rooms');
    var newUsers = $('#newUsers');
    var printAgent = $('#printAgent');
    var canvas = $('#chat-rooms');

    var name_list = [];

    $(document).on('click', '#signout-btn', logout); //登出

    if (window.location.pathname === '/chat') {
        setTimeout(agentName, 100);
        setTimeout(loadMsg, 1000);
    } // set agent name

    socket.on('new message', (data) => {
        displayMessage(data);
        displayClient(data);
    });


    function loadMsg() {
        name_list = [];

        database.ref('chats/users').on('value', snap => {
            let dataArray = [];
            let userArray = [];
            let testVal = snap.val();
            let myIds = Object.keys(testVal);

            for (let i = 0; i < myIds.length; i++) {
                dataArray.push(snap.child(myIds[i]).val());
                userArray.push(dataArray[i].user);
            } // for loop

            userArray = userArray.filter((elem, index, self) => {
              return index == self.indexOf(elem);
            })

            name_list = userArray;
            console.log(name_list);

            for (let i = 0; i < userArray.length; i++) {
              canvas.append(
                '<div class="tabcontent '+ userArray[i] +'" id="user">' +
                  '<h5>'+ userArray[i] +'</h5>' +
                  '<div id="user_inn"></div>' +
                '</div>');

                // let arr = dataArray.filter(item => {
                //     return item.user === userArray[i];
                // });
                //
                // console.log(arr.length);
            }


        }); //database
    } //function

    function agentName() {
        var person = prompt("Please enter your name");
        if (person != null) {
            printAgent.append("Welcome <b>" + person + "</b>! You're now on board.");
        } //'name already taken'功能未做
    }

    function displayClient(data) {
        clients.empty();
        var i = data.name;
        var namefound = (name_list.indexOf(i) !== -1);

        if (namefound) {
          console.log('user exists');
          clients.append("<li><button id=\"" + data.name + "\" class=\"tablinks\"> " + data.name + "</button></li>");
        } else {
          name_list.push(i);
          clients.append("<li><button id=\"" + data.name + "\" class=\"tablinks\"> " + data.name + "</button></li>");
          console.log(name_list);
        }
    }

    function displayMessage(data) {
        canvas.empty();
        let i = data.name;
        let match_user = canvas.find('div#user_inn');
        let chat_number = 1;

        if (name_list.indexOf(i) === -1) {
          canvas.append(
            '<div class="tabcontent '+ data.name +'" id="new_user">' +
              '<h5>'+ data.name +'</h5>' +
              '<div id="new_user'+ chat_number +'_inn"></div>' +
            '</div>');
          let new_user = $('#new_user').find('div');
          new_user.prepend(
            '<tr>' +
              '<td>' + i + ': ' + data.msg + '</td>' +
            '</tr>'
          );
          new_user.show()
          name_list.push(data.name);
          chat_number++;

        } else {
          $.each(canvas, (index, value) => {
            console.log(index, value);
          })
          // let old_user = $('#user').attr('class');
          // old_user.prepend(
          //   '<tr>' +
          //     '<td>' + i + ': ' + data.msg + '</td>' +
          //   '</tr>'
          // );
          // old_user.show();
        }
    }


}); //document ready close tag
