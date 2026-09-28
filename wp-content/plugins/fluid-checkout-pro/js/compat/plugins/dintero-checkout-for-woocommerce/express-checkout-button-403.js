/**
 * Dintero express checkout button.
 */

(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.ExpressCheckoutButtonDintero = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		buttonSelector: '.fc-wrapper .dintero-checkout-express-checkout__button',
		paymentMethodElementSelector: '.fc-wrapper input[name="payment_method"][value="dintero_checkout"]',
	};




	/**
	 * METHODS
	 */



	/**
	 * Handle document clicks and route to the appropriate function.
	 */
	var selectPaymentMethod = function() {
		// Get target element
		var targetPaymentMethodElement = document.querySelector( _settings.paymentMethodElementSelector );
		
		// Bail if target element is not available
		if ( ! targetPaymentMethodElement ) { return; }

		// Change checked element
		targetPaymentMethodElement.checked = true;

		// Dispatch change event.
		var changeEvent = new CustomEvent( 'change', { detail: {}, bubbles: true } );
		targetPaymentMethodElement.dispatchEvent( changeEvent );
	};



	/**
	 * Handle document clicks and route to the appropriate function.
	 */
	var handleClick = function( e ) {
		// BUTTON
		if ( e.target.closest( _settings.buttonSelector ) ) {
			e.preventDefault();
			selectPaymentMethod();
		}
	};



	/**
	 * Initialize intl phone number inputs
	 */
	_publicMethods.init = function() {
		if ( _hasInitialized ) return;

		// Add event listeners
		document.addEventListener( 'click', handleClick, true );

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
