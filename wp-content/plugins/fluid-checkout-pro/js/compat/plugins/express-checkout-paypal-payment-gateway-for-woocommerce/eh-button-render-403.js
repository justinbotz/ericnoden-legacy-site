;( function ( $, window, document ) {
	'use strict';

	var post_data = {type:'ajax'};
	var tagline   = true;
	if (eh_button_params['tagline'] == 'show') {
		tagline = true;
	} else {
		tagline = false;
	}
	$( '.eh_spinner' ).hide();
	if (document.getElementById( 'paypal-checkout-button-render' ) && eh_button_params['express_button']) {
		
		var render = function () {
			// CHANGE: Hide spinner every time the buttons are rendered
			$( '.eh_spinner' ).hide();

			// CHANGE: Clear rendered buttons before rendering again
			$( '#paypal-checkout-button-render' ).empty();

			paypal.Buttons(
				{

					env: eh_button_params['environment'],  // sandbox | production
					locale: eh_button_params['locale'],
					style: {
						size: eh_button_params['size'],   // tiny | small | medium
						color: eh_button_params['color'],	// gold | blue | silver
						shape: eh_button_params['shape'],	// pill | rect
						label: eh_button_params['label'],// checkout | credit
						tagline: tagline, // checkout | credit
						layout: eh_button_params['layout'] // checkout | credit
					},
					createOrder: function() {
						// CHANGE: Set cart as not updatable
						window.can_update_cart = false;

						var qty = $( '.qty' ).val();
						if ( ! qty) {
							qty = $( "input[name=quantity]" ).val();
						}

						return fetch(
							eh_button_params['express_url'],
							{
								method: 'POST',
								headers: {
									'Accept': 'application/json',
									'Content-Type': 'application/json'
								},
								body: JSON.stringify( post_data )
							}
						).then(
							function(res) {
								return res.json();
							}
						).then(
							function(data) {
								return data.id;
							}
						);

					},

					onApprove: function(data) {
						// CHANGE: Set cart as updatable
						window.can_update_cart = true;

						$( '.eh_spinner' ).show();
						window.location.href = eh_button_params['return_url'] + '&token=' + data.orderID;
					},

					onError: function(err){
						// CHANGE: Set cart as updatable
						window.can_update_cart = true;

						console.log( err );
						if (err == 'Error: Unexpected end of JSON input') {
							$( '.eh_spinner' ).show();
							window.location.href = eh_button_params['p'];
						} else {
							alert( 'Unable to proceed payment.' );

						}

					},

					onCancel: function(data, actions) {
						// CHANGE: Set cart as updatable
						window.can_update_cart = true;

						$( '.eh_spinner' ).show();
						window.location.href = eh_button_params['cancel_url']
					}

				}
			).render( '#paypal-checkout-button-render' );
		};
		render();
		$( document.body ).on( 'updated_cart_totals', render.bind( this, false ) );

	}

} )( jQuery, window, document );
