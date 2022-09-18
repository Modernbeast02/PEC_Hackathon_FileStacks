require('dotenv').config();
const express = require("express");
const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
upload=require("express-fileupload");
app.use(upload());
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const filesSchema=new mongoose.Schema({
  filename:String,
  status:[String],
  filepath:String,
});
const userSchema = new mongoose.Schema ({
 
  username:String,
  googleId: String,

  actions:[filesSchema]
  
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const File = new mongoose.model("File", filesSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/basefile",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id,  username:profile.emails[0].value}, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res){
  res.render("index");
});
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile","email"] })
);
app.get("/auth/google/basefile",
  passport.authenticate('google', { failureRedirect: "/index" }),
  function(req, res) {
    
    res.redirect("/permissions");
  });
  
  
app.get("/permissions", function(req, res){
  if (req.isAuthenticated()){
    res.render("permissions",{items:req.user.actions});
  } else {
    res.redirect("/");
  }
  
});
  app.get("/basefile", function(req, res){
    if (req.isAuthenticated()){
      res.render("basefile",{name:req.user.username});
    } else {
      res.redirect("/");
    }
    
  });
  app.get('/:postman', function(req, res){

    
  });
  app.get("/delete/:postname",function(req,res){
    console.log(req);
    res.redirect("/permissions");
  })
  app.post("/uploadFile",function(req,res){
    
    
    const email=req.body.EmailID;
    const viewDoc=req.body.View_Document;
    const DownDoc=req.body.Download_Document;
    const DelDoc=req.body.Delete_Document;
   
    
    if(req.files){
        const file = req.files.fil;
  const path =__dirname+"/uploads/"+file.name;
  User.findOne({username:email},function(err,user){
    if(err){
      const fie=new File({
        filename:file,
        filepath:path,
        status:[]
      });
      if(viewDoc==='on'){
            fie.status.push("view");
            
      }
      
  
      
   
    
      if(DownDoc==='on'){
        fie.status.push("Down");
  }
    
  if(DelDoc==='on'){
    fie.status.push("Del");
}
    const user=new User({
      username:email,
      actions:[fie],

     });
     user.save();
     file.mv(path, (err) => {
      if (err) {
        return res.status(500).send(err);
      }
      return res.redirect("/basefile");
    });
    
    }
    else{
      const fie=new File({
        filename:file,
        filepath:path,
        status:[]
      });
      if(viewDoc==='on'){
            fie.status.push("view");
            
      }
      
  
      
   
    
      if(DownDoc==='on'){
        fie.status.push("Down");
  }
    
  if(DelDoc==='on'){
    fie.status.push("Del");
}
user.actions.push(fie);
user.save();
    file.mv(path, (err) => {
      if (err) {
        return res.status(500).send(err);
      }
      return res.redirect("/basefile");
    });
    }
  
  });

 
    }
})



  app.listen(3000, function() {
    console.log("Server started on port 3000.");
  });
  