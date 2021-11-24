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
   
    let cart=await userHelpers.getCartProducts(req.session.user._id)

    let showwishlist=await userHelpers.showUserWishlist(req.session.user._id)

    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let ADSCategory=await userHelpers.find_ADS_details()

    let productCategory=await userHelpers.findCategory()

    let checkCategoryOfferValidity=await productHelpers.checkCategoryOfferValidity()

    checkCategoryOfferValidity.map((categoryDetails)=>{
     
      productHelpers.DeleteCategoryOffer(categoryDetails._id,categoryDetails.category,categoryDetails.offerName).then((findprodetails)=>{

        findprodetails.map((productdetail)=>{

          productHelpers.changeCategoryOfferpriceToMRP(productdetail).then(()=>{

          })

        })

      })

    })
    let productOfferValidity=await productHelpers.productOfferValidity()

      productOfferValidity.map((productdetail)=>{
        productHelpers.DeleteProductOffer(productdetail._id,productdetail.productName).then(()=>{

        })
      })
      let checkCouponValidity=await userHelpers.checkCouponValidity()
      
      checkCouponValidity.map((CouponOfferDetails)=>{
        userHelpers.DeleteCoupon(CouponOfferDetails._id).then(()=>{
          
        })
      })
      const arrival=await productHelpers.getnewArrival()

      res.render("user-home", {  user: true, name: req.session.user.username,arrival,cartcount ,cart,showwishlist,ADSCategory,productCategory});

    
  } else {
    const arrival=await productHelpers.getnewArrival()

    let ADSCategory=await userHelpers.find_ADS_details()

    let productCategory=await userHelpers.findCategory()


    let checkCategoryOfferValidity=await productHelpers.checkCategoryOfferValidity()

    checkCategoryOfferValidity.map((categoryDetails)=>{
     
      productHelpers.DeleteCategoryOffer(categoryDetails._id,categoryDetails.category,categoryDetails.offerName).then((findprodetails)=>{

        findprodetails.map((productdetail)=>{

          productHelpers.changeCategoryOfferpriceToMRP(productdetail).then(()=>{

          })

        })

      })

    })


    let productOfferValidity=await productHelpers.productOfferValidity()

    productOfferValidity.map((productdetail)=>{
      productHelpers.DeleteProductOffer(productdetail._id,productdetail.productName).then(()=>{

      })
    })
    let checkCouponValidity=await userHelpers.checkCouponValidity()
    
    checkCouponValidity.map((CouponOfferDetails)=>{
      userHelpers.DeleteCoupon(CouponOfferDetails._id).then(()=>{
        
      })
    })

    
      
      res.render("user-home", { withoutLogin: true, arrival,ADSCategory,productCategory })
    
    
       

   
  }
});







router.get("/userlogin/", (req, res) => {

  

 var token=req.query.token


    

    if(token == 'guestToBuyNow'){
      req.session.guestToBuyNow=true
      req.session.guestToBuyNowProId=req.query.prodId
    }

   else if(token == 'gustToAddToCart'){
    
      req.session.gustToAddToCart=true
      req.session.gustToAddToCartProId=req.query.id
      req.session.gustToAddToCartPrice=req.query.price
    }
   else if(token == 'guestToWishList'){
     

     req.session.guestToWishList=true
     req.session.guestToWishListProId=req.query.id
   }
   else if(token == 'gustViewWishlist'){
     req.session.gustViewWishlist=true

   }
   else if(token == 'gustViewAddToCart'){
    
    req.session.gustViewAddToCart=true
   } 
    

 
  
  res.render("user-login", { loginError: req.session.error ,blockUser:req.session.blocked });
  req.session.error = false;
  req.session.blocked=false
})

// __________________________________________________





// ______________________________________________________________



router.get("/usersignup", (req, res) => {

  res.render("user-signup",{emailvalid:req.session.emailORpasswd})
  req.session.emailORpasswd=false
});




router.post("/signupsubmit", (req, res) => {

  mobile1 = req.body.countryCode+req.body.mobile
  mobileNum = parseInt(mobile1)

  userHelpers.doSignup(req.body).then((response) => {

    if(response){

      req.session.newUser=req.body
      
      req.session.userRegnumber=mobileNum
      
      
      twilio.verify.services(OTP.serviceID)
             .verifications
             .create({to:'+'+mobileNum , channel: 'sms'})
             .then(verification => console.log(verification.sid)).catch((err)=>{
             
              res.redirect('/usersignup')
             })
           
             res.redirect('/signupOTP_Verify')
    }else{
      
      req.session.emailORpasswd=true
      res.redirect('/usersignup')
    }
  }).catch((err)=>{

   res.render('404')
  })


});






