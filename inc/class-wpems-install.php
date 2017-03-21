<?php

if ( !defined( 'ABSPATH' ) ) {
	exit;
}

class WPEMS_Install {

	/**
	 * upgrade store
	 * @var type null || array
	 */
	public static $db_upgrade = null;

	/**
	 * Init
	 */
	public static function init() {
		self::$db_upgrade = array(
			'2.0' => WPEMS_INC . 'admin/upgrades/upgrade-2.0.php'
		);
	}

	/**
	 * register_activation_hook callback
	 */
	public static function install() {
		if ( !defined( 'WPEMS_INSTALLING' ) ) {
			define( 'WPEMS_INSTALLING', true );
			if ( !function_exists( 'get_plugin_data' ) ) {
				require_once ABSPATH . '/wp-admin/includes/plugin.php';
			}

			$active_plugins = get_option( 'active_plugins', true );
			if ( ( $key = array_search( 'tp-event-auth/tp-event-auth.php', $active_plugins ) ) !== false ) {
				unset( $active_plugins[$key] );
			}
			update_option( 'active_plugins', $active_plugins );

			/**
			 * Update options
			 */
			if ( !get_option( 'thimpress-event-version' ) ) {

				$prefix   = 'thimpress_events';
				$settings = get_option( $prefix );
				if ( $settings ) {
					foreach ( $settings as $name => $value ) {
						if ( is_array( $value ) ) {
							foreach ( $value as $n => $v ) {
								if ( $name === 'email' ) {
									if ( $n != 'email_subject' ) {
										update_option( $prefix . '_' . $name . '_' . $n, $v );
									} else {
										update_option( $prefix . '_' . $n, $v );
									}
								} else if ( $name === 'checkout' ) {
									if ( $n == 'paypal_sanbox_email' ) {
										update_option( $prefix . '_paypal_sanbox_email', $v );
									}
									if ( $n == 'paypal_email' ) {
										update_option( $prefix . '_paypal_email', $v );
									}
									if ( $n == 'paypal_enable' ) {
										update_option( $prefix . '_paypal_enable', $v );
									}
									update_option( $prefix . '_' . $name . '_' . $n, $v );
								} else {
									update_option( $prefix . '_' . $n, $v );
								}

							}
						}
					}
				}
			}
		}
		/**
		 * Upgrade options
		 */
		self::upgrade_database();
		/**
		 * Add new roles
		 */
		WPEMS_Roles::add_roles();
		/**
		 * Add new caps
		 */
		WPEMS_Roles::add_caps();
		/**
		 * Create Pages
		 */
		self::create_pages();
		/**
		 * Update current version
		 */
		update_option( 'thimpress-event-version', WPEMS_VER );
	}

	/**
	 * register_deactivation_hook callback
	 */
	public static function uninstall() {
		/**
		 * Remove Caps and Roles
		 */
		WPEMS_Roles::remove_roles();
	}


	/**
	 * Create pages
	 */
	public static function create_pages() {
		$pages = array(
			'register'        => array(
				'name'    => _x( 'user-register', 'Page slug', 'wp-events-manager' ),
				'title'   => _x( 'User Register', 'Page title', 'wp-events-manager' ),
				'content' => '[' . apply_filters( 'tp_event_register_shortcode_tag', 'tp_event_register' ) . ']'
			),
			'login'           => array(
				'name'    => _x( 'user-login', 'Page slug', 'wp-events-manager' ),
				'title'   => _x( 'User Login', 'Page title', 'wp-events-manager' ),
				'content' => '[' . apply_filters( 'tp_event_login_shortcode_tag', 'tp_event_login' ) . ']'
			),
			'forgot_password' => array(
				'name'    => _x( 'forgot-password', 'Page slug', 'wp-events-manager' ),
				'title'   => _x( 'Forgot Password', 'Page title', 'wp-events-manager' ),
				'content' => '[' . apply_filters( 'tp_event_forgot_password_shortcode_tag', 'tp_event_forgot_password' ) . ']'
			),
			'reset_password'  => array(
				'name'    => _x( 'reset-password', 'Page slug', 'wp-events-manager' ),
				'title'   => _x( 'Reset Password', 'Page title', 'wp-events-manager' ),
				'content' => '[' . apply_filters( 'tp_event_reset_password_shortcode_tag', 'tp_event_reset_password' ) . ']'
			),
			'account'         => array(
				'name'    => _x( 'user-account', 'Page slug', 'wp-events-manager' ),
				'title'   => _x( 'User Account', 'Page title', 'wp-events-manager' ),
				'content' => '[' . apply_filters( 'tp_event_account_shortcode_tag', 'tp_event_account' ) . ']'
			),
		);
		foreach ( $pages as $name => $page ) {
			wpems_create_page( esc_sql( $page['name'] ), $name . '_page_id', $page['title'], $page['content'], !empty( $page['parent'] ) ? tp_event_get_page_id( $page['parent'] ) : '' );
		}
	}

	/**
	 * Upgrade Database
	 */
	public static function upgrade_database() {
		$old_version = get_option( 'thimpress-event-version' );
		foreach ( self::$db_upgrade as $ver => $file ) {
			if ( !$old_version || version_compare( $old_version, $ver, '<' ) ) {
				require_once $file;
			}
		}
	}

}

WPEMS_Install::init();

// active plugin
register_activation_hook( WPEMS_MAIN_FILE, array( 'WPEMS_Install', 'install' ) );
register_deactivation_hook( WPEMS_MAIN_FILE, array( 'WPEMS_Install', 'uninstall' ) );