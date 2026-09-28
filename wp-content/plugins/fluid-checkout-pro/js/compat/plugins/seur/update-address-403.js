/**
 * Svea Checkout express checkout button.
 */

(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.SeurUpdateAddress = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		fieldsSelector: '#shipping_city_seur, #shipping_postcode_seur',
	};




	/**
	 * METHODS
	 */


	/**
	 * Update related field value based on the current field value.
	 */
	var updateRelatedField = function( field ) {
		// Get related field key
		var fieldKey = field.id.replace( '_seur', '' );

		// Get related field
		var relatedField = document.getElementById( fieldKey );

		// Bail if related field does not exist
		if ( ! relatedField ) return;

		// Update related field
		relatedField.value = field.value;
	};



	/**
	 * Handle captured `keyup` event and route to the appropriate functions.
	 */
	var handleKeyUp = function( e ) {
		// BUTTON
		if ( e.target.closest( _settings.fieldsSelector ) ) {
			updateRelatedField( e.target );
		}
	};



	/**
	 * Initialize intl phone number inputs
	 */
	_publicMethods.init = function() {
		if ( _hasInitialized ) return;

		// Add event listeners
		document.addEventListener( 'keyup', handleKeyUp, true );

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

} );
