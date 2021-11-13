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
     
      productHelpers.DeleteCategoryOffer(categoryDetails._id,categoryDetails.category).then((findprodetails)=>{

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
    
      
      res.render("user-home", { withoutLogin: true, arrival,ADSCategory,productCategory })
    
    
       

    // res.render('user-signup');
  }
});

router.get("/usersignup", (req, res) => {

  res.render("user-signup",{emailvalid:req.session.emailORpasswd})
  req.session.emailORpasswd=false
});

router.get("/userlogin", (req, res) => {
  
  res.render("user-login", { loginError: req.session.error ,blockUser:req.session.blocked });
  req.session.error = false;
  req.session.blocked=false
})

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
              console.log('OTP     ERRRRRRR',err);
             })
             res.render('usersignupOTP_Verify',{mobileNum})
    }else{
      console.log('enter else case')
      req.session.emailORpasswd=true
      res.redirect('/usersignup')
    }
  }).catch((err)=>{
   console.log('what is this')
  })


});




router.post('/signupOTP',(req,res)=>{
  
  let otp=req.body.digit_1+req.body.digit_2+req.body.digit_3+req.body.digit_4
  
  
  console.log('&&&&&&&&&&&&&&&&&&&&&&&&',otp)

  mobile1 = req.body.mobile
  mobileNum =parseInt(mobile1)
 
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



        // res.render('user-changePassword',{mobileNum})
      }else{
        req.session.otpError = true  
        res.render('usersignupOTP_Verify',{mobileNum,otpError:req.session.otpError})
        req.session.otpError = false
      }
      }
      ).catch((err)=>{console.log("RRR : ",err);});



   // res.render('/usersignupOTP_Verify')
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

        

      // req.session.newUser=req.body
      
      req.session.userRegnumber=mobileNum
     
     
      twilio.verify.services(OTP.serviceID)
             .verifications
             .create({to:'+'+mobileNum , channel: 'sms'})
             .then(verification => console.log(verification.sid)).catch((err)=>{
           
             })
             res.render('userLoginOTP_Verify',{mobileNum})
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
    console.log('@@@@@@@@@@@@@@@@  catch');
  })


})




router.post('/userloginOTP',(req,res)=>{

  mobile1 = req.body.mobile
  mobileNum =parseInt(mobile1)

  let otp=req.body.digit_1+req.body.digit_2+req.body.digit_3+req.body.digit_4
  console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQ',otp);
  
  

 
  twilio.verify.services("VA716b2ecd593bad2dd3a9c3f305df24c7")
      .verificationChecks
      .create({to: '+'+mobileNum,code :otp})
      .then(verification_check =>{ 
     
      
      if(verification_check.status == 'approved'){
        
        req.session.loggedIn = true;
        
        res.redirect('/')


        // res.render('user-changePassword',{mobileNum})
      }else{
        otpError = true  
        res.render('usersignupOTP_Verify',{mobileNum,otpError})
        otpError = false
      }
      }
      ).catch((err)=>{
        console.log("RRR : ",err);

    
      });




})









