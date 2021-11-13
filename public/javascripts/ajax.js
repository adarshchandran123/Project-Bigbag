// const { response } = require("express")

// const { response } = require("express")

  
function addToCart(proId,price){

       
    $.ajax({
        url:'/addToCart?id='+proId+'&price='+price,
        method:'get',
        success:(response)=>{
           
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $("#cart-count").html(count)
                location.reload()
            }
        }
    })
}


function addtoWishlist(proId){
    
    // document.getElementById(proId).style.color = "green";
    $.ajax({
        url:'/addtoWishlist/'+proId,
        method:'get',
        success:(response)=>{
            if(response){
                document.getElementById(proId).style.color = "green";
            }else{
                document.getElementById(proId).style.color = "black";
            }
            
        }
    })


}
                                                                                                     




