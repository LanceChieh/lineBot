var   key;
var   sublist  = [];

$(document).ready(function() {

  if(window.location.pathname === '/ticket'){
    document.getElementById("defaultOpen").click();
    setTimeout(loadTable, 1000);
  }

  //modal actions
  $(document).on('click', '#modal-submit', modalSubmit); //新增
  $('#viewModal').on('hidden.bs.modal', reset); //viewModal 收起來
  $(document).on('click', '#editBtn', openEdit); //打開編輯modal
  $(document).on('click', '#edit-submit', modalEdit); //完成編輯
  $(document).on('click', '#add-sub', addSub); //新增子任務
  $(document).on('click', '#delete-sub', deleteSub); //新增子任務
  $('#editModal').on('hidden.bs.modal', reset); //editModal 收起來
  $(document).on('click', '#form-submit', formSubmit); //form actions
  $(document).on('click', '#signout-btn', logout); //登出
  $(document).on('click', '#viewBtn', loadView); //view form畫面
  $(document).on('click', '#deleBtn', deleteRow); //刪除
  $(document).on('click', '#tform-submit', formSubmit); //一般新增
  $(document).on('click', '#tform-goback', goback); //回上一頁

  //=========[SEARCH by TEXT]=========
  $("#exampleInputAmount").keyup(function() {
    var open_rows = $('#open-ticket-list tr');
    var close_rows = $('#closed-ticket-list tr');
    var val = $.trim($(this).val()).replace(/ +/g, ' ').toLowerCase();

    open_rows.show().filter(function() {
      var text1 = $(this).text().replace(/\s+/g, ' ').toLowerCase();
      return !~text1.indexOf(val);
    }).hide();

    close_rows.show().filter(function() {
      var text2 = $(this).text().replace(/\s+/g, ' ').toLowerCase();
      return !~text2.indexOf(val);
    }).hide();
  });

});

//functions
function loadTable(){
  $('#open-ticket-list').empty();
  $('#closed-ticket-list').empty();
  // console.log('Table loaded');

  let userId = auth.currentUser.uid;
  database.ref('tickets/' + userId).on('value', snap => {
    let dataArray = [];
    let testVal = snap.val();
    let myIds = Object.keys(testVal);
    // console.log(myIds.length);

    for(var i=0;i < myIds.length;i++){
      dataArray.push(snap.child(myIds[i]).val());

      if(dataArray[i].status === 'Closed') {
        $('#closed-ticket-list').append(
          '<tr>' +
            '<td id="' + myIds[i] + '" hidden>' + myIds[i] + '</td>' +
            '<td>' + dataArray[i].taskName + '</td>' +
            '<td class="category">' + dataArray[i].category + '</td>' +
            '<td>' + dataArray[i].status + '</td>' +
            '<td>' + dataArray[i].priority + '</td>' +
            '<td class="owner">' + dataArray[i].owner + '</td>' +
            '<td>' +
              '<button type="button" id="editBtn" data-toggle="modal" data-target="#editModal">Edit</button>' +
              ' ' +
              '<button type="button" id="viewBtn" data-toggle="modal" data-target="#viewModal">View</button>' +
              ' ' +
              '<button type="button" id="deleBtn">Delete</button>' +
            '</td>' +
          '</tr>'
        );
      } else {
        $('#open-ticket-list').append(
          '<tr>' +
            '<td id="' + myIds[i] + '" hidden>' + myIds[i] + '</td>' +
            '<td>' + dataArray[i].taskName + '</td>' +
            '<td class="category">' + dataArray[i].category + '</td>' +
            '<td>' + dataArray[i].status + '</td>' +
            '<td>' + dataArray[i].priority + '</td>' +
            '<td class="owner">' + dataArray[i].owner + '</td>' +
            '<td>' +
              '<button type="button" id="editBtn" data-toggle="modal" data-target="#editModal">Edit</button>' +
              ' ' +
              '<button type="button" id="viewBtn" data-toggle="modal" data-target="#viewModal">View</button>' +
              ' ' +
              '<button type="button" id="deleBtn">Delete</button>' +
            '</td>' +
          '</tr>'
        );
      }


    }

  });

}

function formSubmit() {
  let d = Date.now()
  let date = new Date(d);
  let name = $('#task-name').val();
  let cate = $('#category').val();
  let stat = $('#status').val();
  let prio = $('#priority').val();
  let desc = $('#description').val();

  writeUserData(auth.currentUser.uid, name, cate, stat, prio, desc, auth.currentUser.email, date.toString());

  // 寫入資料庫 回到列表把資料印出來
  $('#quickAdd').modal('hide');
  $('#task-name').val('');
  $('#category').val('');
  $('#priority').val('Normal');
  $('#modal-description').val('');
  alert('Saved!')

  window.location.href = "/ticket";
}

