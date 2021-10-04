var db = require("../config/connection");
var collection = require("../config/collection");
const { response } = require("express");
var objectId=require('mongodb').ObjectId

module.exports = {
  addProduct: async (product) => {
    console.log(product);
    const data = await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product);
    console.log(data.insertedId)
    return data.insertedId
  },


  getAllProduct:()=>{
    return new Promise(async(resolve,reject)=>{
        const product=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
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
      const arrival=await db.get().collection(collection.PRODUCT_COLLECTION).find().limit(8).toArray()
      resolve(arrival)
    })
  },

  updateproduct:(proId,proDetails)=>{
    return new Promise((resolve,reject)=>{

        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
        {$set:{productName:proDetails.productName,
              categoy:proDetails.categoy,
              discription:proDetails.discription,
              oldprice:proDetails.oldprice,
              newprice:proDetails.newprice,
              date:proDetails.date,
              qty:proDetails.qty,

      }
    
  }).then((response)=>{
    
      resolve(response)
  })
            
    })
}



};
