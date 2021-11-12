var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
const { USER_COLLECTION } = require('../config/collection')
var objectId=require('mongodb').ObjectId
const { response } = require('express')
const { ObjectId } = require('bson')
var Razorpay=require('razorpay')
const { resolve } = require('path')


var instance = new Razorpay({
    key_id: 'rzp_test_PjwJi1AI0OquKP',
    key_secret: 'RCMpSKRqXWYqNNjr0GJL7KSE',
  })

	









module.exports={





    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            var checkEmail = await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            console.log("Check email");
            var checkMobile =await db.get().collection(collection.USER_COLLECTION).findOne({mobile:userData.mobile})
    
            if(checkEmail == null && checkMobile == null){ 
                resolve(response)
            
        //         userData.password=await bcrypt.hash(userData.password,10)
        //    var details = await db.get().collection(collection.USER_COLLECTION).insertOne(userData)
        //    var data = await db.get().collection(collection.USER_COLLECTION).findOne({_id:details.insertedId})
        //    console.log("enterd in database");
           
        //    resolve(data)
            
            }
            else{
        
           console.log("email already used");
           
           resolve(false)
        }
        })
    
    },
    
    signupOTPsuccess:(userdetail)=>{

        return new Promise(async(resolve,reject)=>{

            userdetail.password=await bcrypt.hash(userdetail.password,10)
           var details = await db.get().collection(collection.USER_COLLECTION).insertOne(userdetail)
           var data = await db.get().collection(collection.USER_COLLECTION).findOne({_id:details.insertedId})
           console.log("enterd in ");
           
           resolve(data)


        })





    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginstatus=false
            
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            
            if(user){
                
                bcrypt.compare(userData.password,user.password).then((status)=>{
                   
                    if(status){
                        console.log("login success"); 
                        response.user=user
                        response.status=true
                        console.log(response)
                        resolve(response)
                    }else{
                        console.log("login failed");
                        resolve({status:false})
                    }
                })
            }else{
                console.log("login error");
                resolve({status:false})
            }

        })
    },
    
    loginWithOTP:(detail)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({mobile:detail.mobile,countryCode:detail.countryCode})
            if(user){
                console.log('numberiiiiiii==',user)
                response.user=user
                response.status=true
                resolve(response)
            }else{
                resolve(false)
            }

        })

    },

    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            const allUsers=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(allUsers)
        })
    },

    blockedUser:(userId)=>{
        console.log('user111==',userId);
        return new Promise(async(resolve,reject)=>{
           var BLOCK_USER = await db.get().collection(collection.USER_COLLECTION).update({_id:objectId(userId)},
                {$set:{block:'false'}})
                console.log('rrrr=',BLOCK_USER);
                resolve(BLOCK_USER)
            
            
           
            


        })
    },
    
    findBlockedUsers:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).find({block:'false'}).toArray().then((response)=>{
                resolve(response)
            })

        })
    },
    
    
    findNumber:(userNum)=>{
        return new Promise(async(resolve,reject)=>{
            userNumber=await db.get().collection(collection.USER_COLLECTION).findOne({mobile:userNum.mobile,countryCode:userNum.countryCode})
            console.log('usernumber==',userNumber);
            if(userNumber){
                resolve(userNumber)
            }else{
                console.log('falsss');
                resolve(false)
            }
        })
    },
    changePassword:(userData,oldData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.password=await bcrypt.hash(adduserData.password,10)

            var dataupdated=await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(oldData._id)},{$set:{password:userData.password}})
            resolve(dataupdated)
        })
    },
    
    Findprodetails:(proId)=>{
        return new Promise(async(resolve,reject)=>{
            let proDetails=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
            resolve(proDetails)

        })

    },

    addToCart:(proId,userId,price,productdetail)=>{
        console.log('frrrrfr==',proId)
        console.log('jhjhj==',productdetail)
       
        let proObj={
            item:objectId(proId),
            quantity:1,
            price:parseInt(productdetail.newprice),
            totalprice:parseInt(productdetail.newprice),
            status:'Pending',
            category:productdetail.category,
            productName:productdetail.productName,
            discription:productdetail.discription

        }
   
    
       
        return new Promise(async(resolve,reject)=>{

 
            const userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
                console.log('rtrt=',proExist)
                if(proExist != -1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then((response)=>{
                    resolve(response)
                })
            }else{

                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId)},
                {
                    
                        $push:{products:proObj}
                    
                }).then((response)=>{
                    resolve(response)
                })

            }   

            }else{
                const cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    console.log('fffff')
                    resolve(response)
                })
            }
        })

    },

    getCartProducts:(userId)=>{
        
        return new Promise(async(resolve,reject)=>{
            const cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        totalprice:'$products.totalprice'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        totalprice:1,
                        product:{$arrayElemAt:['$product',0]},
                        
                    }
                }



                
                
            ]).toArray()
           
            // if(cartItems){
            //     resolve(cartItems)
            // }else{
            //     resolve(false)
            // }
            
            if (cartItems[0]) {
                for (key in cartItems){
                  product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(cartItems[key].item)})
                  db.get().collection(collection.CART_COLLECTION).updateOne({products:{$elemMatch:{item:objectId(product._id)}}},{
                    $set:{
                     'products.$.newprice':product.newprice,
                     'products.$.totalprice':cartItems[key].quantity * product.newprice
                    }
                  }).then(()=>{
                    resolve(cartItems)
                  })
                }
                
              } else {
                resolve(false);
              }
               
            
            
        })

    },

    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },



    changeProductQuantity:(detail)=>{
        
        
        detail.count=parseInt(detail.count)
        detail.quantity=parseInt(detail.quantity)
        detail.price = parseInt(detail.price)
                                                                        
        return new Promise((resolve,reject)=>{

            if(detail.count==-1 && detail.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:objectId(detail.cart)},
                    {
                        $pull:{products:{item:objectId(detail.product)}}
                    }
                    ).then((response)=>{
                        resolve({removeProduct:true})
                    })
            }else{

                db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(detail.cart),'products.item':objectId(detail.product)},
            {
                $inc:{'products.$.quantity':detail.count,'products.$.totalprice':detail.price*detail.count}
            }    
            ).then((response)=>{
               
                resolve({status : true})
            })

            } 
   

            
  
        })
    },
    
    UnBlockedUser:(userId)=>{
     
        return new Promise(async(resolve,reject)=>{
           var BLOCK_USER = await db.get().collection(collection.USER_COLLECTION).update({_id:objectId(userId)},
                {$set:{block:'true'}})
                console.log('rrrr=',BLOCK_USER)
                resolve(BLOCK_USER)
            
            
           
            


        })
    },
    
    
    RemoveCart:(CartDetail)=>{
        
        
        
        return new Promise(async(resolve,reject)=>{

            await db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(CartDetail.cart)},
            {
                $pull:{products:{item:objectId(CartDetail.product)}}
            }).then((response)=>{
                resolve(response)
            })

        })
    },

    getTotalPrice:(userId)=>{
       
        return new Promise(async(resolve,reject)=>{
            let cartPrice=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {             
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        totalprice:'$products.totalprice'
                        
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        totalprice:1,
                        product:{$arrayElemAt:['$product',0]}
                       
                        
                        
                    }
                },
                {

                    $group:{   
                       
                        _id:null,
                        cartPrice:{$sum:'$totalprice'}
                    }

                } 

         

                                                         
                  
            ]).toArray()
            if(cartPrice[0]){
                
                resolve(cartPrice[0].cartPrice)
            }else{
                
                resolve()
            }
            
            
        })
 
 
    },
    placeOrder:(order,cartProduct,GrandTotal)=>{
        return new Promise((resolve,reject)=>{
           

            let status=order['payment']==='COD'?'Placed':'Pending'
            let orderObject={
                deliveryDetails:{
                    fname:order.fname,
                    lname:order.lname,
                    house_name:order.house_name,
                    address1:order.address1,
                    address2:order.address2,
                    town_city:order.town_city,
                    country_state:order.country_state,
                    pincode_zip:order.pincode_zip
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment'],
                products:cartProduct,
                status:status,
                GrandTotal:GrandTotal,
                mode:'cart',
                
                date:new Date().toISOString().slice(0,10)   //+" "+new Date().toISOString().slice(11,19)
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObject).then((response)=>{
                

                resolve(response.insertedId)
              
            })

        })

    },
    DeleteUserCart:(userId)=>{
        return new Promise((resolve,reject)=>{

            db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(userId)}).then(()=>{
                resolve()
            })
        })

    },


    getCartProductList:(userId)=>{

        return new Promise(async(resolve,reject)=>{
            let cartProduct=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
           console.log('mm....llll.....===',cartProduct);
            resolve(cartProduct.products)
            
        })

    },

    getuserOrders:(userId)=>{
       
        return new Promise(async(resolve,reject)=>{
            let userorders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).sort({date:-1}).toArray()
            resolve(userorders)
          
            
 
        })

    },

    getorderproducts:(orderId)=>{
       
        return new Promise(async(resolve,reject)=>{

            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        price:'$products.price',
                        totalprice:'$products.totalprice',
                        status:'$products.status'
                        
                    }
                    
                },

                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        price:1,
                        totalprice:1,
                        status:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                } 

            ]).toArray()
           
            
            resolve(orderItems)
            

        })

    },

    generateRazorpay:(orderId,GrandTotal)=>{
        return new Promise((resolve,reject)=>{

            var options = {
                amount: GrandTotal*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                  if(err){
                      console.log('hjhj==',err)
                  }else{

                    console.log('tytytytyt==',order)
                    resolve(order)

                  }
                
              })
            
        })
    },

    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256','RCMpSKRqXWYqNNjr0GJL7KSE')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')

            if(hmac=details['payment[razorpay_signature]']){
                resolve()

            }else{
                reject()
            }

        })

    },

    changePaymentStatus:(orderId)=>{

        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'Placed'
                }
            }
            ).then(()=>{
                resolve()
            })

        })

    },

    editProfile:(detail,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let editedProfile=await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
            
            {$set:{username:detail.username,
                mobile1:detail.mobile1,
                houseName1:detail.houseName1,
                place1:detail.place1,
                city1:detail.city1,
                state1:detail.state1,
                country1:detail.country1,
                pincode1:detail.pincode1

            }}
            )
            
            resolve(editedProfile)


        })

    },


    getUserDetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userdetail=await db.get().collection(collection.USER_COLLECTION).find({_id:objectId(userId)}).toArray()
            
            resolve(userdetail[0])

        })

    },





    getAllOrders:()=>{

        return new Promise(async(resolve,reject)=>{
            let allorders=await db.get().collection(collection.ORDER_COLLECTION).find().sort({date:-1}).toArray()

            resolve(allorders)
        })
    },  

    buyNow:(proId)=>{
        return new Promise(async(resolve,reject)=>{

          let productdetail=await db.get().collection(collection.PRODUCT_COLLECTION).find({_id:objectId(proId)}).toArray()
          
          
            resolve(productdetail[0])
        })

    },
    BuynowPlaceOrder:(order,orderproduct,productprice)=>{

        let buynowproductprice=parseInt(productprice)
        console.log('ooooooooooooooooooooooooooooooooo',orderproduct)
        return new Promise(async(resolve,reject)=>{
            
            

            let status=order['payment']==='COD'?'Placed':'Pending'
            let orderObject={
                deliveryDetails:{
                    fname:order.fname,
                    lname:order.lname,
                    house_name:order.house_name,
                    address1:order.address1,
                    address2:order.address2,
                    town_city:order.town_city,
                    country_state:order.country_state,
                    pincode_zip:order.pincode_zip
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment'],
                proId:orderproduct._id,
                productName:orderproduct.productName,
                category:orderproduct.category,
                discription:orderproduct.discription,
                oldprice:orderproduct.oldprice,
                newprice:orderproduct.newprice,
                status:status,
                productprice:buynowproductprice,
                mode:'buyNow',
                coupon:order.coupon,
                
                date:new Date().toISOString().slice(0,10)  //+" "+new Date().toISOString().slice(11,19)
            }

           await db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObject).then((response)=>{
                // db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})

                resolve(response.insertedId)
               
            })

 


        })

    },
    
    
    BuynowProductDetails:(orderId)=>{
        return new Promise(async(resolve,reject)=>{

           let detail=await db.get().collection(collection.ORDER_COLLECTION).find({_id:objectId(orderId)}).toArray()

                console.log('xxxxxxxxxxzzzzzzzz==',detail);
                console.log('');
                resolve(detail[0])


        })

    },
    
    findorder:(orderId)=>{

        return new Promise(async(resolve,reject)=>{
            let order=await db.get().collection(collection.ORDER_COLLECTION).find({_id:objectId(orderId)}).toArray()
            console.log('ggggggppppppp',order);
            resolve(order[0])
            
        })

    },

    orderInvoiceDetails:(orderId)=>{

        
        return new Promise(async(resolve,reject)=>{

            let invoiceDetails=await db.get().collection(collection.ORDER_COLLECTION).find({_id:objectId(orderId)}).toArray()
            
            console.log('_____++++++++++++',invoiceDetails);
            
        
            resolve(invoiceDetails[0])


        })


    },

    addnewAddress:(detail,userId)=>{

        return new Promise(async(resolve,reject)=>{

            let addressdetails={
                userId:userId,
                fname:detail.fname,
                lname:detail.lname,
                house_name:detail.house_name,
                address1:detail.address1,
                address2:detail.address2,
                town_city:detail.town_city,
                country_state:detail.country_state,
                pincode_zip:detail.pincode_zip,
                phone:detail.phone

            }

            let newaddress=await db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addressdetails)

           
            resolve(newaddress)

        })

    },
    
    
    DeleteUserNewAddress:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({userId:userId}).then(()=>{
                resolve()
            })
        })

    },

    addtoWishlist:(proId,userId)=>{
        
        return new Promise(async(resolve,reject)=>{
            

            let checkingWishlist=await db.get().collection(collection.WISH_LIST_COLLECTION).findOne({proId:objectId(proId)})
            
            if(checkingWishlist==null){


                let productdetail=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})

            
                // resolve(productdetail)
                let wishlistObj={
                    userId:objectId(userId),
                    proId:productdetail._id,
                    wishlist:productdetail,
                    productIn:true
                    

                    
                }

                let userwishlist=await db.get().collection(collection.WISH_LIST_COLLECTION).insertOne(wishlistObj)

                resolve(userwishlist)
                console.log('aaaaaaaaaaaaaaaa===',userwishlist)
            }else{
               let wishlist={
                   productIn:true
               }
               console.log('xxxxxxxxxxxxxxx==',wishlist)
                resolve(wishlist)
            }



            

            
            

        })


    },


    showUserWishlist:(userId)=>{
        
        return new Promise(async(resolve,reject)=>{
            let wishList=await db.get().collection(collection.WISH_LIST_COLLECTION).find({userId:objectId(userId)}).toArray()

            
            resolve(wishList)
        })

    },


    findUserAddress:(userId)=>{
       
        return new Promise(async(resolve,reject)=>{

            let address=await db.get().collection(collection.ADDRESS_COLLECTION).find({userId:userId}).toArray()

           

            resolve(address)

        })


    },

    orderStatus:(orderId,proId,statusUpdate)=>{
        
 

        return new Promise(async(resolve,reject)=>{
            let checkorder=await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
            

            if(checkorder.mode == 'cart'){
                console.log('caaarrrttt');
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId), products:{$elemMatch:{item:objectId(proId)}}},
                {
                    $set:{
                        "products.$.status":statusUpdate
                    }
                }
                ).then(()=>{
                    resolve(orderId)
                })

            }else if(checkorder.mode == 'buyNow'){
                console.log('dddddddddddddddd');
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{$set:{status:statusUpdate}}).then((orderId)=>{
                    resolve(orderId)
                })

            }
 

 
        }) 
 
    },

    AddCategory:(detail)=>{

        return new Promise(async(resolve,reject)=>{

            let categoryadded=await db.get().collection(collection.CATEGORY_COLLECTION).insertOne(detail)

            resolve(categoryadded)

        })

    },

    findCategory:()=>{

        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((response)=>{
                resolve(response)
            })
        })

    },

    DeleteProductCategory:(categoryId,categoryName)=>{

        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(categoryId)}).then((response)=>{
                
                db.get().collection(collection.PRODUCT_COLLECTION).deleteMany({category:categoryName})

                db.get().collection(collection.CART_COLLECTION).update({},{$pull:{products:{category:categoryName}}})

                resolve(response)
            }) 

        })  

    },


    DisplayCategory:(category)=>{

        return new Promise(async(resolve,reject)=>{

            let categoryItems=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:category}).toArray()

            
            resolve(categoryItems)

        })

    },


    DeleteWishlist:(proId)=>{
        
        return new Promise(async(resolve,reject)=>{




            db.get().collection(collection.WISH_LIST_COLLECTION).deleteOne({proId:objectId(proId)}).then((response)=>{
               
                resolve(response)
            })

            

        })

    },

    TotalUser:()=>{

        return new Promise(async(resolve,reject)=>{

            let total=await db.get().collection(collection.USER_COLLECTION).find().count()

            
            resolve(total)

        })

    },

    TotalProduct:()=>{
        return new Promise(async(resolve,reject)=>{
            let producttotal=await db.get().collection(collection.PRODUCT_COLLECTION).find().count()

            resolve(producttotal)
        })
    },

    CartTotalRevenue:()=>{
        return new Promise(async(resolve,reject)=>{
            let revenueTotal=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $group:{   
                       
                        _id:null,
                        totalRevenue:{$sum:'$GrandTotal'}
                    }
                }
            ]).toArray()
            if(revenueTotal[0]){
                resolve(revenueTotal[0].totalRevenue)
            }else{
                let newgg=0
                resolve(newgg)
            }

            
            
        })
    },
    
    BuyNowTotalRevenue:()=>{
        return new Promise(async(resolve,reject)=>{

            let buyrevenueTotal=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $group:{   
                       
                        _id:null,
                        buynowTotal:{$sum:'$productprice'}
                    }
                }
            ]).toArray()

            console.log('///////;;;//;;/;/;===',buyrevenueTotal);
            if(buyrevenueTotal[0]){

            resolve(buyrevenueTotal[0].buynowTotal)


            }else{
                let buynow=0
                resolve(buynow)
            }

        })

    },
    


    TotalCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category=await db.get().collection(collection.CATEGORY_COLLECTION).find().count()

            console.log('qqqqqqqq===',category)
            resolve(category)

        })
    },

    cartStockupdate:(products)=>{
       
        console.log('xxxxxxxxx====',products)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(products.item)},{$inc:{qty:-products.quantity}}).then(()=>{
                resolve()
            })
        })

    },

    findAllorderStatus:()=>{
        return new Promise(async(resolve,reject)=>{
            let TotalbuynowOrder=await db.get().collection(collection.ORDER_COLLECTION).count({mode:'buyNow'})
            let TotalCartOrder=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
               
                {
                   $unwind:"$products"
                },
                {             
                    $project:{
                        
                        quantity:'$products.quantity'
                        
                        
                    }
                },
                {
                    $group:{
                        _id:null,
                        products:{$sum:"$quantity"}
                    }
                }
                
            ]).toArray()
            if(TotalCartOrder[0]){
                
                var totalcart=TotalCartOrder[0].products
            }else{
                totalcart=0
            }


            let buynowCancell=await db.get().collection(collection.ORDER_COLLECTION).count({mode:'buyNow',status:'Cancelled'})
            let cartCancell=await db.get().collection(collection.ORDER_COLLECTION).aggregate([{$match:{mode:"cart"}},
            { 
                $unwind:"$products"
            },
            {
                $match:{"products.status":"Cancelled"}
            },
            {             
                $project:{
                    
                    quantity:'$products.quantity'
                    
                    
                }
            },
            {
                $group:{
                    _id:null,
                    quantity:{$sum:"$quantity"}
                }
            }
    ]).toArray()
    if(cartCancell[0]){
        //resolve(cartCancell)
        var totalcartcancel=cartCancell[0].quantity
        
    }else{
        totalcartcancel = 0
        //resolve(false)
    }


   
   
    let totalOrder=TotalbuynowOrder+totalcart
    let totalcancel=buynowCancell+totalcartcancel
        

        let buynowDelivered=await db.get().collection(collection.ORDER_COLLECTION).count({mode:'buyNow',status:'Delivered'})
        let cartDelivered=await db.get().collection(collection.ORDER_COLLECTION).aggregate([{$match:{mode:"cart"}},
            { 
                $unwind:"$products"
            },
            {
                $match:{"products.status":"Delivered"}
            },
            {             
                $project:{
                    
                    quantity:'$products.quantity'
                    
                    
                }
            },
            {
                $group:{
                    _id:null,
                    quantity:{$sum:"$quantity"}
                }
            }
        ]).toArray()
        if(cartDelivered[0]){
          
            var totalcartDelivered=cartDelivered[0].quantity
            
        }else{
            totalcartDelivered = 0
          
        }
           
        let totalDelivered=buynowDelivered+totalcartDelivered


        let buynowPending=await db.get().collection(collection.ORDER_COLLECTION).count({mode:'buyNow',status:'Pending'})
        
        let cartPending=await db.get().collection(collection.ORDER_COLLECTION).aggregate([{$match:{mode:"cart"}},
            { 
                $unwind:"$products"
            },
            {
                $match:{"products.status":"Pending"}
            },
            {             
                $project:{
                    
                    quantity:'$products.quantity'
                    
                    
                }
            },
            {
                $group:{
                    _id:null,
                    quantity:{$sum:"$quantity"}
                }
            }
        ]).toArray()
        if(cartPending[0]){
          
            var totalcartPending=cartPending[0].quantity

        }else{
            totalcartPending = 0
       
        }
        
        
        let totalPending=buynowPending+totalcartPending

    
        let buynowPlaced=await db.get().collection(collection.ORDER_COLLECTION).count({mode:'buyNow',status:'Placed'})

        let cartPlaced=await db.get().collection(collection.ORDER_COLLECTION).aggregate([{$match:{mode:"cart"}},
            { 
                $unwind:"$products"
            },
            {
                $match:{"products.status":"Placed"}
            },
            {             
                $project:{
                    
                    quantity:'$products.quantity'
                    
                    
                }
            },
            {
                $group:{
                    _id:null,
                    quantity:{$sum:"$quantity"}
                }
            }
        ]).toArray()
        if(cartPlaced[0]){
           
            
            var totalcartPlaced=cartPlaced[0].quantity

        }else{
            totalcartPlaced = 0
       
        }

        let totalPlaced=buynowPlaced+totalcartPlaced


       

        let buynowShipped=await db.get().collection(collection.ORDER_COLLECTION).count({mode:'buyNow',status:'Shipped'})

        let cartShipped=await db.get().collection(collection.ORDER_COLLECTION).aggregate([{$match:{mode:"cart"}},
            { 
                $unwind:"$products"
            },
            {
                $match:{"products.status":"Shipped"}
            },
            {             
                $project:{
                    
                    quantity:'$products.quantity'
                    
                    
                }
            },
            {
                $group:{
                    _id:null,
                    quantity:{$sum:"$quantity"}
                }
            }
        ]).toArray()
        if(cartShipped[0]){
            
            var totalcartShipped=cartShipped[0].quantity

        }else{
            totalcartShipped = 0
        
        }

        let totalShipped=buynowShipped+totalcartShipped


            
            let count ={}
            count.totalOrder = totalOrder
            count.totalcancel = totalcancel
            count.totalPending = totalPending
            count.totalDelivered=totalDelivered
            count.totalPlaced = totalPlaced
            count.totalShipped = totalShipped

            console.log('kkkkkk==',count);
            resolve(count)
            
        })
       

    },

    findpaymentMethod:()=>{
        return new Promise(async(resolve,reject)=>{
            let COD=await db.get().collection(collection.ORDER_COLLECTION).count({paymentMethod:'COD'})
            let online=await db.get().collection(collection.ORDER_COLLECTION).count({paymentMethod:'Online'})
            let payment={}
            payment.COD=COD
            payment.online=online

            resolve(payment)
            console.log('/===========000000==',payment)
        })

    },
    
    
    findMonthSalesReport:()=>{
        return new Promise(async(resolve,reject)=>{
            let buyNowWeekendSales=await db.get().collection(collection.ORDER_COLLECTION).find({mode:'buyNow',status:'Delivered'}).sort({date:-1}).limit(7).toArray()
            console.log('<<<<[{{{{{}}}{}{}{{{{{{}{}{{}{}{}{{{}}',buyNowWeekendSales)
            resolve(buyNowWeekendSales)

        })
    },

    Addcoupon:(couponData)=>{
       
        return new Promise(async(resolve,reject)=>{
            let checkCoupon=await db.get().collection(collection.COUPON_COLLECTION).findOne({couponName:couponData.couponName})

            if(checkCoupon == null){

                db.get().collection(collection.COUPON_COLLECTION).insertOne(couponData).then(()=>{
                    resolve()
                    
                })

            }else{
                let couponAlreadyUsed=true
                
                resolve(couponAlreadyUsed)
            }


        })
    },

    findAllcoupon:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((response)=>{
                resolve(response)
            })
            
        })
    },

    DeleteCoupon:(couponId)=>{
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(couponId)}).then((response)=>{
                resolve(response)
            })

        })
    },

    BuyNowcheckingCouponExist:(couponCode,productprice,userId)=>{
        console.log('userid checckiiing      =',userId)
        return new Promise(async(resolve,reject)=>{
            let coupon =await db.get().collection(collection.COUPON_COLLECTION).findOne({couponName:couponCode})
            
            if(coupon){
                let checkingalreadyUsingCoupon=await db.get().collection(collection.ORDER_COLLECTION).findOne({userId:objectId(userId),coupon:couponCode})

                console.log('<<<<<<<<<<[[[<<<<<<==',checkingalreadyUsingCoupon)
                if(checkingalreadyUsingCoupon == null){

                    var couponSuccess = {}

                    couponSuccess.discountprice = (productprice*coupon.couponOffer)/100
                    couponSuccess.finalprice = productprice-couponSuccess.discountprice
    
                    resolve(couponSuccess)
                    
                }else{
                    var couponSuccess = {}
                    couponSuccess.discountprice=0
                    couponSuccess.finalprice=productprice - 0
                    couponSuccess.alreadyCouponUsed=true
    
                    resolve(couponSuccess)
                    
                }

                }else{
                    var couponSuccess = {}
                    couponSuccess.discountprice=0
                    couponSuccess.finalprice=productprice - 0
                    couponSuccess.couponInvalid=true
    
                    resolve(couponSuccess)
                }


        })
    },

    CartCouponChecking:(couponCode,GrandTotal,userId)=>{

        return new Promise(async(resolve,reject)=>{
            let coupon =await db.get().collection(collection.COUPON_COLLECTION).findOne({couponName:couponCode})
            
            if(coupon){
                let checkingalreadyUsingCoupon=await db.get().collection(collection.ORDER_COLLECTION).findOne({userId:objectId(userId),coupon:couponCode})

                console.log('<<<<<<<<<<[[[<<<<<<==',checkingalreadyUsingCoupon)
                if(checkingalreadyUsingCoupon == null){

                    var couponSuccess = {}

                    couponSuccess.discountprice = (GrandTotal*coupon.couponOffer)/100
                    couponSuccess.finalprice = GrandTotal-couponSuccess.discountprice
    
                    resolve(couponSuccess)
                    
                }else{
                    var couponSuccess = {}
                    couponSuccess.discountprice=0
                    couponSuccess.finalprice=GrandTotal - 0
                    couponSuccess.alreadyCouponUsed=true
    
                    resolve(couponSuccess)
                    
                }

                }else{
                    var couponSuccess = {}
                    couponSuccess.discountprice=0
                    couponSuccess.finalprice=GrandTotal - 0
                    couponSuccess.couponInvalid=true
    
                    resolve(couponSuccess)
                }


        })

    },

    BuynowFindSalesReport:()=>{
        return new Promise(async(resolve,reject)=>{
           let buynowSalesReport =await db.get().collection(collection.ORDER_COLLECTION).find({mode:'buyNow',status:'Delivered'}).toArray()
           resolve(buynowSalesReport)

        })
    },

    CartfindSalesReport:()=>{
        return new Promise(async(resolve,reject)=>{
            let cartSalesReport=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        mode:'cart'
                    }
                },
                {
                    $unwind:"$products"
                },
                {
                    $match:{
                        "products.status":'Delivered'
                    }
                }
            ]).toArray()


            resolve(cartSalesReport)
        })
    },


    FindUserOrderedProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userorderedProduct=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).sort({date:-1}).limit(12).toArray()
            console.log('hhhhhhh[[[[[[[[[[[[[[==',userorderedProduct)
            resolve(userorderedProduct)

        })
    },


    SearchDatas:(searchData)=>{
        console.log('%%%%%%%%%%%%%%%',searchData);
       
        
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).createIndex( { productName: "text" } ).then(async()=>{

            })

                let result=await db.get().collection(collection.PRODUCT_COLLECTION).find({ $text: { $search: searchData } }).toArray()

           
           

           console.log('---------------',result)
           resolve(result)

        })

    },

    checkCouponValidity:()=>{
        return new Promise(async(resolve,reject)=>{
            let currentDate=new Date().toISOString().slice(0,10)
            let couponValidity=await db.get().collection(collection.COUPON_COLLECTION).find({offerlimit:{$lte:currentDate}}).toArray()

            resolve(couponValidity)
        })
    },


    Add_Ads_category:(detail)=>{
        return new Promise(async(resolve,reject)=>{

            let checkAds=await db.get().collection(collection.ADS___COLLECTION).findOne({category:detail.category})

            if(checkAds == null){

                db.get().collection(collection.ADS___COLLECTION).insertOne(detail).then(()=>{
                   
                    resolve()
                })


            }else{
                resolve(false)
            }


            
        })
    },


    find_ADS_details:()=>{
        return new Promise(async(resolve,reject)=>{
          let findAds=await  db.get().collection(collection.ADS___COLLECTION).find().toArray()
            resolve(findAds)
        })

    },


    Delete_ADS:(category)=>{
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADS___COLLECTION).deleteOne({category:category}).then((response)=>{
                resolve(response)
            })
        })

    }


  
    



} 