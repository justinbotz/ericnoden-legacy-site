/**
 * Manage cart update actions.
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
		root.CartUpdate = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		bodyClass: 'has-fc-cart-update',

		sectionSelector: '.fc-wrapper .fc-cart-section',
		messagesWrapperSelector: '.woocommerce-notices-wrapper',

		sectionVisibleStateFieldSelector: '.fc-section-visible-state[type="hidden"]',
		sectionVisibleStateAttribute: 'data-section-visible',

		uiProcessingClass: 'processing',

		shippingCalcMessagesWrapperSelector: '.fc-shipping-calculator-messages',

		updateCartFragmentsNonce: '', // Value updated during runtime
	}
	var _xhr = false;
	var _fragments = {};



	/**
	 * Global flags.
	 */

	window.can_update_cart = true;



	/**
	 * METHODS
	 */




	/**
	 * Maybe change visibility status of cart sections.
	 *
	 * @param   Event  _event  An unused `jQuery.Event` object.
	 * @param   Array  data   The updated checkout data.
	 */
	var maybeChangeSectionState = function( _event, data ) {
		// Get all section elements
		var sectionElements = document.querySelectorAll( _settings.sectionSelector );

		// Loop through each section element
		for ( var i = 0; i < sectionElements.length; i++ ) {
			var sectionElement = sectionElements[i];

			// Handle visibility state
			var visibilityHiddenField = sectionElement.querySelector( _settings.sectionVisibleStateFieldSelector );
			if ( visibilityHiddenField && 'no' === visibilityHiddenField.value ) {
				sectionElement.setAttribute( _settings.sectionVisibleStateAttribute, visibilityHiddenField.value );
			}
			else {
				sectionElement.removeAttribute( _settings.sectionVisibleStateAttribute );
			}
		}
	}

	/**
	 * Maybe enhance select fields with TomSelect.
	 */
	var maybeEnhanceFields = function() {
		// Bail if FCEnhancedSelect is not available
		if ( ! window.FCEnhancedSelect ) { return; }

		FCEnhancedSelect.enhanceFields();
	}

	/**
	 * Reinitialize collapsible blocks after checkout update.
	 */
	var maybeReinitializeCollapsibleBlocks = function() {
		// Bail if collapsible blocks are not available
		if ( ! window.CollapsibleBlock ) { return; }

		requestAnimationFrame( function() {
			// Get the current focused element
			var currentFocusedElement = document.activeElement;

			// Get all collapsible blocks
			var collapsibleBlocks = document.querySelectorAll( '[data-collapsible]' );

			// Loop through each collapsible block
			for ( var i = 0; i < collapsibleBlocks.length; i++ ) {
				// Initialize variables
				var collapsibleBlock = collapsibleBlocks[ i ];

				// Maybe initialize the collapsible block
				if ( ! CollapsibleBlock.getInstance( collapsibleBlock ) ) {
					CollapsibleBlock.initializeElement( collapsibleBlock );
				}

				//  Maybe expand section if it was previously expanded
				if ( collapsibleBlock.contains( currentFocusedElement ) ) {
					CollapsibleBlock.expand( collapsibleBlock, false, true );

					// Get collapsible block for the toggle link of optional fields
					var wrapper = currentFocusedElement.closest( '.fc-expansible-form-section' );
					var toggleCollapsibleBlock = wrapper ? wrapper.querySelector( '.fc-expansible-form-section__toggle' ) : false;

					// Maybe collapse the toggle section
					if ( false !== toggleCollapsibleBlock ) {
						CollapsibleBlock.collapse( toggleCollapsibleBlock, false );
					}
				}
			}
		} );
	}



	/**
	 * Maybe trigger the update cart event when the page visibility state changes.
	 */
	var maybeUpdateCartVisibilityChange = function() {
		// Bail if not target page visibility state
		if ( 'hidden' != document.visibilityState && 'visible' != document.visibilityState ) { return;	}

		// Triggger the update cart event
		$( document.body ).trigger( 'wc_fragment_refresh' );
	};
	var debouncedMaybeUpdateCartVisibilityChange = FCUtils.debounce( maybeUpdateCartVisibilityChange, 50 );



	/**
	 * Trigger update cart fragments for use with event handlers.
	 */
	var triggerUpdateCartFragments = function( e ) {
		_publicMethods.updateCartFragments();
	};



	/**
	 * Update the cart fragments.
	 * @throws  {TypeError}  Throws TypeError when used directly with event handlers because events pass the Event object as the first parameter while this function expects the first parameter to be the extra data to be sent with the AJAX request.
	 */
	_publicMethods.updateCartFragments = function( data ) {
		// Cancel existing update request
		if ( _xhr ) { _xhr.abort(); }

		// Bail if the cart is not updatable
		if ( ! window.can_update_cart ) { return; }

		// Add security
		data = FCUtils.extendObject( data, {
			security:   _settings.updateCartFragmentsNonce,
		} );

		_xhr = $.ajax({
			type:         'POST',
			url:          fcSettings.wcAjaxUrl.toString().replace( '%%endpoint%%', 'fc_pro_update_cart_fragments' ),
			data:         data,
			success:      function( result ) {
				// Reload the page if requested
				if ( result && true === result.reload ) {
					window.location.reload();
					return;
				}

				// CHANGE: Set variables for current focused element
				FCUtils.setCurrentFocusedElementGlobalVariables();

				// Always update the fragments
				if ( result && result.fragments ) {
					// Try to remove select2 components from existing fields before replacing fragments
					$( 'select.country_select, select.state_select' ).each( function() {
						var field = $( this );
						if ( field && false !== field.data( 'select2' ) && field.selectWoo && 'function' === typeof field.selectWoo ) {
							try {
								field.select2( 'destroy' );
							} catch ( error ) {
								try { field.selectWoo( 'destroy' ); }
								catch ( error2 ) { /* Do nothing */ }
							}
						}
					});

					// Iterate through each fragment
					$.each( result.fragments, function ( key, value ) {
						// CHANGE: Declare local variables needed for some checks before replacing the fragment
						var fragmentToReplace = document.querySelector( key );
						var replaceFragment = true;

						// CHANGE: Allow fragments to be replaced every time even when their contents are equal the existing elements in the DOM
						if ( value && -1 !== value.toString().indexOf( 'fc-fragment-always-replace' ) ) {
							replaceFragment = true;
						}
						
						// CHANGE: Allow fragments to be replaced every time even when their contents are equal the existing elements in the DOM
						if ( replaceFragment && ( ! _fragments || _fragments[ key ] !== value ) ) {
							// CHANGE: Log replaced fragment to console if debug mode is enabled.
							if ( 'yes' === fcSettings.debugMode ) {
								console.log( 'Replacing fragment: ' + key );
							}
							$( key ).replaceWith( value );
						}
						// CHANGE: Log skipped fragment to console if debug mode is enabled.
						else if ( 'yes' === fcSettings.debugMode ) {
							console.log( 'Skipping fragment: ' + key );
						}
						$( key ).unblock();
					} );

					// Update fragments list
					_fragments = result.fragments;
				}

				// CHANGE: Re-set focus to the element with focus previously to updating fragments
				FCUtils.maybeRefocusElement( window.fcCurrentFocusedElement, window.fcCurrentFocusedElementValue );

				// Maybe scroll to notices
				var messagesWrapper = document.querySelector( _settings.messagesWrapperSelector );
				if ( messagesWrapper && messagesWrapper.children.length > 0 && window.FCUtils && 'function' === typeof FCUtils.scrollToElement ) {
					FCUtils.scrollToElement( messagesWrapper );
				}

				// Trigger elements updated events
				$( document.body ).trigger( 'wc_fragments_refreshed' );
				$( document.body ).trigger( 'updated_cart_totals' );
			}
		});
	};

	

	/**
	 * Use the same method that WooCommerce uses to block other parts of the checkout form while updating.
	 * The UI is unblocked by the WooCommerce `checkout.js` script (which is replaced with a modified version but keeps the same behavior)
	 * using the checkout fragment selector, then unblocking after the checkout update is completed.
	 *
	 * @param   HTMLElement  element  Element to block the UI and show the loading indicator.
	 */
	_publicMethods.blockUI = function( element ) {
		$( element ).addClass( _settings.uiProcessingClass ).block( {
			message: null,
			overlayCSS: {
				background: '#fff',
				opacity: 0.6
			}
		} );
	}

	/**
	 * Unblock UI element to be used again.
	 *
	 * @param   HTMLElement  element  Element to get the UI unblocked.
	 *
	 * @see  blockUI
	 */
	_publicMethods.unblockUI = function( element ) {
		$( element ).removeClass( _settings.uiProcessingClass ).unblock();
	}

	/**
	 * Add notices in the coupon code section.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	 _publicMethods.showShippingNotices = function( content ) {
		var messagesWrapper = document.querySelector( _settings.shippingCalcMessagesWrapperSelector );
		if ( messagesWrapper ) {
			messagesWrapper.innerHTML = content;
		}
	}

	/**
	 * Remove all notices from the coupon code section.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	_publicMethods.clearShippingNotices = function() {
		var messagesWrapper = document.querySelector( _settings.shippingCalcMessagesWrapperSelector );
		if ( messagesWrapper ) {
			messagesWrapper.innerHTML = '';
		}
	}



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) return;

		// Merge settings
		_settings = FCUtils.extendObject( _settings, options );

		// Add event listeners
		document.addEventListener( 'visibilitychange', debouncedMaybeUpdateCartVisibilityChange );

		// Add jQuery event listeners
		if ( _hasJQuery ) {
			$( document.body ).on( 'wc_fragment_refresh updated_wc_div updated_shipping_method', triggerUpdateCartFragments );

			// After cart fragments has been updated
			$( document.body ).on( 'wc_fragments_refreshed', maybeReinitializeCollapsibleBlocks );
			$( document.body ).on( 'wc_fragments_refreshed', maybeChangeSectionState );
			$( document.body ).on( 'wc_fragments_refreshed', maybeEnhanceFields );
		}

		// Add init class
		document.body.classList.add( _settings.bodyClass );

		// Update fragments
		triggerUpdateCartFragments();

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
