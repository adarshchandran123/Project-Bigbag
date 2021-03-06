var db = require("../config/connection");
var collection = require("../config/collection");
const { response } = require("express");
var objectId = require("mongodb").ObjectId;

module.exports = {
  addProduct: (product) => {
    return new Promise(async (resolve, reject) => {
      var checkproduct = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ productName: product.productName });

      if (checkproduct == null) {
        product.date = new Date();

        product.qty = parseInt(product.qty);

        product.newprice = parseInt(product.newprice);
        product.MRP = product.newprice;

        const data = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .insertOne(product);

        resolve(data.insertedId);
      } else {
        resolve(false);
      }
    });
  },

  getAllProduct: () => {
    return new Promise(async (resolve, reject) => {
      const product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .sort({ date: -1 })
        .toArray();
      resolve(product);
    });
  },
  deleteProduct: (proId) => {
    return new Promise(async (resolve, reject) => {
      var deleteFromWishlist = await db
        .get()
        .collection(collection.WISH_LIST_COLLECTION)
        .deleteMany({ proId: objectId(proId) });

      var deleteFromCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .update(
          {},
          {
            $pull: { products: { item: objectId(proId) } },
          }
        );

      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: objectId(proId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  getproductdetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(proId) })
        .then((product) => {
          resolve(product);
        });
    });
  },

  getnewArrival: () => {
    return new Promise(async (resolve, reject) => {
      const arrival = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .sort({ date: -1 })
        .limit(8)
        .toArray();
      resolve(arrival);
    });
  },

  updateproduct: (proId, proDetails) => {
    return new Promise((resolve, reject) => {
      proDetails.qty = parseInt(proDetails.qty);
      proDetails.newprice = parseInt(proDetails.newprice);

      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              productName: proDetails.productName,
              category: proDetails.category,
              discription: proDetails.discription,
              newprice: proDetails.newprice,
              Longdiscription: proDetails.Longdiscription,
              date: new Date(),
              qty: proDetails.qty,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  orderProductDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderdetails = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ _id: objectId(orderId) })
        .toArray();

      resolve(orderdetails[0]);
    });
  },

  buynowProductQuantityupdate: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne({ _id: objectId(proId) }, { $inc: { qty: -1 } })
        .then((data) => {
          resolve(data);
        });
    });
  },

  UserCancellProduct: (proId, orderId, quantity) => {
    return new Promise(async (resolve, reject) => {
      let Quantity = parseInt(quantity);

      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(orderId) });

      if (order.mode == "buyNow") {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne({ _id: objectId(proId) }, { $inc: { qty: 1 } });

        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            { $set: { status: "Cancelled" } }
          )
          .then(() => {
            resolve();
          });
      } else if (order.mode == "cart") {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne({ _id: objectId(proId) }, { $inc: { qty: Quantity } });

        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            {
              _id: objectId(orderId),
              products: { $elemMatch: { item: objectId(proId) } },
            },
            { $set: { "products.$.status": "Cancelled" } }
          )
          .then(() => {
            resolve();
          });
      }
    });
  },

  AddCategoryOffer: (detail) => {
    detail.offerStartingDate = new Date().toISOString().slice(0, 10);

    return new Promise(async (resolve, reject) => {
      let findCategoryOffer = await db
        .get()
        .collection(collection.CATEGORY_OFFER_COLLECTION)
        .findOne({ category: detail.category });
      let findOfferName = await db
        .get()
        .collection(collection.CATEGORY_OFFER_COLLECTION)
        .findOne({ offerName: detail.offerName });

      if (findCategoryOffer == null && findOfferName == null) {
        let findAllCategoryOffers = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .find({ category: detail.category })
          .toArray();

        let insertoffer = await db
          .get()
          .collection(collection.CATEGORY_OFFER_COLLECTION)
          .insertOne(detail);

        resolve(findAllCategoryOffers);
      } else {
        resolve(false);
      }
    });
  },

  updateCategoryOfferPrice: (productdetail, offer, offerName) => {
    return new Promise(async (resolve, reject) => {
      let percentage = offer / 100;

      var checkAnyOffer = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({
          productName: productdetail.productName,
          offer: { $exists: true },
        });

      if (checkAnyOffer == null) {
        let changeWishlistPrice = await db
          .get()
          .collection(collection.WISH_LIST_COLLECTION)
          .updateOne(
            { proId: objectId(productdetail._id) },
            {
              $set: {
                "wishlist.offer": offer,
                "wishlist.offerName": offerName,
                "wishlist.MRP": productdetail.newprice,
                "wishlist.newprice":
                  productdetail.newprice - productdetail.newprice * percentage,
              },
            }
          );

        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: objectId(productdetail._id) },
            {
              $set: {
                offer: offer,
                offerName: offerName,
                MRP: productdetail.newprice,
                newprice:
                  productdetail.newprice - productdetail.newprice * percentage,
              },
            }
          )
          .then((response) => {
            resolve(response);
          });
      } else {
        resolve(false);
      }
    });
  },

  findCategoryOffers: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_OFFER_COLLECTION)
        .find()
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },

  DeleteCategoryOffer: (categoryId, category, offerName) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_OFFER_COLLECTION)
        .deleteOne({ _id: objectId(categoryId) })
        .then(async (response) => {
          let removeCategory_ADS = await db
            .get()
            .collection(collection.ADS___COLLECTION)
            .deleteOne({ category: category });

          let findprodetails = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ category: category, offerName: offerName })
            .toArray();
          resolve(findprodetails);
        });
    });
  },

  changeCategoryOfferpriceToMRP: (productdetail) => {
    return new Promise(async (resolve, reject) => {
      let removeOffers = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(productdetail._id) },
          {
            $unset: {
              offer: 1,
              offerName: 1,
            },
          }
        );

      let removeOffersFromWishlist = await db
        .get()
        .collection(collection.WISH_LIST_COLLECTION)
        .updateOne(
          { proId: objectId(productdetail._id) },
          {
            $unset: {
              "wishlist.offer": 1,
              "wishlist.offerName": 1,
            },
          }
        );

      let changeWishlistPrice = await db
        .get()
        .collection(collection.WISH_LIST_COLLECTION)
        .updateOne(
          { proId: objectId(productdetail._id) },
          {
            $set: {
              "wishlist.newprice": productdetail.MRP,
            },
          }
        );

      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(productdetail._id) },
          {
            $set: {
              newprice: productdetail.MRP,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  AddProductOffer: (detail) => {
    return new Promise(async (resolve, reject) => {
      detail.offerStartingDate = new Date().toISOString().slice(0, 10);
      detail.offer = parseInt(detail.offer);
      let percentage = detail.offer / 100;

      let checkProduct = await db
        .get()
        .collection(collection.PRODUCT_OFFER_COLLECTION)
        .findOne({ productName: detail.productName });
      if (checkProduct == null) {
        let findProduct = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ productName: detail.productName });

        let checkproductCategoryOffer = await db
          .get()
          .collection(collection.CATEGORY_OFFER_COLLECTION)
          .findOne({ category: findProduct.category });

        if (checkproductCategoryOffer == null) {
          let ProductofferUpdate = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              { productName: detail.productName },
              {
                $set: {
                  offer: detail.offer,
                  MRP: findProduct.newprice,
                  newprice:
                    findProduct.newprice - findProduct.newprice * percentage,
                },
              }
            );

          let WishlistProductofferUpdate = await db
            .get()
            .collection(collection.WISH_LIST_COLLECTION)
            .updateOne(
              { "wishlist.productName": detail.productName },
              {
                $set: {
                  "wishlist.offer": detail.offer,
                  "wishlist.MRP": findProduct.newprice,
                  "wishlist.newprice":
                    findProduct.newprice - findProduct.newprice * percentage,
                },
              }
            );

          let insertoffer = await db
            .get()
            .collection(collection.PRODUCT_OFFER_COLLECTION)
            .insertOne(detail);
          resolve(response);
        } else {
          let response = false;
          resolve(response);
        }
      } else {
        let response = false;
        resolve(response);
      }
    });
  },

  findproductOffers: () => {
    return new Promise(async (resolve, reject) => {
      let findproductOffers = await db
        .get()
        .collection(collection.PRODUCT_OFFER_COLLECTION)
        .find()
        .toArray();

      resolve(findproductOffers);
    });
  },

  DeleteProductOffer: (offerId, productName) => {
    return new Promise(async (resolve, reject) => {
      let deleteOffer = await db
        .get()
        .collection(collection.PRODUCT_OFFER_COLLECTION)
        .deleteOne({ _id: objectId(offerId) });

      let channgeProductOffer = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { productName: productName },
          {
            $unset: {
              offer: 1,
            },
          }
        );

      let WishlistchanngeProductOffer = await db
        .get()
        .collection(collection.WISH_LIST_COLLECTION)
        .updateOne(
          { "wishlist.productName": productName },
          {
            $unset: {
              "wishlist.offer": 1,
            },
          }
        );

      let findProduct = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ productName: productName });

      let channgeProductOfferPrice = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { productName: productName },
          {
            $set: {
              newprice: findProduct.MRP,
            },
          }
        );

      let WhishlistchanngeProductOfferPrice = await db
        .get()
        .collection(collection.WISH_LIST_COLLECTION)
        .updateOne(
          { "wishlist.productName": productName },
          {
            $set: {
              "wishlist.newprice": findProduct.MRP,
            },
          }
        );

      resolve();
    });
  },

  findLimitedStock: () => {
    return new Promise(async (resolve, reject) => {
      let findStock = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ qty: { $lte: 10 } })
        .toArray();

      resolve(findStock);
    });
  },

  checkCategoryOfferValidity: () => {
    return new Promise(async (resolve, reject) => {
      let currentDate = new Date().toISOString().slice(0, 10);

      let CheckValidity = await db
        .get()
        .collection(collection.CATEGORY_OFFER_COLLECTION)
        .find({ offerLimit: { $lte: currentDate } })
        .toArray();

      resolve(CheckValidity);
    });
  },

  productOfferValidity: () => {
    return new Promise(async (resolve, reject) => {
      let currentDate = new Date().toISOString().slice(0, 10);

      let CheckValidity = await db
        .get()
        .collection(collection.PRODUCT_OFFER_COLLECTION)
        .find({ offerLimit: { $lte: currentDate } })
        .toArray();

      resolve(CheckValidity);
    });
  },
};
