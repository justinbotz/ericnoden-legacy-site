/**
 * Checkout scripts for:  WooCommerce Delivery Slots Premium (by Iconic).
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
		root.CheckoutIconicWooDeliverySlotsPremium = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		datePickerFieldSelector: '#jckwds-delivery-date',
		deliverySubstepSelector: '.fc-step__substep[data-substep-id="delivery_slots"]',
		nextStepButtonSelector: '[data-step-next]',
		stepSelector: '.fc-checkout-step',
	}



	/**
	 * METHODS
	 */



	/**
	 *  Maybe hide the datepicker UI.
	 */
	var maybeHideDatepickerUI = function() {
		// Get the datepicker field
		var datePickerField = document.querySelector( _settings.datePickerFieldSelector );

		// Bail if datepicker field is not available
		if ( ! datePickerField ) { return; }

		// Hide the datepicker UI
		if ( _hasJQuery ) {
			$( datePickerField ).datepicker( 'hide' );
		}
	}

	/**
	 * Maybe show the datepicker UI.
	 */
	var maybeShowDatepickerUI = function( e ) {
		// Get the datepicker field
		var datePickerField = document.querySelector( _settings.datePickerFieldSelector );

		// Bail if datepicker field is not available
		if ( ! datePickerField ) { return; }

		// Bail if datepicker field is not in focus
		if ( ! document.activeElement || document.activeElement !== datePickerField ) { return; }

		// Show the datepicker UI
		if ( _hasJQuery ) {
			$( datePickerField ).datepicker( 'show' );
		}
	}



	/**
	 * Handle document clicks and route to the appropriate function.
	 */
	var handleClick = function( e ) {
		// NEXT STEP BUTTON
		if ( e.target.matches( _settings.nextStepButtonSelector ) ) {
			maybeHideDatepickerUI();
		}
	}



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) { return; }

		// Add event listeners
		document.addEventListener( 'click', handleClick, true );

		// Add jQuery event listeners
		if ( _hasJQuery ) {
			$( document.body ).on( 'updated_checkout', maybeShowDatepickerUI ) ;
		}

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
