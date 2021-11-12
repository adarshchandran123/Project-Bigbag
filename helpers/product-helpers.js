var db = require("../config/connection");
var collection = require("../config/collection");
const { response } = require("express");
var objectId=require('mongodb').ObjectId

module.exports = {
  addProduct: async (product) => {
   

    product.date= new Date()

    

    product.qty=parseInt(product.qty)

    product.newprice=parseInt(product.newprice)

    console.log('jjjj',product)
    
    const data = await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product);
    console.log(data.insertedId)
    return data.insertedId
  },


  getAllProduct:()=>{
    
    return new Promise(async(resolve,reject)=>{
        const product=await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({date:-1}).toArray()
        resolve(product)
    })

  },
  deleteProduct:(proId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{
       console.log("yy==",response);
        resolve(response)
      })
    })
  },

  getproductdetails:(proId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
        resolve(product)
      })
    })
  },

  getnewArrival:()=>{
    return new Promise(async(resolve,reject)=>{
      const arrival=await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({date:-1}).limit(8).toArray()
      resolve(arrival)
    })
  },

  updateproduct:(proId,proDetails)=>{
    return new Promise((resolve,reject)=>{
      proDetails.qty = parseInt(proDetails.qty)
      proDetails.newprice=parseInt(proDetails.newprice)

      console.log('bbbbbbbbbbbbbbbbbbb==',proDetails)

        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
        {$set:{productName:proDetails.productName,
              category:proDetails.category,
              discription:proDetails.discription,
              oldprice:proDetails.oldprice,
              newprice:proDetails.newprice,
              date:new Date(),
              qty:proDetails.qty,

      }
    
  }).then((response)=>{
  
      resolve(response)
  })
            
    })
},

orderProductDetails:(orderId)=>{
  return new Promise(async(resolve,reject)=>{
    let orderdetails=await db.get().collection(collection.ORDER_COLLECTION).find({_id:objectId(orderId)}).toArray()
    
    resolve(orderdetails[0])

  })

},

buynowProductQuantityupdate:(proId)=>{

  return new Promise((resolve,reject)=>{
    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{$inc:{qty:-1}}).then((data)=>{
      console.log('enter quchangeantity ');
      resolve(data)
      
    })
 
  }) 


},


UserCancellProduct:(proId,orderId,quantity)=>{
  return new Promise(async(resolve,reject)=>{
    let Quantity=parseInt(quantity)

    let order=await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
    console.log('000000000000000000==',order);
    
    if(order.mode == 'buyNow'){

      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{$inc:{qty:1}})
      
      db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{$set:{status:'Cancelled'}}).then(()=>{
        resolve()
      }) 
 
    }else if(order.mode == 'cart'){
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{$inc:{qty:Quantity}})
      
      db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId),products:{$elemMatch:{item:objectId(proId)}}},{$set:{"products.$.status":'Cancelled'}}).then(()=>{
        resolve()
      })
 
    }



  })

},

AddCategoryOffer:(detail)=>{
  detail.offer=parseInt(detail.offer)

  detail.offerStartingDate=new Date().toISOString().slice(0,10)

  
  

  return new Promise(async(resolve,reject)=>{

    let findCategoryOffer=await db.get().collection(collection.CATEGORY_OFFER_COLLECTION).findOne({category:detail.category})

    if(findCategoryOffer == null){

      let offerUpdate=await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({category:detail.category},{
        $set:{
          offer:detail.offer
        }
      })
      
      let findAllCategoryOffers=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:detail.category}).toArray()

      // findAllCategoryOffers.map((productdetail)=>{
      //   db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productdetail._id)},
      //   {$set:{
      //     offerpricees:productdetail.newprice-(productdetail.newprice*percentage)
      //   }})
      // })


    //  db.get().collection(collection.PRODUCT_COLLECTION).updateMany({category:detail.category},
    //     {$set:{
    //       offerpricees : 500-"$newprice" //"newprice"-(parseInt("newprice") * percentage)
    //     }
    // },{multi : true}).then((response)=>{
    //   console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",response)
      
      
    //   resolve(response)
    // })
       
        

   

      
    resolve(findAllCategoryOffers)
      

      let insertoffer=await db.get().collection(collection.CATEGORY_OFFER_COLLECTION).insertOne(detail)

      
      
     
    }else{
      resolve(false)
    }

    // db.employee.aggregate([{$match: {department: "HR"}},
    // {$project: {name: 1, newSalary: {$multiply: ["$details.salary", 3]}}}])
    
    




    

  })
},


