/**
 * Checkout scripts for: WooCommerce Order Delivery (by Themesquad).
 */

(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.CheckoutWooCommerceOrderDelivery = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		datePickerContainerSelector: '#wc-od:not( :empty )',
	};



	/**
	 * METHODS
	 */



	/**
	 * Unblock datepicker fields.
	 */
	var unblockDatePicker = function() {
		// Get datepicker container
		var datePickerContainer = $( _settings.datePickerContainerSelector );

		// Bail if datepicker container is not available
		if ( 0 === datePickerContainer.length ) return;

		// Unblock datepicker
		datePickerContainer.unblock();
	}



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function() {
		if ( _hasInitialized ) return;

		// Add jQuery event listeners
		if ( _hasJQuery ) {
			$( document.body ).on( 'updated_checkout', unblockDatePicker );
		}

		_hasInitialized = true;
	};


	
	//
	// Public APIs
	//
	return _publicMethods;

});
