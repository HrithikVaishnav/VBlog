const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const dotenv = require("dotenv");
const session = require('express-session');
const passport = require('passport');
const User = require('./models/User');
const Blog = require('./models/Blog');
const app = express();

// Passport config 
require('./config/passport')(passport);
dotenv.config();
//DB 
const dbURL = require('./config/keys').mongoURI;

mongoose.connect(dbURL ,{ useNewUrlParser: true , useUnifiedTopology: true})
    .then(() => console.log('Mongo Connected'))
    .catch(err => console.log(err));

//EJS 
app.set('view engine','ejs');
app.use(express.static("public"));
app.use(express.urlencoded({extended:false}));

// Express Session 
app.use(session({
    secret: 'Secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

//connect flash 
app.use(flash()); 
app.use((req,res,next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
} );

app.get('/', function(req,res){
    res.render('Home');
});

app.get('/register', function(req,res){
    res.render('Register');
});

app.post('/register',function(req,res){
    //console.log(req.body);
    const { Username , Email , Password ,cpassword} = req.body;
    let error= [];

    //value is not null
    if(!Username || !Email || !Password || !cpassword){
        error.push({msg: 'Please fill all details'});
    }

    //check password match
    if(Password != cpassword){
        error.push({msg: 'Password not matching'});
    }

    //check Length of password
    if(Password.length < 8){
        error.push({msg:'Password should of length at least 8'})
    }

    if(error.length > 0){
        console.log(error);
        res.render('register', {
            error,
            Username,
            Email,
            Password,
            cpassword
        });
    } else {
        // Validation for User
        User.findOne( {Username : Username})
            .then(user => {
                if(user) {
                    error.push({msg :'Username already registerd'});
                    res.render('register', {
                        error,
                        Username,
                        Email,
                        Password,
                        cpassword
                    });
                }else{
                    const newUser = new User({
                        Username,
                        Email,
                        Password
                    });
                    //Hash Password 
                    bcrypt.genSalt(10,(err,salt)=>
                     bcrypt.hash(newUser.Password,salt,(err,hash)=>{
                       if(err) throw err;
                       
                       newUser.Password = hash;
                       // Save User 
                       newUser.save()
                       .then(user => {
                           req.flash('success_msg','Successfully registerd');
                           res.redirect('/login');
                       })
                       .catch(err => console.log(err));
                    }))
                }
            })
    }
});

// login 
app.get('/login', function(req,res){
    res.render('Login');
});

app.post('/login',(req, res, next) => {
    passport.authenticate('local',{
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
    })(req, res, next);
});

// logout
app.get('/logout',function(req,res){
    req.logout();
    req.flash('success', 'You are Logout');
    res.redirect('/login');
});

app.get('/profile', ensureAuthenticated, function(req,res){
    username = req.user.Username;
    Blog.find()
  .then((result) => {
    res.render('user', {blogs:result ,username : req.user.Username, email: req.user.Email });
  })
  .catch((err) => {
    console.log(err);
  });
});

app.get('/user-profile' , ensureAuthenticated ,function(req,res){
    username = req.user.Username;
    Blog.find({Username : username})
  .then((result) => {
    res.render('profile', {blogs:result ,username : req.user.Username, email: req.user.Email });
  })
  .catch((err) => {
    console.log(err);
  });
})

app.get('/addblog', ensureAuthenticated, function(req,res){
    res.render('Addblog');
});

app.post('/Addblog',function(req,res){
    let blog = new Blog({
        title : req.body.title,
        Keywords : req.body.Keywords,
        Content : req.body.Content,
        Username : req.body.username
    });
    blog.save()
        .then((result) => {
            req.flash('success', 'Your Blog added Successfully');
            res.render('Addblog',{username:req.body.username});
        })
        .catch((err) => {
        console.log(err);
    })
});

app.get('/profileedit',ensureAuthenticated , function(req,res){
    username = req.user.Username;
    email = req.user.Email;
    console.log(username);
    res.render('profileedit',{username:username,email:email});
});

app.post('/profileedit',function(req,res){
    var myquery = { Username: req.user.Username };
    var newvalues = { $set: {Username: req.body.username, Email: req.body.email } };
    var updated = 0;
    User.updateOne(myquery, newvalues, function(err, res) {
        if (err) throw err;
        console.log("1 document updated");
      });   
    
      username = req.body.username;
      Blog.find({Username : username})
          .then((result) => {
          res.render('profile', {blogs:result ,username : username, email: req.body.email });
          })
          .catch((err) => {
          console.log(err);
      });
});

app.get('/profilechangepass',ensureAuthenticated, function(req,res){
    username = req.user.Username;
    email = req.user.Email;
    res.render('profilechangepass',{username:username,email:email});
});

app.post('/profilechangepass',function(req,res){
    var myquery = { Username: req.user.Username };
    password = req.body.newpassword;
    bcrypt.genSalt(10,(err,salt)=>
        bcrypt.hash(password,salt,(err,hash)=>{
            if(err) throw err;
                       
            var newvalues = { $set: {Username: req.body.username, Password: hash} };
            User.updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            });   
        }));
    
      username = req.body.username;
      Blog.find({Username : username})
          .then((result) => {
          res.render('profile', {blogs:result ,username : username, email: req.body.email });
          })
          .catch((err) => {
          console.log(err);
      });
});

function ensureAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error_msg', 'Please Log in to view this');
    res.redirect('/login');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, console.log(`Server on PORT ${PORT}`));