router.get('/signupOTP_Verify',(req,res)=>{
  var mobileNum=req.session.userRegnumber

  res.render('usersignupOTP_Verify',{mobileNum,otpError:req.session.otpError,serverError:req.session.serverError})
  req.session.otpError=false
  req.session.serverError=false
})




router.post('/signupOTP',(req,res)=>{
  
  let otp=req.body.digit_1+req.body.digit_2+req.body.digit_3+req.body.digit_4
  
  
 

  
  var mobileNum=req.session.userRegnumber

 
 
  twilio.verify.services("VA716b2ecd593bad2dd3a9c3f305df24c7")
      .verificationChecks
      .create({to: '+'+mobileNum,code :otp})
      .then(verification_check =>{ 
     
      
      if(verification_check.status == 'approved'){
        let userdetail=req.session.newUser

        userHelpers.signupOTPsuccess(userdetail).then((data)=>{

          if(data){

            res.redirect('/userlogin')
          }

        })



        
      }else{
        req.session.otpError = true  
        res.redirect('/signupOTP_Verify')
        
      }
      }
      ).catch((err)=>{console.log("RRR  signupOTP: ",err);

      req.session.serverError=true

      res.redirect('/signupOTP_Verify')
      
    });



   
 })



 router.get('/resend_OTP_signUp',(req,res)=>{

  
  var mobileNum=req.session.userRegnumber
 


  twilio.verify.services(OTP.serviceID)
  .verifications
  .create({to:'+'+mobileNum , channel: 'sms'})
  .then(verification => console.log(verification.sid)).catch((err)=>{
  
  
  })
 
  res.redirect('/signupOTP_Verify')




  
})




router.get('/loginwith_otp',(req,res)=>{


  res.render('userLoginwithOTP',{errCountryCode_OR_MobNum:req.session.errCountryCode_OR_MobNum})
  req.session.errCountryCode_OR_MobNum=false
})



router.post("/loginwithOTP", (req, res) => {   ///original login router
  userHelpers.loginWithOTP(req.body).then((response) => {

    mobile1 = req.body.countryCode+req.body.mobile
  mobileNum = parseInt(mobile1)



    if(response.status){

      req.session.user = response.user

      if(req.session.user.block=='true'){

        

      
      
      req.session.userRegnumber=mobileNum
     
     
      twilio.verify.services(OTP.serviceID)
             .verifications
             .create({to:'+'+mobileNum , channel: 'sms'})
             .then(verification => console.log(verification.sid)).catch((err)=>{

              res.render('404')
           
             })
             res.redirect('/LoginOTP_Verify')
            
    }else{
            req.session.user.block=='false'
            req.session.blocked=true
            
           
    
            res.redirect('/userlogin')
          }

  }else{
    req.session.errCountryCode_OR_MobNum=true
    res.redirect('/loginwith_otp')
  }

  }).catch((err)=>{
    
    res.render('404')
  })


})


router.get('/LoginOTP_Verify',(req,res)=>{

  mobileNum=req.session.userRegnumber

  res.render('userLoginOTP_Verify',{mobileNum,otpError:req.session.otpError,serverError:req.session.serverError})
  req.session.otpError=false
  req.session.serverError=false
})



router.post('/userloginOTP',(req,res)=>{

  mobile1 = req.body.mobile
  mobileNum =parseInt(mobile1)

  let otp=req.body.digit_1+req.body.digit_2+req.body.digit_3+req.body.digit_4
  
  
  

 
  twilio.verify.services("VA716b2ecd593bad2dd3a9c3f305df24c7")
      .verificationChecks
      .create({to: '+'+mobileNum,code :otp})
      .then(verification_check =>{ 
     
      
      if(verification_check.status == 'approved'){
        
        req.session.loggedIn = true;
        
        res.redirect('/')


       
      }else{
        req.session.otpError = true 
       
       
        res.redirect('/LoginOTP_Verify')
        
      }
      }
      ).catch((err)=>{
       
        req.session.serverError = true  
       
        res.redirect('/LoginOTP_Verify')
       
       

    
      });




})





