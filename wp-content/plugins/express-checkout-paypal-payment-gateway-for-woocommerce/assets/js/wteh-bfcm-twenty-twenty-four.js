(function ($) {
    'use strict';
    $(function () {
        var wteh_bfcm_twenty_twenty_four_banner = {
            init: function () { 
                var data_obj = {
                    _wpnonce: wteh_bfcm_twenty_twenty_four_banner_js_params.nonce,
                    action: wteh_bfcm_twenty_twenty_four_banner_js_params.action,
                    wteh_bfcm_twenty_twenty_four_banner_action_type: '',
                };
                $(document).on('click', 'weht-bfcm-banner-2024 .bfcm_cta_button', function (e) { 
                    e.preventDefault(); 
                    var elm = $(this);
                    window.open(wteh_bfcm_twenty_twenty_four_banner_js_params.cta_link, '_blank'); 
                    elm.parents('.wteh-bfcm-banner-2024').hide();
                    data_obj['wteh_bfcm_twenty_twenty_four_banner_action_type'] = 3; // Clicked the button.
                    
                    $.ajax({
                        url: wteh_bfcm_twenty_twenty_four_banner_js_params.ajax_url,
                        data: data_obj,
                        type: 'POST'
                    });
                }).on('click', '.wteh-bfcm-banner-2024 .notice-dismiss', function(e) {
                    e.preventDefault();
                    data_obj['wteh_bfcm_twenty_twenty_four_banner_action_type'] = 2; // Closed by user
                    
                    $.ajax({
                        url: wteh_bfcm_twenty_twenty_four_banner_js_params.ajax_url,
                        data: data_obj,
                        type: 'POST',
                    });
                });
            }
        };
        wteh_bfcm_twenty_twenty_four_banner.init();
    });
})(jQuery);