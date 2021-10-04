var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
const { USER_COLLECTION } = require('../config/collection')
var objectId=require('mongodb').ObjectId
const { response } = require('express')
const { ObjectId } = require('bson')

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            var checkEmail = await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            console.log("Check email");
    
            if(checkEmail==null){ 
            
                userData.password=await bcrypt.hash(userData.password,10)
           var details = await db.get().collection(collection.USER_COLLECTION).insertOne(userData)
           var data = await db.get().collection(collection.USER_COLLECTION).findOne({_id:details.insertedId})
           console.log("enterd in database");
           
           resolve(data)
            
            }
            else{
        
           console.log("email already used");
           resolve(false)
        }
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

    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            const allUsers=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(allUsers)
        })
    },

    blockedUser:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            var BLOCK_USER= await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
           
            resolve(BLOCK_USER)

        })
    },
    
    
    findNumber:(userNum)=>{
        return new Promise(async(resolve,reject)=>{
            userNumber=await db.get().collection(collection.USER_COLLECTION).findOne({mobile:userNum.mobile})
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
            userData.password=await bcrypt.hash(userData.password,10)

            var dataupdated=await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(oldData._id)},{$set:{password:userData.password}})
            resolve(dataupdated)
        })
    },

    addToCart:(proId,userId)=>{

        let proObj={
            item:objectId(proId),
            quantity:1
        }

        return new Promise(async(resolve,reject)=>{
            const userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
                console.log('rtrt=',proExist);
                if(proExist != -1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    resolve()
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
                    console.log('fffff');
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
                        product:{$arrayElemAt:['$product',0]}
                    }
                }



                
                
            ]).toArray()
            console.log("opop==",cartItems[0]);
            console.log('uiuii=');
            console.log('lklkl==',cartItems);
            if(cartItems){
                resolve(cartItems)
            }else{
                resolve(false)
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
                $inc:{'products.$.quantity':detail.count}
            }
            ).then((response)=>{
                console.log('yuyuyu=');
                resolve(true)
            })

            } 


            

        })
    }
    



}