router.get('/resend_OTP_Login_with_OTP',(req,res)=>{


  var mobileNum=req.session.userRegnumber

  


  twilio.verify.services(OTP.serviceID)
  .verifications
  .create({to:'+'+mobileNum , channel: 'sms'})
  .then(verification => console.log(verification.sid)).catch((err)=>{

   res.render('404')

  })
  res.redirect('/LoginOTP_Verify')
 


  


})











router.post("/userloginsubmit",(req,res)=>{     
  
  userHelpers.doLogin(req.body).then((response)=>{

        if (response.status) {
    
      req.session.loggedIn = true;
      req.session.user = response.user;

      if(req.session.user.block=='true'){

     if(req.session.guestToBuyNow)
      { 
     
        res.redirect('/buyNow/'+req.session.guestToBuyNowProId)
      }

     else if(req.session.gustToAddToCart){
     
    
        res.redirect('/addToCart?id='+req.session.gustToAddToCartProId)
      }
     else if(req.session.guestToWishList){
  

       res.redirect('/addtoWishlist/'+req.session.guestToWishListProId)

     }
     else if(req.session.gustViewWishlist){
      res.redirect('/wishlist')
     }
     else if(req.session.gustViewAddToCart){

 
       res.redirect('/cart')
     }

     res.redirect('/')

    }else{

        req.session.user.block=='false'
        req.session.blocked=true
        
       

        res.redirect('/userlogin')
      
       


    }

      
    } else {
      req.session.error = true;
      
      res.redirect("/userlogin")
    }

  
  });



})





router.get('/userForgotPassword',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect("/")
  }else{
    res.render("user-forgot-password",{err:req.session.mobileNumber_OR_CountryCode_ERR,serverError:req.session.serverError});
    req.session.mobileNumber_OR_CountryCode_ERR=false
    req.session.serverError=false
  }
})


router.post('/userForgotPassword',(req,res,next)=>{
  mobile1 = req.body.countryCode+req.body.mobile
  mobileNum = parseInt(mobile1)
 
 
  userHelpers.findNumber(req.body).then((response)=>{
   
    if(response){
      
      req.session.userRegnumber=mobileNum
     req.session.userdetail=response
     
      twilio.verify.services(OTP.serviceID)
             .verifications
             .create({to:'+'+mobileNum , channel: 'sms'})
             .then(verification => console.log(verification.sid)).catch((err)=>{
               
               
                res.redirect('/userForgotPassword')
             })
           
            res.redirect('OTP_VERIFY')
    }else{

      req.session.mobileNumber_OR_CountryCode_ERR=true
      res.redirect('/userForgotPassword')
    }
  }).catch((err)=>{
   
   res.render('404');
  })
})


router.get('/OTP_VERIFY',(req,res)=>{

 var mobileNum =req.session.userRegnumber



  res.render("otp-verify",{mobileNum,otpError:req.session.otpError})
  req.session.otpError = false
})




router.post('/otpverify',(req,res,next)=>{
 
  
  mobileNum =req.session.userRegnumber
  let otp=req.body.digit_1+req.body.digit_2+req.body.digit_3+req.body.digit_4
 
  
  
 
  twilio.verify.services("VA716b2ecd593bad2dd3a9c3f305df24c7")
      .verificationChecks
      .create({to: '+'+mobileNum,code :otp})
      .then(verification_check =>{ 
     
      
      if(verification_check.status == 'approved'){
        res.render('user-changePassword',{mobileNum})
      }else{
        req.session.otpError = true  
        res.redirect('/OTP_VERIFY')
        
      }
      }
      ).catch((err)=>{console.log("RRR otp verify le error : ",err);
      req.session.serverError = true  
        res.redirect('/userForgotPassword')
      
    
    });
})




router.get('/resend_OTP_forgotOTP_verify',(req,res)=>{

  var mobileNum =req.session.userRegnumber

 

  twilio.verify.services(OTP.serviceID)
  .verifications
  .create({to:'+'+mobileNum , channel: 'sms'})
  .then(verification => console.log(verification.sid)).catch((err)=>{
    res.render('404')
    
  })
 
 res.redirect('/OTP_VERIFY')



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
       

      res.render('404')
     })
 })