function modalSubmit() {
  let d = Date.now()
  let date = new Date(d);
  let name = $('#modal-task-name').val();
  let cate = $('#modal-category').val();
  let prio = $('#modal-priority').val();
  let desc = $('#modal-description').val();

  // console.log(auth.currentUser.uid, name, cate, 'Pending', prio, desc, auth.currentUser.email, date.toString());

  writeUserData(auth.currentUser.uid, name, cate, 'Pending', prio, desc, auth.currentUser.email, date.toString());

  //塞入資料庫並重整
  $('#quickAdd').modal('hide');
  $('#modal-task-name').val('');
  $('#modal-category').val('');
  $('#modal-priority').val('Normal');
  $('#modal-description').val('');

  loadTable();
}

function openEdit() {
  $('#edit-id').text(''); //
  $('#edit-task-name').val(''); //任務內容
  $('#edit-category').val(''); //分類
  $('#edit-status').val(''); //狀態
  $('#edit-priority').val(''); //緊急程度
  $('#edit-owner').val(''); //負責人
  $('#edit-description').val(''); //說明
  $('#edit-inir').text(''); //建立人
  $('#edit-inid').text(''); //建立日期
  $('#edit-subt').empty(''); //

  let key = $(this).parent().parent().find('td:first').text();
  let userId = auth.currentUser.uid;

  database.ref('tickets/' + userId + '/' + key).on('value', snap => {
    let testVal = snap.val();
    // console.log(testVal);

    $('#edit-id').append(key);
    $('#edit-task-name').val(testVal.taskName); //任務內容
    $('#edit-category').val(testVal.category); //分類
    $('#edit-status').val(testVal.status); //狀態
    $('#edit-priority').val(testVal.priority); //緊急程度
    $('#edit-owner').val(testVal.owner); //負責人
    $('#edit-description').val(testVal.description); //說明
    $('#edit-inir').append(testVal.initiator); //建立人
    $('#edit-inid').append(testVal.initDate); //建立日期
    if(testVal.subTask !== undefined){
      for(var i=0;i<testVal.subTask.length;i++){
        $('#edit-subt').append(
          '<li>' +
            '<span id="subname">' + testVal.subTask[i] + '</span>' +
            '<span class="fa fa-trash trash" id="delete-sub"></span>' +
          '</li>'
        );
        sublist.push(testVal.subTask[i]);
        // console.log(testVal.subTask[i]);
      }
    }

    // console.log(sublist);

  });
}

function modalEdit() {
  let key = $('#edit-id').text();
  let userId = auth.currentUser.uid;
  var name = $('#edit-task-name').val(); //任務內容
  var cate = $('#edit-category').val(); //分類
  var stat = $('#edit-status').val(); //狀態
  var prio = $('#edit-priority').val(); //緊急程度
  var owne = $('#edit-owner').val(); //負責人
  var desc = $('#edit-description').val(); //說明
  var inir = $('#edit-inir').text(); //建立人
  var inid = $('#edit-inid').text(); //建立日期
  //日期
  let d = Date.now();
  let date = new Date(d);

  // console.log(key, userId, name, cate, stat, prio, owne, desc, subt, inir, inid, auth.currentUser.email, date);

  saveUserData(key, userId, name, cate, stat, prio, owne, desc, sublist, inir, inid, auth.currentUser.email, date.toString());

  $('#edit-id').text(''); //
  $('#edit-task-name').val(''); //任務內容
  $('#edit-category').val(''); //分類
  $('#edit-status').val(''); //狀態
  $('#edit-priority').val(''); //緊急程度
  $('#edit-owner').val(''); //負責人
  $('#edit-description').val(''); //說明
  $('#edit-inir').text(''); //建立人
  $('#edit-inid').text(''); //建立日期
  $('#edit-subt').empty(); //

  loadTable();
  $('#editModal').modal('hide');
  sublist = [];
}

