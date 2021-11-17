const { response } = require("express");
var express = require("express");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");

var router = express.Router();


let admin={
  email:"admin@gmail.com",
  password:123
}


var adminLoginHelper = (req,res,next)=>{
  if(req.session.adminLogin){
    next()
  }else{
    res.redirect("/admin/admin-login")
  }

}
var answer

/* GET users listing. */
router.get("/",adminLoginHelper,async function(req, res, next) {

  let totalUser=await userHelpers.TotalUser()

  let totalproduct=await userHelpers.TotalProduct()

  let carttotalRevenue=await userHelpers.CartTotalRevenue()

  let buyNowTotalRevenue=await userHelpers.BuyNowTotalRevenue()
  
  
  let allorderStatus=await userHelpers.findAllorderStatus()

  let paymentMethod=await userHelpers.findpaymentMethod()

  let salesReportMonth=await userHelpers.findMonthSalesReport()

  

  let productCategory=await userHelpers.findCategory()

  var categoryReport=[]
 
 
  
  for(key in productCategory){
    var details =await userHelpers.categoryproductsTotal(productCategory[key].category)
    categoryReport.push(details)
  }


//   const start = new Date("02/05/2020");
//   const end = new Date("02/10/2020");
  
//   let loop = new Date(start);
//   while (loop <= end) {
//     console.log('rrrrrr',loop);
//     let newDate = loop.setDate(loop.getDate() + 1);
//     loop = new Date(newDate);
//   }
// console.log('kkkkk',loop)


var date = new Date()

d= new Date().getTime()

var sevenday=date.setDate(new Date().getDate()-10)

console.log('!@@@@@@@2',date)



  
 
  


  let payment=[paymentMethod.COD,paymentMethod.Razorpay]
  
  let totalOrder=[allorderStatus.totalOrder]

  let order=[allorderStatus.totalcancel,  allorderStatus.totalDelivered]
  
  let lineorder=[allorderStatus.totalcancel, allorderStatus.totalPending, allorderStatus.totalDelivered, allorderStatus.totalPlaced, allorderStatus.totalShipped]
 
  let totalRevenue=carttotalRevenue+buyNowTotalRevenue
  

  let totalCategory=await userHelpers.TotalCategory()


  const arrival=await productHelpers.getnewArrival()

  res.render("admin/dashboard", { admin: true,totalUser,totalproduct,totalCategory,totalRevenue,allorderStatus,order,lineorder,payment,arrival,totalOrder,categoryReport })
});
 







router.get('/admin-login',(req,res)=>{
  res.render('admin/admin-login',{loginError:req.session.adminerror})
  req.session.adminerror=false

})


router.post('/adminloginsubmit',(req,res)=>{
  
  if(req.body.email == admin.email && req.body.password == admin.password){
    req.session.admindetails=admin
    req.session.adminLogin=true
    res.redirect('/admin')
  }else{
    req.session.adminerror=true
    res.redirect('/admin/admin-login')
  }

})

  
 


router.get("/userManagment",adminLoginHelper,async (req, res) => {
 
  var allUsers=await userHelpers.getAllUsers()
 
    
    res.render("admin/userManagment", { admin: true,allUsers});
  
  
})


router.get('/BlockedUsers',adminLoginHelper,(req,res)=>{

  userHelpers.findBlockedUsers().then((BlockedUser)=>{
    

    res.render('admin/blockedUsers',{admin:true,BlockedUser})
  })

  
})




router.get("/add-product",adminLoginHelper, async(req, res) => {

  let productCategory=await userHelpers.findCategory()

  res.render("admin/add-product", { admin: true,productCategory });
});

router.post("/add-product", (req, res) => {
  
  
  productHelpers.addProduct(req.body).then((id) => {
   const image1 = req.files.image1
   const image2 = req.files.image2
   const image3 = req.files.image3
   image1.mv('./public/product-image/'+id+'__1.jpg')
   image2.mv('./public/product-image/'+id+'__2.jpg')
   image3.mv('./public/product-image/'+id+'__3.jpg')
   res.redirect('/admin/view-product')
  });
});


router.get('/view-product',adminLoginHelper, (req,res)=>{

  productHelpers.getAllProduct().then((product)=>{
    
    res.render('admin/view-product',{admin:true,product})

  })                       

  
})





router.get('/editProduct/',adminLoginHelper, async(req,res,next)=>{

  const productdetail=await productHelpers.getproductdetails(req.query.id)

  let productCategory=await userHelpers.findCategory()

 
  res.render('admin/edit-product',{admin:true,productdetail,productCategory})
})


