const { response } = require("express");
var express = require("express");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();


/* GET users listing. */
router.get("/", function (req, res, next) {
  res.render("admin/dashboard", { admin: true });
});

router.get("/admin-profile", function (req, res, next) {
  res.render("admin/admin-profile", { admin: true });
});



router.get('/admin-login',(req,res)=>{
  res.render('admin/admin-login')
})





router.get("/userManagment", (req, res) => {
  userHelpers.getAllUsers().then((allUsers)=>{
    res.render("admin/userManagment", { admin: true,allUsers });
  })
  
});

router.get("/add-product", (req, res) => {
  res.render("admin/add-product", { admin: true });
});

router.post("/add-product", (req, res) => {
  console.log("yyyyy==" + req.body);
  console.log("mmm==" + req.files.image1);
  productHelpers.addProduct(req.body).then((id) => {
   const image1 = req.files.image1;
   const image2 = req.files.image2;
   const image3 = req.files.image3;
   image1.mv('./public/product-image/'+id+'__1.jpg')
   image2.mv('./public/product-image/'+id+'__2.jpg')
   image3.mv('./public/product-image/'+id+'__3.jpg')
   res.redirect('/admin/view-product')
  });
});


router.get('/view-product',(req,res)=>{

  productHelpers.getAllProduct().then((product)=>{
    console.log("hhhh==",product);
    res.render('admin/view-product',{admin:true,product})

  })

  
})





router.get('/editProduct/',async(req,res,next)=>{

  const productdetail=await productHelpers.getproductdetails(req.query.id)
  console.log("edit==",productdetail);
  res.render('admin/edit-product',{admin:true,productdetail})
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



router.get('/deleteProduct/:id',(req,res)=>{
  const proId=req.params.id
  console.log("proid==",proId);
  productHelpers.deleteProduct(proId).then((response)=>{
   console.log("ppp",response);
    res.redirect('/admin/view-product')

  })
  
})

// router.get('/blocked-user',(req,res)=>{
  
  
//   res.render('admin/blocked-User',{admin:true})
// })



router.get('/blockedUser/:id',(req,res)=>{
  console.log("strt 123");
  const userId=req.params.id
  console.log("userid==",userId);
  userHelpers.blockedUser(userId).then((BLOCK_USER)=>{
    console.log(BLOCK_USER);
    res.render('admin/blocked-User',{admin:true,BLOCK_USER})
  })
  
  
})




module.exports = router;