router.get("/userAllProduct",async (req, res, next) => {
  if (req.session.loggedIn) {
    let cartcount=null

    let cart=await userHelpers.getCartProducts(req.session.user._id)
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let productCategory=await userHelpers.findCategory()

    const product=await productHelpers.getAllProduct()
    
    res.render("allProduct", { user: true,  name: req.session.user.username,  product,cartcount ,cart,productCategory})
       
  } else {  
     product=await productHelpers.getAllProduct()

     let productCategory=await userHelpers.findCategory()

    res.render("allProduct", { withoutLogin: true, product,productCategory })
                          
  }                                                            
})                    
                               
router.get("/product-detail", async function (req, res, next) {
  if (req.session.loggedIn) {
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let cart=await userHelpers.getCartProducts(req.session.user._id)

    const productdetail = await productHelpers.getproductdetails(req.query.id);

    let productCategory=await userHelpers.findCategory()
    
    res.render("product-detail", {
      user: true,
      name: req.session.user.username,
      productdetail,cartcount,cart,productCategory
    });
 
  } else {
    
    let productCategory=await userHelpers.findCategory()

    const productdetail = await productHelpers.getproductdetails(req.query.id);
    res.render("product-detail", { withoutLogin: true, productdetail ,productCategory});

    
  }
});

router.get("/cart",async function (req, res, next) {
 
  if (req.session.loggedIn) {
  
    req.session.gustViewAddToCart=false
  
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let productCategory=await userHelpers.findCategory()

    const products=await userHelpers.getCartProducts(req.session.user._id)

  
    
    
    if(products){
          
     let GrandTotal=await userHelpers.getTotalPrice(req.session.user._id)

      res.render("cart", { user: true, name: req.session.user.username,products,cartcount,GrandTotal,productCategory });
      }
      else{
       
        
        res.render('cart',{user:true,name: req.session.user.username,cartcount})
        
        
      }

   
  } else {
    res.redirect("/userlogin")
  }
})


router.get("/addToCart/",async function (req, res, next) {
 
  if (req.session.loggedIn) {

    if(req.session.gustToAddToCart){

      req.session.gustToAddToCart=false
      let findprodetails=await userHelpers.Findprodetails(req.query.id)
      userHelpers.addToCart(req.query.id,req.session.user._id,req.query.price,findprodetails).then(async()=>{
        
       
        res.redirect('/cart')  
      
      })

    }else{

      let findprodetails=await userHelpers.Findprodetails(req.query.id)
      userHelpers.addToCart(req.query.id,req.session.user._id,req.query.price,findprodetails).then(async()=>{
        
       
        res.json({status:true})  
      
      })


    }

 

   
  } else {
   
    res.redirect("/userlogin");
  }
})





router.post('/change-product-quantity',(req,res,next)=>{
 
  
  
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    let GrandTotal=await userHelpers.getTotalPrice(req.session.user._id)
    response.GrandTotal = GrandTotal
    res.json(response)
  })
})


router.get('/placeOrder',async(req,res)=>{
  if(req.session.loggedIn){
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let productCategory=await userHelpers.findCategory()

    let GrandTotal=await userHelpers.getTotalPrice(req.session.user._id)
    

    let userAddress=await userHelpers.findUserAddress(req.session.user._id)


 
  
  
  res.render('Place-Order',{user:true,name: req.session.user.username,GrandTotal,cartcount,user:req.session.user,userAddress,productCategory})
  }else{
    res.redirect("/userlogin")
  }
  
  
})


router.post('/placeOrder',async(req,res)=>{
  if(req.session.loggedIn){
    let cartProduct=await userHelpers.getCartProductList(req.body.userId)

  let GrandTotal=await userHelpers.getTotalPrice(req.body.userId)
  req.session.cart = true
userHelpers.placeOrder(req.body,cartProduct,GrandTotal).then((orderId)=>{

  cartProduct.map((data)=>{

    userHelpers.cartStockupdate(data).then(()=>{
      
    })
  
  }) 

 
  if(req.body['payment']=='COD'){
  

    res.json({COD_success:true})

  }


  else if (req.body.payment == 'Razorpay'){
   
    userHelpers.generateRazorpay(orderId, GrandTotal).then((response) => {
  

      res.json(response)
    }).catch((err) => {
      res.redirect('/404')
    })
  }

      // Paypal
      else if (req.body.payment == 'Paypal'){
        
        userHelpers.generatePaypal(orderId, GrandTotal).then((paySuccess)=>{
    
          res.json(paySuccess)
        }).catch((err)=>{
          res.redirect('/404')
        })
      }

}) 


  }
    
})


