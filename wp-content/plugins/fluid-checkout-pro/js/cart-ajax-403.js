/**
 * Manage cart items ajax actions.
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
		root.CartAjax = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _animationEndEvent = window.whichAnimationEnd ? window.whichAnimationEnd() : 'animationend';
	var _publicMethods = {};
	var _settings = {
		bodyClass: 'has-fc-cart-ajax--activated',

		messagesWrapperSelector: '.woocommerce-notices-wrapper, .woocommerce-NoticeGroup-checkout',

		dataAttributePrefix: 'data-',

		removeItemButtonSelector: '.cart_item .remove',
		restoreItemButtonSelector: '.cart_item .restore-item',
		restoreItemDismissButtonSelector: '.cart_item .restore-item-dismiss',
		cartItemSelector: '.cart_item',
		cartItemBlockUIElementSelector: '.cart_item td',
		cartItemAnimationElementSelector: '.cart_item td',
		cartItemRemovedTemplate: '<td colspan="6">##CONTENT##</td>',
		cartItemRemoveAnimationClass: 'fade-out-right',
		cartItemRemoveAnimationName: 'fade-out-right',
		cartItemRemovingClass: 'removing',
		cartItemRemovedClass: 'removed',
		cartItemUndoClass: 'undo',
		cartItemKeyAttribute: 'data-cart_item_key',
		cartItemDataFieldsSelector: '.cart_item input, .cart_item select, .cart_item textarea',

		cartItemsListSelector: 'div.woocommerce .woocommerce-cart-form__contents tbody',
		cartItemRestoreSelector: '.cart_item.removed.undo',
		cartItemNotRemovedSelector: '.cart_item:not( .removed ):not( .undo )',

		addToCartButtonSelector: '.add_to_cart_button.ajax_add_to_cart',
		productIdAttribute: 'data-product_id',
		addToCartButtonAddedClass: 'added',
		addToCartButtonLoadingClass: 'fc-loading',

		quantityWrapperSelector: '.cart_item .quantity',
		quantityInputSelector: '.cart_item input.qty',
		quantitySpinnerButtonSelector: '.cart_item .fc-number-spin-button',
		quantityAttribute: 'data-quantity',
		quantityMinAttribute: 'min',
		quantityMaxAttribute: 'max',

		quantityLimitAnimationEnabled: 'yes',
		quantityLimitAnimationClass: 'shake',
		quantityLimitAnimationName: 'shake',

		quantityInvalidAnimationEnabled: 'yes',
		quantityInvalidAnimationClass: 'shake',
		quantityInvalidAnimationName: 'shake',

		formSubmitFieldsSelector: 'input:not( [type="button"] ):not( [type="submit"] ):not( [type="reset"] ):not( [type="file"] ):not( [type="image"] )',

		uiProcessingClass: 'processing',

		updateWaitTime: 600,

		fragmentsUpdateEvent: 'wc_fragment_refresh',
		fragmentsReplacedEvent: 'wc_fragments_refreshed',

		addToCartNonce: '', // Value updated during runtime
		removeCartItemNonce: '', // Value updated during runtime
		restoreCartItemNonce: '', // Value updated during runtime
		updateCartItemNonce: '', // Value updated during runtime
	};
	var _restoreItemsMatrix = [];



	/**
	 * METHODS
	 */



	/**
	 * Remove all notices from the top of the page.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	var clearNotices = function() {
		var messagesWrappers = document.querySelectorAll( _settings.messagesWrapperSelector );
		for ( var i = 0; i < messagesWrappers.length; i++ ) {
			var wrapper = messagesWrappers[ i ];
			wrapper.innerHTML = '';
		}
	}

	/**
	 * Add notices at the top of the page, then scroll to display it on the screen.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	var showNotices = function( content ) {
		var messagesWrapper = document.querySelector( _settings.messagesWrapperSelector );
		messagesWrapper.innerHTML = content;

		// Maybe scroll notices into view
		FCUtils.scrollToElement( messagesWrapper );
	}



	/**
	 * Use the same method that WooCommerce uses to block other parts of the checkout form while updating.
	 * The UI is unblocked by the WooCommerce `checkout.js` script (which is replaced with a modified version but keeps the same behavior)
	 * using the checkout fragment selector, then unblocking after the checkout update is completed.
	 *
	 * @param   HTMLElement  element  Element to block the UI and show the loading indicator.
	 */
	var blockUI = function( element ) {
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
	var unblockUI = function( element ) {
		$( element ).removeClass( _settings.uiProcessingClass ).unblock();
	}



	/**
	 * Play the animation for quantity limit reached for a cart item.
	 * 
	 * @param {HTMLElement}  cartItem  The cart item element.
	 */
	var playLimitReachedAnimation = function( cartItem ) {
		// Bail if quantity limit animation is not enabled
		if ( 'yes' !== _settings.quantityLimitAnimationEnabled ) { return; }

		// Bail if cart item not valid
		if ( ! cartItem ) { return; }

		// Get cart item quantity wrapper element
		var quantityWrapper = cartItem.querySelector( _settings.quantityWrapperSelector );

		// Bail if quantity wrapper not found
		if ( ! quantityWrapper ) { return; }

		// Prepare to remove animating class when transition ends
		quantityWrapper.addEventListener( _animationEndEvent, function endRemovingItemAnimation( e ) {
			// Bail if not target animation ending
			if ( e.animationName !== _settings.quantityLimitAnimationName ) { return; }

			// Remove animation class
			quantityWrapper.classList.remove( _settings.quantityLimitAnimationClass );

			// Remove event listener
			quantityWrapper.removeEventListener( _animationEndEvent, endRemovingItemAnimation );
		} );

		quantityWrapper.classList.add( _settings.quantityLimitAnimationClass );
	}

	/**
	 * Play the animation for quantity limit reached for a cart item.
	 * 
	 * @param {HTMLElement}  cartItem  The cart item element.
	 */
	var playInvalidValueAnimation = function( cartItem ) {
		// Bail if quantity limit animation is not enabled
		if ( 'yes' !== _settings.quantityInvalidAnimationEnabled ) { return; }

		// Bail if cart item not valid
		if ( ! cartItem ) { return; }

		// Get cart item quantity wrapper element
		var quantityWrapper = cartItem.querySelector( _settings.quantityWrapperSelector );

		// Bail if quantity wrapper not found
		if ( ! quantityWrapper ) { return; }

		// Prepare to remove animating class when transition ends
		quantityWrapper.addEventListener( _animationEndEvent, function endRemovingItemAnimation( e ) {
			if ( e.animationName == _settings.quantityInvalidAnimationName ) {
				quantityWrapper.classList.remove( _settings.quantityInvalidAnimationClass );
			}
		} );

		quantityWrapper.classList.add( _settings.quantityInvalidAnimationClass );
	}



	/**
	 * Set the quantity attribute value for quantity fields.
	 */
	var setAllQuantityAttributes = function() {
		var quantityFields = document.querySelectorAll( _settings.quantityInputSelector );
		for ( var i = 0; i < quantityFields.length; i++ ) {
			var input = quantityFields[ i ];
			input.setAttribute( _settings.quantityAttribute, input.value );
		}
	};



	/**
	 * Check whether the product quantity field value has changed.
	 *
	 * @param   HTMLElement  qtyField  The product quantity field.
	 *
	 * @return  bool                   Whether the product quantity value has changed.
	 */
	var hasQuantityChanged = function( qtyField ) {
		// Maybe return as changed if previous valid field value is different from current value
		if ( qtyField.getAttribute( _settings.quantityAttribute ) != qtyField.value ) { // Intentional loose comparison between previous valid field value and current value
			return true;
		}

		return false;
	}

	/**
	 * Maybe update cart items quantity and other attributes for all products in cart.
	 * This function needs to be debounced to avoid multiple requests when multiple quantity fields are changed at the same time.
	 */
	var maybeUpdateCartItemQuantities = function( e ) {
		// Bail if target is not a quantity field or buttons,
		// or if the target is a quantity field and the event is a `click` event.
		if ( ! ( e.target.matches( _settings.quantityInputSelector ) && 'click' !== e.type ) && ! e.target.matches( _settings.quantitySpinnerButtonSelector ) ) { return; }

		// Get cart items list
		var cartItemsList = document.querySelector( _settings.cartItemsListSelector );

		// Bail if cart items list not found
		if ( ! cartItemsList ) { return; }

		// Get quantity fields from cart items list
		var allQuantityFields = cartItemsList.querySelectorAll( _settings.quantityInputSelector );

		// Iterate through all quantity fields
		for ( var i = 0; i < allQuantityFields.length; i++ ) {
			// Get quantity field
			var qtyField = allQuantityFields[ i ];

			// Maybe skip if quantity is not set
			if ( '' === qtyField.value ) {
				continue;
			}

			// Get cart item element
			var cartItemElement = qtyField.closest( _settings.cartItemSelector );

			// Maybe trigger update item
			if ( hasQuantityChanged( qtyField ) ) {
				// Disable quantity field
				qtyField.setAttribute( 'disabled', 'disabled' );

				// Process update item, then quantity field will be re-enabled after fragment refresh
				processUpdateCartItem( cartItemElement );
			}
			// Maybe play animation for quantity limit reached
			else if (
					cartItemElement == e.target.closest( _settings.cartItemSelector )
					&& ( qtyField.value == qtyField.getAttribute( _settings.quantityMinAttribute ) || qtyField.value == qtyField.getAttribute( _settings.quantityMaxAttribute ) )
				) {
				playLimitReachedAnimation( cartItemElement );
			}
		}
	}
	var debouncedMaybeUpdateCartItemQuantities = null; // Initialized in init()

	/**
	 * Maybe update cart items quantity and other attributes for all products in cart.
	 * This function needs to be debounced to avoid multiple requests when multiple quantity fields are changed at the same time.
	 */
	var maybeUpdateCartItemData = function( e ) {
		// Bail if target is not a cart item data field
		if ( ! e.target.matches( _settings.cartItemDataFieldsSelector ) ) { return; }

		// Bail if target is a quantity field, as update to quantity is handled separately
		if ( e.target.matches( _settings.quantityInputSelector ) ) { return; }

		// Get cart item element
		var cartItemElement = e.target.closest( _settings.cartItemSelector );

		// Bail if quantity is not set
		var quantityField = cartItemElement.querySelector( _settings.quantityInputSelector );
		if ( '' === quantityField.value ) {
			// Restore previous valid quantity value
			quantityField.value = quantityField.getAttribute( _settings.quantityAttribute );

			// Maybe play animation for invalid quantity value
			playInvalidValueAnimation( cartItemElement );

			return;
		}

		// Maybe trigger update item
		processUpdateCartItem( cartItemElement );
	}
	var debouncedMaybeUpdateCartItemData = null; // Initialized in init()

	/**
	 * Maybe remove cart item from the cart.
	 * This function needs to be debounced to avoid multiple requests when the removal button is clicked multiple times in a quick succession.
	 */
	var maybeRemoveCartItem = function( e ) {
		// Bail if target is not a cart item remove button
		if ( ! e.target.closest( _settings.removeItemButtonSelector ) ) { return; }

		// Remove cart item
		var cartItemElement = e.target.closest( _settings.cartItemSelector );
		processRemoveCartItem( cartItemElement );
	}
	var throttledMaybeRemoveCartItem = null; // Initialized in init()



	/**
	 * Play the animation for removing the cart item.
	 *
	 * @param   HTMLElement  cartItemElement  The cart item list element.
	 */
	var playRemovingItemAnimation = function( cartItemElement ) {
		// Bail if cart item is not valid
		if ( ! cartItemElement ) { return; }

		// Get cart item UI elements
		var blockUIElement = cartItemElement.matches( _settings.cartItemBlockUIElementSelector ) ? cartItemElement : cartItemElement.querySelector( _settings.cartItemBlockUIElementSelector );
		var animationElement = cartItemElement.matches( _settings.cartItemAnimationElementSelector ) ? cartItemElement : cartItemElement.querySelector( _settings.cartItemAnimationElementSelector );

		// Bail if animated element was not found
		if ( ! animationElement ) { return; }

		// Prepare to remove animating class when transition ends
		animationElement.addEventListener( _animationEndEvent, function endRemovingItemAnimation( e ) {
			if ( e.animationName == _settings.cartItemRemoveAnimationName ) {
				cartItemElement.classList.add( _settings.cartItemRemovedClass );
				cartItemElement.classList.remove( _settings.cartItemRemovingClass );
				animationElement.classList.remove( _settings.cartItemRemoveAnimationClass );	
				animationElement.removeEventListener( _animationEndEvent, endRemovingItemAnimation );

				// Block the element from further changes
				blockUI( blockUIElement );
			}
		} );

		cartItemElement.classList.add( _settings.cartItemRemovingClass );
		animationElement.classList.add( _settings.cartItemRemoveAnimationClass );
	}



	/**
	 * Remove a removed cart item message from the cart items list.
	 *
	 * @param   string  cartItemKey  The cart item key.
	 */
	var removeCartItemElement = function( cartItemKey ) {
		// Bail if cart item key not provided
		if ( ! cartItemKey ) { return; }

		// Get list of cart item elements
		var cartItemsList = document.querySelector( _settings.cartItemsListSelector );

		// Get cart item element
		var cartItemElementSelector = _settings.cartItemSelector + '[' + _settings.cartItemKeyAttribute + '="' + cartItemKey + '"]';
		var cartItemElement = cartItemsList.querySelector( cartItemElementSelector );

		// Try to remove the cart item element
		if ( cartItemElement ) {
			cartItemElement.parentElement.removeChild( cartItemElement );
		}
	}

	/**
	 * Process the removal of a cart item from the cart item element.
	 *
	 * @param   HTMLElement  cartItemElement  The cart item element.
	 */
	var processRemoveCartItem = function( cartItemElement ) {
		var cartItemKey = cartItemElement.getAttribute( _settings.cartItemKeyAttribute );
		_publicMethods.removeCartItem( cartItemKey );
	}

	/**
	 * Process restoring a removed cart item from the restore button.
	 *
	 * @param   HTMLElement  restoreButton  The restore cart item button element.
	 */
	var processRestoreCartItem = function( restoreButton ) {
		var cartItemKey = restoreButton.getAttribute( _settings.cartItemKeyAttribute );
		_publicMethods.restoreCartItem( cartItemKey );
	}

	/**
	 * Process dismissing message for removed cart item from the dismiss button.
	 *
	 * @param   HTMLElement  dismissButton  The dismiss cart item button element.
	 */
	var processRestoreCartItemDismiss = function( dismissButton ) {
		var cartItemKey = dismissButton.getAttribute( _settings.cartItemKeyAttribute );
		removeCartItemElement( cartItemKey );
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
		_publicMethods.updateCartItem( cartItemKey );
	}

	/**
	 * Process adding a new product to the cart from the add to cart button.
	 *
	 * @param   HTMLElement  addToCartButton  The cart item element.
	 */
	var processAddToCart = function( addToCartButton ) {
		// Bail if add to cart button not provided
		if ( ! addToCartButton ) { return; }

		var $thisbutton = $( addToCartButton );

		// Bail if button does not have the product id attribute
		if ( ! addToCartButton.hasAttribute( _settings.productIdAttribute ) ) { return; }

		// Change button state classes
		addToCartButton.classList.remove( _settings.addToCartButtonAddedClass );
		addToCartButton.classList.add( _settings.addToCartButtonLoadingClass );

		// TODO: Maybe allow 3rd parties to validate and quit early.
		// 	// Allow 3rd parties to validate and quit early.
		// 	if ( false === $( document.body ).triggerHandler( 'should_send_ajax_request.adding_to_cart', [ $thisbutton ] ) ) { 
		// 		$( document.body ).trigger( 'ajax_request_not_sent.adding_to_cart', [ false, false, $thisbutton ] );
		// 		return true;
		// 	}

		var data = {};

		// TODO: Maybe fetch data from jQuery.data() structure
		// 	// Fetch changes that are directly added by calling $thisbutton.data( key, value )
		// 	$.each( $thisbutton.data(), function( key, value ) {
		// 		data[ key ] = value;
		// 	});

		// Get product add to cart data
		var attrs = addToCartButton.attributes;
		for ( var i = attrs.length - 1; i >= 0; i-- ) {
			var attrName = attrs[ i ].name;

			// Maybe skip attribute
			if ( 0 !== attrName.indexOf( _settings.dataAttributePrefix ) ) { continue; }

			var dataAttrName = attrs[ i ].name.substring( _settings.dataAttributePrefix.length );
			data[ dataAttrName ] = attrs[ i ].value;
		}

		// Trigger event.
		$( document.body ).trigger( 'adding_to_cart', [ $thisbutton, data ] );

		// Process add to cart
		_publicMethods.addToCart( data );
	}



	/**
	 * Handle document clicks and route to the appropriate function.
	 */
	var handleClick = function( e ) {
		// ADD TO CART
		if ( e.target.closest( _settings.addToCartButtonSelector ) ) {
			e.preventDefault();
			var addToCartButton = e.target.closest( _settings.addToCartButtonSelector );
			processAddToCart( addToCartButton );
		}
		// REMOVE ITEM
		else if ( e.target.closest( _settings.removeItemButtonSelector ) ) {
			e.preventDefault();
			throttledMaybeRemoveCartItem( e );
		}
		// RESTORE ITEM
		else if ( e.target.closest( _settings.restoreItemButtonSelector ) ) {
			e.preventDefault();
			processRestoreCartItem( e.target.closest( _settings.restoreItemButtonSelector ) );
		}
		// RESTORE ITEM DISMISS
		else if ( e.target.closest( _settings.restoreItemDismissButtonSelector ) ) {
			e.preventDefault();
			processRestoreCartItemDismiss( e.target.closest( _settings.restoreItemDismissButtonSelector ) );
		}
		// QUANTITY FIELD
		else if ( e.target.matches( _settings.quantitySpinnerButtonSelector ) ) {
			e.preventDefault();
			debouncedMaybeUpdateCartItemQuantities( e );
		}
	};

	/**
	 * Handle keypress event.
	 */
	var handleKeyDown = function( e ) {
		// Should do nothing if the default action has been cancelled
		if ( e.defaultPrevented ) { return; }

		// ENTER on input fields
		if ( FCUtils.keyboardKeys.ENTER === e.key && e.target.closest( _settings.cartItemSelector ) && e.target.matches( _settings.formSubmitFieldsSelector ) ) {
			// Prevents submitting form
			e.preventDefault();
		}
	};



	/**
	 * Maybe update the cart contents via the CartUpdate when available.
	 */
	var maybeUpdateCartFragments = function() {
		// Bail if CartUpdate is not available
		if ( ! window.CartUpdate ) { return; }

		CartUpdate.updateCartFragments();
	}



	/**
	 * Run processes before sending request to update cart fragments.
	 */
	 var processBeforeFragmentsUpdate = function() {
		// Get cart items list element
		var cartItemsList = document.querySelector( _settings.cartItemsListSelector );
		var _restoreItems = cartItemsList.querySelectorAll( _settings.cartItemRestoreSelector );

		// Clear restore items matrix
		_restoreItemsMatrix = [];
		
		// Build matrix of "undo removed item" elements and their positions
		for ( var i = 0; i < _restoreItems.length; i++ ) {
			var cartItem = _restoreItems[ i ];
			var position = Array.prototype.indexOf.call( cartItem.parentElement.children, cartItem );
			_restoreItemsMatrix.push( [ position, cartItem ] );
		}
	}

	/**
	 * Run processes after cart fragments are replaced on the page.
	 */
	var processAfterFragmentsReplaced = function() {
		// Get cart items list element
		var cartItemsList = document.querySelector( _settings.cartItemsListSelector );

		// Maybe trigger event `wc_cart_emptied` if cart items list not found, then bail.
		if ( ! cartItemsList ) {
			$( document.body ).trigger( 'wc_cart_emptied' );
			return;
		}

		// Maybe restore "undo removed item" elements
		for ( var j = 0; j < _restoreItemsMatrix.length; j++ ) {
			var restoreItem = _restoreItemsMatrix[ j ];
			var position = restoreItem[ 0 ];
			var cartItem = restoreItem[ 1 ];
			var referenceItem = cartItemsList.children[ position ];
			var productId = cartItem.getAttribute( _settings.productIdAttribute );

			// Skip "restore" item if a cart item with same product ID already exists
			var cartItemProductIdSelector = _settings.cartItemSelector + '[' + _settings.productIdAttribute + '="' + productId + '"]' + ':not(.' + _settings.cartItemUndoClass + ')';
			if ( cartItemsList.querySelector( cartItemProductIdSelector ) ) { continue; }

			// Unblock the element
			unblockUI( cartItem );

			// Add the "restore" item to the cart items list
			cartItemsList.insertBefore( cartItem, referenceItem );
		}

		// Get cart items
		var cartItems = cartItemsList.querySelectorAll( _settings.cartItemNotRemovedSelector );

		// Maybe trigger cart emptied event
		if ( 0 === cartItems.length ) {
			$( document.body ).trigger( 'wc_cart_emptied' );
		}
		// Maybe unblock cart items that got stuck on processing
		else {
			// Iterate through cart items
			for ( var k = 0; k < cartItems.length; k++ ) {
				// Get variables
				var cartItemElement = cartItems[ k ];
				var blockUIElement = cartItemElement.matches( _settings.cartItemBlockUIElementSelector ) ? cartItemElement : cartItemElement.querySelector( _settings.cartItemBlockUIElementSelector );

				// Unblock cart item
				unblockUI( blockUIElement );

				// Get cart quantity field
				var quantityField = cartItemElement.querySelector( _settings.quantityInputSelector );
				if ( quantityField ) {
					// Re-enable quantity field
					quantityField.removeAttribute( 'disabled' );
				}
			}
		}
	}



	/**
	 * Add a product to the cart.
	 *
	 * @param   object  data  The product data to add to the cart.
	 */
	_publicMethods.addToCart = function( data ) {
		// Bail if data object was not provided
		if ( ! data ) { return; }

		// Add security nonce
		data[ 'security' ] = _settings.addToCartNonce;

		$.ajax({
			type:         'POST',
			url:          fcSettings.wcAjaxUrl.toString().replace( '%%endpoint%%', 'fc_pro_add_to_cart' ),
			data:         data,
			dataType:     'json',
			success:      function( response ) {
				// Successfully added item
				if ( response.result && 'success' === response.result ) {
					// Trigger update cart event
					$( document.body ).trigger( _settings.fragmentsUpdateEvent );

					// Clear notices
					clearNotices();
				}
				// Failed to add item
				else if ( response.result && 'error' === response.result ) {
					// Show error messages
					showNotices( response.message );
				}
			}
		});
	};



	/**
	 * Remove a item from the cart.
	 *
	 * @param   string  cartItemKey  The cart item key.
	 */
	_publicMethods.removeCartItem = function( cartItemKey ) {
		// Get list of cart item elements
		var cartItemsList = document.querySelector( _settings.cartItemsListSelector );

		// Get cart item element
		var cartItemElementSelector = _settings.cartItemSelector + '[' + _settings.cartItemKeyAttribute + '="' + cartItemKey + '"]';
		var cartItemElement = cartItemsList.querySelector( cartItemElementSelector );

		// Play removing item animation then block element from further changes
		playRemovingItemAnimation( cartItemElement );

		var data = {
			security:             _settings.removeCartItemNonce,
			cart_item_key:        cartItemKey,
		};

		$.ajax({
			type:         'POST',
			url:          fcSettings.wcAjaxUrl.toString().replace( '%%endpoint%%', 'fc_pro_remove_cart_item' ),
			data:         data,
			dataType:     'json',
			success:      function( response ) {
				// Get list of cart item elements
				var cartItemsList = document.querySelector( _settings.cartItemsListSelector );

				// Get cart item element
				var cartItemElementSelector = _settings.cartItemSelector + '[' + _settings.cartItemKeyAttribute + '="' + cartItemKey + '"]';
				var cartItemElement = cartItemsList.querySelector( cartItemElementSelector );

				// Successfully removed item
				if ( response.result && 'success' === response.result ) {
					// Try to replace the cart item with a message and link to undo action
					if ( cartItemElement && response.message ) {
						cartItemElement.classList.remove( _settings.cartItemRemovingClass );
						cartItemElement.classList.add( _settings.cartItemRemovedClass, _settings.cartItemUndoClass );
						cartItemElement.innerHTML = _settings.cartItemRemovedTemplate.replace( '##CONTENT##', response.message );
					}

					// Try to set focus to the restore item button
					var restoreButton = cartItemElement.querySelector( _settings.restoreItemButtonSelector );
					if ( restoreButton ) {
						requestAnimationFrame( function() { restoreButton.focus(); } );
					}

					// Trigger update cart event
					$( document.body ).trigger( _settings.fragmentsUpdateEvent );

					// Clear notices
					clearNotices();
				}
				// Failed to remove item
				else if ( response.result && 'error' === response.result ) {
					// Get the block UI element
					var blockUIElement = cartItemElement.matches( _settings.cartItemBlockUIElementSelector ) ? cartItemElement : cartItemElement.querySelector( _settings.cartItemBlockUIElementSelector );

					// Unblock cart item
					unblockUI( blockUIElement );

					// Show error messages
					showNotices( response.message );
				}
			}
		});
	};



	/**
	 * Restore a cart item from the cart.
	 *
	 * @param   string  cartItemKey  The cart item key.
	 */
	_publicMethods.restoreCartItem = function( cartItemKey ) {
		// Get list of cart item elements
		var cartItemsList = document.querySelector( _settings.cartItemsListSelector );

		// Get cart item element
		var cartItemElementSelector = _settings.cartItemSelector + '[' + _settings.cartItemKeyAttribute + '="' + cartItemKey + '"]';
		var cartItemElement = cartItemsList.querySelector( cartItemElementSelector );

		// Get block UI element
		var blockUIElement = cartItemElement.matches( _settings.cartItemBlockUIElementSelector ) ? cartItemElement : cartItemElement.querySelector( _settings.cartItemBlockUIElementSelector );

		// Block the element from further changes
		blockUI( blockUIElement );

		// Prepare AJAX request data
		var data = {
			security:             _settings.restoreCartItemNonce,
			cart_item_key:        cartItemKey,
		};

		$.ajax({
			type:         'POST',
			url:          fcSettings.wcAjaxUrl.toString().replace( '%%endpoint%%', 'fc_pro_restore_cart_item' ),
			data:         data,
			dataType:     'json',
			success:      function( response ) {
				// Get list of cart item elements
				var cartItemsList = document.querySelector( _settings.cartItemsListSelector );

				// Get cart item element
				var cartItemElementSelector = _settings.cartItemSelector + '[' + _settings.cartItemKeyAttribute + '="' + cartItemKey + '"]';
				var cartItemElement = cartItemsList.querySelector( cartItemElementSelector );

				// Successfully restored item
				if ( response.result && 'success' === response.result ) {
					// Trigger update cart event
					$( document.body ).trigger( _settings.fragmentsUpdateEvent );

					// Clear notices
					clearNotices();
				}
				// Failed to restore item
				else if ( response.result && 'error' === response.result ) {
					// Get block UI element
					var blockUIElement = cartItemElement.matches( _settings.cartItemBlockUIElementSelector ) ? cartItemElement : cartItemElement.querySelector( _settings.cartItemBlockUIElementSelector );

					// Unblock cart item
					unblockUI( blockUIElement );

					// Show error messages
					showNotices( response.message );
				}
			}
		});
	};



	/**
	 * Update the cart item data.
	 *
	 * @param   string  cartItemKey   The cart item key.
	 * @param   object  extraData     (Optional) The cart item data to be updated, in addition to the item data retrieved from the cart item element.
	 */
	_publicMethods.updateCartItem = function( cartItemKey, extraData ) {
		// Get list of cart item elements
		var cartItemsList = document.querySelector( _settings.cartItemsListSelector );

		// Get cart item element
		var cartItemElementSelector = _settings.cartItemSelector + '[' + _settings.cartItemKeyAttribute + '="' + cartItemKey + '"]';
		var cartItemElement = cartItemsList.querySelector( cartItemElementSelector );

		// Get animation UI element
		var animationElement = cartItemElement.matches( _settings.cartItemAnimationElementSelector ) ? cartItemElement : cartItemElement.querySelector( _settings.cartItemAnimationElementSelector );

		// Get cart item data
		var data = {};
		var cartItemFields = cartItemElement.querySelectorAll( _settings.cartItemDataFieldsSelector );
		for ( var i = 0; i < cartItemFields.length; i++ ) {
			// Get cart item field data
			var field = cartItemFields[ i ];
			var fieldName = field.name;
			var fieldValue = field.value;

			// Skip field if it does not have a name attribute
			if ( ! fieldName ) { continue; }

			// Skip radio buttons not checked
			if ( 'radio' === field.type && ! field.checked ) { continue; }

			// Maybe set checkbox field value as empty
			if ( 'checkbox' === field.type && ! field.checked ) {
				fieldValue = '';
			}

			data[ fieldName ] = fieldValue;
		}

		// Merge extra data with cart item data
		data = FCUtils.extendObject( data, extraData );

		// Get quantity value from data
		var quantity = 0;
		var dataProperties = Object.keys( data );
		for ( var i = 0; i < dataProperties.length; i++ ) {
			var propertyName = dataProperties[ i ];
			if ( propertyName.indexOf( '[qty]' ) >= 0 ) {
				quantity = data[ propertyName ];
				break;
			}
		}

		// Remove item if quantity is zero or less
		if ( ! quantity || quantity <= 0 || quantity == '' ) { // Intentional loose comparison
			processRemoveCartItem( cartItemElement );
			return;
		}

		// Block the element from further changes
		blockUI( animationElement );

		// Set quantity field (original) quantity attribute to avoid other functions from triggering update again without the need to
		var quantityField = cartItemElement.querySelector( _settings.quantityInputSelector );
		if ( quantityField ) {
			quantityField.setAttribute( _settings.quantityAttribute, quantity );
		}

		// Add security and cart item key
		data = FCUtils.extendObject( data, {
			security:             _settings.updateCartItemNonce,
			cart_item_key:        cartItemKey,
		} );

		$.ajax({
			type:         'POST',
			url:          fcSettings.wcAjaxUrl.toString().replace( '%%endpoint%%', 'fc_pro_update_cart_item' ),
			data:         data,
			dataType:     'json',
			success:      function( response ) {
				// Get list of cart item elements
				var cartItemsList = document.querySelector( _settings.cartItemsListSelector );

				// Get cart item element
				var cartItemElementSelector = _settings.cartItemSelector + '[' + _settings.cartItemKeyAttribute + '="' + cartItemKey + '"]';
				var cartItemElement = cartItemsList.querySelector( cartItemElementSelector );

				// Successfully updated item
				if ( response.result && 'success' === response.result ) {
					// Trigger update cart event
					$( document.body ).trigger( _settings.fragmentsUpdateEvent );

					// Clear notices
					clearNotices();
				}
				// Failed to update item
				else if ( response.result && 'error' === response.result ) {
					// Get the block UI element
					var blockUIElement = cartItemElement.matches( _settings.cartItemBlockUIElementSelector ) ? cartItemElement : cartItemElement.querySelector( _settings.cartItemBlockUIElementSelector );

					// Get cart quantity field
					var quantityField = cartItemElement.querySelector( _settings.quantityInputSelector );
					if ( quantityField ) {
						// Re-enable quantity field
						quantityField.removeAttribute( 'disabled' );
					}

					// Unblock cart item
					unblockUI( blockUIElement );

					// Show error messages
					showNotices( response.message );
				}
			}
		});
	};



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) return;

		// Merge settings
		_settings = FCUtils.extendObject( _settings, options );

		// Set quantity attribute for quantity fields at initialization
		setAllQuantityAttributes();

		// Initialize timed functions
		debouncedMaybeUpdateCartItemQuantities = FCUtils.debounce( maybeUpdateCartItemQuantities, _settings.updateWaitTime );
		debouncedMaybeUpdateCartItemData = FCUtils.debounce( maybeUpdateCartItemData, _settings.updateWaitTime );
		throttledMaybeRemoveCartItem = FCUtils.throttle( maybeRemoveCartItem, _settings.updateWaitTime );

		// Add event listeners
		document.addEventListener( 'click', handleClick, true );
		document.addEventListener( 'keydown', handleKeyDown, true );

		// Add event listeners for quantity updates
		// Click events on product quantity spinner buttons is handled by the function `handleClick`.
		document.addEventListener( 'keydown', debouncedMaybeUpdateCartItemQuantities, true );
		document.addEventListener( 'change', debouncedMaybeUpdateCartItemQuantities, true );

		// Add event listeners for cart item data updates
		document.addEventListener( 'change', debouncedMaybeUpdateCartItemData, true );

		// Add event listeners for jQuery events
		if ( _hasJQuery ) {
			// Handle 'wc_update_cart' jQuery event to update fragments via cart-update.js
			$( document.body ).on( 'wc_update_cart', maybeUpdateCartFragments );
			$( document.body ).on( 'removed_from_cart', maybeUpdateCartFragments );

			// After fragments has been updated
			$( document.body ).on( _settings.fragmentsReplacedEvent, setAllQuantityAttributes );

			// Cart item restore
			$( document.body ).on( _settings.fragmentsUpdateEvent, processBeforeFragmentsUpdate );
			$( document.body ).on( _settings.fragmentsReplacedEvent, processAfterFragmentsReplaced );
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
