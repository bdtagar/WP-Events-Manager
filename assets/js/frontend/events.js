( function ( $ ) {

	var Event_Auth = {
		init: function () {
			var $doc = $( document );
			/**
			 * load register form
			 */
			$doc.on( 'click', '.event-load-booking-form', this.load_form_register );
			$doc.on( 'submit', 'form.event_register:not(.active)', this.book_event_form );

			/**
			 * Sanitize form field
			 */
			this.sanitize_form_field();

			$doc.on( 'submit', '#event-lightbox .event-auth-form', this.ajax_login );
		},
		load_form_register: function ( e ) {
			e.preventDefault();
			var _this = $( this ),
				_event_id = _this.attr( 'data-event' );

			$.ajax( {
				url: TP_Event.ajaxurl,
				type: 'POST',
				dataType: 'html',
				async: false,
				data: {
					event_id: _event_id,
					nonce: TP_Event.register_button,
					action: 'load_form_register'
				},
				beforeSend: function () {
					_this.append( '<i class="event-icon-spinner2 spinner"></i>' );
				}
			} )
				.always( function () {
					_this.find( '.event-icon-spinner2' ).remove();
				} )
				.done( function ( html ) {
					Event_Auth.lightbox( html );
				} )
				.fail( function () {

				} );
			return false;
		},
		/**
		 * Ajax action register form
		 * @returns boolean
		 */
		book_event_form: function ( e ) {
			e.preventDefault();
			var _self = $( this ),
				_data = _self.serializeArray(),
				button = _self.find( 'button[type="submit"]' ),
				_notices = _self.find( '.tp-event-notice' );

			$.ajax( {
				url: TP_Event.ajaxurl,
				type: 'POST',
				data: _data,
				dataType: 'json',
				beforeSend: function () {
					_notices.slideUp().remove();
					button.addClass( 'event-register-loading' );
					_self.addClass( 'active' );
				}
			} ).done( function ( res ) {
				button.removeClass( 'event-register-loading' );
				if ( typeof res.status === 'undefined' ) {
					Event_Auth.set_message( _self, TP_Event.something_wrong );
					return;
				}

				if ( res.status === true && typeof res.url !== 'undefined' ) {
					window.location.href = res.url;
				}

				if ( typeof res.message !== 'undefined' ) {
					Event_Auth.set_message( _self, res.message );
					return;
				}

			} ).fail( function () {
				button.removeClass( 'event-register-loading' );
				Event_Auth.set_message( _self, TP_Event.something_wrong );
				return;
			} ).always(function(){
				_self.removeClass( 'active' );
			});
			// button.removeClass('event-register-loading');
			return false;
		},
		set_message: function ( form, message ) {
			var html = '<ul class="tp-event-notice error">';
			html += '<li class="event_auth_register_message_error">' + message + '</li>';
			html += '</ul>';
			form.find( '.event_register_foot' ).after( html );
		},
		/**
		 * sanitize form field
		 * @returns null
		 */
		sanitize_form_field: function () {
			var _form_fields = $( '.form-row.form-required' );

			for ( var i = 0; i < _form_fields.length; i++ ) {
				var field = $( _form_fields[i] ),
					input = field.find( 'input' );

				input.on( 'blur', function ( e ) {
					e.preventDefault();
					var _this = $( this ),
						_form_row = _this.parents( '.form-row:first' );
					if ( !_form_row.hasClass( 'form-required' ) ) return;

					if ( _this.val() == '' ) {
						_form_row.removeClass( 'validated' ).addClass( 'has-error' );
					} else {
						_form_row.removeClass( 'has-error' ).addClass( 'validated' );
					}
				} );
			}
		},
		lightbox: function ( content ) {
			var html = [ ];
			html.push( '<div id="event-lightbox">' );
			html.push( content );
			html.push( '</div>' );

			$.magnificPopup.open( {
				items: {
					type: 'inline',
					src: $( html.join( '' ) )
				},
				mainClass: 'event-lightbox-wrap',
				callbacks: {
					open: function () {
						var lightbox = $( '#event-lightbox' );

						lightbox.addClass( 'event-fade' );
						var timeout = setTimeout( function () {
							lightbox.addClass( 'event-in' );
							clearTimeout( timeout );
							Event_Auth.sanitize_form_field();
						}, 100 );
					},
					close: function () {
						var lightbox = $( '#event-lightbox' );
						lightbox.remove();
					}
				}
			} );
		},
		ajax_login: function ( e ) {
			e.preventDefault();

			var _this = $( this ),
				_button = _this.find( '#wp-submit' ),
				_lightbox = $( '#event-lightbox' ),
				_data = _this.serializeArray();

			$.ajax( {
				url: TP_Event.ajaxurl,
				type: 'POST',
				data: _data,
				async: false,
				beforeSend: function () {
//                    setTimeout( function(){
					_lightbox.find( '.tp-event-notice' ).slideUp().remove();
//                    } );
					_button.addClass( 'event-register-loading' );
				}
			} ).always( function () {
				_button.find( '.event-icon-spinner2' ).remove();
			} ).done( function ( res ) {
				if ( typeof res.notices !== 'undefined' ) {
					_this.before( res.notices );
				}

				if ( typeof res.status !== 'undefined' && res.status === true ) {
					if ( typeof res.redirect !== 'undefined' && res.redirect ) {
						window.location.href = res.redirect;
					} else {
						window.location.reload();
					}
				}
			} ).fail( function ( jqXHR, textStatus, errorThrown ) {
				var html = '<ul class="tp-event-notice error">';
				html += '<li>' + jqXHR + '</li>';
				html += '</ul>';
				_this.before( res.notices );
			} );

			return false;
		}
	};

    $( document ).ready( function () {

		Event_Auth.init();

        // countdown each
        var counts = $( '.tp_event_counter' );
        for ( var i = 0; i < counts.length; i++ ) {
            var time = $( counts[i] ).attr( 'data-time' );
            time = new Date( time );

            $( counts[i] ).countdown( {
                labels: TP_Event.l18n.labels,
                labels1: TP_Event.l18n.label1,
                until: time,
                serverSync: TP_Event.current_time
            } );
        }

        // owl-carausel
        var carousels = $( '.tp_event_owl_carousel' );
        for ( var i = 0; i < carousels.length; i++ ) {
            var data = $( carousels[i] ).attr( 'data-countdown' );
            var options = {
                navigation: true, // Show next and prev buttons
                slideSpeed: 300,
                paginationSpeed: 400,
                singleItem: true
            };
            if ( typeof data !== 'undefined' ) {
                data = JSON.parse( data );
                $.extend( options, data );

                $.each( options, function ( k, v ) {
                    if ( v === 'true' ){
                        options[k] = true;
                    } else if ( v === 'false' ) {
                        options[k] = false;
                    }
                } );
            }

            if ( typeof options.slide === 'undefined' || options.slide === true ) {
                $( carousels[i] ).owlCarousel( options );
            } else {
                $( carousels[i] ).removeClass( 'owl-carousel' );
            }
        }
    } );

} )( jQuery );