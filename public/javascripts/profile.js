$(document).ready(function() {
  // $('#side-menu').hide();

  $('#prof-name').text('');
  $('#prof-dob').text('');
  $('#prof-email').text('');
  $('#prof-gender').text('');
  $('#prof-phone').text('');
  setTimeout(loadProf, 1000);

  $(document).on('click', '#prof-edit', profEdit); //打開modal
  $(document).on('click', '#prof-submit', profSubmit); //完成編輯
  $('#profModal').on('hidden.bs.modal', profClear); //viewModal 收起來
  $(document).on('click', '#signout-btn', logout); //登出
});

function loadProf() {
  let userId = auth.currentUser.uid;

  database.ref('users/' + userId).on('value', snap => {
    let profInfo = snap.val();
    if(profInfo === null) {
      $('#error-message').show();
    } else {
      let profInfo = []
      let profData = snap.val();
      let profId = Object.keys(profData);
      profInfo.push(snap.child(profId[0]).val());
      // console.log(profInfo);
      $('#prof-id').text(profId);
      $('#prof-name').text(profInfo[0].username);
      $('#prof-dob').text(profInfo[0].dob);
      $('#prof-email').text(profInfo[0].email);
      $('#prof-gender').text(profInfo[0].gender);
      $('#prof-phone').text(profInfo[0].phone);
    }

  });

  // $('#prof-email').append(email);
}

function profEdit() {
  let id = $('#prof-id').text();
  let name = $('#prof-name').text();
  let dob = $('#prof-dob').text();
  let email = $('#prof-email').text();
  let gender = $('#prof-gender').text();
  let phone = $('#prof-phone').text();

  // console.log(id, name, dob, email, gender,phone);

  $('#prof-edit-id').val(id);
  $('#prof-edit-name').val(name);
  $('#prof-edit-dob').val(dob);
  $('#prof-edit-email').val(email);
  $('#prof-edit-gender').val(gender);
  $('#prof-edit-phone').val(phone);


}

function profSubmit() {
  let userId = auth.currentUser.uid;
  let id = $('#prof-edit-id').val();
  let name = $('#prof-edit-name').val();
  let dob = $('#prof-edit-dob').val();
  let email = $('#prof-edit-email').val();
  let gender = $('#prof-edit-gender').val();
  let phone = $('#prof-edit-phone').val();

  // console.log(id, name, dob, email, gender,phone);

  // console.log(id);

  if(id === ''){
    database.ref('users/' + userId).push({
      username: name,
      dob: dob,
      email: email,
      gender: gender,
      phone: phone
    });
  } else {
    database.ref('users/' + userId + '/' + id).set({
      username: name,
      dob: dob,
      email: email,
      gender: gender,
      phone: phone
    });
  }

  $('#error-message').hide();
  profClear();
  loadProf();
  $('#profModal').modal('hide');
}

function profClear() {
  $('#prof-edit-id').val('');
  $('#prof-edit-name').val('');
  $('#prof-edit-dob').val('');
  $('#prof-edit-email').val('');
  $('#prof-edit-gender').val('Male');
  $('#prof-edit-phone').val('');
}
