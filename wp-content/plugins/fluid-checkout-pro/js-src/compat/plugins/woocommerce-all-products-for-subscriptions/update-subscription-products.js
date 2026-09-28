/**
 * Update subscription products on cart page for: Woo All Products For Subscriptions (by WooCommerce).
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
		root.WooUpdateSubscriptionProducts = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		nonRecurringOptionSelector: '.wcsatt-options .one-time-option input[type="radio"]',
	};



	/**
	 * METHODS
	 */



	/**
	 * Update value for all non-recurring options after cart fragments are refreshed.
	 */
	var updateNonRecurringOptions = function() {
		// Get non-recurring options
		var nonRecurringOptions = document.querySelectorAll( _settings.nonRecurringOptionSelector );

		// Reset value for non-recurring options after a small delay
		requestAnimationFrame( function() {
			for ( var i = 0; i < nonRecurringOptions.length; i++ ) {
				nonRecurringOptions[ i ].value = 0;
			}
		} );
	}



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function() {
		if ( _hasInitialized ) return;
		// Add jQuery event listeners
		if ( _hasJQuery ) {
			$( document.body ).on( 'wc_fragments_refreshed', updateNonRecurringOptions );
			$( document.body ).on( 'updated_checkout', updateNonRecurringOptions );
		}

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

} );
