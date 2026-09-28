/**
 * Checkout scripts for: Checkout Field Editor for WooCommerce Pro (by Themehigh).
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
		root.CheckoutWoocommerceFieldEditorPro = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		fieldWrapperSelector: '.thwcfe-input-field-wrapper',
		checkoutEditorFieldSelector: '.thwcfe-input-field',
		formRowExpansibleSelector: '.fc-expansible-form-section',

		disabledFieldWrapperClass: 'thwcfe-disabled-field-wrapper'
	}



	/**
	 * METHODS
	 */



	/**
	 * Maybe run plugin's function to validate field display conditions.
	 */
	var maybeValidateAllConditions = function() {
		// Bail if required plugin function is not available
		if ( ! thwcfe_public_conditions || 'function' !== typeof thwcfe_public_conditions.validate_all_conditions ) { return; }

		// Run the function
		thwcfe_public_conditions.validate_all_conditions();
	}



	/**
	 * Maybe toggle expansible wrappers visibility for optional fields with "display rules" from the plugin.
	 */
	var maybeToggleExpansibleFieldsWrapperVisibility = function() {
		// Get all plugin fields
		var pluginFields = document.querySelectorAll( _settings.checkoutEditorFieldSelector );

		// Loop through the fields
		for ( var i = 0; i < pluginFields.length; i++ ) {
			var fieldWrapper = pluginFields[i].closest( _settings.fieldWrapperSelector );
			var expansibleContainer = pluginFields[i].closest( _settings.formRowExpansibleSelector );

			// Skip if wrapper elements not found
			if ( ! expansibleContainer || ! fieldWrapper ) { continue; }

			// If field is hidden, hide corresponding expansible container
			if ( fieldWrapper.classList.contains( _settings.disabledFieldWrapperClass ) && 'none' === fieldWrapper.style.display ) {
				expansibleContainer.style.display = 'none';
			}
			// Otherwise, if both field and its wrapper are visible, unhide the expansible container
			else if ( 'none' !== pluginFields[i].style.display && 'none' !== fieldWrapper.style.display ) {
				expansibleContainer.style.display = '';
			}
		}
	}



	/**
	 * Handle captured `change` event and route to the appropriate functions.
	 */
	var handleChange = function( e ) {
		// PLUGIN FIELDS
		if ( e.target.matches( _settings.checkoutEditorFieldSelector ) ) {
			// Update field visibility since `update_checkout` event is not triggered for all plugin fields
			maybeValidateAllConditions();
			maybeToggleExpansibleFieldsWrapperVisibility();
		}
	}



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) { return; }

		// Add event listeners
		document.addEventListener( 'change', handleChange, true );

		// Add jQuery event listeners
		if ( _hasJQuery ) {
			$( document.body ).on( 'updated_checkout', maybeValidateAllConditions );
			$( document.body ).on( 'updated_checkout', maybeToggleExpansibleFieldsWrapperVisibility );
		}

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
