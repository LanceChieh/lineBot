var google_provider = new firebase.auth.GoogleAuthProvider();
var facebook_provider = new firebase.auth.FacebookAuthProvider();
// var line_code;

$(document).ready(function() {
  line_code = window.location.href;
  console.log(line_code);
  if(line_code !== 'https://localhost:3000/login'){
    let new_code = line_code.substr(52, 20);
    console.log(new_code);

    fetch('https://api.line.me/v2/oauth/accessToken', {
        method: 'POST',
        data: {
      		grant_type: 'authorization code',
          client_id: '1520803908',
          client_secret: '2fb17a933caf2db8fa4c1d8fb67e7b6a',
          code: new_code,
          redirect_uri: 'https://localhost:3000/login'
      	}
    }).then(response => {
      console.log(response);
    }).catch(function(err) {
      console.log(err);
    });
  }
  $(document).on('click', '#login-btn', login); //登入
  $(document).on('click', '#google-log', googleLog); //Google登入
  $(document).on('click', '#facebook-log', facebookLog); //Facebook登入
  $(document).on('click', '#line-log', lineLog); // Line登入
});

function login(){
  var email = document.getElementById('login-email').value;
  var password = document.getElementById('login-password').value;
  auth.signInWithEmailAndPassword(email, password)
  .then(response => {
    window.location.assign("/");
  })
  .catch(error => {
    // console.log(error.message);
    showError(error.message);
  });
};

function googleLog() {
  auth.signInWithPopup(google_provider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;

    database.ref('users/' + user.uid).push({
      name: user.displayName,
      email: user.email
    });

    // window.location.assign("/");
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
  });
}

function facebookLog() {
  auth.signInWithPopup(facebook_provider).then(function(result) {
    // This gives you a Facebook Access Token. You can use it to access the Facebook API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    // console.log(user);

    database.ref('users/' + user.uid).push({
      name: user.displayName,
      email: user.email
    });

    window.location.assign("/");

  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
}

function lineLog() {
  var URL = 'https://access.line.me/dialog/oauth/weblogin?';
  URL += 'response_type=code';
  URL += '&client_id=1520803908';
  URL += '&redirect_uri=https://localhost:3000/login';
  URL += '&state=login';
  window.location.href = URL;
}

function showError(msg) {
  $('#log-error').hide();
  $('#log-error').text('');
  $('#log-error').append(msg);
  $('#log-error').show();
}
