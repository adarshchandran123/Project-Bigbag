var createError = require('http-errors');
var express = require('express');
var path = require('path');
var dotenv=require('dotenv').config()
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exhbs=require('express-handlebars')
var fileUpload=require('express-fileupload')
var helper = require('handlebars-helpers')()
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var Handlebars=require('handlebars')

 
var hbs = exhbs.create({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/',
helpers : helper
})

var app = express();
var db=require('./config/connection')

var session=require('express-session');
const { response } = require('express');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({
  resave:false,
  saveUninitialized:true,
  secret:"key",
  cookie:{maxAge:6000000}
}))

db.connect((err)=>{
  if(err){
    console.log('connection error'+err);
  }else{
    console.log('database connected');
  }

})
app.use('/', userRouter);
app.use('/admin', adminRouter);


Handlebars.registerHelper('hello',function(context,options,price){

  for(key in context){
    if(options.toString()=== context[key].item.toString()){
      var inp =true
      break;
    }else{
      var inp=false
    }
  }
  if(inp ===true){
    var data ='<a href="/cart"  style="margin-top: 10px; color: white; font-weight: bold;"  class="btn btn-primary add-to-cart"> View Cart</a>'
  }else{
    var data =`<a style="margin-top: 10px; color: white; font-weight: bold;" class="btn btn-primary add-to-cart" onclick="addToCart('${options}','${price}')">Add To Cart <i class="fas fa-shopping-cart"></i> </a>`
  }
  return data

})









// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};


  // render the error page
  res.status(err.status || 500);
  res.render('error')
});

module.exports = app;
