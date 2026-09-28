/**
 * Local Pickup Plus Cart update handler.
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
		root.LocalPickupPlusCart = factory(root);
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
	 * Maybe trigger cart fragments update when an AJAX call completes.
	 * 
	 * @param Event           e              The event object.
	 * @param XMLHttpRequest  jqXHR          The jQuery XMLHttpRequest object.
	 * @param object          jqXHRSettings  The jQuery AJAX settings object.
	 */
	var maybeUpdateCart = function( e, jqXHR, jqXHRSettings ) {
		// Bail if local pickup settings object is not available
		if ( ! window.wc_local_pickup_plus_frontend ) return;

		// Bail if AJAX call was not successful
		if ( 200 !== jqXHR.status ) return;

		// Bail if AJAX call was not to the Local Pickup Plus AJAX URL
		if ( wc_local_pickup_plus_frontend.ajax_url !== jqXHRSettings.url ) return;

		// Bail if not update local pickup cart action
		if ( -1 === jqXHRSettings.data.indexOf( 'action=wc_local_pickup_plus_set_cart_item_handling' ) ) return;

		// Bail if call was not successful
		if ( ! jqXHR.responseJSON || ! jqXHR.responseJSON.success ) return;

		// Trigger update cart fragments
		$( document.body ).trigger( 'wc_fragment_refresh' );
	}



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function() {
		if ( _hasInitialized ) return;

		// Add jQuery event listeners
		if ( _hasJQuery ) {
			$( document ).ajaxComplete( maybeUpdateCart );
		}

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
