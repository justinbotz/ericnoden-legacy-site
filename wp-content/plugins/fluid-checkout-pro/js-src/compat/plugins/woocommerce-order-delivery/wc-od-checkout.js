/**
 * WC_OD Checkout scripts.
 *
 *
 * 
 * IMPORTANT: This is a modified version to let inline datepicker
 * to update the hidden input element, without this the calendar 
 * doesn't save the selected date.
 * The handler for event 'changeDate' was changed around lines 50-60.
 * 
 */

/* global wc_od_checkout_l10n */
jQuery( function( $ ) {

	'use strict';

	if ( typeof wc_od_checkout_l10n === 'undefined' ) {
		return false;
	}

	var WC_OD = function( options ) {
		this.options = options;
		this.$body   = $( 'body' );

		this.init();
	};

	WC_OD.prototype = {

		init: function() {
			// Bind events.
			this._bindEvents();
		},

		_bindEvents: function() {
			var that = this;

			// Update the calendar when the checkout form changes.
			this.$body.on( 'updated_checkout', function() {
				that.updateDeliveryDateCalendar();
			});

			// Update the checkout form when the time frame field changes.
			this.$body.on( 'change', '#delivery_time_frame', function() {
				that.$body.trigger( 'update_checkout' );
			});
		},

		// CHANGE: Set the date custom fields values
		setDateCustomFields: function( datepicker ) {
			if ( datepicker.getDate() !== null ) {
				$('#delivery_date').data( 'wc_od_datepicker' ).hiddenElement.val( datepicker.getFormattedDate( 'yyyy-mm-dd' ) );
				$('#delivery_date_visible').val( datepicker.getFormattedDate( 'yyyy-mm-dd' ) );
			}
		},
		// END - CHANGE: Set the date custom fields values

		// CHANGE: Add inline error message
		addInlineMessageMarkup: function( field, formRow, message, typeClass ) {
			// Bail if field not valid
			if ( !field ) { return; }
	
			var referenceNode = field;
	
			// Create message element and add it after the field.
			var parent = field.parentNode;
			var element = document.createElement( 'span' );
			element.className = 'woocommerce-error invalid-' + typeClass;
			element.innerText = message;
			parent.insertBefore( element, referenceNode.nextSibling );
		},
		// END - CHANGE: Add inline error message

		// CHANGE: Maybe update fields
		maybe_change_fields: function( that, triggedByCalendar = false ) {
			var datepicker = $('#delivery_date').data( 'wc_od_datepicker' ).getDatepicker();
			var dpg = $.fn.bootstrapDP.DPGlobal;
			var dateStr = $( '#delivery_date_visible' ).val();
			var date = dpg.parseDate( dateStr, dpg.parseFormat( 'yyyy-mm-dd' ) );

			// Remove error messages
			var formRow = document.querySelector( '#delivery_date_field' );
			$( formRow ).find( '.woocommerce-error' ).remove();

			// Get error flags
			var isDisabled = datepicker.dateIsDisabled( date );
			var isOutOfRange = date < datepicker.getStartDate() || date > datepicker.getEndDate();

			// Maybe update calendar and checkout fragments
			if ( ! isDisabled && ! isOutOfRange ) {
				// Update calendar and custom fields
				if ( ! triggedByCalendar ) {
					datepicker.update( date );
				}
				
				// Update custom fields
				that.setDateCustomFields( datepicker );
			}
			// Handle errors
			else {
				// Clear calendar and hidden field values
				datepicker.update('');
				$('#delivery_date').data( 'wc_od_datepicker' ).hiddenElement.val( '' );
			}

			// Trigger update checkout
			$( 'body' ).trigger( 'update_checkout' );
		},
		// END - CHANGE: Maybe update fields

		updateDeliveryDateCalendar: function() {
			var that = this;

			// CHANGE: Bail if delivery date field is not present
			var deliveryDateField = document.querySelector( '#delivery_date' );
			if ( ! deliveryDateField ) { return; }

			// Refresh the options.
			this.options = $.extend( {}, this.options, window.wc_od_checkout_l10n );

			// Create the calendar.
			$( '#delivery_date' ).wc_od_datepicker( this.options ).on( 'changeDate', function() {
				// CHANGE: Update custom fields
				var datepicker = $('#delivery_date').data( 'wc_od_datepicker' ).getDatepicker();
				that.setDateCustomFields( datepicker );
				that.maybe_change_fields( that, true );

				// CHANGE: Removed call to update checkout, moved to our function `maybe_change_fields`.
			} );

			// CHANGE: Update calendar and datepicker value when visible date field changes
			$( '#delivery_date_visible' ).on( 'change', function() { that.maybe_change_fields( that ); } );

			// CHANGE: Update custom field values
			var datepicker = $('#delivery_date').data( 'wc_od_datepicker' ).getDatepicker();
			that.setDateCustomFields( datepicker );

			// CHANGE: Set selected date value from session
			if ( this.options.default_date && this.options.default_date != '' ) {
				var datepicker = $('#delivery_date').data( 'wc_od_datepicker' ).getDatepicker();
				datepicker.update( this.options.default_date );
				that.setDateCustomFields( datepicker );
			}
			// END - CHANGE: Set selected date value from session
		}
	};

	new WC_OD( wc_od_checkout_l10n );
});
