/**
 * Checkout scripts for: Uncanny Groups for LearnDash (by Uncanny Owl).
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
		root.UpdateUncannyGroups = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		groupNameFieldSelectorCheckout: 'input[name^="ulgm_group_name"]',
		groupNameFieldSelectorCart: '.group-name-field > input[id^="group_name_"]',
		cartItemSelector: '.cart_item',
		
		cartItemKeyAttribute: 'data-cart_item_key',

		updateWaitTime: 500,
	}



	/**
	 * METHODS
	 */


	/**
	 * Trigger update checkout.
	 */
	var triggerCheckoutUpdate = function() {
		// Bail if jQuery is not available
		if ( ! _hasJQuery ) { return; }

		// Trigger update checkout
		$( document.body ).trigger( 'update_checkout' );
	}

	/**
	 * Maybe update cart itme data.
	 */
	var maybeUpdateCartItemData = function( e ) {
		// Bail if target is not a group name field
		if ( ! e.target.matches( _settings.groupNameFieldSelectorCart ) ) { return; }

		// Bail if value is not set
		if ( '' === e.target.value ) { return; }

		// Get cart item element
		var cartItemElement = e.target.closest( _settings.cartItemSelector );

		// Update cart item
		processUpdateCartItem( cartItemElement );
	}



	/**
	 * Process the update of a cart item from the cart item element.
	 *
	 * @param   HTMLElement  cartItemElement  The cart item element.
	 */
	var processUpdateCartItem = function( cartItemElement ) {
		// Get cart item key
		var cartItemKey = cartItemElement.getAttribute( _settings.cartItemKeyAttribute );

		// Trigger update cart item
		CartAjax.updateCartItem( cartItemKey );
	}



	/**
	 * Handle keypress event event and route to the appropriate functions.
	 */
	var handleKeyDown = function( e ) {
		// CHECKOUT GROUP NAME FIELD
		if ( e.target.matches( _settings.groupNameFieldSelectorCheckout ) ) {
			triggerCheckoutUpdate();
		}
	};



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) { return; }

		// Add event listeners
		document.addEventListener( 'keydown', handleKeyDown );

		// Add event listeners for cart item data updates
		var debouncedMaybeUpdateCartItemData = FCUtils.debounce( maybeUpdateCartItemData, _settings.updateWaitTime );
		document.addEventListener( 'keydown', debouncedMaybeUpdateCartItemData, true );

		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
