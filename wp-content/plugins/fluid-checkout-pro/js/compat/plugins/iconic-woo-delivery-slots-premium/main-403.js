(function ($) {
  /**
   * Compatiblity with CheckoutWC.
   * https://www.checkoutwc.com/
   */
  var iconic_wds_compat_checkout_wc = {
    init: function () {
      wp.hooks.addFilter('iconic_wds_is_checkout', 'iconic_wds', function (is_checkout) {
        if ($('body').hasClass('checkout-wc')) {
          return true;
        }
        return is_checkout;
      });
    }
  };

  /**
   * Compatiblity with Cart all in one plugin by VillaTheme.
   * https://wordpress.org/plugins/woo-cart-all-in-one/
   * https://codecanyon.net/item/woocommerce-cart-all-in-one/30184317
   */
  var iconic_wds_compat_all_in_one_cart = {
    init: function () {
      $('body').on('viwcaio_sc_effect_after_atc', function () {
        window.jckwds.cache();
        window.jckwds.toggle_date_time_fields();
      });
      wp.hooks.addFilter('iconic_wds_is_checkout', 'iconic_wds', function (is_checkout) {
        if ($('body').find('.vi-wcaio-checkout-step-wrap').length > 0) {
          return true;
        }
        return is_checkout;
      });
    }
  };

  /**
   * Compatiblity with Elementor.
   */
  var iconic_wds_compat_elementor_popup = {
    init: function () {
      // Reservation table compatiblity with Elementor popup.
      jQuery("a[href^='" + CSS.escape('#elementor-action%3Aaction%3Dpopup%3Aopen') + "']").click(function () {
        setTimeout(function () {
          jQuery(document.body).trigger('iconic_wds_init_reservation_table');
        }, 100);
      });
    }
  };
  $(document).ready(iconic_wds_compat_checkout_wc.init);
  $(document).ready(iconic_wds_compat_all_in_one_cart.init);
  $(document).ready(iconic_wds_compat_elementor_popup.init);
})(jQuery);
(function ($, document) {
  window.jckwds = {
    cache: function () {
      jckwds.els = {};

      // common elements
      jckwds.els.document = $(document);
      jckwds.els.document_body = $(document.body);
      jckwds.els.date_picker = $("#jckwds-delivery-date");
      jckwds.els.date_ymd = $("#jckwds-delivery-date-ymd");
      jckwds.els.timeslot_select = $('#jckwds-delivery-time');
      jckwds.els.timeslot_select_wrapper = $('#jckwds-delivery-time-wrapper');
      jckwds.els.timeslot_field_row = $('#jckwds-delivery-time_field');
      jckwds.els.checkout_fields = $('#jckwds-fields');
      jckwds.els.fields_hidden = $('[name="iconic-wds-fields-hidden"]');
      jckwds.els.ship_to_different_address_checkbox = $('#ship-to-different-address-checkbox');
      jckwds.els.shipping_postcode_field = $('#shipping_postcode');
      jckwds.els.billing_postcode_field = $('#billing_postcode');
      jckwds.els.multi_step_checkout = $('#wizard');
    },
    common_vars: function () {
      jckwds.vars = {};

      // common vars
      jckwds.vars.is_checkout = wp.hooks.applyFilters('iconic_wds_is_checkout', jckwds.els.document_body.hasClass('woocommerce-checkout'));
      jckwds.vars.has_multi_step = jckwds.els.multi_step_checkout.length > 0 ? true : false;
      jckwds.vars.inactive_class = 'jckwds-fields-inactive';
      jckwds.vars.chosen_shipping_method = false;
      jckwds.vars.set_date_flag = false;
      jckwds.vars.wds_ajax_init_flag = false;
      jckwds.vars.is_order_pay = jckwds.els.document_body.hasClass('woocommerce-order-pay');
    },
    on_load: function () {
      // on load stuff here
      jckwds.cache();
      jckwds.common_vars();
      jckwds.setup_checkout();
      jckwds.setup_multi_step_checkout();
      $(jckwds.els.document_body).trigger('iconic_wds_init_tooltip');
    },
    /**
     * Checkout: Functions to run on checkout
     */
    setup_checkout: function () {
      if (!jckwds.vars.is_checkout || jckwds.vars.has_multi_step || jckwds.vars.is_order_pay) {
        return;
      }
      jckwds.setup_checkout_fields();
      jckwds.watch_update_checkout();
    },
    /**
     * Checkout: If multi step checkout is enabled
     */
    setup_multi_step_checkout: function () {
      $(document.body).on('cfw_updated_checkout', function () {
        jckwds.cache();
        jckwds.unblock_checkout();
        jckwds.setup_date_picker();
      });
      if (!jckwds.vars.is_checkout || !jckwds.vars.has_multi_step) {
        return;
      }
      jckwds.els.multi_step_checkout.init(function () {
        jckwds.cache();
        jckwds.common_vars();
        jckwds.setup_checkout_fields();
        jckwds.watch_update_checkout();
      });
    },
    /**
     * Checkout: Setup date/time fields
     */
    setup_checkout_fields: function () {
      jckwds.setup_date_picker();
      jckwds.setup_timeslot_select();
    },
    /**
     * Checkout: Setup date_picker
     */
    setup_date_picker: function () {
      if ($("#jckwds-delivery-date").hasClass('hasDatepicker')) {
        jckwds.maybe_auto_select_first_date();
        return;
      }
      jckwds.els.date_picker.datepicker({
        defaultDate: jckwds_vars.bookable_dates[0],
        minDate: jckwds_vars.bookable_dates[0],
        maxDate: jckwds_vars.bookable_dates[jckwds_vars.bookable_dates.length - 1],
        beforeShow: function (input, inst) {
          var theme = $.inArray(jckwds_vars.settings.datesettings_datesettings_setup_uitheme, ['none', 'dark', 'light']) >= 0 ? jckwds_vars.settings.datesettings_datesettings_setup_uitheme : 'dark';
          inst.dpDiv.addClass('iconic-wds-datepicker iconic-wds-datepicker--' + theme);
          jckwds.els.document_body.trigger('iconic_wds_datepicker_before_show', inst);
        },
        beforeShowDay: function (date) {
          var formatted_date = $.datepicker.formatDate(jckwds_vars.settings.datesettings_datesettings_dateformat, date, {
              monthNames: jckwds_vars.strings.months,
              monthNamesShort: jckwds_vars.strings.months_short,
              dayNames: jckwds_vars.strings.days,
              dayNamesShort: jckwds_vars.strings.days_short,
              dayNamesMin: jckwds_vars.strings.days_short
            }).toString(),
            cell_class = 'iconic-wds-date';
          if (jckwds.within_min_max_range(formatted_date)) {
            cell_class += ' iconic-wds-date--tooltip';
          }
          if (jckwds.is_date_available(formatted_date)) {
            var fee = jckwds.get_fee_for_date(date),
              fee_numeric = parseFloat(fee.replace(jckwds_vars.currency.symbol, '')),
              text = fee_numeric ? '+' + fee : '';
            if (fee_numeric) {
              cell_class += ' iconic-wds-date--fee';
            }
            return [true, cell_class, text];
          } else {
            return [false, cell_class, jckwds_vars.strings.unavailable];
          }
        },
        dateFormat: jckwds_vars.settings.datesettings_datesettings_dateformat,
        onSelect: function (dateText, inst) {
          /* Trigger change event */
          $(this).trigger('change');
          if (this.value === "") {
            return;
          }
          var selected_year = jckwds.pad_left(inst.selectedYear, 4),
            selected_month = jckwds.pad_left(inst.selectedMonth + 1, 2),
            selected_day = jckwds.pad_left(inst.selectedDay, 2),
            selected_date_ymd = [selected_year, selected_month, selected_day].join('');

          /* Add selected date to hidden date ymd field for processing */
          jckwds.els.date_ymd.val(selected_date_ymd);

          // If we programatically set the date, we don't need to refresh the time slots.
          if (jckwds.vars.set_date_flag) {
            jckwds.vars.set_date_flag = false;
            return;
          }

          // CHANGE: Always trigger update checkout on date selection.
          jckwds.els.document_body.trigger('update_checkout');
        },
        onChangeMonthYear: function () {
          //  
          jckwds.els.document_body.trigger('iconic_wds_datepicker_on_change_month_year');
        },
        monthNames: jckwds_vars.strings.months,
        monthNamesShort: jckwds_vars.strings.months_short,
        dayNames: jckwds_vars.strings.days,
        dayNamesShort: jckwds_vars.strings.days_short,
        dayNamesMin: jckwds_vars.strings.days_short,
        firstDay: jckwds.get_first_day_of_the_week(),
        duration: 0
      });
      $.datepicker.setDefaults($.datepicker.regional['']);
      jckwds.els.date_picker.datepicker($.datepicker.regional['']);
      jckwds.maybe_auto_select_first_date();

      // Fix Google Translate bug
      $('.ui-datepicker').addClass('notranslate');
    },
    /**
     * Maybe auto select the first date.
     * @returns 
     */
    maybe_auto_select_first_date: function () {
      if ("1" !== jckwds_vars.settings.datesettings_datesettings_setup_auto_select_first || !jckwds_vars.bookable_dates.length) {
        return;
      }
      if (jckwds.els.date_ymd.val()) {
        return;
      }
      jckwds.set_date(jckwds_vars.bookable_dates[0], true);
    },
    /**
     * Check if value is true.
     *
     * @param value
     * @return {boolean}
     */
    is_true: function (value) {
      if (!value || value === 0 || value === '0' || value === '' || value.length <= 0) {
        return false;
      }
      return true;
    },
    /**
     * Get fee for date.
     *
     * @param date
     *
     * @return string|bool
     */
    get_fee_for_date: function (date) {
      var day_number = date.getDay(),
        ymd = $.datepicker.formatDate(jckwds_vars.settings.datesettings_datesettings_dateformat, date, {
          monthNames: jckwds_vars.strings.months,
          monthNamesShort: jckwds_vars.strings.months_short,
          dayNames: jckwds_vars.strings.days,
          dayNamesShort: jckwds_vars.strings.days_short,
          dayNamesMin: jckwds_vars.strings.days_short
        }).toString(),
        ymd_stripped = ymd.replace(/\//g, ''),
        fee = typeof jckwds_vars.day_fees[ymd_stripped] !== 'undefined' ? parseFloat(jckwds_vars.day_fees[ymd_stripped]) : parseFloat(jckwds_vars.day_fees[day_number]);

      // Same day
      if (ymd === jckwds_vars.dates.same_day && jckwds_vars.settings.datesettings_fees_same_day.length > 0) {
        fee += parseFloat(jckwds_vars.settings.datesettings_fees_same_day);
      }

      // Next day
      if (ymd === jckwds_vars.dates.next_day && jckwds_vars.settings.datesettings_fees_next_day.length > 0) {
        fee += parseFloat(jckwds_vars.settings.datesettings_fees_next_day);
      }
      return isNaN(fee) ? false : accounting.formatMoney(fee, jckwds_vars.currency);
    },
    /**
     * Set date.
     *
     * @param string value          Date to be set.
     * @param bool   fetch_timeslot Whether to fetch timeslot options from server.
     */
    set_date: function (value, fetch_timeslot) {
      if (!value) {
        return;
      }
      if (value.length <= 0 || !jckwds.is_date_available(value, false)) {
        jckwds.els.date_picker.blur().datepicker('hide').datepicker('setDate', null);
        jckwds.els.date_ymd.val('');
        jckwds.clear_timeslots(jckwds_vars.strings.selectdate);
        return;
      }
      fetch_timeslot = typeof fetch_timeslot !== 'undefined' ? fetch_timeslot : false;
      jckwds.vars.set_date_flag = !fetch_timeslot;
      value = $.datepicker.parseDate(jckwds_vars.settings.datesettings_datesettings_dateformat, value, {
        monthNames: jckwds_vars.strings.months,
        monthNamesShort: jckwds_vars.strings.months_short,
        dayNames: jckwds_vars.strings.days,
        dayNamesShort: jckwds_vars.strings.days_short,
        dayNamesMin: jckwds_vars.strings.days_short
      });
      jckwds.els.date_picker.blur().datepicker('hide').datepicker('setDate', value);
      $('.ui-datepicker .ui-state-active').click();
    },
    /**
     * Is date available to be selected (case insensitive).
     *
     * There was an issue with date formats sometimes being lower case,
     * and sometimes not - thus they weren't matching.
     *
     * @param date
     * @return {boolean}
     */
    is_date_available: function (date) {
      if (jckwds_vars.bookable_dates.length <= 0) {
        return false;
      }
      var match = false;
      date = date.toLowerCase();
      $.each(jckwds_vars.bookable_dates, function (index, value) {
        if (false === match && value.toLowerCase() === date) {
          match = true;
          return false;
        }
      });
      return match;
    },
    /**
     * Helper: Get all timeslots available on a specific date,
     *         and update the timeslots dropdown
     *
     * @param [str] [date] [format?]
     * @param [func] [callback]
     */
    update_timeslot_options: function (date, callback) {
      var $first_timeslot_option = jckwds.els.timeslot_select.find("option:eq(0)"),
        currently_selected = jckwds.els.timeslot_select.val(),
        postcode = jckwds.els.ship_to_different_address_checkbox.is(":checked") ? $('#shipping_postcode').val() : $('#billing_postcode').val();
      jckwds.clear_timeslots(jckwds_vars.strings.loading);
      jckwds.els.timeslot_select.attr('disabled', 'disabled').trigger('change', ['update_timeslots']);
      var ajaxData = {
        action: 'iconic_wds_get_slots_on_date',
        nonce: jckwds_vars.ajax_nonce,
        date: date,
        postcode: postcode
      };
      jQuery.post(jckwds_vars.ajax_url, ajaxData, function (response) {
        if (response.success === true) {
          jckwds.clear_timeslots(jckwds_vars.strings.selectslot);
          jckwds.els.timeslot_select.append(response.html);
          currently_selected = jckwds.els.timeslot_select.find('option[value="' + currently_selected + '"]').length > 0 ? currently_selected : 0;
          jckwds.els.timeslot_select.val(currently_selected);
          if (response.reservation) {
            if (jckwds.els.timeslot_select.find("option[value='" + response.reservation + "']").length > 0) {
              jckwds.els.timeslot_select.val(response.reservation);
            }
          } else {
            if ("1" === jckwds_vars.settings.timesettings_timesettings_setup_auto_select_first) {
              jckwds.els.timeslot_select.val(jckwds.els.timeslot_select.find("option:eq(1)").val());
            } else {
              jckwds.els.timeslot_select.val(jckwds.els.timeslot_select.find("option:eq(0)").val());
            }
          }
          // It causes infinite loops when we trigger the event on failed responses.
          // Removing this would cause Fees to not work, specifically when Auto select first day is enabled.
          jckwds.els.document_body.trigger('update_checkout');
        } else {
          $first_timeslot_option.text(jckwds_vars.strings.noslots);
        }
        jckwds.els.document_body.trigger('timeslots_loaded');
        jckwds.els.timeslot_select.removeAttr('disabled').trigger('change', ['update_timeslots']);
        if (callback !== undefined) {
          callback(response);
        }
      });
    },
    /**
     * Checkout: Refresh time slots
     *
     * @param force
     */
    refresh_timeslots: function (force) {
      force = typeof force !== 'undefined' ? force : false;

      // if a reservation is in place, don't refresh timeslots
      if (jckwds.els.timeslot_field_row.hasClass('jckwds-delivery-time--has-reservation') && force === false) {
        jckwds.els.timeslot_field_row.removeClass('jckwds-delivery-time--has-reservation');
        return;
      }

      // refresh timeslots, based on date
      var date = jckwds.els.date_ymd.val();
      if (jckwds.is_true(date) && jckwds.is_true(jckwds_vars.settings.timesettings_timesettings_setup_enable)) {
        jckwds.update_timeslot_options(date);
      }
      jckwds.els.document_body.trigger('timeslots_refreshed');
    },
    /**
     * Clear date fields.
     */
    clear_date: function () {
      jckwds.els.date_ymd.val('');
      jckwds.set_date('');
    },
    /**
     * Clear timeslots from select and optionally replace first option text.
     *
     * @param first_option_text
     */
    clear_timeslots: function (first_option_text) {
      jckwds.els.timeslot_select.children().not(':first').remove();
      if (typeof first_option_text === 'string') {
        jckwds.els.timeslot_select.find("option:eq(0)").text(first_option_text);
      }
    },
    /**
     * Checkout: Setup timeslot field
     *
     * Don't update checkout if we've triggered the select change ourselves
     */
    setup_timeslot_select: function () {
      // update checkout on time selection
      jckwds.els.timeslot_select.on('change', function (event, type) {
        type = typeof type !== "undefined" ? type : false;
        if (type === "update_timeslots") {
          return;
        }
        jckwds.els.document_body.trigger('update_checkout');
      });
    },
    /**
     * Checkout: Watch for the update_checkout trigger
     */
    watch_update_checkout: function () {
      /**
       * Toggle checkout fields loading and disable place order button.
       */
      jckwds.els.document_body.on('update_checkout', function (e) {
        jckwds.block_checkout();
      });
      jckwds.els.document_body.on('updated_checkout', function (e, data) {
        if (!data || !data.fragments || !data.fragments.iconic_wds) {
          return;
        }
        jckwds.cache();
        jckwds.setup_date_picker();

        /**
         * Refresh select2 if it is present and enabled for time field.
         */
        if (jQuery.fn.select2 && $("#jckwds-delivery-time").hasClass('select2-hidden-accessible')) {
          jQuery("#jckwds-delivery-time").select2("destroy");
          jQuery("#jckwds-delivery-time").select2();
        }
        jckwds.update_checkout_field_labels(data.fragments.iconic_wds.labels);

        /**
         * If shipping method hasn't changed.
         */
        if (data.fragments.iconic_wds.chosen_shipping_method === jckwds.vars.chosen_shipping_method) {
          // To add compatiblity with plugins which load checkout content in ajax.
          if (data.fragments.iconic_wds && data.fragments.iconic_wds.slots_allowed && !jckwds.vars.wds_ajax_init_flag) {
            jckwds.vars.wds_ajax_init_flag = true;
            jckwds.cache();
            jckwds.show_date_time_fields();
          }
          jckwds.unblock_checkout();
          return;
        }

        /**
         * Re-cache the selected shipping method
         */
        jckwds.vars.chosen_shipping_method = data.fragments.iconic_wds.chosen_shipping_method.toString();

        // CHANGE: Remove function call to refresh datepicker and timeslots as the fields are updated using checkout fragments refresh.

        // Show error if no dates are available.
        var $submit_btn = $('form.checkout [name=woocommerce_checkout_place_order]');
        if (0 === data.fragments.iconic_wds.bookable_dates.length) {
          $('.iconic-wds-fields__error').show();
          $('.iconic-wds-fields__fields').hide();
          $submit_btn.prop('disabled', true);
          $('#ppc-button').hide();
        } else {
          $('.iconic-wds-fields__error').hide();
          $('.iconic-wds-fields__fields').show();
          $submit_btn.prop('disabled', false);
          $('#ppc-button').show();
        }
      });
      if (jckwds.els.checkout_fields.hasClass(jckwds.vars.inactive_class)) {
        jckwds.hide_date_time_fields();
      }
    },
    /**
     * Block the checkout.
     */
    block_checkout: function () {
      jckwds.els.checkout_fields.block({
        message: null,
        overlayCSS: {
          background: '#fff',
          opacity: 0.6
        }
      });
      $('#place_order').attr('disabled', 'disabled');
    },
    /**
     * Unblock the checkout.
     */
    unblock_checkout: function () {
      jckwds.els.checkout_fields.unblock({
        fadeOut: 0
      });
      $('#place_order').removeAttr('disabled');
    },
    /**
     * Update checkout field labels.
     *
     * @param labels
     */
    update_checkout_field_labels: function (labels) {
      if (labels.length <= 0) {
        return;
      }
      var elements = {
        details: $('.iconic-wds-fields__title'),
        date: $('.jckwds-delivery-date label'),
        select_date: $('#jckwds-delivery-date'),
        choose_date: $('#jckwds-delivery-date-description'),
        time_slot: $('.jckwds-delivery-time label'),
        choose_time_slot: $(' #jckwds-delivery-time-description')
      };
      $.each(labels, function (index, label) {
        if (typeof elements[index] === 'undefined') {
          return true;
        }
        if (elements[index].is('input')) {
          elements[index].attr('placeholder', label);
          return true;
        }
        var $html = elements[index].find('*');
        elements[index].text(label);
        if ($html.length > 0) {
          elements[index].append('&nbsp;').append($html);
        }
      });
    },
    /**
     * Refresh datepicker
     *
     * Fetch new bookable dates based on shipping method selected
     * and update the cached bookable_dates variable. Then, refresh
     * the datepicker
     */
    refresh_datepicker: function (bookable_dates, callback) {
      jckwds_vars.bookable_dates = bookable_dates;
      jckwds.els.date_picker.blur().datepicker('hide').datepicker('option', 'defaultDate', bookable_dates[0]).datepicker('option', 'minDate', bookable_dates[0]).datepicker('option', 'maxDate', bookable_dates[bookable_dates.length - 1]);

      /**
       * Set date if one is reserved and it is bookable
       */
      if (jckwds_vars.reserved_slot && jckwds_vars.reserved_slot.date) {
        if ($.inArray(jckwds_vars.reserved_slot.date.formatted, jckwds_vars.bookable_dates) !== -1) {
          jckwds.set_date(jckwds_vars.reserved_slot.date.formatted);
        }
      } else {
        var selected_date = jckwds.els.date_picker.val();
        jckwds.set_date(selected_date);
      }
      if (typeof callback !== "undefined") {
        callback();
      }
    },
    /**
     * Clear date and time fields
     */
    clear_date_time_fields: function () {
      jckwds.clear_date();
      jckwds.clear_timeslots();
    },
    /**
     * Checkout: Toggle date/time fields
     */
    toggle_date_time_fields: function (fragment_data, callback) {
      /**
       * If the selected shipping method isn't allowed, no need to load
       * anything more. Just hide the fields and return the callback.
       */
      if (
      // If there's no shipping fields (i.e. a virtual product).
      !jckwds_vars.needs_shipping ||
      // Or if "any method" is not selected and the current method isn't selected.
      $.inArray('any', jckwds_vars.settings.general_setup_shipping_methods) < 0 && $.inArray(jckwds.vars.chosen_shipping_method, jckwds_vars.settings.general_setup_shipping_methods) < 0) {
        jckwds.hide_date_time_fields();
        if (typeof callback === 'function') {
          /**
           * @param bool   allowed
           * @param object data
           */
          callback(false, {
            index: true
          });
        }
        return;
      } else {
        jckwds.show_date_time_fields();
      }
      if (fragment_data.slots_allowed) {
        jckwds.show_date_time_fields();
      } else {
        jckwds.hide_date_time_fields();
      }
      if (typeof callback === 'function') {
        callback(fragment_data.slots_allowed);
      }
    },
    /**
     * Checkout: Hide date/time fields
     */
    hide_date_time_fields: function () {
      // CHANGE: Stop adding/removing class `woocommerce-billing-fields`.
      jckwds.els.checkout_fields.removeClass(jckwds.vars.inactive_class).hide();
      jckwds.els.fields_hidden.val(1);
      jckwds.clear_date_time_fields();
    },
    /**
     * Checkout: Show date/time fields
     */
    show_date_time_fields: function () {
      // CHANGE: Stop adding/removing class `woocommerce-billing-fields`.
      jckwds.els.checkout_fields.show();
      jckwds.els.fields_hidden.val(0);
    },
    /**
     * Get last day of the week
     *
     * @return int
     */
    get_last_day_of_the_week: function () {
      var days = {
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
        'sunday': 0
      };
      if (typeof jckwds_vars.settings.datesettings_datesettings_last_day_of_week === "undefined" || typeof days[jckwds_vars.settings.datesettings_datesettings_last_day_of_week] === "undefined") {
        return 6;
      }
      return days[jckwds_vars.settings.datesettings_datesettings_last_day_of_week];
    },
    /**
     * Get first day of the week
     *
     * @return int
     */
    get_first_day_of_the_week: function () {
      var last_day = jckwds.get_last_day_of_the_week();
      if (last_day === 6) {
        return 0;
      } else {
        return last_day + 1;
      }
    },
    /**
     * Pad left
     *
     * @param int number
     * @param int count
     * @param str string
     * @return str
     */
    pad_left: function (number, count, string) {
      return new Array(count - String(number).length + 1).join(string || '0') + number;
    },
    /**
     * Run on checkout error.
     */
    checkout_error: function () {
      var $clear_date = $('[data-iconic-wds-clear-date="1"]'),
        $clear_time = $('[data-iconic-wds-clear-time="1"]'),
        $update_checkout = $('[data-iconic-wds-update-checkout="1"]');
      if ($clear_date.length <= 0 && $clear_time.length <= 0 && $update_checkout.length <= 0) {
        return;
      }
      if ($clear_date.length > 0) {
        jckwds.clear_date();
      }
      if ($clear_time.length > 0) {
        jckwds.refresh_timeslots(true);
      }
      if ($update_checkout.length > 0) {
        $(document.body).trigger('update_checkout');
      }
    },
    /**
     * Show Checkout error.
     *
     * @param string error_message 
     */
    submit_error: function (error_message) {
      var $checkout_form = $('form.checkout');
      $('.woocommerce-NoticeGroup-checkout, .woocommerce-error, .woocommerce-message').remove();
      $checkout_form.prepend('<div class="woocommerce-NoticeGroup woocommerce-NoticeGroup-checkout">' + error_message + '</div>'); // eslint-disable-line max-len
      $checkout_form.removeClass('processing').unblock();
      $checkout_form.find('.input-text, select, input:checkbox').trigger('validate').blur();
      $(document.body).trigger('checkout_error', [error_message]);
    },
    /**
     * Is the given date within the range of min and max bookable dates?
     *
     * @param string formatted_date Formatted Date
     * @returns bool
     */
    within_min_max_range: function (formatted_date) {
      return jckwds_vars.bookable_dates.includes(formatted_date);
    }
  };
  $(window).on('load', jckwds.on_load);
  $(document.body).on('checkout_error', jckwds.checkout_error);
})(jQuery, document);
jQuery(function () {
  if (!window.Vue || !window.vueConciseSlider) {
    return;
  }

  /**
   * Event bus for Parent to child communication.
   * Usage: When a step is opened, we send a message to <wds-reservation-date-slider>
   * So that it can slide to the pre-selected date.
   *
   * This Eventbus can be extended for other purposes too.
   */
  var EventBus = new Vue();

  /**
   * Initialize the root app.
   */
  function init_reservation_table() {
    if (!jQuery('.wds-reservation-table-wrapper').length) {
      return;
    }

    // Prepare HTML - copy HTML from script to the div.
    // This is to make the reservation table compatible with popup plugins.
    jQuery('.wds-reservation-table-wrapper').html(jQuery('#wds-reservation-table-script').html());
    window.iconic_wds_reservation_table = new Vue({
      el: '#wds-reservation-table',
      data: {
        // Vars.
        page_loaded: false,
        // Data.
        shipping_methods: [],
        selected_shipping_method: '',
        available_timeslots: {},
        available_dates: [],
        selected_date: '',
        selected_date_timeslots: [],
        selected_slot: '',
        shipping_method_type: jckwds_vars.strings.reservation_table.delivery,
        datetime_required_for_selected_method: true,
        shipping_method_provided_as_shortcode_arg: false,
        address: {
          country: '',
          state: '',
          city: '',
          postcode: ''
        },
        // Settings.
        timeslot_enabled: false,
        remaining_label_threshold: false,
        // Steps.
        step1: {
          caption: '',
          form_open: false,
          data_available: true,
          none_caption: jckwds_vars.strings.reservation_table.none_selected
        },
        step2: {
          caption: '',
          form_open: false,
          data_available: false,
          none_caption: jckwds_vars.strings.reservation_table.none_selected
        },
        step3: {
          caption: '',
          form_open: false,
          data_available: false,
          none_caption: jckwds_vars.strings.reservation_table.none_selected
        },
        strings: {
          free: jckwds_vars.strings.reservation_table.free
        }
      },
      mounted: function () {
        this.page_loaded = true;
        this.timeslot_enabled = '1' === jckwds_vars.settings.timesettings_timesettings_setup_enable;
        this.remaining_label_threshold = parseInt(jckwds_vars.settings.reservations_reservations_remaining_label_threshold);

        // If address is already present in the session.
        if (jckwds_vars.shipping) {
          this.shipping_methods = jckwds_vars.shipping.shipping_methods;
          this.step1.caption = jckwds_vars.shipping.formatted_destination;
          this.selected_shipping_method = jckwds_vars.shipping.selected_shipping_method;
        }

        // If specific shipping method is provided as the shortcode argument, then use it.
        $parent = jQuery(this.$el).parent();
        if ($parent.data('shipping-method')) {
          this.shipping_method_provided_as_shortcode_arg = $parent.data('shipping-method');
          this.selected_shipping_method = $parent.data('shipping-method');
        }
        if (this.selected_shipping_method) {
          this.step3.form_open = true;
          this.selected_date = jckwds_vars?.reserved_slot?.date?.id ? jckwds_vars.reserved_slot.date.id : '';
          Vue.nextTick(() => {
            // If slot has been reserved then use that date and slot.
            if (jckwds_vars.reserved_slot.id) {
              this.selected_slot = jckwds_vars.reserved_slot.id;
              this.fetch_dates(this.selected_date, false);
            } else {
              this.fetch_dates();
            }
            this.step3.caption = jckwds_vars.reserved_slot.string;
          });
        }
      },
      methods: {
        /**
         * Open the given form.
         * @param int step Step number.
         */
        open_form: function (step) {
          var step_obj = this['step' + step];
          step_obj.form_open = !step_obj.form_open;
          if (3 === step && 0 === this.available_dates.length) {
            this.fetch_dates();
          }
          if (step_obj.form_open) {
            EventBus.$emit('open_step', step);
          }
        },
        /**
         * Get text of the button.
         *
         * @param int step Step number.
         *
         * @returns string.
         */
        btn_text: function (step) {
          var step_obj = this['step' + step];
          if (step_obj.form_open) {
            return window.jckwds_vars.strings.reservation_table.cancel;
          } else if ('' === step_obj.caption) {
            return window.jckwds_vars.strings.reservation_table.add;
          } else {
            return window.jckwds_vars.strings.reservation_table.edit;
          }
        },
        /**
         * Does this step needs a grey background?
         * 
         * @param int step Step number.
         * @returns 
         */
        has_grey_bg: function (step) {
          var step_obj = this['step' + step];
          return !step_obj.form_open && '' === step_obj.caption;
        },
        /**
         * Fetch shipping methods.
         */
        fetch_shipping_methods: function () {
          var data = {
            action: 'iconic_wds_get_address_shipping_methods',
            calc_shipping_country: this.address.country,
            calc_shipping_state: this.address.state,
            calc_shipping_city: this.address.city,
            calc_shipping_postcode: this.address.postcode,
            nonce: window.jckwds_vars.ajax_nonce
          };
          var self = this;
          self.block();
          jQuery.post(window.jckwds_vars.ajax_url, data, function (response) {
            if (!response.success) {
              alert(jckwds_vars.strings.reservation_table.no_shiping_methods);
              return;
            }
            self.open_step(2);
            self.shipping_methods = response.data.shipping_methods;
            self.step1.caption = response.data.formatted_destination;

            // unset shipping method, dates, timeslots.
            self.selected_shipping_method = '';
            self.available_dates = [];
            self.available_timeslots = {};
            if (response.data.new_nonce) {
              window.jckwds_vars.ajax_nonce = response.data.new_nonce;
            }
            var shipping_method_keys = Object.keys(self.shipping_methods);
            if (1 === shipping_method_keys.length) {
              self.selected_shipping_method = shipping_method_keys[0];
              Vue.nextTick(() => {
                self.fetch_dates();
              });
            }
          }).always(function () {
            self.unblock();
          });
        },
        /**
         * Handle click on the step2 button (fetch dates).
         */
        handle_fetch_dates_button_click: function () {
          this.available_dates = [];
          // this.selected_date = null;
          this.available_timeslots = {};
          this.selected_date_timeslots = [];
          this.fetch_dates(null, true, true);
        },
        /**
         * Fetch dates and timeslots.
         * We fetch all available dates but we use lazy approach to fetch time slots.
         * We would fetch timeslots for next 10 days when user clicks on a date.
         * 
         * @param string date_ymd (optional)   Fetch timeslots for this date and next 10. If not provided, the current date will be used.
         * @param bool   open_step3 (optional) Open step3 after fetching dates. Default: true.
         * @param bool   scroll_to_step3 (optional) Scroll to step3 after fetching dates. Default: false.
         */
        fetch_dates: function (date_ymd, open_step3, scroll_to_step3) {
          var data = {
            action: 'iconic_wds_get_reservation_table_data',
            shipping_method: this.selected_shipping_method,
            nonce: window.jckwds_vars.ajax_nonce
          };
          if ('string' === typeof date_ymd) {
            data.ymd = date_ymd;
          }
          if ('undefined' === typeof open_step3) {
            open_step3 = true;
          }
          var self = this;
          self.block();
          jQuery.post(window.jckwds_vars.ajax_url, data, function (response) {
            if (!response.success) {
              return;
            }
            self.available_dates = response.data.dates;
            if (false === response.data.datetime_required_for_selected_method) {
              self.step3.caption = response.data.message;
              self.step3.form_open = false;
              self.step2.form_open = false;
              self.datetime_required_for_selected_method = false;
              return;
            }
            self.datetime_required_for_selected_method = true;
            if (!self.available_dates || 0 === self.available_dates.length) {
              alert(response.data.message);
              return;
            } else {
              if (open_step3) {
                self.open_step(3);
              } else {
                // Close all steps.
                self.open_step(-1);
              }
            }
            for (var ymd in response.data.timeslots) {
              self.$set(self.available_timeslots, ymd, response.data.timeslots[ymd]);
            }
            if ('string' === typeof date_ymd) {
              self.selected_date_timeslots = self.available_timeslots[self.selected_date];
            }
            self.shipping_method_type = response.data.shipping_method_type;
            if (self.selected_date && self.available_timeslots[self.selected_date]) {
              self.selected_date_timeslots = self.available_timeslots[self.selected_date];
            }
            if (scroll_to_step3) {
              Vue.nextTick(function () {
                jQuery("html, body").animate({
                  scrollTop: jQuery(".wds-reservation-table__step--datetime").offset().top - 50
                }, 600);
              });
            }
            jQuery(document.body).trigger('iconic_wds_reservation_table_dates_fetched', [date_ymd, open_step3]);
          }).always(function () {
            self.unblock();
          });
        },
        /**
         * Select a date.
         * 
         * @param obj date Date.
         */
        handle_select_date: function (date) {
          if ('undefined' === typeof this.available_timeslots[date.ymd]) {
            this.fetch_dates(date.ymd);
          }
          this.selected_slot = null;
          this.selected_date_timeslots = this.available_timeslots[date.ymd];
          this.selected_date = date.ymd;
        },
        /**
         * Mark the given slot as selected.
         *
         * @param {obj} timeslot Timeslot.
         */
        select_slot: function (timeslot) {
          if (timeslot.slots_available_count > 0) {
            this.selected_slot = timeslot.slot_id;
          }
        },
        /**
         * Reserve Slots.
         */
        reserve_slot: function () {
          // Send an ajax request to reserve the slot.
          var data = {
            action: 'iconic_wds_reserve_slot',
            nonce: window.jckwds_vars.ajax_nonce,
            timeslot_enabled: this.timeslot_enabled,
            slot_id: this.timeslot_enabled ? this.selected_timeslot_obj.slot_id : '',
            slot_start_time: this.timeslot_enabled ? this.selected_timeslot_obj.timefrom.stripped : '',
            slot_end_time: this.timeslot_enabled ? this.selected_timeslot_obj.timeto.stripped : '',
            slot_date: this.selected_date
          };
          var self = this;
          self.block();
          jQuery.post(window.jckwds_vars.ajax_url, data, function (response) {
            self.unblock();
            if (!response.success) {
              if (response.data.message) {
                alert(response.data.message);
              }
              return;
            }
            jQuery(document.body).trigger('iconic_wds_reservation_added', response);
            jQuery("html, body").animate({
              scrollTop: jQuery(".wds-reservation-table-wrapper").offset().top - 50
            }, 600);

            // Redirect to the next page if specified in the settings.
            if (jckwds_vars.settings.reservations_reservations_redirect_url) {
              window.location.href = jckwds_vars.settings.reservations_reservations_redirect_url;
            }
            self.step3.form_open = false;
          }).fail(function () {
            alert(window.jckwds_vars.strings.reservation_table.cant_book_slot);
            self.unblock();
          });
        },
        /**
         * Update local scope when address is changed in the child componend.
         * 
         * @param Obj data Data.
         */
        handle_address_changed: function (data) {
          this.address.country = data.country;
          this.address.state = data.state;
          this.address.city = data.city;
          this.address.postcode = data.postcode;
        },
        /**
         * Is earliest timeslot.
         *
         * @param int timeslot_index Index of the selected_date_timeslots array.
         * @returns bool
         */
        is_earliest_slot: function (timeslot_index) {
          // Find date index.
          var date_index = this.available_dates.findIndex(date => {
            return date.ymd === this.selected_date;
          });
          return 0 === timeslot_index && 0 === date_index;
        },
        /**
         * Block.
         */
        block: function () {
          jQuery("#wds-reservation-table").block({
            message: null,
            overlayCSS: {
              opacity: 0.6
            }
          });
        },
        /**
         * Unblock.
         */
        unblock: function () {
          jQuery("#wds-reservation-table").unblock();
        },
        /**
         * Open the given step, close others.
         *
         * @param int step Step.
         */
        open_step: function (step) {
          for (var i = 1; i <= 3; i++) {
            if (i == step) {
              this['step' + i].form_open = true;
            } else {
              this['step' + i].form_open = false;
            }
          }
        },
        /**
         * Decode entities.
         * @param {string} input_str Input string.
         *
         * @returns {string} Decoded string.
         */
        decode_entities: function (html) {
          if (window.wp && window.wp.htmlEntities) {
            return window.wp.htmlEntities.decodeEntities(html);
          }
          return html;
        }
      },
      watch: {
        selected_shipping_method: function () {
          this.step2.caption = this.shipping_methods[this.selected_shipping_method] ? this.shipping_methods[this.selected_shipping_method].label : false;
        }
      },
      computed: {
        selected_date_obj: function () {
          return this.available_dates && this.available_dates.find(date => date.ymd === this.selected_date);
        },
        selected_timeslot_obj: function () {
          return this.available_timeslots[this.selected_date] && this.available_timeslots[this.selected_date].find(timeslot => timeslot.slot_id === this.selected_slot);
        },
        /**
         * We want to watch selected_date_obj and selected_timeslot_obj,
         * and update step3.caption when any of these 2 change.
         */
        selected_slot_formatted: function () {
          var formatted_slot;
          if (this.timeslot_enabled) {
            formatted_slot = this.selected_date_obj && this.selected_timeslot_obj ? this.selected_date_obj.formatted + ' @ ' + this.selected_timeslot_obj.formatted : '';
          } else {
            formatted_slot = this.selected_date_obj ? this.selected_date_obj.formatted : '';
          }
          if (this.datetime_required_for_selected_method) {
            this.step3.caption = formatted_slot;
          }
          return formatted_slot;
        },
        step3_button_text: function () {
          var text = jckwds_vars.strings.reservation_table.reserve;
          if (this.selected_slot_formatted) {
            text = text + " - " + this.selected_slot_formatted;
          }
          return text;
        },
        total_fees: function () {
          var day_fee = this.selected_date_obj && this.selected_date_obj.fee ? parseFloat(this.selected_date_obj.fee) : 0;
          var time_fee = this.selected_timeslot_obj && this.selected_timeslot_obj.fee.value ? parseFloat(this.selected_timeslot_obj.fee.value) : 0;
          return day_fee + time_fee;
        },
        total_fees_formatted: function () {
          var fees = this.total_fees;
          if (!fees) {
            return '';
          }
          var fee_formatted = accounting.formatMoney(fees, jckwds_vars.currency);
          return fee_formatted;
        }
      }
    });
  }

  /**
   * Address component.
   */
  Vue.component('wds-address', {
    name: 'wds-address',
    data: function () {
      return {
        button_clicked: false,
        available_countries: [],
        locale: {},
        states: {},
        fields: {
          country: '',
          state: '',
          postcode: '',
          city: ''
        },
        validation: {
          country: true,
          state: true,
          postcode: true,
          city: true
        },
        strings: {},
        locale_default: {}
      };
    },
    mounted: function () {
      // String.
      this.strings.select_country = window.jckwds_vars.strings.reservation_table.select_country;
      this.strings.select_state = window.jckwds_vars.strings.reservation_table.select_state;
      this.strings.continue = window.jckwds_vars.strings.reservation_table.continue;

      // Get the locale data.
      this.available_countries = jckwds_vars.available_countries;
      var locale_json = window.wc_address_i18n_params.locale.replace(/&quot;/g, '"');
      this.locale = JSON.parse(locale_json);
      var states_json = window.wc_country_select_params.countries.replace(/&quot;/g, '"');
      this.states = JSON.parse(states_json);
      this.locale_default = jckwds_vars.locale_default;

      // Get address from session.
      this.fields.country = jckwds_vars.address.country;
      this.fields.state = jckwds_vars.address.state;
      this.fields.city = jckwds_vars.address.city;
      this.fields.postcode = jckwds_vars.address.postcode;

      // Emit address_changed event.
      this.input_changed();
    },
    computed: {
      selected_locale: function () {
        return this.locale[this.fields.country];
      }
    },
    methods: {
      is_object_empty: function (obj) {
        return Object.keys(obj).length === 0;
      },
      is_postcode_visible: function () {
        var visible = this.selected_locale && this.selected_locale.postcode && this.selected_locale.postcode.hidden ? !this.selected_locale.postcode.hidden : true;
        return wp.hooks.applyFilters('iconic_wds_reservation_table_postcode_visible', 'iconic_wds', visible);
      },
      is_state_visible: function () {
        var visible = this.selected_locale && this.selected_locale.state && this.selected_locale.state.hidden ? !this.selected_locale.state.hidden : true;
        return wp.hooks.applyFilters('iconic_wds_reservation_table_state_visible', 'iconic_wds', visible);
      },
      is_city_visible: function () {
        var visible = this.selected_locale && this.selected_locale.city && this.selected_locale.city.hidden ? !this.selected_locale.city.hidden : true;
        return wp.hooks.applyFilters('iconic_wds_reservation_table_city_visible', 'iconic_wds', visible);
      },
      country_changed: function () {
        this.fields.state = '';
        this.fields.city = '';
        this.fields.postcode = '';
        this.input_changed();
      },
      input_changed: function () {
        this.$emit('address_changed', this.fields);
      },
      validate: function () {
        if (!this.button_clicked) {
          return;
        }
        this.validation.city = this.is_city_visible() ? this.fields.city ? true : false : true;
        this.validation.state = this.is_state_visible() ? this.fields.state ? true : false : true;
        this.validation.postcode = this.is_postcode_visible() ? this.fields.postcode ? true : false : true;
        return this.validation.city && this.validation.state && this.validation.postcode;
      },
      get_label: function (field) {
        if (!this.selected_locale && jQuery.isEmptyObject(this.locale_default)) {
          return false;
        }
        return this.selected_locale && this.selected_locale[field] && this.selected_locale[field].label ? this.selected_locale[field].label : this.locale_default[field].label;
      },
      handle_btn_click: function () {
        this.button_clicked = true;
        if (!this.validate()) {
          return;
        }
        this.$emit('button_clicked', this.fields);
      }
    },
    template: /* html */`
			<div class="wds-reservation-step-address" v-if="locale">
				<div class="wds-reservation-step-address__inner">
					<div class="wds-reservation-step-address__field" :class="{ 'wds-reservation-step-address__field--error': ! this.validation.country }">
						<label for="wds-reservation-table-address-country">Country</label>
						<select v-model='fields.country' @change="country_changed" id="wds-reservation-table-address-country" class="iconic-wds-dropdown">
							<option value="">{{strings.select_country}}</option>
							<option v-for="(name, code) in available_countries" :value="code" :key="code">{{name}}</option>
						</select>
					</div>
					<div class="wds-reservation-step-address__field" v-show="is_state_visible()"  :class="{ 'wds-reservation-step-address__field--error': ! this.validation.state }">
						<label for="wds-reservation-table-address-state">{{ get_label( 'state' )  }}</label>
						<input
							id="wds-reservation-table-address-state" 
							v-if="'undefined' === typeof states[fields.country]"
							type='text'
							v-model='fields.state'
							@change="validate(); input_changed();"
							>
						<select
							id="wds-reservation-table-address-state"
							class="iconic-wds-dropdown"
							v-if="states[fields.country] && ! is_object_empty( states[fields.country] )"
							v-model='fields.state'
							@change="validate(); input_changed();"
							>
							<option>{{strings.select_state}}</option>
							<option v-for="(state, state_key) in states[fields.country]" :value="state_key" :key="state_key">{{state}}</option>
						</select>
						<input v-if="states[fields.country] && is_object_empty( states[fields.country] )" type='text' @change="input_changed" placeholder="hidden" v-model='fields.state'>
					</div>
					<div class="wds-reservation-step-address__field" v-show="is_city_visible()" :class="{ 'wds-reservation-step-address__field--error': ! this.validation.city }">
						<label for="wds-reservation-table-address-city">{{ get_label( "city" ) }}</label>
						<input type='text' @keyup="validate()" id="wds-reservation-table-address-city"  v-model='fields.city' @change="input_changed">
					</div>
					<div class="wds-reservation-step-address__field" v-show="is_postcode_visible()"  :class="{ 'wds-reservation-step-address__field--error': ! this.validation.postcode }">
						<label for="wds-reservation-table-address-postcode">{{ get_label( "postcode" ) }}</label>
						<input type='text' @keyup="validate()" id="wds-reservation-table-address-postcode" v-model='fields.postcode' @change="input_changed">
					</div>

					</div>
				<button class="wds-reservation-table-button" @click="handle_btn_click">{{strings.continue}}</button>
			</div>
		`
  });

  /**
   * Date slider component.
   * 
   * It extends vue-concise-slider to add the features we need.
   * https://warpcgd.github.io/vue-concise-slider/
   */
  Vue.component('wds-reservation-date-slider', {
    name: 'wds-reservation-date-slider',
    components: {
      'slider': vueConciseSlider.slider,
      'slideritem': vueConciseSlider.slideritem
    },
    props: ['available_dates', 'initial_selected_date'],
    data: function () {
      return {
        wrapper_width: 0,
        selected_date: null,
        right_nav_disabled: false,
        left_nav_disabled: false,
        slide_styles: {
          '6': {
            width: '15%',
            'margin-right': '2%'
          },
          '4': {
            width: '23%',
            'margin-right': '2%'
          },
          '3': {
            width: '31%',
            'margin-right': '3%'
          }
        }
      };
    },
    mounted: function () {
      this.wrapper_width = jQuery('.wds-reservation-table-wrapper').width();
      this.selected_date = this.initial_selected_date;
      EventBus.$on('open_step', this.slide_to_selected_date);
    },
    methods: {
      /**
       * Select date.
       * @param obj date 
       */
      select_date: function (date) {
        this.selected_date = date.ymd;
        this.$emit('select_date', date);
      },
      /**
       * Slide Next.
       */
      slide_next: function () {
        if (this.right_nav_disabled) {
          return;
        }
        this.$refs.slider.$emit('slideNext');
      },
      /**
       * Slide Prev.
       */
      slide_prev: function () {
        if (this.left_nav_disabled) {
          return;
        }
        this.$refs.slider.$emit('slidePre');
      },
      /**
       * On slide event callback.
       *
       * @param obj data 
       */
      on_slide: function (data) {
        this.left_nav_disabled = 0 === data.currentPage;
        this.right_nav_disabled = data.currentPage >= this.available_dates.length - 6;
      },
      /**
       * Slide to the selected date.
       * @param {object} e event object.
       * @param {int} step step number.
       */
      slide_to_selected_date: function (step) {
        if (3 !== step) {
          return;
        }
        this.$nextTick(() => {
          var selected_date_index = this.available_dates.findIndex(date => {
            return date.ymd === this.selected_date;
          });
          if (selected_date_index <= this.carousel_per_page) {
            return;
          }
          var current_page = this.$refs.slider.data.currentPage;

          // Slide if the selected date is not in the current page.
          if (selected_date_index < current_page || selected_date_index >= current_page + this.carousel_per_page) {
            page = selected_date_index - this.carousel_per_page + 1;
            this.$refs.slider.$emit('slideTo', page);
          }
        });
      }
    },
    computed: {
      /**
       * The number of slides to show in the date carousel, based on the screensize.
       *
       * @returns int.
       */
      carousel_per_page: function () {
        if (this.wrapper_width > 500) {
          return 6;
        } else if (this.wrapper_width >= 400) {
          return 4;
        } else {
          return 3;
        }
      }
    },
    template: /* html */`
			<div class="wds-reservation-table-date-slider">
				<slider 
					:slides-to-scroll="carousel_per_page"
					:currentPage="0"
					ref="slider"
					@slide="on_slide"
					>
					<slideritem v-for="date in available_dates" :key="date.ymd" :style="slide_styles[carousel_per_page]">
						<div class="wds-reservation-table__select-date-date" @click='select_date( date )' :class="{ 'wds-reservation-table__select-date-date--selected': selected_date === date.ymd }" >
							<div class="wds-reservation-table__select-date-date-day">
								{{date.weekday}}
							</div>
							<div class="wds-reservation-table__select-date-date-formatted">
								{{date.header_formatted}}
							</div>
							<div class="wds-reservation-table__select-date-date-fee" v-html="date.fee_formatted"></div>
						</div>
					</slideritem>
				</slider>
				<span v-if="available_dates.length" @click="slide_prev" class='wds-reservation-table-date-slider__nav-next' :class="{ 'wds-reservation-table-date-slider__nav--disabled': left_nav_disabled }">&#xe900;</span>
				<span v-if="available_dates.length" @click="slide_next" class='wds-reservation-table-date-slider__nav-prev' :class="{ 'wds-reservation-table-date-slider__nav--disabled': right_nav_disabled }">&#xe902;</span>
			</div>
		`
  });
  init_reservation_table();
  jQuery(document.body).on('iconic_wds_init_reservation_table', init_reservation_table);
});
(function ($) {
  var iconic_wds_tooltip = {
    cache: function () {
      iconic_wds_tooltip.cache.vars = {
        tooltip: '.iconic-wds-tooltip',
        arrow: '.iconic-wds-tooltip__arrow',
        anchor: '.ui-datepicker .iconic-wds-date--tooltip'
      };
    },
    /**
     * On ready.
     */
    on_ready: function () {
      iconic_wds_tooltip.cache();

      // Add tooltip HTML if doesn't exist already.
      if (0 === $('.iconic-wds-tooltip').length) {
        $('body').append('<div class="iconic-wds-tooltip"><div class="iconic-wds-tooltip__inner_wrap"></div><div class="iconic-wds-tooltip__arrow"></div></div>');
        $('.iconic-wds-tooltip').hide();
        $('.iconic-wds-tooltip').addClass('iconic-wds-tooltip--theme-' + jckwds_vars.settings.datesettings_datesettings_setup_uitheme);
      }
      $(window).resize(iconic_wds_tooltip.on_resize);
      var debounced_mouseenter = iconic_wds_tooltip.debounce(iconic_wds_tooltip.handle_mouseenter, 200);
      var debounced_mouseleave = iconic_wds_tooltip.debounce(iconic_wds_tooltip.handle_mouseleave, 200);

      // Mobile needs different handling than desktop.
      if (jckwds_vars.is_mobile) {
        iconic_wds_tooltip.mobile_click_handler();
        $(window).scroll(iconic_wds_tooltip.handle_mouseleave);
        $(window).on('resize_threshold', iconic_wds_tooltip.handle_mouseleave);
      } else {
        $(document.body).on('mouseenter', iconic_wds_tooltip.cache.vars.anchor, debounced_mouseenter);
        $(document.body).on('mouseleave', iconic_wds_tooltip.cache.vars.anchor, debounced_mouseleave);
        $(window).scroll(iconic_wds_tooltip.handle_mouseleave).resize(iconic_wds_tooltip.handle_mouseleave);
      }
    },
    /**
     * Handle mouseenter.
     */
    handle_mouseenter: function () {
      // Determine the coordinates of element and place the tooltip accordingly.
      var text = $(this).attr('aria-label'),
        $tooltip = $(iconic_wds_tooltip.cache.vars.tooltip);
      if (!text) {
        return;
      }

      // Update the text before calculation for accuracy.
      $tooltip.find(".iconic-wds-tooltip__inner_wrap").html(text);
      $tooltip.css({
        'left': '',
        'right': ''
      });
      var $arrow = $tooltip.find(iconic_wds_tooltip.cache.vars.arrow),
        tooltip_width = $tooltip.outerWidth(true),
        rect = $(this).get(0).getBoundingClientRect(),
        a_center_point_x = rect.left + rect.width / 2,
        tootltip_left = a_center_point_x - tooltip_width / 2;
      tootltip_left = tootltip_left < 0 ? 0 : tootltip_left;
      var window_width = $(window).width();

      // If we're off the right side of the screen, use right offset instead.
      if (tooltip_width + tootltip_left > window_width) {
        $tooltip.css({
          'left': '',
          'right': 0
        });
      } else {
        $tooltip.css({
          'left': tootltip_left,
          'right': ''
        });
      }
      var tooltip_height = $tooltip.outerHeight(true),
        tooltip_top = rect.top - tooltip_height;
      $tooltip.css('top', tooltip_top).show().addClass('iconic-wds-tooltip--animate-opacity iconic-wds-tooltip--animate-top iconic-wds-tooltip--active');
      var tooltip_offset = $tooltip.offset();
      $arrow.css('left', a_center_point_x - tooltip_offset.left);
    },
    /**
     * Handle mouseleve.
     */
    handle_mouseleave: function () {
      $(iconic_wds_tooltip.cache.vars.tooltip).removeClass('iconic-wds-tooltip--animate-top iconic-wds-tooltip--animate-opacity iconic-wds-tooltip--active');
    },
    /**
     * Click behaviour is slightly different for mobile.
     * We will "show" the preview on tap/click event instead of hover.
     * And "hide" the preview when clicked outside.
     */
    mobile_click_handler: function () {
      document.addEventListener('click', function (event) {
        var targets = document.querySelectorAll(iconic_wds_tooltip.cache.vars.anchor);
        var composedPath = event.composedPath();
        var target_clicked = false;

        // Determine which swatch was clicked.
        for (var target_idx in targets) {
          var target = targets[target_idx];
          if (composedPath.includes(target)) {
            target_clicked = target;
            break;
          }
        }
        if (!target_clicked) {
          // if target_clicked is empty then user clicked outside of a swatch
          // trigger a mouseleave event.
          iconic_wds_tooltip.handle_mouseleave();
        } else {
          // Clicked on a target. Call handle_mouseenter and pass the target element
          // which was clicked as `this`.
          iconic_wds_tooltip.handle_mouseenter.call(target_clicked);
        }
      });
    },
    /**
     * Run function only once in the certain period.
     *
     * @param function func      function to call
     * @param int      wait      Time interval.
     * @param bool     immediate Immediate.
     */
    debounce: function (func, wait, immediate) {
      var timeout;
      return function () {
        var context = this,
          args = arguments;
        var later = function () {
          timeout = null;
          if (!immediate) {
            func.apply(context, args);
          }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
          func.apply(context, args);
        }
      };
    },
    /**
      * Remove Title attribute, to avoid showing both tooltip and default HTML title.
      */
    remove_title_attribute: function (e, inst) {
      // Add a delay.
      window.setTimeout(function () {
        var date_cell = $('.iconic-wds-datepicker .iconic-wds-date');
        date_cell.each(function () {
          // Remove 'title' attribute and add 'aria-label'.
          var title = $(this).attr('title');
          $(this).removeAttr('title');
          $(this).attr('aria-label', title);
        });
      }, 100);
    }
  };
  $(document.body).on('iconic_wds_datepicker_before_show iconic_wds_datepicker_on_change_month_year', iconic_wds_tooltip.remove_title_attribute);
  $(document.body).on('iconic_wds_init_tooltip', iconic_wds_tooltip.on_ready);
})(jQuery);