function openCity(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

function writeUserData(userId, name, cate, stat, prio, desc, inir, inid) {
  database.ref('tickets/' + userId).push({
    taskName: name,
    category: cate,
    status: stat,
    priority: prio,
    owner: auth.currentUser.email,
    description: desc,
    subTask: [],
    initiator: inir,
    initDate: inid,
    modifier: '',
    modiDate: ''
  });
}

function saveUserData(key, userId, name, cate, stat, prio, owne, desc, subt, inir, inid, modr, modd) {
  database.ref('tickets/' + userId + '/' + key).set({
    taskName: name,
    category: cate,
    status: stat,
    priority: prio,
    owner: owne,
    description: desc,
    subTask: subt,
    initiator: inir,
    initDate: inid,
    modifier: modr,
    modiDate: modd
  });
}

function logout(){
  auth.signOut()
  .then(response => {
    window.location.assign("/login");
  })
}

function goback() {
  let name = $('#task-name').val('');
  let cate = $('#category').val('');
  let stat = $('#status').val('Pending');
  let prio = $('#priority').val('Normal');
  let desc = $('#description').val('');

  window.location = '/ticket';
}

function loadView() {

  $('#view-id').text(''); //編號
  $('#view-name').text(''); //任務內容
  $('#view-cate').text(''); //分類
  $('#view-stat').text(''); //狀態
  $('#view-prio').text(''); //緊急程度
  $('#view-owne').text(''); //負責人
  $('#view-desc').text(''); //說明
  $('#view-inir').text(''); //建立人
  $('#view-inid').text(''); //建立日期
  $('#view-modr').text(''); //修改人
  $('#view-modd').text(''); //修改日期
  $('#view-subt').empty(); //

  let key = $(this).parent().parent().find('td:first').text();
  let userId = auth.currentUser.uid;

  database.ref('tickets/' + userId + '/' + key).on('value', snap => {
    let testVal = snap.val();
    // console.log(testVal);
    // 重複出現值 要抓出來
    $('#view-id').append(key); //編號
    $('#view-name').append(testVal.taskName); //任務內容
    $('#view-cate').append(testVal.category); //分類
    $('#view-stat').append(testVal.status); //狀態
    $('#view-prio').append(testVal.priority); //緊急程度
    $('#view-owne').append(testVal.owner); //負責人
    $('#view-desc').append(testVal.description); //說明
    $('#view-inir').append(testVal.initiator); //建立人
    $('#view-inid').append(testVal.initDate); //建立日期
    $('#view-modr').append(testVal.modifier); //修改人
    $('#view-modd').append(testVal.modiDate); //修改日期
    if(testVal.subTask !== undefined){
      for(var i=0;i<testVal.subTask.length;i++){
        $('#view-subt').append($('<li>').append(testVal.subTask[i]));//子任務
      }
    }
    // $('#view-subt').append(testVal.subTask); //子任務

  });

}

function reset() {
  $('#view-id').text(''); //編號
  $('#view-name').text(''); //任務內容
  $('#view-cate').text(''); //分類
  $('#view-stat').text(''); //狀態
  $('#view-prio').text(''); //緊急程度
  $('#view-owne').text(''); //負責人
  $('#view-desc').text(''); //說明
  $('#view-inir').text(''); //建立人
  $('#view-inid').text(''); //建立日期
  $('#view-modr').text(''); //修改人
  $('#view-modd').text(''); //修改日期
  $('#view-subt').empty(); //

  $('#edit-id').text(''); //編號
  $('#edit-task-name').val(''); //任務內容
  $('#edit-category').val(''); //分類
  $('#edit-status').val(''); //狀態
  $('#edit-priority').val(''); //緊急程度
  $('#edit-owner').val(''); //負責人
  $('#edit-description').val(''); //說明
  $('#edit-inir').text(''); //建立人
  $('#edit-inid').text(''); //建立日期
  $('#edit-subt').empty(''); //子任務

  sublist = [];
}

function deleteRow() {
  let key = $(this).parent().parent().find('td:first').text();
  let userId = auth.currentUser.uid;
  // console.log(userId, key);

  database.ref('tickets/' + userId + '/' + key).remove();

  loadTable();
}

function addSub() {
  // 宣告變數取得input的值
  var subVal = $('#sub-input').val();
  // console.log(subVal);
  // 把得到的值放進list
  $('#edit-subt').append(
    '<li>' +
      '<span id="subname">' + subVal + '</span>' +
      '<span class="fa fa-trash trash" id="delete-sub"></span>' +
    '</li>'
  );
  sublist.push(subVal);
  // console.log(sublist);
  // input重設
  $('#sub-input').val('');

}

function deleteSub() {
  $(this).parent().remove();
}

//=========[SORT OPEN]=========
function sortOpenTable(n) {
  var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
  table = document.getElementById("open-Table");
  switching = true;
  //Set the sorting direction to ascending:
  dir = "asc";
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      console.log(x, y);
      /*check if the two rows should switch place,
      based on the direction, asc or desc:*/
      if (dir == "asc") {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      } else if (dir == "desc") {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      //Each time a switch is done, increase this count by 1:
      switchcount ++;
    } else {
      /*If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again.*/
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}

//=========[SORT CLOSE]=========
function sortCloseTable(n) {
  var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
  table = document.getElementById("close-Table");
  switching = true;
  //Set the sorting direction to ascending:
  dir = "asc";
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      console.log(x, y);
      /*check if the two rows should switch place,
      based on the direction, asc or desc:*/
      if (dir == "asc") {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      } else if (dir == "desc") {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      //Each time a switch is done, increase this count by 1:
      switchcount ++;
    } else {
      /*If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again.*/
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}