router.post('/verify_payment',(req,res)=>{


userHelpers.verifyPayment(req.body).then(()=>{
  
  userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
   
    res.json({status:true})

  })

}).catch((err)=>{
 
  res.json({status:false})
})

})




router.post('/removecart',(req,res)=>{

userHelpers.RemoveCart(req.body).then((response)=>{

  if(response){
   
    res.json(response)
  }
  
})


})

router.get('/successPage',async(req,res)=>{

  if(req.session.loggedIn){

    if(req.session.cart){
     
      userHelpers.DeleteUserCart(req.session.user._id)
    }
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let productCategory=await userHelpers.findCategory()

    

  res.render('SuccessPage',{user:true,name: req.session.user.username,cartcount,productCategory})

  }
  
})


router.get('/OrderList',async(req,res)=>{

    if(req.session.loggedIn){
      let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let productCategory=await userHelpers.findCategory()
   
      let userorders=await userHelpers.getuserOrders(req.session.user._id)
      let GrandTotal=await userHelpers.getTotalPrice(req.session.user._id)
      

      res.render('OrderList',{user:true,name: req.session.user.username,cartcount,userorders,GrandTotal,productCategory})

    }else{
      res.redirect("/userlogin")
    }
  

})


router.get('/view_order_products/:id',async(req,res)=>{

  
  let orderId=req.params.id
  

  if(req.session.loggedIn){


let allorder=await userHelpers.findorder(orderId)

var productCategory=await userHelpers.findCategory()


    if(allorder.mode == 'cart'){
     

      let cartcount=null
    
    cartcount=await userHelpers.getCartCount(req.session.user._id)
    let orderproducts=await userHelpers.getorderproducts(orderId)
   
   
    
    
    res.render('viewOrderProducts',{user:true,name: req.session.user.username,user:req.session.user,cartcount,orderproducts,carts:true,productCategory})

 
    }else if(allorder.mode == 'buyNow'){

     
      let cartcount=null
    
      cartcount=await userHelpers.getCartCount(req.session.user._id)
      
     
      
      let buyproduct=await userHelpers.BuynowProductDetails(orderId)


      res.render('viewOrderProducts',{user:true,name: req.session.user.username,user:req.session.user,cartcount,buyproduct,buyNowpro:true,productCategory})
 

    } 
     

  }else{
    res.redirect("/userlogin")
  }
  

})


router.get('/userorderedProduct',async(req,res)=>{
  if(req.session.loggedIn){

    let cartcount=null
    
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    var productCategory=await userHelpers.findCategory()

    let userOrderedProducts=await userHelpers.FindUserOrderedProducts(req.session.user._id)

    res.render('UserOrderedProduct',{user:true,name: req.session.user.username,user:req.session.user,cartcount,userOrderedProducts,productCategory})
  }

  
})





router.get('/UserOrderInvoice/:id',async(req,res)=>{

  var productCategory=await userHelpers.findCategory()

  if(req.session.loggedIn){

    let orderId=req.params.id


    let orderInvoice=await userHelpers.orderInvoiceDetails(orderId)

    if(orderInvoice.mode == 'cart'){

      let cartcount=null
    
    cartcount=await userHelpers.getCartCount(req.session.user._id)

  res.render('user_order_invoice',{user:true,name: req.session.user.username,orderInvoice,cartcount,user:req.session.user,carts:true,productCategory})

    }else if(orderInvoice.mode == 'buyNow'){
      let cartcount=null
    
      cartcount=await userHelpers.getCartCount(req.session.user._id)
  
    res.render('user_order_invoice',{user:true,name: req.session.user.username,orderInvoice,cartcount,user:req.session.user,buynows:true,productCategory})

    }

    

  }
  
})