router.post('/edit-product/:id',(req,res)=>{
  const id=req.params.id
  productHelpers.updateproduct(req.params.id,req.body).then(()=>{
    
    res.redirect('/admin/view-product')
      if(req.files.image1 || req.files.image2 || req.files.image3){
        const image1 = req.files.image1;
        const image2 = req.files.image2;
        const image3 = req.files.image3;
        image1.mv('./public/product-image/'+id+'__1.jpg')
        image2.mv('./public/product-image/'+id+'__2.jpg')
        image3.mv('./public/product-image/'+id+'__3.jpg')
       
      }
     

  })

})



router.get('/deleteProduct/:id',adminLoginHelper, (req,res)=>{
  const proId=req.params.id
 
  productHelpers.deleteProduct(proId).then((response)=>{
  
    res.redirect('/admin/view-product')

  })
  
})





router.get('/blockedUser/:id',adminLoginHelper, (req,res)=>{
 
  const userId=req.params.id
 
  userHelpers.blockedUser(userId).then((BLOCK_USER)=>{
   
   
    res.redirect('/admin/userManagment')
  })
  
   
})




router.get('/unblockedUser/:id',adminLoginHelper, (req,res)=>{
 
  const userId=req.params.id
  
  userHelpers.UnBlockedUser(userId).then(()=>{
    
 
    res.redirect('/admin/userManagment')
  })
  
   
})


router.get('/OrderList',adminLoginHelper, async(req,res)=>{

  let allOrders=await userHelpers.getAllOrders()

  
  

  res.render('admin/order_list',{admin:true,allOrders})
})

router.get('/viewOrderProduct/:id',adminLoginHelper, async(req,res)=>{
  let orderId=req.params.id
  let orderproduct=await productHelpers.orderProductDetails(orderId)
  
  
  if(orderproduct.mode == 'cart'){

    res.render('admin/orderViewProduct',{admin:true,orderproduct,carts:true})

  }else if(orderproduct.mode == 'buyNow'){

    res.render('admin/orderViewProduct',{admin:true,orderproduct,buynow:true})
  }
 
  
  req.session.oldorderid=orderId
  req.session.orderId=false
})



router.get('/change_orderStatus/',adminLoginHelper, (req,res)=>{
  
  
 
 
 let olduserid=req.session.oldorderid

  userHelpers.orderStatus(olduserid,req.query.proId,req.query.status).then((orderId)=>{
 
    req.session.orderId=orderId

    res.redirect('/admin/OrderList')

  }).catch((error)=>{
    console.log('order error==',error);
  })


})


router.get('/add_category',adminLoginHelper, async(req,res)=>{

  let productCategory=await userHelpers.findCategory()
  

  res.render('admin/Add_Category',{admin:true,productCategory})
})

router.post('/addCategory',(req,res)=>{
  

  userHelpers.AddCategory(req.body).then(()=>{

    res.redirect('/admin/add_category')
  })

 
  
}) 

router.get('/DeleteCategory/:id/:category',adminLoginHelper, (req,res)=>{
 

 userHelpers.DeleteProductCategory(req.params.id,req.params.category).then(()=>{

  res.redirect('/admin/add_category')

 })
 
})

router.get('/report',adminLoginHelper, async(req,res)=>{

  let allOrders=await userHelpers.getAllOrders()

  var currentDate=new Date().toISOString().slice(0,10)

  res.render('admin/reports',{admin:true,allOrders,currentDate})

})

router.get('/Add_Coupon',async(req,res)=>{

  let allcoupon=await userHelpers.findAllcoupon()
  let currentDate=new Date().toISOString().slice(0,10)

  res.render('admin/AddCoupon',{admin:true,allcoupon,currentDate,couponAlreadyUsed:req.session.alreadyUsed})
  req.session.alreadyUsed=false
  
})

router.post('/addcoupon',(req,res)=>{
  
 
  userHelpers.Addcoupon(req.body).then((response)=>{

    if(response){

    }else{
      req.session.alreadyUsed=true
    }
    

    res.redirect('/admin/Add_Coupon')
  })
  
})

router.get('/deletecoupon/:id', (req,res)=>{
  
  userHelpers.DeleteCoupon(req.params.id).then((response)=>{

    res.json(response)
  })
})


router.get('/salesReport',async(req,res)=>{

 let BuynowsalesReport=await userHelpers.BuynowFindSalesReport()

 let CartSalesReport=await userHelpers.CartfindSalesReport()
let array = [...BuynowsalesReport,...CartSalesReport]
var currentDate=new Date().toISOString().slice(0,10)

array.sort((a,b)=>{
  let date1 = new Date(a.date),
  date2=new Date(b.date)
  return date2 - date1
})


console.log('qqqqooo00000',array);
  res.render('admin/Sales_Report',{admin:true,array,currentDate})
})


router.get('/ProductOffer',async(req,res)=>{

  let product=await productHelpers.getAllProduct()

  let findproductOffers=await productHelpers.findproductOffers()

  let currentDate=new Date().toISOString().slice(0,10)

  res.render('admin/ProductsOffers',{admin:true,product,findproductOffers,allreadyUsed:req.session.ProductOfferAllreadyUsed,currentDate})
  req.session.ProductOfferAllreadyUsed=false
})

