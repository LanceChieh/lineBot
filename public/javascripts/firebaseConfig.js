// Initialize Firebase
var config = {
  apiKey: "AIzaSyAqzIra9YkeE0HZZBSwXrjh4GemO7yVdmI",
  authDomain: "shield-88fd0.firebaseapp.com",
  databaseURL: "https://shield-88fd0.firebaseio.com",
  projectId: "shield-88fd0",
  storageBucket: "shield-88fd0.appspot.com",
  messagingSenderId: "376341346069"
};
firebase.initializeApp(config);

const auth = firebase.auth();
const database = firebase.database();

// log in status
if(window.location.pathname === '/login' || window.location.pathname === '/signup'){
  auth.onAuthStateChanged(user => {
    if(user){
      window.location = '/';
    } else {
      console.log('need to sign in');
    }
  });
} else {
  auth.onAuthStateChanged(user => {
    if(user){
      // console.log(user.email);
      console.log('firebase signed in');
    } else {
      // console.log('need to sign in');
      window.location.assign("/login");
    }
  });
}

// functions
function logout(){
  auth.signOut()
  .then(response => {
    window.location.assign("/login");
  })
}
