/**
 * Handle phone fields using `intl-tel-input` component.
 */

(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.IntlTelInputHandler = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		bodyClass:                        'has-fc-intl-tel-input--activated',

		phoneFieldSelector:               '[data-phone-field], input.js-phone-field, .js-phone-field input, #billing_phone, #shipping_phone, #phone',
		formRowSelector:                  '.form-row',
		intlTelContainerSelector:         '.iti',
		countryContainerSelector:         '.iti__selected-country',
		flagContainerSelector:            '.iti__selected-country-primary',

		validationNumberTypeClassTemplate: 'js-phone-field--{type}',

		initialCountryAttribute:          'data-intl-tel-initial-country',
		countryFieldSelectorAttribute:    'data-intl-tel-country-field-selector',

		hiddenInputSuffix:                '_full',

		enablePhoneValidation:            false,
		enablePreciseValidation:          false,
		enableCountryListFilter:          false,

		typePhoneSelector:                '.validate-phone',
		invalidFormRowSelector:           '.woocommerce-invalid-phone',
		validationMessages: {
			invalid_generic:             'This is not a valid phone number.',
			invalid_country:             'This is not a valid phone number for this country.',
			invalid_country_precise:     'This is not a valid or accepted phone number. Accepted types are: {types}.',
			invalid_country_code:        'This is not a valid phone number: invalid country code or country not available.',
			too_short:                   'This is not a valid phone number: too short.',
			too_long:                    'This is not a valid phone number: too long.',
			precise_unknown:             'unknown',
		},
	};
	var _defaultFieldSettings = {
		separateDialCode:                 true,
		autoPlaceholder:                  'off',
		formatOnDisplay:                  true,
		formatAsYouType:                  true,
		validationNumberTypes:            [ 'MOBILE', 'FIXED_LINE' ],
	};
	var _acceptedValidationTypes = [ 'MOBILE', 'FIXED_LINE', 'FIXED_LINE_OR_MOBILE', 'TOLL_FREE' ];





	/**
	 * METHODS
	 */



	/**
	 * Check if the field is a phone field.
	 * @param  {Field}    field            Field for validation.
	 * @param  {Element}  formRow          Form row element.
	 * @param  {String}   validationEvent  Event that triggered the validation.
	 * @return {Boolean}                   Whether the field is a Phone field.
	 */
	var isPhoneField = function( field, formRow, validationEvent ) {
		if ( ! formRow.matches( _settings.typePhoneSelector ) ) { return false; }
		return true;
	};

	/**
	 * Validate phone field value.
	 * @param  {Field}    field            Field for validation.
	 * @param  {Element}  formRow          Form row element.
	 * @param  {String}   validationEvent  Event that triggered the validation.
	 * @return {Boolean}                   Whether the field value is a valid phone field.
	 */
	var validatePhoneField = function( field, formRow, validationEvent ) {
		// Bail as `valid` if field does not have a value
		// Required phone fields are validated by `CheckoutValidation.validateRequired` validation type.
		if ( ! CheckoutValidation.hasValue( field ) ) { return { valid: true }; }

		// Get phone field instance
		var phoneField = field.iti;

		// Check that phone field instance is available
		if ( ! phoneField ) { return { valid: true }; }

		// Check whether the number is valid (maybe using precise validation)
		var isPhoneNumberValid = phoneField.isValidNumber();
		if ( _settings.enablePreciseValidation && typeof phoneField.isValidNumberPrecise === 'function' ) {
			isPhoneNumberValid = phoneField.isValidNumberPrecise();
		}

		// Maybe return validation errors
		if ( ! isPhoneNumberValid ) {
			// Define default error message
			var errorMessage = _settings.validationMessages.invalid_generic;

			// Try get a more specific error message
			var errorCode = phoneField.getValidationError();
			switch ( errorCode ) {
				case intlTelInput.utils.validationError.TOO_SHORT:
					errorMessage = _settings.validationMessages.too_short;
					break;
				case intlTelInput.utils.validationError.TOO_LONG:
					errorMessage = _settings.validationMessages.too_long;
					break;
				case intlTelInput.utils.validationError.INVALID_COUNTRY_CODE:
					errorMessage = _settings.validationMessages.invalid_country_code;
					break;
				case intlTelInput.utils.validationError.IS_POSSIBLE:
				case intlTelInput.utils.validationError.IS_POSSIBLE_LOCAL_ONLY:
					errorMessage = _settings.validationMessages.invalid_country;
					break;
			}

			// Maybe update error message with validation number types, if precise validation is enabled
			if ( _settings.enablePreciseValidation ) {
				var fieldValidationTypes = getValidationNumberTypesForField( field );
				var types = ! Array.isArray( fieldValidationTypes ) ? _settings.validationMessages.precise_unknown : fieldValidationTypes.map( function( type ) {
					return type.toLowerCase().replace( '_', ' ' );
				} ).join( ', ' );
				errorMessage = _settings.validationMessages.invalid_country_precise.replace( '{types}', types );
			}

			return { valid: false, message: errorMessage };
		}

		// Field is valid
		return { valid: true };
	};

	/**
	 * Register validation types.
	 */
	var registerValidationTypes = function() {
		if ( _settings.enablePhoneValidation ) {
			CheckoutValidation.registerValidationType( 'phone', 'phone', isPhoneField, validatePhoneField );
		}
	}



	/**
	 * Populate hidden field with full phone number
	 */
	var populateHiddenField = function( field ) {
		// Get phone field instance
		var phoneField = field.iti;

		// Get hidden field
		var hiddenFieldName = field.getAttribute( 'name' ) + _settings.hiddenInputSuffix;
		var hiddenField = document.querySelector( 'input[name="' + hiddenFieldName + '"]' );

		// Bail if hidden field is not available
		if ( ! phoneField || ! hiddenField ) { return; }

		// Get selected country code
		var selectedCountry = phoneField.getSelectedCountryData();
		var selectedCountryCode = selectedCountry && selectedCountry.dialCode && 0 !== field.value.indexOf( '+' ) ? '+' + selectedCountry.dialCode : '';

		// Set hidden field value
		hiddenField.value = phoneField.isValidNumber() ? phoneField.getNumber() : '';

		// Maybe append country code to full phone number
		if ( ! hiddenField.value && field.value ) {
			// Set field value
			hiddenField.value = selectedCountryCode + field.value;
		}
	};

	/**
	 * Initialize all phone fields.
	 */
	var initializeAllFields = function() {
		var phoneFields = document.querySelectorAll( _settings.phoneFieldSelector );
		for ( var i = 0; i < phoneFields.length; i++ ) {
			_publicMethods.initializeField( phoneFields[ i ] );
		}
	};

	/**
	 * Initialize all phone fields.
	 */
	var populateAllHiddenFields = function() {
		var phoneFields = document.querySelectorAll( _settings.phoneFieldSelector );
		for ( var i = 0; i < phoneFields.length; i++ ) {
			populateHiddenField( phoneFields[ i ] );
		}
	};



	/**
	 * Handle blur event
	 */
	var handleBlur = function( e ) {
		// Bail if target element does not support `matches` method
		if ( ! e.target.matches ) { return; }

		// Bail if target field is not a phone field
		if ( ! e.target.matches( _settings.phoneFieldSelector ) ) { return; }

		var field = e.target;
		populateHiddenField( field );
		// IMPORTANT: Cannot format field at `blur` event because it will trigger
		// the field to get focus again, making it impossible to leave focus from the field.
	};




	/**
	 * Handle change event
	 */
	var handleChange = function( e ) {
		// Bail if target field is not a phone field
		if ( ! e.target.matches( _settings.phoneFieldSelector ) ) { return; }

		// Get field
		var field = e.target;

		// Populate hidden field
		populateHiddenField( field );

		// Maybe validate field when country changes
		if ( _settings.enablePhoneValidation && window.CheckoutValidation && 'countrychange' === e.type ) {
			CheckoutValidation.validateField( field );
		}
	};
	var handleChangeDebounced = FCUtils.debounce( handleChange, 100 );



	/**
	 * Get allowed countries for a phone field, based on the related country field.
	 * 
	 * @param  {HTMLElement}  field  The phone field.
	 */
	var getAllowedCountriesForField = function( field ) {
		// Bail if field is not valid
		if ( ! field ) { return; }

		// Initialize variables
		var onlyCountries = [];
		
		// Get the country field selector
		var countryFieldSelector = field.getAttribute( _settings.countryFieldSelectorAttribute );

		// Get the country list from dropdown field
		var countryField = countryFieldSelector ? document.querySelector( countryFieldSelector ) : null;
		if ( countryField && 'select' === countryField.tagName.toLowerCase() ) {
			// Get the country options as a list
			var countryOptions = countryField.options;
			for ( var i = 0; i < countryOptions.length; i++ ) {
				// Skip if empty value
				if ( ! countryOptions[ i ].value ) { continue; }

				// Add country to list
				onlyCountries.push( countryOptions[ i ].value );
			}
		}
		// Otherwise, get single country from the field value
		else if ( countryField && 'input' === countryField.tagName.toLowerCase() ) {
			// Add country to list
			onlyCountries.push( countryField.value );
		}

		// Return only countries
		return onlyCountries;
	}



	/**
	 * Get validation number types for a phone field. Check for class on the field or related form row element, otherwise return default validation number types.
	 * 
	 * @param   {HTMLElement}  field  The phone field.
	 * @return  {Array}               The validation number types for the field.
	 */
	var getValidationNumberTypesForField = function( field ) {
		// Bail if field is not valid
		if ( ! field ) { return _settings.fieldSettings.validationNumberTypes; }

		// Initialize validation number types list
		var fieldValidationTypes = [];

		// Loop through accepted validation types
		_acceptedValidationTypes.forEach( function( type ) {
			// Get validation type class, applying template
			var validationTypeClass = _settings.validationNumberTypeClassTemplate.replace( '{type}', type );

			// Skip if validation type class is not found
			if ( ! field.closest( '.' + validationTypeClass ) ) { return; }

			// Add validation type to list, if not already in list
			if ( -1 === fieldValidationTypes.indexOf( type ) ) {
				fieldValidationTypes.push( type );
			}
		} );

		// Maybe update validation number types list
		if ( 0 === fieldValidationTypes.length ) {
			fieldValidationTypes = _settings.fieldSettings.validationNumberTypes;
		}

		// Return validation number types
		return fieldValidationTypes;
	}



	/**
	 * Initialize a phone field.
	 */
	_publicMethods.initializeField = function( field ) {
		// Maybe populate hidden field, then bail if field has already been initialized
		if ( field.iti ) {
			populateHiddenField( field );
			return;
		}

		// Get the default field settings
		var fieldSettings = _defaultFieldSettings;

		// Maybe set only allowed countries
		var allowedCoutries = [];
		if ( _settings.enableCountryListFilter ) {
			allowedCoutries = getAllowedCountriesForField( field );
			if ( allowedCoutries && allowedCoutries.length > 0 ) {
				fieldSettings.onlyCountries = allowedCoutries;
			}
		}

		// Maybe set initial country
		var initialCountry = field.getAttribute( _settings.initialCountryAttribute );
		if ( initialCountry && allowedCoutries && allowedCoutries.indexOf( initialCountry ) !== -1 ) {
			fieldSettings.initialCountry = initialCountry;
		}

		// Maybe set initial country to single allowed country, if only one country is allowed
		if ( allowedCoutries && 1 === allowedCoutries.length ) {
			fieldSettings.initialCountry = allowedCoutries[ 0 ];
		}

		// Maybe set custom validation number type classes for the field, from class name
		// Check for class on the field or related form row element
		if ( _settings.enablePreciseValidation ) {
			fieldSettings.validationNumberTypes = getValidationNumberTypesForField( field );
		}

		// Intialize field
		field.iti = window.intlTelInput( field, fieldSettings );

		// Remove the hidden field if it exists
		var hiddenFieldName = field.getAttribute( 'name' ) + _settings.hiddenInputSuffix;
		var hiddenField = document.querySelector( 'input[name="' + hiddenFieldName + '"]' );
		if ( hiddenField ) {
			hiddenField.parentNode.removeChild( hiddenField );
		}

		// Create a new hidden field and append it to the form
		hiddenField = document.createElement( 'input' );
		hiddenField.type = 'hidden';
		hiddenField.name = hiddenFieldName;
		field.parentNode.appendChild( hiddenField );

		// Set flag container rounded borders
		var formRow = field.closest( _settings.formRowSelector );
		var flagContainer = formRow ? formRow.querySelector( _settings.flagContainerSelector ) : 0;
		if ( flagContainer ) {
			if ( ! document.body.classList.contains( 'rtl' ) ) {
				// LTR languages
				flagContainer.style.borderTopLeftRadius = window.getComputedStyle( field ).borderTopLeftRadius;
				flagContainer.style.borderBottomLeftRadius = window.getComputedStyle( field ).borderBottomLeftRadius;
			}
			else {
				// RTL languages
				flagContainer.style.borderTopRightRadius = window.getComputedStyle( field ).borderTopRightRadius;
				flagContainer.style.borderBottomRightRadius = window.getComputedStyle( field ).borderBottomRightRadius;
			}
		}

		// Set select country rounded borders
		var countryContainer = formRow ? formRow.querySelector( _settings.countryContainerSelector ) : 0;
		if ( countryContainer ) {
			if ( ! document.body.classList.contains( 'rtl' ) ) {
				// LTR languages
				countryContainer.style.borderTopLeftRadius = window.getComputedStyle( field ).borderTopLeftRadius;
				countryContainer.style.borderBottomLeftRadius = window.getComputedStyle( field ).borderBottomLeftRadius;
			}
			else {
				// RTL languages
				countryContainer.style.borderTopRightRadius = window.getComputedStyle( field ).borderTopRightRadius;
				countryContainer.style.borderBottomRightRadius = window.getComputedStyle( field ).borderBottomRightRadius;
			}
		}

		// Maybe validate field at initialization
		if ( _settings.enablePhoneValidation && window.CheckoutValidation && field.closest( _settings.invalidFormRowSelector ) ) {
			CheckoutValidation.validateField( field );
		}

		// Set initial value for hidden field
		populateHiddenField( field );
	}



	/**
	 * Initialize intl phone number inputs
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) return;

		// Bail if intl-tel-input library has not been loaded
		if ( ! window.intlTelInput ) { return; }

		// Merge settings
		_settings = FCUtils.extendObject( _settings, options );
		_defaultFieldSettings = options && options.fieldSettings ? FCUtils.extendObject( _defaultFieldSettings, options.fieldSettings ) : _defaultFieldSettings;

		// Load utils
		if ( _settings.utilsScript ) {
			_defaultFieldSettings.loadUtils = function() {
				return import( _settings.utilsScript );
			};
		}

		// Set event listeners
		document.addEventListener( 'blur', handleBlur, true );
		document.addEventListener( 'input', handleChangeDebounced, true );
		document.addEventListener( 'change', handleChangeDebounced, true );
		document.addEventListener( 'countrychange', handleChangeDebounced, true );

		// Set jQuery event listeners
		if ( _hasJQuery ) {
			$( document.body ).on( 'update_checkout', populateAllHiddenFields );
			$( document.body ).on( 'updated_checkout', initializeAllFields );
		}

		// Initialize all phone fields
		initializeAllFields();

		// Integrate with `CheckoutValidation` if available
		if ( window.CheckoutValidation ) {
			// Register validation types
			registerValidationTypes();
		}

		// Add init class
		document.body.classList.add( _settings.bodyClass );

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