router.post("/userloginsubmit",(req,res)=>{     //its just for trial without otp verification
  
  userHelpers.doLogin(req.body).then((response)=>{

        if (response.status) {
    
       
      
      req.session.loggedIn = true;
      req.session.user = response.user;
      

      if(req.session.user.block=='true'){
       
        
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
    res.render("user-forgot-password",{err:req.session.mobileNumber_OR_CountryCode_ERR});
    req.session.mobileNumber_OR_CountryCode_ERR=false
  }
})


router.post('/userForgotPassword',(req,res,next)=>{
  mobile1 = req.body.countryCode+req.body.mobile
  mobileNum = parseInt(mobile1)
 
 
  userHelpers.findNumber(req.body).then((response)=>{
    if(response){
      
      req.session.userRegnumber=response
     
     
      twilio.verify.services(OTP.serviceID)
             .verifications
             .create({to:'+'+mobileNum , channel: 'sms'})
             .then(verification => console.log(verification.sid)).catch((err)=>{
               console.log('forgor OTP errr',err);
             })
             res.render('otp-verify',{mobileNum})
    }else{

      req.session.mobileNumber_OR_CountryCode_ERR=true
      res.redirect('/userForgotPassword')
    }
  }).catch((err)=>{
   
  })
})




router.post('/otpverify',(req,res,next)=>{
 
  mobile1 = req.body.mobile
  mobileNum =parseInt(mobile1)
  let otp=req.body.digit_1+req.body.digit_2+req.body.digit_3+req.body.digit_4
  
  
  
 
  twilio.verify.services("VA716b2ecd593bad2dd3a9c3f305df24c7")
      .verificationChecks
      .create({to: '+'+mobileNum,code :otp})
      .then(verification_check =>{ 
     
      
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
    
    res.render("product-detail", {
      user: true,
      name: req.session.user.username,
      productdetail,cartcount,cart
    });
    // productHelpers.getAllProduct().then((product)=>{
    //   res.render('product-detail', {user:true,name:req.session.user.username,product});

    // })
  } else {
    


    const productdetail = await productHelpers.getproductdetails(req.query.id);
    res.render("product-detail", { withoutLogin: true, productdetail });

    
  }
});

router.get("/cart",async function (req, res, next) {
  if (req.session.loggedIn) {
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    const products=await userHelpers.getCartProducts(req.session.user._id)

    console.log('m........,,,..,.,.m,mmm==',products)
    
    
    if(products){
          
     let GrandTotal=await userHelpers.getTotalPrice(req.session.user._id)

      res.render("cart", { user: true, name: req.session.user.username,products,cartcount,GrandTotal });
      }else{
        
        // res.render('cart',{user:true,name: req.session.user.username,cartcount})
        res.redirect('/userlogin')
        
      }
      
      


   
  } else {
    res.redirect("/userlogin")
  }
})


router.get("/addToCart/",async function (req, res, next) {
 
  if (req.session.loggedIn) {
  
    let findprodetails=await userHelpers.Findprodetails(req.query.id)
    userHelpers.addToCart(req.query.id,req.session.user._id,req.query.price,findprodetails).then(async()=>{
      
     
     

      res.json({status:true})  
    // res.redirect('/')
    }) 

    // res.render("cart", { user: true, name: req.session.user.username });
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

    let GrandTotal=await userHelpers.getTotalPrice(req.session.user._id)
    

    let userAddress=await userHelpers.findUserAddress(req.session.user._id)


 
  
  
  res.render('Place-Order',{user:true,name: req.session.user.username,GrandTotal,cartcount,user:req.session.user,userAddress})
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

  }else{
    userHelpers.generateRazorpay(orderId,GrandTotal).then((response)=>{
      res.json(response)

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
      console.log('cart deleeete aaaayii')
      userHelpers.DeleteUserCart(req.session.user._id)
    }
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    

  res.render('SuccessPage',{user:true,name: req.session.user.username,cartcount})

  }
  
})


router.get('/OrderList',async(req,res)=>{

    if(req.session.loggedIn){
      let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)
   
      let userorders=await userHelpers.getuserOrders(req.session.user._id)
      let GrandTotal=await userHelpers.getTotalPrice(req.session.user._id)
      

      res.render('OrderList',{user:true,name: req.session.user.username,cartcount,userorders,GrandTotal})

    }else{
      res.redirect("/userlogin")
    }
  

})


router.get('/view_order_products/:id',async(req,res)=>{

  
  let orderId=req.params.id
  

  if(req.session.loggedIn){


let allorder=await userHelpers.findorder(orderId)


    if(allorder.mode == 'cart'){
     

      let cartcount=null
    
    cartcount=await userHelpers.getCartCount(req.session.user._id)
    let orderproducts=await userHelpers.getorderproducts(orderId)
   
    console.log('cccaaaarrrtttt====',orderproducts)
    
    
    res.render('viewOrderProducts',{user:true,name: req.session.user.username,user:req.session.user,cartcount,orderproducts,carts:true})

 
    }else if(allorder.mode == 'buyNow'){

     
      let cartcount=null
    
      cartcount=await userHelpers.getCartCount(req.session.user._id)
      
     
      
      let buyproduct=await userHelpers.BuynowProductDetails(orderId)

      console.log('buy nnnnnnnnnnn==',buyproduct)

     

      res.render('viewOrderProducts',{user:true,name: req.session.user.username,user:req.session.user,cartcount,buyproduct,buyNowpro:true})
 

    } 
     
  


    
   
    
  

  }else{
    res.redirect("/userlogin")
  }
  

})


router.get('/userorderedProduct',async(req,res)=>{
  if(req.session.loggedIn){

    let cartcount=null
    
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let userOrderedProducts=await userHelpers.FindUserOrderedProducts(req.session.user._id)

    res.render('UserOrderedProduct',{user:true,name: req.session.user.username,user:req.session.user,cartcount,userOrderedProducts})
  }

  
})





router.get('/UserOrderInvoice/:id',async(req,res)=>{

  if(req.session.loggedIn){

    let orderId=req.params.id

    
    
    let orderInvoice=await userHelpers.orderInvoiceDetails(orderId)

    if(orderInvoice.mode == 'cart'){

      let cartcount=null
    
    cartcount=await userHelpers.getCartCount(req.session.user._id)

  res.render('user_order_invoice',{user:true,name: req.session.user.username,orderInvoice,cartcount,user:req.session.user,carts:true})

    }else if(orderInvoice.mode == 'buyNow'){
      let cartcount=null
    
      cartcount=await userHelpers.getCartCount(req.session.user._id)
  
    res.render('user_order_invoice',{user:true,name: req.session.user.username,orderInvoice,cartcount,user:req.session.user,buynows:true})

    }

    

  }
  
})






router.get('/userProfile',async(req,res)=>{
  
  if(req.session.loggedIn){

    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)
    let userId=req.session.user._id
    let userdetail=await userHelpers.getUserDetails(userId)
  

    res.render('user_profile',{user:true,name: req.session.user.username,userdetail,cartcount,userId})
  }else{
    res.redirect("/userlogin")
  }

  
})

router.get('/editProfile',async(req,res)=>{

  if(req.session.loggedIn){

    let userId=req.session.user._id
    let userdetail=await userHelpers.getUserDetails(userId)

    res.render('edit_profile',{user:true,name: req.session.user.username,userdetail})
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
  }
 

 
res.redirect('/userProfile')
})





router.get('/addNewAddress',async(req,res)=>{
  if(req.session.loggedIn){

    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let userAddress=await userHelpers.findUserAddress(req.session.user._id)
    console.log('???????????????????????????===',userAddress);


    res.render('newAddress',{user:true,name: req.session.user.username,cartcount,userAddress})
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



router.get('/DeleteUserNewAddress/:userId',(req,res)=>{

  userHelpers.DeleteUserNewAddress(req.params.userId).then(()=>{

    res.redirect('/addNewAddress')
  })

  
})




router.get('/buyNow/:id',async(req,res)=>{

  if(req.session.loggedIn){
    
    
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let userId=req.session.user._id
    let proId=req.params.id
    let orderproduct=await userHelpers.buyNow(proId)
   
    
    let productprice=parseInt(orderproduct.newprice)

    let userAddress=await userHelpers.findUserAddress(req.session.user._id)
    
    
    
    res.render('buynowPlaceOrder',{user:true,name: req.session.user.username,userId,orderproduct,user:req.session.user,productprice,cartcount,userAddress})
    
  }else{
    res.redirect("/userlogin")
  }

})





router.post('/BuynowPlaceOrder',async(req,res)=>{
  if(req.session.loggedIn){
    console.log('[][[][]]]][][][][][][]llllllll===',req.body)
  let orderproduct=await userHelpers.buyNow(req.body.proId)
  req.session.cart=false
  let productprice=orderproduct.newprice
userHelpers.BuynowPlaceOrder(req.body,orderproduct,productprice).then((orderId)=>{

 
  if(req.body['payment']=='COD'){

    res.json({COD_success:true})

  }else{
    userHelpers.generateRazorpay(orderId,productprice).then((response)=>{
      res.json(response)

    })   
  }


})  




productHelpers.buynowProductQuantityupdate(req.body.proId).then(()=>{
 
   
}) 



  }
  
    
  
})



router.get('/wishlist',async(req,res)=>{
  if(req.session.loggedIn){

    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let cart=await userHelpers.getCartProducts(req.session.user._id)

    let showwishlist=await userHelpers.showUserWishlist(req.session.user._id)

    

    res.render('user_wishlist',{user:true,name: req.session.user.username,cart,cartcount,showwishlist})

  }else{

    

    res.redirect("/userlogin")
  }

  
})

router.get('/addtoWishlist/:id',(req,res)=>{

  if(req.session.loggedIn){

    userHelpers.addtoWishlist(req.params.id,req.session.user._id).then((response)=>{
      console.log('\\\\\\\\;;;;;;;',response);
      res.json(response)

    })

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
    console.log('bwbbwbwbwbbwbbwbwbwbbwbwbwbw==',req.params)
    
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

    console.log('^^^^^^^^^^^^^^^^^^^',req.body.searchdata);
    let cartcount=null
    cartcount=await userHelpers.getCartCount(req.session.user._id)

    let SearchData=await userHelpers.SearchDatas(req.body.searchdata)

    let cart=await userHelpers.getCartProducts(req.session.user._id)

  
    res.render('SearchResult',{user:true,cartcount,name: req.session.user.username,SearchData,cart})

  }else{

    let SearchData=await userHelpers.SearchDatas(req.body.searchdata)

    res.render('SearchResult',{ withoutLogin: true,SearchData})
  }






})



 




router.get("/logout", (req, res) => {
  req.session.loggedIn = false;
  res.redirect("/");
});

// ------------------------start----------------------------------


 















// --------------------------ent---------------------------------------











            














module.exports = router;