router.post('/submitproductOffer',(req,res)=>{
  

  productHelpers.AddProductOffer(req.body).then((response)=>{
    
    if(response){
      
    }else{
      req.session.ProductOfferAllreadyUsed=true
      
    }
    res.redirect('/admin/ProductOffer')
  })

  
})


router.get('/DeleteProductOffer/:id/:productName',(req,res)=>{

  productHelpers.DeleteProductOffer(req.params.id,req.params.productName).then(()=>{

    res.redirect('/admin/ProductOffer')

  })

})




router.get('/CategoryOffer',async(req,res)=>{
  

  let productCategory=await userHelpers.findCategory()
  let CategoryOffer=await productHelpers.findCategoryOffers()
  let currentDate=new Date().toISOString().slice(0,10)

  res.render('admin/categoryOffers',{admin:true,productCategory,CategoryOffer,allreadyUsed:req.session.CategoryOfferAlreadyUsed,currentDate})
  req.session.CategoryOfferAlreadyUsed=false
})


router.post('/submitCategoryOffer',async(req,res)=>{
  

 let addCategoryOffer=await productHelpers.AddCategoryOffer(req.body)
  
  if(addCategoryOffer){

    addCategoryOffer.map(async(productdetail)=>{
      productHelpers.updateCategoryOfferPrice(productdetail).then(()=>{
  
      
      })
  
    })


  }else{
    req.session.CategoryOfferAlreadyUsed=true
  }
  



  res.redirect('/admin/CategoryOffer')

  
})


router.get('/DeleteCategoryOffer/:id/:category',async(req,res)=>{

let DeleteCategoryOffer=await productHelpers.DeleteCategoryOffer(req.params.id,req.params.category)



DeleteCategoryOffer.map((productdetail)=>{

  productHelpers.changeCategoryOfferpriceToMRP(productdetail).then(()=>{

  })

})

    res.redirect('/admin/CategoryOffer')
  

  
})


router.get('/productStockReport',async(req,res)=>{

 let limitedStock=await productHelpers.findLimitedStock()

  res.render('admin/limitedProduct',{admin:true,limitedStock})
})


router.post('/filterReport',async(req,res)=>{

  var currentDate=new Date().toISOString().slice(0,10)
  
  if(req.body.salesReport == 'true'){

    let BuynowsalesReport=await userHelpers.BuynowFindSalesReport()

    let CartSalesReport=await userHelpers.CartfindSalesReport()
   let array = [...BuynowsalesReport,...CartSalesReport]
  
   let newArray=array.filter(function(el){
     
    return el.date >= req.body.date1 && el.date <= req.body.date2
   })

  
   if(newArray.length == 0){
     var noData=true
   }
  
   newArray.sort((a,b)=>{
    let sortdate1 = new Date(a.date),
    sortdate2=new Date(b.date)
    return sortdate2 - sortdate1
  })
 let salesReport=true

  res.render('admin/filterReports',{admin:true,newArray,salesReport,noData,currentDate})


  }else if(req.body.orderReport == 'true'){

  



let allOrders=await userHelpers.getAllOrders()

  let orderReport=allOrders.filter(function(el){
    return el.date >= req.body.date1 && el.date <= req.body.date2
  })

  if(orderReport.length == 0){
    var noData=true
  }

  orderReport.sort((a,b)=>{
    let sortdate1 = new Date(a.date),
    sortdate2=new Date(b.date)
    return sortdate2 - sortdate1
  })



  let order_report= true

 res.render('admin/filterReports',{admin:true,orderReport,order_report,noData,currentDate})

}

})


router.get('/Add_Ads',async(req,res)=>{

  let CategoryOffer=await productHelpers.findCategoryOffers()
  


  res.render('admin/Add_New_Ads',{admin:true,CategoryOffer})
})


router.post('/add_Adds1',(req,res)=>{


  var categoryName= req.body.category
  userHelpers.Add_Ads_category(req.body).then(()=>{
    const image1 = req.files.image1
     image1.mv('./public/ADS_IMAGES/'+categoryName+'__1.jpg')
    
  })

  res.redirect("/admin/Add_Ads")
})








router.get('/View_Ads',async(req,res)=>{

  let ADSCategory=await userHelpers.find_ADS_details()
  

  res.render('admin/View_all_Ads',{admin:true,ADSCategory})
})

router.get('/Delete_ADS/:category',(req,res)=>{
  
  userHelpers.Delete_ADS(req.params.category).then(()=>{

    res.redirect('/admin/View_Ads')
  })

  
})





router.get('/adminLogOut',(req,res)=>{
  req.session.adminLogin=false
  res.redirect('/admin/admin-login')

})

module.exports = router;