router.get('/userProfile',async(req,res)=>{

  
  if(req.session.loggedIn){
    var productCategory=await userHelpers.findCategory()

    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)
    let userId=req.session.user._id
    let userdetail=await userHelpers.getUserDetails(userId)
  

    res.render('user_profile',{user:true,name: req.session.user.username,userdetail,cartcount,userId,productCategory})
  }else{
    res.redirect("/userlogin")
  }

  
})

router.get('/editProfile',async(req,res)=>{

  if(req.session.loggedIn){
    var productCategory=await userHelpers.findCategory()

    let userId=req.session.user._id
    let userdetail=await userHelpers.getUserDetails(userId)

    res.render('edit_profile',{user:true,name: req.session.user.username,userdetail,productCategory})
  }else{
    res.redirect("/userlogin")
  }
  
})

router.post('/EditProfile',(req,res)=>{
  
  if(req.session.loggedIn){
   let userId=req.session.user._id
  
    userHelpers.editProfile(req.body,userId).then((response)=>{

      const image1 = req.files.image1
      
      image1.mv('./public/user_profile_photo/'+userId+'.jpg')
      

    })
  }else{
    res.redirect('/userlogin')
  }
 

 
res.redirect('/userProfile')
})





router.get('/addNewAddress',async(req,res)=>{
  if(req.session.loggedIn){

    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    var productCategory=await userHelpers.findCategory()

    let userAddress=await userHelpers.findUserAddress(req.session.user._id)
   


    res.render('newAddress',{user:true,name: req.session.user.username,cartcount,userAddress,productCategory})
  }

  
})

router.post('/Addnewaddress',(req,res)=>{
  if(req.session.loggedIn){
    let userId = req.session.user._id

    
    userHelpers.addnewAddress(req.body,userId).then(()=>{

      res.redirect('/userProfile')

    })

    
  }

  
})



router.get('/DeleteUserNewAddress/:id',(req,res)=>{

  userHelpers.DeleteUserNewAddress(req.params.id).then(()=>{

    res.redirect('/addNewAddress')
  })

  
})

router.get('/EditAddress/:id',async(req,res)=>{

  if(req.session.loggedIn){
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    var addressdetails=await userHelpers.findaddresDetails(req.params.id)

    req.session.addId=req.params.id

    res.render('Edit_Address',{user:true,name: req.session.user.username,cartcount,addressdetails})
  }else{
    res.redirect('/userlogin')
  }

  
})

router.post('/edit_address',(req,res)=>{

  userHelpers.Edit_address(req.session.addId,req.body).then(()=>{


    res.redirect('/addNewAddress')
  })

  
})






router.get('/buyNow/:id',async(req,res)=>{

  if(req.session.loggedIn){
    req.session.guestToBuyNow=false
    
    
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    var productCategory=await userHelpers.findCategory()

    let userId=req.session.user._id
    let proId=req.params.id
    let orderproduct=await userHelpers.buyNow(proId)
   
    
    let productprice=parseInt(orderproduct.newprice)

    let userAddress=await userHelpers.findUserAddress(req.session.user._id)
    
    
    
    res.render('buynowPlaceOrder',{user:true,name: req.session.user.username,userId,orderproduct,user:req.session.user,productprice,cartcount,userAddress,productCategory})
    
  }else{
    res.redirect("/userlogin")
  }

})





router.post('/BuynowPlaceOrder',async(req,res)=>{
  if(req.session.loggedIn){
   
  var orderproduct=await userHelpers.buyNow(req.body.proId)
  req.session.cart=false
  var productprice=orderproduct.newprice
userHelpers.BuynowPlaceOrder(req.body,orderproduct,productprice).then((orderId)=>{

 
  if(req.body['payment']=='COD'){
   
    res.json({COD_success:true})

  }


   else if (req.body.payment == 'Razorpay'){
      userHelpers.generateRazorpay(orderId, productprice).then((response) => {
       
        res.json(response)
      }).catch((err) => {
        res.redirect('/404')
      })
    }
    // Paypal
    else if (req.body.payment == 'Paypal'){
     
      userHelpers.generatePaypal(orderId, productprice).then((paySuccess)=>{
        
        res.json(paySuccess)
      }).catch((err)=>{
        res.redirect('/404')
      })
    }
    

})  




productHelpers.buynowProductQuantityupdate(req.body.proId).then(()=>{
 
   
}) 


  }
  
})



