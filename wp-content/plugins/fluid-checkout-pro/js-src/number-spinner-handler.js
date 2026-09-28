/**
 * Handle phone fields using `intl-tel-input` component.
 */

(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.NumberSpinnerHandler = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		bodyClass: 'has-number-spinner--activated',

		numberSpinnerOptions: {},

		fragmentsUpdateEvent: 'wc_fragment_refresh',
		fragmentsReplacedEvent: 'wc_fragments_refreshed',
	};




	/**
	 * METHODS
	 */



	/**
	 * Initialize a phone field.
	 */
	_publicMethods.initAllInputFields = function() {
		// Bail if container selector option is not set
		if ( ! _settings.numberSpinnerOptions || ! _settings.numberSpinnerOptions.containerSelector || '' == _settings.numberSpinnerOptions.containerSelector ) { return; }

		// Get container element
		var containerElements = document.querySelectorAll( _settings.numberSpinnerOptions.containerSelector );

		for ( var i = 0; i < containerElements.length; i++ ) {
			var containerElement = containerElements[i];

			// Initialize number input fields
			NumberSpinner.initInputFields( containerElement, _settings.numberSpinnerOptions );
		}
	}



	/**
	 * Initialize intl phone number inputs
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) return;

		// Bail if NumberSpinner script was not loaded
		if ( ! window.NumberSpinner ) { return; }

		// Merge settings
		_settings = FCUtils.extendObject( _settings, options );

		// Set jQuery event listeners
		if ( _hasJQuery ) {
			$( document.body ).on( _settings.fragmentsReplacedEvent, _publicMethods.initAllInputFields );
		}

		// Initialize number spinner on page load
		NumberSpinner.init();
		_publicMethods.initAllInputFields();

		// Add init class
		document.body.classList.add( _settings.bodyClass );

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
