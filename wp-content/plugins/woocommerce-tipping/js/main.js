jQuery(document).ready(function($) {

 $(document).on('click', '.wpslash-tip-percentage-btn.tip, .wpslash-tip-submit', function( ){
  if(jQuery('.wc-block-checkout').length)
  {
   
  }
  else
  {
    try{
      $('.fee').block({
        message: null,
        overlayCSS: {
          background: "#fff",
          opacity: .6
        }
      });
    }  catch (error) {
    }

    var data = {
      'action': 'wpslash_tip_submit_handler',
      'percentage':$(this).attr('percentage'),
      'amount':$(this).attr('amount') ? $(this).attr('amount') :$('.wpslash-tip-input').val() ,
      'security': wpslash_tipping_obj.security

    };
    $.post(wpslash_tipping_obj.ajaxurl, data, function(response) {
     $(document.body).trigger("update_checkout");
     try{
      $('.fee').unblock();

    }  catch (error) {
    }
  });
  }





  





});
$(document).on('click', '.wpslash-tip-percentage-btn.custom', function( ){

  jQuery(document).find('.wpslash-tipping-form-wrapper').toggleClass('hidden');

});






 $(document).on('click', '.wpslash_tip_remove_btn', function( ){

  try{
    $('.fee').block({
      message: null,
      overlayCSS: {
        background: "#fff",
        opacity: .6
      }
    });
  }  catch (error) {
  }


  
  



  var data = {
    'action': 'wpslash_tip_remove',
    'percentage':$(this).attr('percentage'),
    'security': wpslash_tipping_obj.security

  };

  $.post(wpslash_tipping_obj.ajaxurl, data, function(response) {
   $(document.body).trigger("update_checkout");

   try{
    $('.fee').unblock();

  }  catch (error) {
  }



});





});



});