updateCategoryOfferPrice:(productdetail)=>{

  return new Promise((resolve,reject)=>{
    let percentage=productdetail.offer/100
    console.log('jjj======',percentage)
    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productdetail._id)},
    {$set:{
      MRP:productdetail.newprice,
      newprice:productdetail.newprice-(productdetail.newprice * percentage)
    }}).then((response)=>{
      resolve(response)
    })

    
  })

},

findCategoryOffers:()=>{
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.CATEGORY_OFFER_COLLECTION).find().toArray().then((response)=>{
      resolve(response)
    })
  })


},

DeleteCategoryOffer:(categoryId,category)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.CATEGORY_OFFER_COLLECTION).deleteOne({_id:objectId(categoryId)}).then(async(response)=>{

      let removeOffers=await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({category:category},
        {$unset:{
          offer:1
        }})

        let removeCategory_ADS=await db.get().collection(collection.ADS___COLLECTION).deleteOne({category:category})

      let findprodetails=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:category}).toArray()  

      resolve(findprodetails)
    })
  })

},

changeCategoryOfferpriceToMRP:(productdetail)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productdetail._id)},
    {$set:{
      newprice:productdetail.MRP
      

    }}).then((response)=>{
      resolve(response)
    })

  })

},

AddProductOffer:(detail)=>{
  return new Promise(async(resolve,reject)=>{
    detail.offerStartingDate=new Date().toISOString().slice(0,10)
    detail.offer=parseInt(detail.offer)
    let percentage=detail.offer/100

    

    let checkProduct=await db.get().collection(collection.PRODUCT_OFFER_COLLECTION).findOne({productName:detail.productName})
    if(checkProduct == null){

      let findProduct=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({productName:detail.productName})

      let checkproductCategoryOffer=await db.get().collection(collection.CATEGORY_OFFER_COLLECTION).findOne({category:findProduct.category})

      if(checkproductCategoryOffer == null){

        let ProductofferUpdate=await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({productName:detail.productName},{
          $set:{
            offer:detail.offer,
            MRP:findProduct.newprice,
            newprice:findProduct.newprice - (findProduct.newprice * percentage)
            
            
          }
        })
  
        let insertoffer=await db.get().collection(collection.PRODUCT_OFFER_COLLECTION).insertOne(detail)
        resolve(response)

      }else{
        let response=false
        resolve(response)
      }

      
    }else{
      let response=false
      resolve(response)
    }


  })

},

findproductOffers:()=>{
  return new Promise(async(resolve,reject)=>{
    let findproductOffers=await db.get().collection(collection.PRODUCT_OFFER_COLLECTION).find().toArray()

    resolve(findproductOffers)

  })
},

DeleteProductOffer:(offerId,productName)=>{
  return new Promise(async(resolve,reject)=>{
   let deleteOffer=await db.get().collection(collection.PRODUCT_OFFER_COLLECTION).deleteOne({_id:objectId(offerId)})

   let channgeProductOffer=await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({productName:productName},
    {$unset:{
      offer:1
    }})

    let findProduct=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({productName:productName})

    let channgeProductOfferPrice=await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({productName:productName},
      {$set:{
        newprice:findProduct.MRP
      }})
    
    resolve()

  })
},

findLimitedStock:()=>{
  return new Promise(async(resolve,reject)=>{
   let findStock=await db.get().collection(collection.PRODUCT_COLLECTION).find({qty:{$lte:10}}).toArray()

   console.log(']===================================',findStock)
   resolve(findStock)
  })

},

checkCategoryOfferValidity:()=>{
  return new Promise(async(resolve,reject)=>{
    let currentDate=new Date().toISOString().slice(0,10)

    let CheckValidity=await db.get().collection(collection.CATEGORY_OFFER_COLLECTION).find({offerLimit:{$lte:currentDate}}).toArray()

    console.log('%%%5%%%%55$$$4####3',CheckValidity)
    resolve(CheckValidity)

  })

},

productOfferValidity:()=>{
  return new Promise(async(resolve,reject)=>{
    let currentDate=new Date().toISOString().slice(0,10)

    let CheckValidity=await db.get().collection(collection.PRODUCT_OFFER_COLLECTION).find({offerLimit:{$lte:currentDate}}).toArray()

   
    resolve(CheckValidity)

  })
}
 






}