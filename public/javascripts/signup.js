$(document).ready(function() {
  $(document).on('click', '#register-btn', register); //註冊
});

function register(){
  let fname = document.getElementById('first-name').value;
  let lname = document.getElementById('last-name').value;
  let email = document.getElementById('register-email').value;
  let password = document.getElementById('register-password').value;
  let full_name = fname + ' ' + lname;
  console.log(full_name, email, password);
  if(fname === ''){
    showError('Please type in your first name');
  } else if(lname === ''){
    showError('Please type in your last name');
  } else {
    auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      database.ref('users/' + auth.currentUser.uid).push({
        name: full_name,
        email: auth.currentUser.email
      });
    })
    .catch(error => {
      // console.log(error);
      showError(error.message);
    });
  }
};

function showError(msg) {
  $('#reg-error').hide();
  $('#reg-error').text('');
  $('#reg-error').append(msg);
  $('#reg-error').show();
}
