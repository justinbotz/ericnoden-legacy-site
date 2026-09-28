/**
 * Manage local pickup actions.
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
		root.FCLocalPickup = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		clearShippingMethodsButtonSelector:              '.fc-clear-shipping-method__button',
		clearShippingMethodsHiddenFieldSelector:         '[name="fc_clear_selected_shipping_method"]',
	}



	/**
	 * METHODS
	 */



	/**
	 * Set the clear chosen shipping method hidden field value to 'yes'.
	 */
	var setClearChosenShippingMethod = function() {
		var hiddenField = document.querySelector( _settings.clearShippingMethodsHiddenFieldSelector );
		if ( hiddenField ) {
               hiddenField.value = 'yes';
          }
	};



	/**
	 * Handle document clicks and route to the appropriate function.
	 */
	var handleClick = function( e ) {
		// CLEAR CHOSEN SHIPPING METHOD
		if ( e.target.closest( _settings.clearShippingMethodsButtonSelector ) ) {
			e.preventDefault();

			// Set to clear chosen shipping method
			setClearChosenShippingMethod();

			// Trigger update checkout
			if ( _hasJQuery ) {
				$( document.body ).trigger( 'update_checkout' );
			}
		}
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

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
