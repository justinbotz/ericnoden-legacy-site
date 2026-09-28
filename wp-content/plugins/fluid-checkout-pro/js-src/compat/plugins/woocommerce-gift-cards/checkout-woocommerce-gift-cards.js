/**
 * Checkout scripts for: WooCommerce Gift Cards (by WooCommerce).
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
		root.CheckoutWooCommerceGiftCards = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		bodyClass: 'has-fc-checkout-gift-cards',

		uiProcessingClass: 'processing',

		sectionWrapperSelector: '.fc-step__substep',
		generalNoticesSelector: '.woocommerce-notices-wrapper',
		messagesWrapperSelector: '.fc-gift-card-code-messages',

		useGeneralNoticesSection: 'no',
		suppressSuccessMessages: 'no',

		giftCardAddedSectionSelector: '.fc-step__substep-text-content--gift-card-codes',
		giftCardSectionSelector: '.fc-gift-card-code-section',
		giftCardFieldSelector: 'input[name="gift_card_code"]',
		addGiftCardButtonSelector: '.fc-gift-card-code__apply',
		removeGiftCardButtonSelector: '.woocommerce-remove-gift-card',
		
		giftCardCodeAttribute: 'data-gift-card',
		giftCardIdAttribute: 'data-giftcard',
		referenceIdAttribute: 'data-reference-id',
		expansibleGiftCardSectionKeyAttribute: 'data-section-key',

		expansibleGiftCardContentSelector: '.fc-expansible-form-section__content',
		expansibleGiftCardToggleSelector: '.fc-expansible-form-section__toggle--###SECTION_KEY###',
		expansibleGiftCardToggleButtonSelector: '.expansible-section__toggle-plus--###SECTION_KEY###',

		section_key_placeholder:  '###SECTION_KEY###',
	}



	/**
	 * METHODS
	 */


	/**
	 * Maybe trigger cart and checkout update events when an AJAX call completes.
	 * 
	 * @param Event           e              The event object.
	 * @param XMLHttpRequest  jqXHR          The jQuery XMLHttpRequest object.
	 * @param object          jqXHRSettings  The jQuery AJAX settings object.
	 */
	var maybeTriggerUpdateEvents = function( e, jqXHR, jqXHRSettings ) {
		// Bail if object is not available
		if ( ! wc_gc_params ) return;

		// Bail if AJAX call was not successful
		if ( 200 !== jqXHR.status ) return;

		// Bail if AJAX call was not to the WooCommerce Gift Cards AJAX URL
		if ( ! wc_gc_params.wc_ajax_url || wc_gc_params.wc_ajax_url.toString().replace( '%%endpoint%%', 'toggle_balance_usage' ) !== jqXHRSettings.url ) return;

		// Trigger update events
		$( document.body ).trigger( 'wc_fragment_refresh' );
		$( document.body ).trigger( 'update_checkout' );
	}



	/**
	 * Add notices in the gift card code section.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	var showNotices = function( content, referenceElement ) {
		// Try to get messages wrapper from the gift card code section
		var messagesWrapper;
		var sectionWrapper = referenceElement ? referenceElement.closest( _settings.sectionWrapperSelector ) : null;
		if ( sectionWrapper ) {
			messagesWrapper = sectionWrapper.querySelector( _settings.messagesWrapperSelector );
		}
		else {
			messagesWrapper = document.querySelector( _settings.generalNoticesSelector );
		}

		// Otherwise try to get messages wrapper from the general notices section
		if ( 'yes' === _settings.useGeneralNoticesSection ) {
			messagesWrapper = document.querySelector( _settings.generalNoticesSelector );
		}

		// Add message
		if ( messagesWrapper ) {
			messagesWrapper.innerHTML = content;
		}
	}

	/**
	 * Remove all notices from the gift card code section.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	var clearNotices = function() {
		var generalNotices = document.querySelector( _settings.generalNoticesSelector );
		if ( generalNotices ) {
			generalNotices.innerHTML = '';
		}

		var messagesWrapper = document.querySelector( _settings.messagesWrapperSelector );
		if ( messagesWrapper ) {
			messagesWrapper.innerHTML = '';
		}
	}



	/**
	 * Process adding a gift card code to the cart from the add gift card button.
	 *
	 * @param   HTMLElement  referenceElement  The element which was used to trigger adding the gift card.
	 */
	var processAddGiftCard = function( referenceElement ) {
		var giftCardCode = '';

		// Try to get gift card code from attributes
		if ( referenceElement && referenceElement.hasAttribute( _settings.giftCardCodeAttribute ) ) {
			giftCardCode = referenceElement.getAttribute( _settings.giftCardCodeAttribute );
		}

		// Try to get gift card code from gift card field
		if ( ! giftCardCode || '' == giftCardCode ) {
			var giftCardSection = referenceElement.closest( _settings.giftCardSectionSelector );
			var giftCardField = giftCardSection.querySelector( _settings.giftCardFieldSelector );

			// Bail if gift card code field was not found
			if ( ! giftCardField ) { return; }

			// Focus on add gift card button and bail if gift card field is empty
			if ( '' === giftCardField.value.trim() ) {
				giftCardField.value = ''; // Clear space chars if any
				giftCardField.focus();
				return;
			}

			giftCardCode = giftCardField.value;
		}

		// Bail if gift card code was not provided
		if ( ! giftCardCode || '' == giftCardCode ) { return; }

		_publicMethods.addGiftCardCode( giftCardCode, referenceElement );
	}
	
	/**
	 * Process removing a gift card code to the cart from the add gift card button.
	 *
	 * @param   HTMLElement  referenceElement  The remove gift card button element.
	 */
	var processRemoveGiftCard = function( referenceElement ) {
		// Bail if add gift card button not provided
		if ( ! referenceElement ) { return; }

		var giftCardId = '';

		// Try to get gift card ID from button attributes
		if ( referenceElement.hasAttribute( _settings.giftCardIdAttribute ) ) {
			giftCardId = referenceElement.getAttribute( _settings.giftCardIdAttribute );
		}

		// Bail if gift card ID was not provided
		if ( ! giftCardId || '' == giftCardId ) { return; }

		_publicMethods.removeGiftCardCode( giftCardId, referenceElement );
	}



	/**
	 * Handle document clicks and route to the appropriate function.
	 */
	var handleClick = function( e ) {
		// ADD GIFT CARD
		if ( e.target.closest( _settings.addGiftCardButtonSelector ) ) {
			e.preventDefault();
			var addGiftCardButton = e.target.closest( _settings.addGiftCardButtonSelector );
			processAddGiftCard( addGiftCardButton );
		}
		// REMOVE GIFT CARD
		else if ( e.target.closest( _settings.removeGiftCardButtonSelector ) ) {
			e.preventDefault();
			var removeGiftCardButton = e.target.closest( _settings.removeGiftCardButtonSelector );
			processRemoveGiftCard( removeGiftCardButton );
		}
	};

	/**
	 * Handle keypress event.
	 */
	 var handleKeyDown = function( e ) {
		// ENTER on input fields
		if ( FCUtils.keyboardKeys.ENTER === e.key && e.target.closest( _settings.giftCardFieldSelector ) ) {
			// Prevents submitting form
			e.preventDefault();

			// ADD GIFT CARD
			processAddGiftCard( e.target.closest( _settings.giftCardFieldSelector ) );
		}
	};



	/**
	 * Use the same method that WooCommerce uses to block other parts of the checkout form while updating.
	 * The UI is unblocked by the WooCommerce `checkout.js` script (which is replaced with a modified version but keeps the same behavior)
	 * using the checkout fragment selector, then unblocking after the checkout update is completed.
	 *
	 * @param   HTMLElement  element  Element to block the UI and show the loading indicator.
	 */
	_publicMethods.blockUI = function( element ) {
		// Bail if jQuery is not available
		if ( ! _hasJQuery ) { return; }

		// Bail if element is invalid
		if ( ! element ) { return; }

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
		// Bail if jQuery is not available
		if ( ! _hasJQuery ) { return; }

		$( element ).removeClass( _settings.uiProcessingClass ).unblock();
	}



	/**
	 * Add a gift card code to the cart.
	 *
	 * @param   string  giftCardCode  The gift card code to be added to the cart.
	 */
	_publicMethods.addGiftCardCode = function( giftCardCode, referenceElement ) {
		// Bail if gift card code was not provided
		if ( ! giftCardCode || '' == giftCardCode ) { return; }

		clearNotices();

		// Get reference id and save to reference element
		var reference_id = Math.floor( Math.random() * 1000 );
		if ( referenceElement ) {
			referenceElement.setAttribute( _settings.referenceIdAttribute, reference_id );
		}

		// Block gift card section
		var giftCardAddedSection = document.querySelector( _settings.giftCardAddedSectionSelector );
		_publicMethods.blockUI( giftCardAddedSection );

		// Add security nonce
		var data = {
			security: _settings.addGiftCardCodeNonce,
			gift_card_code: giftCardCode,
			reference_id: reference_id,
		}

		$.ajax({
			type:		'POST',
			url:		fcSettings.wcAjaxUrl.replace( '%%endpoint%%', 'fc_add_gift_card_code' ),
			data:		data,
			dataType:   'json',
			success:	function( response ) {
				// Get back the reference id
				var referenceElement;
				if ( response.reference_id ) {
					referenceElement = document.querySelector( '[' + _settings.referenceIdAttribute + '="' + response.reference_id + '"]' );
				}

				// Maybe process success
				if ( response.result && 'success' === response.result ) {
					// Maybe add messages
					if ( response.message && 'yes' !== _settings.suppressSuccessMessages ) {
						showNotices( response.message, referenceElement );
					}

					// Maybe remove gift card code value from the field
					var giftCardField = document.querySelector( _settings.giftCardFieldSelector );
					if ( giftCardField ) {
						giftCardField.value = '';
					}

					// Maybe close the gift card code field section
					if ( window.CollapsibleBlock ) {

						// Get expansible content section
						var expansibleGiftCardContent = referenceElement.closest( _settings.expansibleGiftCardContentSelector );

						// Maybe collapse/expanse sections after adding gift card
						if ( expansibleGiftCardContent ) {
							// Collapse the gift card code field content section
							CollapsibleBlock.collapse( expansibleGiftCardContent );

							// Get section key and toggle elements
							var section_key = expansibleGiftCardContent.getAttribute( _settings.expansibleGiftCardSectionKeyAttribute );
							var expansibleGiftCardToggle = document.querySelector( _settings.expansibleGiftCardToggleSelector.replace( _settings.section_key_placeholder, section_key ) );
							var expansibleGiftCardToggleButton = document.querySelector( _settings.expansibleGiftCardToggleButtonSelector.replace( _settings.section_key_placeholder, section_key ) );

							// Maybe expand gift card code toggle section
							if ( expansibleGiftCardToggle ) {
								CollapsibleBlock.expand( expansibleGiftCardToggle );
							}

							// Maybe focus back to the add gift card code button
							if ( expansibleGiftCardToggleButton ) {
								expansibleGiftCardToggleButton.focus();
							}
						}
					}

					$( document.body ).trigger( 'wc_fragment_refresh' );
					$( document.body ).trigger( 'applied_gift_card_in_checkout', [ data.gift_card_code ] );
					$( document.body ).trigger( 'update_checkout', { update_shipping_method: false } );
				}
				// Maybe process error
				else if ( response.result && 'error' === response.result ) {
					// Display new messages
					showNotices( response.message, referenceElement );

					// Trigger error event
					$( document.body ).trigger( 'checkout_error' , [ response.message ] );

					// Unblock gift card section
					var giftCardAddedSection = document.querySelector( _settings.giftCardAddedSectionSelector );
					if ( giftCardAddedSection ) {
						_publicMethods.unblockUI( giftCardAddedSection );
					}
				}

			}

		});
	};



	/**
	 * Remove gift card from the cart.
	 *
	 * @param   string  giftCardId  The gift card ID to be removed from the cart.
	 */
	_publicMethods.removeGiftCardCode = function( giftCardId, referenceElement ) {
		// Bail if gift card ID was not provided
		if ( ! giftCardId || '' == giftCardId ) { return; }

		clearNotices();

		// Get reference id and save to reference element
		var reference_id = Math.floor( Math.random() * 1000 );
		if ( referenceElement ) {
			referenceElement.setAttribute( _settings.referenceIdAttribute, reference_id );
		}

		// Block gift card section
		var giftCardAddedSection = document.querySelector( _settings.giftCardAddedSectionSelector );
		_publicMethods.blockUI( giftCardAddedSection );

		// Add security nonce
		var data = {
			security: _settings.removeGiftCardCodeNonce,
			gift_card_id: giftCardId,
			reference_id: reference_id,
		}

		$.ajax({
			type:         'POST',
			url:          fcSettings.wcAjaxUrl.replace( '%%endpoint%%', 'fc_remove_gift_card_code' ),
			data:         data,
			dataType:     'json',
			success:	function( response ) {
				// Get back the reference id
				var referenceElement;
				if ( response.reference_id ) {
					referenceElement = document.querySelector( '[' + _settings.referenceIdAttribute + '="' + response.reference_id + '"]' );
				}

				// Maybe process success
				if ( response.result && 'success' === response.result ) {
					// Maybe add messages
					if ( response.message && 'yes' !== _settings.suppressSuccessMessages ) {
						showNotices( response.message, referenceElement );
					}

					$( document.body ).trigger( 'wc_fragment_refresh' );
					$( document.body ).trigger( 'removed_gift_card_in_checkout', [ data.gift_card_code ] );
					$( document.body ).trigger( 'update_checkout', { update_shipping_method: false } );
				}
				// Maybe process error
				else if ( response.result && 'error' === response.result ) {
					// Display new messages
					showNotices( response.message, referenceElement );

					// Unblock gift card section
					var giftCardAddedSection = document.querySelector( _settings.giftCardAddedSectionSelector );
					if ( giftCardAddedSection ) {
						_publicMethods.unblockUI( giftCardAddedSection );
					}
				}

			}

		});
	};



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) { return; }

		// Merge settings
		_settings = FCUtils.extendObject( _settings, options );

		// Add jQuery event listeners
		if ( _hasJQuery ) {
			$( document ).ajaxComplete( maybeTriggerUpdateEvents );
		}

		// Add event listeners
		window.addEventListener( 'click', handleClick, true );
		document.addEventListener( 'keydown', handleKeyDown, true );

		// Add init class
		document.body.classList.add( _settings.bodyClass );

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
