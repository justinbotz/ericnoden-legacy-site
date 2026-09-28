/**
 * Checkout Persistence Form Data
 *
 * @package Astra Addon
 * @since 1.1.0
 */

jQuery( function ( $ ) {
	const storageKey = 'ast_checkout_form';
	const checkoutForm = $( 'form.woocommerce-checkout' );

	const isLocalStorageAvailable = () => {
		const testKey = 'test';

		try {
			localStorage.setItem( testKey, testKey );
			localStorage.removeItem( testKey );

			return true;
		} catch ( e ) {
			return false;
		}
	};

	if ( ! isLocalStorageAvailable() ) {
		return;
	}

	const astFormData = {
		/**
		 * Stores the checkout form data in local storage.
		 */
		set() {
			const checkoutData = [];

			localStorage.removeItem( storageKey );

			checkoutForm.find( 'input[type="text"], select' ).each( function () {
				if ( ! this.name ) {
					return;
				}

				checkoutData.push( {
					name: this.name,
					value: this.value,
				} );
			} );

			localStorage.setItem( storageKey, JSON.stringify( checkoutData ) );
		},

		/**
		 * Restores the checkout form data from local storage.
		 */
		get() {
			const storedData = localStorage.getItem( storageKey );

			if ( storedData === null ) {
				return;
			}

			let checkoutData;

			try {
				checkoutData = JSON.parse( storedData );
			} catch ( e ) {
				checkoutData = null;
			}

			if ( ! Array.isArray( checkoutData ) ) {
				localStorage.removeItem( storageKey );
				return;
			}

			for ( const field of checkoutData ) {
				if ( ! field || ! field.name ) {
					continue;
				}

				try {
					checkoutForm.find( `[name="${ field.name }"]` ).val( field.value );
				} catch ( e ) {
					// A malformed field name must not stop restoring the remaining fields.
				}
			}
		},
	};

	astFormData.get();

	checkoutForm.on( 'change', 'input, select', astFormData.set );
} );
