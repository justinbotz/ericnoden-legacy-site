/**
 * Enhances compatibility of the cart with WooCommerce Smart Coupons (by StoreApps).
 *
 * Background:
 * - WooCommerce Smart Coupons updates available coupons and cart fragments
 *   via AJAX on cart interactions (apply/remove coupons, fragment refresh).
 * - Fluid Checkout PRO needs to ensure these updates are applied reliably
 *   so that coupon availability and cart totals stay in sync.
 *
 * Purpose:
 * This script listens to Smart Coupons and WooCommerce cart events,
 * ensuring that available coupons are refreshed and cart fragments updated
 * after coupon changes, maintaining compatibility and a seamless cart UX.
 *
 * Notices: Triggering wc_update_cart after apply/remove coupon causes a
 * fragment refresh that replaces the notices wrapper with fragment HTML
 * (often empty), making the success/error notice disappear. We preserve
 * notices before the refresh and restore them after fragments are applied.
 */
(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.FCSmartCouponsCart = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		preferredNoticesWrapperSelector: '.fc-cart-notices',
		fallbackNoticesWrapperSelector: '.woocommerce-notices-wrapper:first-child',

		applyButtonSelector: '.apply_coupons_credits',
		removeLinkSelector: 'a.woocommerce-remove-coupon',
		innerNoticesWrapperSelector: '.woocommerce-notices-wrapper',
		codeTextSelector: '.code',

		couponsListSelector: '#coupons_list',
		allCouponContainerSelector: '#all_coupon_container',
		invalidCouponsListSelector: '#invalid_coupons_list',

		applyNonce: '', // Defined at initialization
	};

	// Saved notices HTML to restore after fragment refresh (cart coupon flow).
	var _savedNoticesHtml = '';



	/**
	 * Get the wrapper where notices should be rendered.
	 *
	 * @return  Element  The notices wrapper element.
	 */
	var getNoticesWrapper = function() {
		// Get notices wrapper
		var noticesWrapper = document.querySelector( _settings.preferredNoticesWrapperSelector ) || document.querySelector( _settings.fallbackNoticesWrapperSelector );

		// Bail if no notices wrapper found
		if ( ! noticesWrapper ) { return null; }

		// Return notices wrapper
		return noticesWrapper;
	};



	/**
	 * Update available coupons.
	 */
	var maybeUpdateAvailableCoupons = function() {
		// Bail if function is not available
		if ( 'function' !== typeof window.sc_load_coupons ) { return; }

		// Update available coupons
		window.sc_load_coupons();
	};

	/**
	 * After fragments refreshed: restore notices if we had saved them so coupon success/error message does not disappear.
	 */
	var restoreNoticesAfterFragmentRefresh = function() {
		// Bail if saved notices HTML is not available
		if ( ! _savedNoticesHtml ) { return; }

		// Get notices wrapper
		var noticesWrapper = getNoticesWrapper();

		// Bail if notices wrapper is not available, after resetting saved notices HTML
		if ( ! noticesWrapper ) {
			_savedNoticesHtml = '';
			return;
		}

		// Get current HTML
		var currentHtml = noticesWrapper.innerHTML.trim();

		// Maybe restore saved notices HTML
		if ( ! currentHtml && _savedNoticesHtml ) {
			noticesWrapper.innerHTML = _savedNoticesHtml;
		}

		// Reset saved notices HTML
		_savedNoticesHtml = '';
	};



	/**
	 * Apply a Smart Coupon when the "apply coupon/credits" button is clicked.
	 * Uses custom AJAX endpoint "fc_sc_apply_coupon".
	 */
	var applySmartCouponForCart = function( button ) {
		// Bail if jQuery is not available
		if ( ! _hasJQuery ) { return; }
		
		// Bail if button is not available
		if ( ! button ) { return; }

		// Get coupon code value
		var couponCode =
			button.getAttribute('data-coupon_code') ||
			button.getAttribute('data-coupon') ||
			button.getAttribute('name');
		
		// Maybe get coupon code from code text selector
		if ( ! couponCode ) {
			couponCode = button.querySelector( _settings.codeTextSelector ) ? button.querySelector( _settings.codeTextSelector ).textContent.trim() : '';
		}
	
		// Bail if no coupon code value found
		if ( ! couponCode ) { return; }

		// Set button opacity
		button.style.opacity = '0.5';

		$.ajax( {
			type: 'POST',
			url: fcSettings.wcAjaxUrl.replace( '%%endpoint%%', 'fc_sc_apply_coupon' ),
			data: {
				coupon_code: couponCode,
				reference_id: button.getAttribute( 'data-reference_id' ) || '',
				security: _settings.applyNonce
			},
			dataType: 'json',
			success: function( response ) {
				// On success: remove the coupon card first to avoid layout shift, then add notice
				if ( response && response.result === 'success' && button.closest( _settings.couponsListSelector ) ) {
					// Remove button
					button.remove();

					// Get coupons list
					var couponsList = document.querySelector( _settings.couponsListSelector );

					// If no coupons left, hide the section (title + container) to avoid orphaned heading.
					// Use hide() not remove() so fragment refresh can replace it when coupon is removed from cart.
					if ( couponsList.length ) {
						var container = couponsList.querySelector( _settings.allCouponContainerSelector );
						if ( container && ! container.children.length ) {
							couponsList.style.display = 'none';
						}
					}
				}

				// Update notices wrapper
				var noticesWrapper = getNoticesWrapper();
				if ( noticesWrapper && response && response.message ) {
					noticesWrapper.innerHTML = response.message;
					_savedNoticesHtml = response.message;
				}

				// Trigger cart fragments update
				$( document.body ).trigger( 'wc_update_cart' );
			},
			error: function() {},
			complete: function() {
				button.style.opacity = '';
			}
		} );
	};

	/**
	 * Capture click on Smart Coupons apply button (cart). Prevents full page reload.
	 */
	var captureCouponClickHandler = function( e ) {
		// Get target element
		var target = e.target;

		// Bail if target is not available or not a valid element
		if ( ! target || ! target.closest ) { return; }

		// Get button element
		var button = target.closest( _settings.applyButtonSelector );

		// Bail if button is not available
		if ( ! button ) { return; }

		// Bail if button is inside invalid coupons list
		if ( button.closest( _settings.invalidCouponsListSelector ) ) { return; }

		// Prevent default behavior and stop immediate propagation
		e.preventDefault();
		e.stopImmediatePropagation();

		// Apply Smart Coupon for cart
		applySmartCouponForCart( button );
	};

	/**
	 * Trigger cart fragments update after Smart Coupons AJAX.
	 * Saves current notices so we can restore them after fragment refresh.
	 */
	var refreshCartAfterCouponChange = function( _event, _xhr, settings ) {
		// Bail if settings is not available or URL is not available
		if ( ! settings || ! settings.url ) { return; }

		// Bail if URL is not related to Smart Coupons AJAX
		var url = settings.url.toString();
		if ( -1 === url.indexOf( 'wc-ajax=apply_coupon' ) && -1 === url.indexOf( 'wc-ajax=remove_coupon' ) ) { return; }

		// Save current notices
		var noticesWrapper = getNoticesWrapper();
		if ( noticesWrapper ) {
			_savedNoticesHtml = noticesWrapper.innerHTML.trim();
		}

		// Trigger cart fragments update
		$( document.body ).trigger( 'wc_update_cart' );
	};



	/**
	 * Handle cart fragments refreshed.
	 */
	var handleCartFragmentsRefreshed = function() {
		restoreNoticesAfterFragmentRefresh();
		maybeUpdateAvailableCoupons();
	};



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		// Bail if already initialized
		if ( _hasInitialized ) { return; }

		// Merge settings
		_settings = FCUtils.extendObject( _settings, options );

		// Add jQuery event listeners
		if ( _hasJQuery ) {
			$( document.body ).on( 'wc_fragments_refreshed', handleCartFragmentsRefreshed );
			$( document ).ajaxComplete( refreshCartAfterCouponChange );
		}

		// Intercept Smart Coupons click before it does location.href (full page reload)
		document.addEventListener( 'click', captureCouponClickHandler, true );

		// Set initialized flag
		_hasInitialized = true;
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
