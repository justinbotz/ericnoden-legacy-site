/**
 * Apply discounts for the plugin WooCommerce Points and Rewards.
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
		root.PointsRewardsRedeemPoints = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _isProcessing = false;
	var _publicMethods = {};
	var _settings = {
		bodyClass: 'has-fc-points-rewards-redeem-points',

		uiProcessingClass: 'processing',

		sectionWrapperSelector: '.fc-step__substep',
		generalNoticesSelector: '.woocommerce-notices-wrapper',
		messagesWrapperSelector: '.fc-coupon-code-messages',
		suppressSuccessMessages: 'no',

		earnPointsSectionSelector: '.fc-points-rewards-earn-points',
		redeemSectionSelector: '.fc-points-rewards-redeem',
		redeemButtonSelector: '.wc_points_rewards_apply_discount',

		maxPointsFieldSelector: '[name="wc-points-rewards-max-points"]',
		pointsToApplyFieldSelector: 'input.wc_points_rewards_apply_discount_amount',
	}



	/**
	 * METHODS
	 */



	/**
	 * Add notices in the coupon code section.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	var showNotices = function( content, referenceElement ) {
		// Maybe get specific messages wrapper
		var messagesWrapper;
		var sectionWrapper = referenceElement ? referenceElement.closest( _settings.sectionWrapperSelector ) : null;
		if ( sectionWrapper ) {
			messagesWrapper = sectionWrapper.querySelector( _settings.messagesWrapperSelector );
		}
		else {
			messagesWrapper = document.querySelector( _settings.generalNoticesSelector );
		}
		
		// Add message
		if ( messagesWrapper ) {
			messagesWrapper.innerHTML = content;
		}
	}

	/**
	 * Remove all notices from the coupon code section.
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
	 * Maybe prompt user for the amount of points to redeem.
	 *
	 * @return  bool  `true` if amount of points provided by the user was valid or if partial redemption is disabled or not possible at the moment, `false` if user cancelled the dialog or provided an invalid amount.
	 */
	var maybePromptPointsToRedeem = function() {
		// Bail if settings not available or partial redemption not enabled
		if ( ! window.fcSettings || ! fcSettings.woocommercePointsRewards || ! fcSettings.woocommercePointsRewards.partialRedemptionEnabled ) { return true; }
		
		// Get max points
		var max_points = document.querySelector( _settings.maxPointsFieldSelector );
		var pointsToApplyField = document.querySelector( _settings.pointsToApplyFieldSelector );
		
		// Bail if hidden fields for max amount of points or amount of points to redeem are not available
		if ( ! max_points || ! pointsToApplyField ) { return true; }

		var points = prompt( fcSettings.woocommercePointsRewards.pointsToRedeemMessage, max_points.value );
		if ( null != points && 0 != points ) {
			
			if ( points >= fcSettings.woocommercePointsRewards.minPointsToRedeem ) {
				// Should continue with redemption
				pointsToApplyField.value = points;
				return true;
			}
			else {
				// Invalid amount of points
				alert( fcSettings.woocommercePointsRewards.lessThanMinPointsMessage );
				return false;
			}
		}
		else {
			// User cancelled or value invalid
			return false;
		}
	}



	/**
	 * Sends the apply discount ajax request.
	 * 
	 * Adapted from the inline script added by the original plugin.
	 * 
	 * @see WC_Points_Rewards_Cart_Checkout::render_redeem_points_message()
	 */
	var submitPointsRedemption = function( e ) {
		// Bail if still processing a request for points redemption
		if ( _isProcessing ) { return; }

		// Maybe prompt how many points to redeem or cancel submit if dialog is cancelled by the user
		if ( ! maybePromptPointsToRedeem() ) { return; }

		// Get sections
		var redeemSection = document.querySelector( _settings.redeemSectionSelector );
		var earnPointsSection = document.querySelector( _settings.earnPointsSectionSelector );

		// Set processing
		_isProcessing = true;
		blockUI( redeemSection );
		blockUI( earnPointsSection );

		// Remove existing messages
		clearNotices();

		var apply_coupon_nonce = window.woocommerce_params ? woocommerce_params.apply_coupon_nonce : null;
		apply_coupon_nonce = ! apply_coupon_nonce && window.wc_checkout_params ? wc_checkout_params.apply_coupon_nonce : apply_coupon_nonce;
		apply_coupon_nonce = ! apply_coupon_nonce && window.wc_cart_params ? wc_cart_params.apply_coupon_nonce : apply_coupon_nonce;

		var pointsToApplyField = document.querySelector( _settings.pointsToApplyFieldSelector );
		var discount_amount = pointsToApplyField ? pointsToApplyField.value : '';

		var data = {
			action: "wc_points_rewards_apply_discount",
			discount_amount: discount_amount,
			security: apply_coupon_nonce,
		};

		$.ajax({
			type:     "POST",
			url:      woocommerce_params.ajax_url,
			data:     data,
			success:  function( response ) {
				if ( response ) {
					// Maybe show notices
					if ( response && '' !== response && 'yes' !== _settings.suppressSuccessMessages ) {
						showNotices( response, redeemSection );
					}

					// Trigger cart and checkout update events
					$( document.body ).trigger( 'wc_fragment_refresh' );
					$( document.body ).trigger( 'update_checkout' );
				}
			},
			dataType: "html"
		});
	}



	/**
	 * Resets the processing flag state to `false`.
	 */
	var resetProcessingFlag = function () {
		_isProcessing = false;
	}



	/**
	 * Handle document clicks and route to the appropriate function.
	 */
	var handleClick = function( e ) {
		// REDEEM / APPLY DISCOUNT
		if ( e.target.closest( _settings.redeemButtonSelector ) ) {
			e.preventDefault();
			submitPointsRedemption( e );
		}
	};



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function() {
		if ( _hasInitialized ) return;

		// Add event listeners
		window.addEventListener( 'click', handleClick, true );

		// Add jQuery event listeners
		if ( _hasJQuery ) {
			$( document.body ).on( 'updated_checkout', resetProcessingFlag );
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
