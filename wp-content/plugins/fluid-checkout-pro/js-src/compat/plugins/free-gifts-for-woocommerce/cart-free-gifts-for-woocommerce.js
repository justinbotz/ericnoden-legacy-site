/**
 * Cart scripts for: Free Gifts for WooCommerce (by Flintop).
 */

(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.CartFreeGiftsForWooCommerce = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};



	/**
	 * METHODS
	 */



	/**
	 * Initialize Owl Carousel for gift products.
	 */
	var initializeCarousel = function() {
		// Trigger initialization
		$( document.body ).trigger( 'fgf-enhanced-carousel' );
	}

	/**
	 * Initialize Lightcase for the lightbox to work.
	 */
	var initializeLightcase = function() {
		// Trigger initialization
		$( document.body ).trigger( 'fgf-enhanced-lightcase' );
	}



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) { return; }

		// Add jQuery event listeners
		if ( _hasJQuery ) {
			$( document.body ).on( 'updated_cart_totals', initializeCarousel );
			$( document.body ).on( 'updated_cart_totals', initializeLightcase );
		}

		_hasInitialized = true;
	};


	
	//
	// Public APIs
	//
	return _publicMethods;

});
