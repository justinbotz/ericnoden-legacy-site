jQuery(document).ready(function ($) {
	$(document).on(
		"click",
		".woocommerce-MyAccount-navigation-link a",
		function (e) {
			e.preventDefault();

			const $link = $(this);
			const href = $link.attr("href");
			let endpoint = "";

			if ( $link.closest('.tgwc-link').length ) {
				window.open(href, '_blank');
			}

			if (href.includes(myaccountMenuNav.account_url)) {
				endpoint = href
					.replace(myaccountMenuNav.account_url, "")
					.replace(/\/$/, "");
			}

			if (!endpoint) {
				endpoint = "dashboard";
			}

			loadAccountContent(endpoint);
		}
	);

	// Function to load content via AJAX
	function loadAccountContent(endpoint) {
		$.ajax({
			url: myaccountMenuNav.ajax_url,
			type: "POST",
			data: {
				action: "woocommerce_myaccount_menu_nav",
				endpoint: endpoint,
				security: myaccountMenuNav.nonce,
			},
			beforeSend: function () {
				$(".woocommerce-MyAccount-content")
					.addClass("loading")
					.html(
						'<div class="account-loading"><div class="spinner"></div></div>'
					);
			},
			success: function (response) {
				if (response.success) {
					if (response.data.redirect_url) {
						console.log(response.data.redirect_url);

						window.location.href = response.data.redirect_url;
					}
					$(".woocommerce-MyAccount-content")
						.removeClass("loading")
						.html(response.data.content);

					 // Enhanced title update logic
					updatePageTitle(response.data.title);

					updateActiveMenuItem(response.data.active_endpoint);

					updateBrowserUrl(response.data.active_endpoint);
				}
			},
			error: function (error) {
				console.error("AJAX Error:", error);
				// Fallback to regular navigation
				window.location.href = $link.attr("href");
			},
		});
	}

	function updatePageTitle(newTitle) {
		const selectors = [
			'.entry-title',
			'h1.page-title',
			'.page-header h1',
			'article h1',
			'#main h1',
			'.post-title',
			'.wp-block-post-title'
		];

		for (const selector of selectors) {
			const titleElement = $(selector).first();
			if (titleElement.length) {
				titleElement.text(newTitle);
				return;
			}
		}

		$('.woocommerce-MyAccount-content h1').first().text(newTitle);
	}

	// Update active menu item
	function updateActiveMenuItem(endpoint) {
		$(".woocommerce-MyAccount-navigation-link").removeClass("is-active");

		if (endpoint === "dashboard") {
			$(".woocommerce-MyAccount-navigation-link--dashboard").addClass(
				"is-active"
			);
		} else {
			$(`.woocommerce-MyAccount-navigation-link--${endpoint}`).addClass(
				"is-active"
			);
		}
	}

	// Update browser URL without reload
	function updateBrowserUrl(endpoint) {
		let newUrl = myaccountMenuNav.account_url;

		if (endpoint !== "dashboard") {
			newUrl += endpoint + "/";
		}

		history.pushState(null, null, newUrl);
	}

	window.addEventListener("popstate", function () {
		const path = window.location.pathname;
		let endpoint = path.replace(/.*my-account\//, "").replace(/\//g, "");

		if (!endpoint) {
			endpoint = "dashboard";
		}

		loadAccountContent(endpoint);
	});

	if (window.location.pathname.includes("my-account")) {
		const initialEndpoint =
			window.location.pathname
				.replace(/.*my-account\//, "")
				.replace(/\//g, "") || "dashboard";

		// updateActiveMenuItem(initialEndpoint);
	}
});
