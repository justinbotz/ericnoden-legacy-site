/**
 * Manage checkout front-end validation for: WooCommerce Order Delivery (by ThemeSquad)
 *
 * DEPENDS ON:
 * - checkout-validation.js // Main checkout validation script from Fluid Checkout
 */

(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.CheckoutValidationWooCommerceOrderDelivery = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;

	var _hasInitialized = false;
	var _publicMethods = { };
	var _settings = {
		datePickerSelector: '#delivery_date',
		typeDeliveryDateSelector: '#delivery_date_visible',
		validationMessages: {
			out_of_range:     'The selected date "{selected_date}" is out of range. Please select a date from "{start_date}" to "{end_date}".',
			disabled:         'The selected date "{selected_date}" is not available.',
		},
	};



	/**
	 * METHODS
	 */



	/**
	 * Check if form row is a delivery date field.
	 * @param  {Field}    field            Field for validation.
	 * @param  {Element}  formRow          Form row element.
	 * @param  {String}   validationEvent  Event that triggered the validation.
	 * @return {Boolean}                   Whether the field is a Delivery Date field.
	 */
	var isDeliveryDateField = function( field, formRow, validationEvent ) {
		if ( ! field.matches( _settings.typeDeliveryDateSelector ) ) { return false; }
		return true;
	};

	/**
	 * Validate date disabled.
	 * @param  {Field}    field            Field for validation.
	 * @param  {Element}  formRow          Form row element.
	 * @param  {String}   validationEvent  Event that triggered the validation.
	 * @return {Boolean}                   Whether the date is enabled for delivery. Returns `true` if the date is enabled, `false` otherwise.
	 */
	var validateDeliveryDateDisabled = function( field, formRow, validationEvent ) {
		// Bail if field does not have a value
		if ( ! CheckoutValidation.hasValue( field ) ) { return { valid: false }; }

		var datepicker = $( _settings.datePickerSelector ).data( 'wc_od_datepicker' ).getDatepicker();
		var dpg = $.fn.bootstrapDP.DPGlobal;
		var dateStr = $( '#delivery_date_visible' ).val();
		var date = dpg.parseDate( dateStr, dpg.parseFormat( 'yyyy-mm-dd' ) );
		var dateFormatted = dpg.formatDate( date, _settings.dateFormat, _settings.language );

		// Bail if date is disabled
		if ( datepicker.dateIsDisabled( date ) ) { return { valid: false, message: _settings.validationMessages.disabled.replace( '{selected_date}', dateFormatted ) }}

		// Field is valid
		return { valid: true };
	};

	/**
	 * Validate date out of range.
	 * @param  {Field}    field            Field for validation.
	 * @param  {Element}  formRow          Form row element.
	 * @param  {String}   validationEvent  Event that triggered the validation.
	 * @return {Boolean}                   Whether the date is inside the allowed delivery dates range. Returns `true` if the date is accepted for delivery, `false` otherwise.
	 */
	 var validateDeliveryDateOutOfRange = function( field, formRow, validationEvent ) {
		// Bail if field does not have a value
		if ( ! CheckoutValidation.hasValue( field ) ) { return { valid: false }; }

		var datepicker = $( _settings.datePickerSelector ).data( 'wc_od_datepicker' ).getDatepicker();
		var dpg = $.fn.bootstrapDP.DPGlobal;
		var dateStr = $( '#delivery_date_visible' ).val();
		var date = dpg.parseDate( dateStr, dpg.parseFormat( 'yyyy-mm-dd' ) );
		var dateFormatted = dpg.formatDate( date, _settings.dateFormat, _settings.language );
		var startDateFormatted = dpg.formatDate( datepicker.getStartDate(), _settings.dateFormat, _settings.language );
		var endDateFormatted = dpg.formatDate( datepicker.getEndDate(), _settings.dateFormat, _settings.language );

		// Bail if date is disabled
		if ( datepicker.dateIsDisabled( date ) ) { return { valid: false }; }

		// Bail if date is out of range
		if ( date < datepicker.getStartDate() || date > datepicker.getEndDate() ) { return { valid: false, message: _settings.validationMessages.out_of_range.replace( '{selected_date}', dateFormatted ).replace( '{start_date}', startDateFormatted ).replace( '{end_date}', endDateFormatted ) }}

		// Field is valid
		return { valid: true };
	};



	/**
	 * Register validation types.
	 */
	var registerValidationTypes = function() {
		CheckoutValidation.registerValidationType( 'delivery_date_out_of_range', 'delivery-date-range', isDeliveryDateField, validateDeliveryDateOutOfRange );
		CheckoutValidation.registerValidationType( 'delivery_date_disabled', 'delivery-date-disabled', isDeliveryDateField, validateDeliveryDateDisabled );
	}



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) return;

		// Bail if `CheckoutValidation` is not available
		if ( ! window.CheckoutValidation ) { return; }

		// Merge settings
		_settings = FCUtils.extendObject( _settings, options );

		// Register validation types
		registerValidationTypes();

		_hasInitialized = true;
	};


	
	//
	// Public APIs
	//
	return _publicMethods;

});
