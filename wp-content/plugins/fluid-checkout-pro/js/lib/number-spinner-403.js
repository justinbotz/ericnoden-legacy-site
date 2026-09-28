/**
 * File number-spinner.js.
 *
 * Add plus/minus buttons to input type number.
 */
(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.NumberSpinner = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var _hasInitialized = false;
	var _publicMethods = {}; // Placeholder for public methods
	var _settings = {
		bodyClass: 'has-number-spinner',

		containerSelector: '',
		inputSelector: 'input[type="number"]',

		buttonPlacement: 'both', // Accepts `both`, `before` and `after`.
		buttonsAddedClass: 'buttons-added',

		minusButtonTemplate: '<button type="button" class="number-spin-button minus" title="Decrease" aria-hidden="true" tabindex="-1">-</button>',
		plusButtonTemplate: '<button type="button" class="number-spin-button plus" title="Increase" aria-hidden="true" tabindex="-1">+</button>',

		onChangeCallback: null,
	};



	/**
	 * METHODS
	 */


	
	/*!
	* Merge two or more objects together.
	* (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com
	* @param   {Boolean}  deep     If true, do a deep (or recursive) merge [optional]
	* @param   {Object}   objects  The objects to merge together
	* @returns {Object}            Merged values of defaults and options
	*/
	var extend = function () {
		// Variables
		var extended = {};
		var deep = false;
		var i = 0;

		// Check if a deep merge
		if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
			deep = arguments[0];
			i++;
		}

		// Merge the object into the extended object
		var merge = function (obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					// If property is an object, merge properties
					if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
						extended[prop] = extend(extended[prop], obj[prop]);
					} else {
						extended[prop] = obj[prop];
					}
				}
			}
		};

		// Loop through each object and conduct a merge
		for (; i < arguments.length; i++) {
			var obj = arguments[i];
			merge(obj);
		}

		return extended;
	};



	/**
	 * Returns a function, that, as long as it continues to be invoked, will not
	 * be triggered. The function will be called after it stops being called for
	 * N milliseconds. If `immediate` is passed, trigger the function on the
	 * leading edge, instead of the trailing.
	 *
	 * @param   {[type]}  func       Function to be executed.
	 * @param   {[type]}  wait       Wait time in milliseconds.
	 * @param   {[type]}  immediate  Trigger the function on the leading edge.
	 *
	 * @return  function              Function to be executed, incapsulated in a timed function.
	 */
	var _debounce = function ( func, wait, immediate ) {
		var timeout;

		return function() {
		  var context = this, args = arguments;
		  var later = function() {
			timeout = null;
			if (!immediate) func.apply( context, args );
		  };

		  var callNow = immediate && !timeout;
		  clearTimeout( timeout );
		  timeout = setTimeout( later, wait );

		  if ( callNow ) func.apply( context, args );
		};
	};



	/**
	 * Add spin buttons
	 */
	var addButtons = function( input, options ) {
		// Create temporary element to create buttons from string template
		var tempDiv = document.createElement('div');

		// Define buttons placement
		var buttonPlacement = options.buttonPlacement;
		var minusReferenceElement;
		var plusReferenceElement;
		switch ( buttonPlacement ) {
			case 'before':
				minusReferenceElement = input;
				plusReferenceElement = input;
				break;
			case 'after':
				minusReferenceElement = input.nextSibling;
				plusReferenceElement = input.nextSibling;
				break;
			default: // `both` before and after the input field
				minusReferenceElement = input;
				plusReferenceElement = input.nextSibling;
				break;
		}

		// Create minus button from template and insert it before input
		tempDiv.innerHTML = options.minusButtonTemplate;
		tempDiv.firstChild.setAttribute( 'data-number-spinner-button', 'minus' );
		input.parentNode.insertBefore( tempDiv.firstChild, minusReferenceElement );

		// Create plus button from template and insert it after input
		tempDiv.innerHTML = options.plusButtonTemplate;
		tempDiv.firstChild.setAttribute( 'data-number-spinner-button', 'plus' );
		input.parentNode.insertBefore( tempDiv.firstChild, plusReferenceElement );

		// Add class to input element
		input.classList.add( options.buttonsAddedClass );

		// Remove tempDiv element from the DOM
		if ( tempDiv.remove ) { tempDiv.remove(); }
	};



	/**
	 * Handle button click
	 */
	var handleCapturedClick = function( e ) {
		// Get target button
		var target = e.target.closest( '[data-number-spinner-button]' );

		// Bail if number spinner button not clicked
		if ( ! target ) { return; }

		// Get target input
		var targetInput = target.parentNode.querySelector( _settings.inputSelector );

		// Bail if target number input field was not found
		if ( ! targetInput ) { return; }

		// Ger decimals from field attributes
		var decimals = targetInput.getAttribute( 'data-number-spinner-decimals' );
		decimals = decimals ? parseInt( decimals ) : 0;

		// Get number field step and invert signal if minus button
		var step = targetInput.getAttribute( 'step' );
		step = step ? parseFloat( step ) : 1;
		step = target.getAttribute( 'data-number-spinner-button' ) == 'minus' ? -1 * step : step;

		// Get min and max values
		var min = targetInput.getAttribute( 'min' );
		min = min != '' ? parseFloat( min ) : null;
		min = min == NaN ? null : min;
		var max = targetInput.getAttribute( 'max' );
		max = max != '' ? parseFloat( max ) : null;
		max = max == NaN ? null : max;

		// Get new value from field
		var value = parseFloat( targetInput.value );
		value = value + step;

		// Handle min and max values
		if ( min != null && value < min ) { value = min; }
		if ( max != null && value > max ) { value = max; }

		// Lose focus from button
		e.target.blur();

		// Set new value
		// Needs to set decimal places to avoid issues with floating point numbers
		// https://stackoverflow.com/questions/588004/is-floating-point-math-broken
		targetInput.value = value.toFixed( decimals );
		targetInput.focus();

		// Dispatch change event.
		var changeEvent = new CustomEvent( 'change', { detail: {}, bubbles: false } );
		targetInput.dispatchEvent( changeEvent );
	};



	/**
	 * Initialize all input elements inside the passed container.
	 *
	 * @param   HTMLElement  containerElement  The container element where to look for input number fields.
	 */
	_publicMethods.initInputFields = function( containerElement, options ) {
		// Bail if containerElement is invalid
		if ( ! containerElement ) { return; }

		// Merge options with default settings
		options = extend( _settings, options );

		// Get input elements
		var inputElements = containerElement.querySelectorAll( options.inputSelector );

		for ( var i = 0; i < inputElements.length; i++ ) {
			// Check if already initialized
			if ( ! inputElements[ i ].classList.contains( options.buttonsAddedClass ) ) {
				// Add buttons
				addButtons( inputElements[ i ], options );
			}

			// Add event handlers
			if ( options.onChangeCallback && typeof options.onChangeCallback === "function" ) {
				// Try remove event listener to prevent duplicate, then add.
				inputElements[ i ].removeEventListener( 'change', _debounce( options.onChangeCallback, 200 ) );
				inputElements[ i ].addEventListener( 'change', _debounce( options.onChangeCallback, 200 ) );
			}
		}
	};



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) return;

		// Merge settings
		_settings = extend( _settings, options );

		// Add capture click event listener
		document.addEventListener( 'click', handleCapturedClick, true );

		// Initialize fields inside the default container
		if ( _settings.containerSelector && _settings.containerSelector !== '' ) {
			var containerElement = document.querySelector( _settings.containerSelector );
			_publicMethods.initInputFields( containerElement );
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
