   /**
    * Cart scripts for: WooCommerce Buy One Get One Free (BOGO).
    */
   (function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.BOGOCartUpdateHelper = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );
	var _hasInitialized = false;
	var _publicMethods = {};

	/**
	 * Dispatch the BOGO cart updated event.
	 */
	var dispatchCartUpdatedEvent = function() {
		var eventObject = new CustomEvent( 'wc-bogof-cart_updated', { bubbles: true } );
		document.body.dispatchEvent( eventObject );
	};

	_publicMethods.init = function() {
		if ( _hasInitialized || ! _hasJQuery ) { return; }

		// When FC finishes updating cart fragments, emit the BOGO-specific event so that the banner is updated correctly.
		$( document.body ).on( 'wc_fragments_refreshed', dispatchCartUpdatedEvent );

		_hasInitialized = true;
	};

	return _publicMethods;
});
