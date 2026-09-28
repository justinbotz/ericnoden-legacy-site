/**
 * Manage cart shipping ajax actions.
 *
 * DEPENDS ON:
 * - jQuery // Interact with WooCommerce events
 */
 (function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.CartShipping = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		bodyClass: 'has-fc-cart-shipping',

		messagesWrapperSelector: '.woocommerce-notices-wrapper',

		formSubmitFieldsSelector: 'input:not( [type="button"] ):not( [type="submit"] ):not( [type="reset"] ):not( [type="file"] ):not( [type="image"] )',

		shippingMethodsSectionSelector: '.fc-shipping-method__packages',
		shippingMethodsSelector: 'select.shipping_method, input[name^="shipping_method"]',
		shippingMethodsChosenSelector: 'select.shipping_method, input[name^="shipping_method"][type="radio"]:checked, input[name^="shipping_method"][type="hidden"]',
		shippingMethodIndexAttribute: 'data-index',

		shippingCalcFormSelector: '.shipping-calculator-form',
		shippingCalcUpdateButtonSelector: '[name="calc_shipping"]',
		shippingCalcDataFieldsSelector: 'input, select, textarea',

		collapsibleBlockElementSelector: '[data-collapsible]',

		updateShippingMethodsNonce: '', // Value updated during runtime
		updateShippingAddressNonce: '', // Value updated during runtime
	};



	/**
	 * METHODS
	 */



	/**
	 * Add notices at the top of the page, then scroll to display it on the screen.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	var showNotices = function( content ) {
		var messagesWrapper = document.querySelector( _settings.messagesWrapperSelector );
		messagesWrapper.innerHTML = content;
		
		// Maybe scroll notices into view
		if ( window.CartUpdate ) {
			CartUpdate.scrollToNotices();
		}
	}



	/**
	 * Add notices in the coupon code section.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	var showShippingNotices = function( content ) {
		if ( window.CartUpdate ) {
			CartUpdate.showShippingNotices( content );
		}
	}

	/**
	 * Remove all notices from the coupon code section.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	var clearShippingNotices = function() {
		if ( window.CartUpdate ) {
			CartUpdate.clearShippingNotices();
		}
	}



	/**
	 * Block the element UI from user interaction.
	 *
	 * @param   HTMLElement  element  Element to block the UI and show the loading indicator.
	 *
	 * @see     CartUpdate.blockUI
	 */
	var blockUI = function( element ) {
		// Maybe block element UI
		if ( window.CartUpdate ) {
			CartUpdate.blockUI( element );
		}
	}

	/**
	 * Unblock UI element to be used again.
	 *
	 * @param   HTMLElement  element  Element to get the UI unblocked.
	 *
	 * @see     CartUpdate.unblockUI
	 */
	var unblockUI = function( element ) {
		// Maybe unblock element UI
		if ( window.CartUpdate ) {
			CartUpdate.unblockUI( element );
		}
	}



	/**
	 * Maybe reinitialize the collapsible blocks elements.
	 */
	var maybeReinitializeCollapsibleBlocks = function() {
		if ( window.CollapsibleBlock ) {
			var collapsibleBlocks = document.querySelectorAll( _settings.collapsibleBlockElementSelector );
			for ( var i = 0; i < collapsibleBlocks.length; i++ ) {
				var collapsibleBlock = collapsibleBlocks[ i ];
				
				// Maybe initialize the collapsible block
				if ( ! CollapsibleBlock.getInstance( collapsibleBlock ) ) {
					CollapsibleBlock.initializeElement( collapsibleBlock );
				}
			}
		}
	};



	/**
	 * Process update shipping calculator address and shipping costs.
	 */
	var processShippingCalculatorUpdate = function() {
		var shippingForm = document.querySelector( _settings.shippingCalcFormSelector );

		// Bail if shipping form not found
		if ( ! shippingForm ) { return; }
		
		// Get cart item data
		var data = {};
		var fields = shippingForm.querySelectorAll( _settings.shippingCalcDataFieldsSelector );
		for ( var i = 0; i < fields.length; i++ ) {
			var field = fields[ i ];
			var fieldName = field.name;
			var fieldValue = field.value;
			
			// Skip field if it does not have a name attribute
			if ( ! fieldName ) { continue; }

			// Skip radio buttons not checked
			if ( 'radio' === field.type && ! field.checked ) { continue; }

			// Maybe set checkbox field value as empty
			if ( 'checkbox' === field.type && ! field.checked ) {
				fieldValue = '';
			}

			data[ fieldName ] = fieldValue;
		}

		_publicMethods.updateShippingAddress( data );
	}



	/**
	 * Handle document clicks and route to the appropriate function.
	 */
	var handleClick = function( e ) {
		// SHIPPING CALCULATOR SUBMIT
		if ( e.target.closest( _settings.shippingCalcUpdateButtonSelector ) ) {
			e.preventDefault();
			processShippingCalculatorUpdate( e.target.closest( _settings.shippingCalcUpdateButtonSelector ) );
		}
	};

	/**
	 * Handle form field change event and route to the appropriate function.
	 */
	var handleChange = function( e ) {
		
		// SHIPPING METHOD
		if ( e.target.matches( _settings.shippingMethodsSelector ) ) {
			_publicMethods.setShippingMethodChosen();
		}

	};

	/**
	 * Handle keypress event.
	 */
	var handleKeyDown = function( e ) {
		// Should do nothing if the default action has been cancelled
		if ( e.defaultPrevented ) { return; }

		// ENTER on input fields
		if ( FCUtils.keyboardKeys.ENTER === e.key && e.target.closest( _settings.cartItemSelector ) && e.target.matches( _settings.formSubmitFieldsSelector ) ) {
			// Prevents submitting form
			e.preventDefault();
		}
	};



	/**
	 * Update the shipping address information and trigger fragments refresh.
	 *
	 * @param   object  data  The shipping address data to be updated.
	 */
	_publicMethods.updateShippingAddress = function( data ) {
		// Block the shipping section element from further changes
		var shippingMethods = document.querySelector( _settings.shippingMethodsSectionSelector );
		blockUI( shippingMethods );

		// Clear shipping notices
		clearShippingNotices();

		// Add security
		data = FCUtils.extendObject( data, {
			security:             _settings.updateShippingAddressNonce,
		} );

		$.ajax({
			type:		'POST',
			url:		fcSettings.wcAjaxUrl.toString().replace( '%%endpoint%%', 'fc_pro_update_shipping_address' ),
			data:		data,
			dataType:   'json',
			success:	function( response ) {

				if ( response.result && 'success' === response.result ) {
					$( document.body ).trigger( 'wc_fragment_refresh' );
				}
				else if ( response.result && 'error' === response.result ) {
					// Unblock shipping section element
					var shippingMethods = document.querySelector( _settings.shippingMethodsSectionSelector );
					unblockUI( shippingMethods );

					// Maybe show shipping notices
					if ( response.message ) {
						showShippingNotices( response.message );
					}
				}

			}

		});
	};



	/**
	 * Set the chosen shipping method to the cart.
	 */
	_publicMethods.setShippingMethodChosen = function() {
		// Block the element from further changes
		var shippingMethodsSection = document.querySelector( _settings.shippingMethodsSectionSelector );
		blockUI( shippingMethodsSection );

		// Get chosen shipping methods
		var chosenShippingMethods = document.querySelectorAll( _settings.shippingMethodsChosenSelector );
		var shippingMethods = {};
		for ( var i = 0; i < chosenShippingMethods.length; i++ ) {
			var shippingMethod = chosenShippingMethods[ i ];
			var index = shippingMethod.getAttribute( _settings.shippingMethodIndexAttribute );
			shippingMethods[ index ] = shippingMethod.value;
		}

		var data = {
			security:             _settings.updateShippingMethodsNonce,
			shipping_methods:     shippingMethods,
		};

		$.ajax({
			type:		'POST',
			url:		fcSettings.wcAjaxUrl.toString().replace( '%%endpoint%%', 'fc_pro_update_shipping_methods' ),
			data:		data,
			dataType:   'json',
			success:	function( response ) {

				if ( response.result && 'success' === response.result ) {
					$( document.body ).trigger( 'updated_shipping_method' );
					$( document.body ).trigger( 'wc_fragment_refresh' );
				}
				else if ( response.result && 'error' === response.result ) {
					// Unblock the element
					var shippingMethodsSection = document.querySelector( _settings.shippingMethodsSectionSelector );
					unblockUI( shippingMethodsSection );

					showNotices( response.message );
				}

			}

		});
	};



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) return;

		// Merge settings
		_settings = FCUtils.extendObject( _settings, options );

		// Add event listeners
		document.addEventListener( 'click', handleClick, true );
		document.addEventListener( 'keydown', handleKeyDown, true );
		document.addEventListener( 'change', handleChange, true );

		if ( _hasJQuery ) {
			// After cart fragments has been updated
			$( document.body ).on( 'wc_fragments_refreshed', maybeReinitializeCollapsibleBlocks );
		}

		// Add init class
		document.body.classList.add( _settings.bodyClass );

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
