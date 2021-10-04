const { response } = require("express");
var express = require("express");
var router = express.Router();
const session = require("express-session");
var userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const { getAllProduct } = require("../helpers/product-helpers");
const OTP = require("../config/OTP");
const twilio = require("twilio")(OTP.accountsID, OTP.authToken);

/* GET home page. */
router.get("/",async function (req, res, next) {
  
  if (req.session.loggedIn) {
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

      // res.render("user-home", {  user: true, name: req.session.user.username,cartcount });
    
      const arrival=await productHelpers.getnewArrival()

      res.render("user-home", {  user: true, name: req.session.user.username, arrival,cartcount });

    
  } else {
   const arrival=await productHelpers.getnewArrival()
    res.render("user-home", { withoutLogin: true, arrival });
   

    // res.render('user-signup');
  }
});

router.get("/usersignup", (req, res) => {
  res.render("user-signup");
});

router.get("/userlogin", (req, res) => {
  res.render("user-login", { loginError: req.session.error });
  req.session.error = false;
});

router.post("/signupsubmit", (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log("111==");
    res.redirect("userlogin");
  });
});

router.post("/userloginsubmit", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      console.log("hgggg=" + req.session.user.username);
      res.redirect("/");
    } else {
      req.session.error = true;
      res.redirect("/userlogin");
    }
  });
});


router.get('/userForgotPassword',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect("/")
  }else{
    res.render("user-forgot-password");
  }
})


router.post('/userForgotPassword',(req,res,next)=>{
  mobile1 = req.body.countryCode+req.body.mobile
  mobileNum = parseInt(mobile1)
  console.log("ReQ>B",req.body);
  console.log(mobileNum);
  userHelpers.findNumber(req.body).then((response)=>{
    if(response){
      
      req.session.userRegnumber=response
      console.log(req.session.userRegnumber)
      console.log(response);
      twilio.verify.services(OTP.serviceID)
             .verifications
             .create({to:'+'+mobileNum , channel: 'sms'})
             .then(verification => console.log(verification.sid)).catch((err)=>{
               console.log("Teh err is : ",err);
             })
             res.render('otp-verify',{mobileNum})
    }
  }).catch((err)=>{
    console.log("errv : ",err)
  })
})




router.post('/otpverify',(req,res,next)=>{
  console.log('eeeee',req.body);
  mobile1 = req.body.mobile
  mobileNum =parseInt(mobile1)
  console.log("yy==",mobileNum);
  twilio.verify.services("VA716b2ecd593bad2dd3a9c3f305df24c7")
      .verificationChecks
      .create({to: '+'+mobileNum,code : req.body.otp})
      .then(verification_check =>{ 
      console.log("asdfghjkl",verification_check.status)
      
      if(verification_check.status == 'approved'){
        res.render('user-changePassword',{mobileNum})
      }else{
        otpError = true  
        res.render('otp-verify',{mobileNum,otpError})
        otpError = false
      }
      }
      ).catch((err)=>{console.log("RRR : ",err);});
})





//post change password
router.post('/changepassword',(req,res,next)=>{
  let passDetails=req.body
  let oldDetails=req.session.userRegnumber
  
   userHelpers.changePassword(passDetails,oldDetails).then((response)=>{
     
     if(response){
       req.session.loggedInviaotp=true
       req.session.loggedIn=false
       res.redirect('/userlogin')
     }  }).catch((err)=>{
       console.log("ERRORRRRR : ",err)
     })
 })




router.get("/userAllProduct",async (req, res, next) => {
  if (req.session.loggedIn) {
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    const product=await productHelpers.getAllProduct()
    res.render("allProduct", { user: true,  name: req.session.user.username,  product,cartcount });
    
  } else {
     product=await productHelpers.getAllProduct()
    res.render("allProduct", { withoutLogin: true, product });
    
  }
});

router.get("/product-detail", async function (req, res, next) {
  if (req.session.loggedIn) {
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    const productdetail = await productHelpers.getproductdetails(req.query.id);
    res.render("product-detail", {
      user: true,
      name: req.session.user.username,
      productdetail,cartcount
    });
    // productHelpers.getAllProduct().then((product)=>{
    //   res.render('product-detail', {user:true,name:req.session.user.username,product});

    // })
  } else {
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)


    const productdetail = await productHelpers.getproductdetails(req.query.id);
    res.render("product-detail", { withoutLogin: true, productdetail,cartcount });

    // productHelpers.getAllProduct().then((product)=>{
    //   console.log("mkmkkmk==",product);

    //   res.render('product-detail', {withoutLogin:true,product });

    // })
  }
});

router.get("/cart",async function (req, res, next) {
  if (req.session.loggedIn) {
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    const products=await userHelpers.getCartProducts(req.session.user._id)
    
    if(products){
          

      res.render("cart", { user: true, name: req.session.user.username,products,cartcount });
      }else{
        var emty=true
        res.render('cart',{user:true,name: req.session.user.username,emty,cartcount})
        
      }
      
      


   
  } else {
    res.redirect("/userlogin");
  }
})


router.get("/addToCart/", function (req, res, next) {
  console.log('111');
  if (req.session.loggedIn) {
    console.log('222');
    userHelpers.addToCart(req.query.id,req.session.user._id).then(()=>{
      console.log('ff=',req.query.id)
      console.log('uuu=',req.session.user._id);
      console.log('333');

      res.json({status:true})
    // res.redirect('/')
    })

    // res.render("cart", { user: true, name: req.session.user.username });
  } else {
    res.redirect("/userlogin");
  }
})





router.post('/change-product-quantity',(req,res,next)=>{
  console.log('fffffooo=',req.body);
  
  
  userHelpers.changeProductQuantity(req.body).then((response)=>{
    res.json(response)
  })
})






router.get("/logout", (req, res) => {
  req.session.loggedIn = false;
  res.redirect("/");
});

// ------------------------start----------------------------------


















// --------------------------ent---------------------------------------


























module.exports = router;