router.get('/wishlist',async(req,res)=>{
  if(req.session.loggedIn){
    req.session.gustViewWishlist=false

    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    var productCategory=await userHelpers.findCategory()

    let cart=await userHelpers.getCartProducts(req.session.user._id)

    let showwishlist=await userHelpers.showUserWishlist(req.session.user._id)

    console.log('wishlis',showwishlist);

    res.render('user_wishlist',{user:true,name: req.session.user.username,cart,cartcount,showwishlist,productCategory})

  }else{

    

    res.redirect("/userlogin")
  }

  
})

router.get('/addtoWishlist/:id',(req,res)=>{

  if(req.session.loggedIn){

    if(req.session.guestToWishList){

      req.session.guestToWishList=false
      userHelpers.addtoWishlist(req.params.id,req.session.user._id).then((response)=>{
        
        res.redirect('/wishlist')
  
      })

    }else{
      userHelpers.addtoWishlist(req.params.id,req.session.user._id).then((response)=>{
      
        res.json(response)
  
      })

    }



  }else{
    res.redirect('/userlogin')
  }

  
})


router.get('/deleteWishlist/:id',(req,res)=>{
 
  userHelpers.DeleteWishlist(req.params.id).then((response)=>{

    res.redirect('/wishlist')
  })

  
})



router.get('/categoryDisplay/:category',async(req,res)=>{

  if(req.session.loggedIn){

    

    let cart=await userHelpers.getCartProducts(req.session.user._id)

    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let productCategory=await userHelpers.findCategory()

    userHelpers.DisplayCategory(req.params.category).then((categoryItems)=>{

      
  
      res.render('userCategoryDisplay',{user:true,cartcount,name: req.session.user.username,categoryItems,productCategory,cart})
    })


  }else{

    let productCategory=await userHelpers.findCategory()

    userHelpers.DisplayCategory(req.params.category).then((categoryItems)=>{

      res.render('userCategoryDisplay',{withoutLogin: true,categoryItems,productCategory})
    })

    
  }


})

router.get('/userCancellProduct/:id/:orderId/:quantity',(req,res)=>{
  if(req.session.loggedIn){
    
    
    productHelpers.UserCancellProduct(req.params.id,req.params.orderId,req.params.quantity).then(()=>{

    })

  }

  res.redirect('/OrderList')
})

// buyNow Coupon

router.get('/couponChecking/:couponCode/:productprice', (req,res)=>{
  userHelpers.BuyNowcheckingCouponExist(req.params.couponCode,req.params.productprice,req.session.user._id).then((response)=>{
    if(response){
      
      res.json(response)
    }else{
      res.json({noCoupon:true})
    }
  })


})

//cart Coupon

router.get('/cartCouponChecking/:couponCode/:GrandTotal',(req,res)=>{

  userHelpers.CartCouponChecking(req.params.couponCode,req.params.GrandTotal,req.session.user._id).then((response)=>{
    if(response){
      
      res.json(response)
    }else{
      res.json({noCoupon:true})
    }

  })
})


router.post('/searchResult',async(req,res)=>{

  


  

  if(req.session.loggedIn){

   
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    var productCategory=await userHelpers.findCategory()

    let SearchData=await userHelpers.SearchDatas(req.body.searchdata)

    let cart=await userHelpers.getCartProducts(req.session.user._id)

  
    res.render('SearchResult',{user:true,cartcount,name: req.session.user.username,SearchData,cart,productCategory})

  }else{
    var productCategory=await userHelpers.findCategory()
    let SearchData=await userHelpers.SearchDatas(req.body.searchdata)

    res.render('SearchResult',{ withoutLogin: true,SearchData,productCategory})
  }




})



router.post('/currencycoverterCart/:amount',(req,res)=>{

  

  userHelpers.convertAmount(req.params.amount).then((total)=>{
    
    res.json(total)
  })


})




router.get('/about_us',async(req,res)=>{

  var productCategory=await userHelpers.findCategory()

 

  if(req.session.loggedIn){

    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)



    res.render('About_us',{user:true,cartcount,name: req.session.user.username,productCategory})
  }else{
    res.render('About_us',{ withoutLogin: true,productCategory})
  }

  
})



 




router.get("/logout", (req, res) => {
  req.session.loggedIn = false;
  res.redirect("/");
});

// ------------------------start----------------------------------


 















// --------------------------ent---------------------------------------








module.exports = router;
