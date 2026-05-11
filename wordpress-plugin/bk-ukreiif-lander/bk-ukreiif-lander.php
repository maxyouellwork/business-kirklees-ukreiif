<?php
/**
 * Plugin Name: Business Kirklees — UKREiiF Lander
 * Description: Serves the "Invest in Kirklees" landing page at /ukreiif using a self-contained static HTML file. Used by Kirklees Council delegates at UKREiiF 2026 (19–21 May).
 * Version: 1.0.1
 * Author: Kirklees Council Comms — Max Youell
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Add rewrite rule for /ukreiif.
 */
function bk_ukreiif_add_rewrite_rule() {
    add_rewrite_rule( '^ukreiif/?$', 'index.php?bk_ukreiif=1', 'top' );
}
add_action( 'init', 'bk_ukreiif_add_rewrite_rule' );

/**
 * Register custom query var.
 */
function bk_ukreiif_add_query_var( $vars ) {
    $vars[] = 'bk_ukreiif';
    return $vars;
}
add_filter( 'query_vars', 'bk_ukreiif_add_query_var' );

/**
 * Output the lander HTML when /ukreiif is requested.
 * Replaces {{PLUGIN_URL}} placeholders with the live plugin URL so fonts and
 * images resolve correctly regardless of where the plugin is installed.
 */
function bk_ukreiif_template_redirect() {
    if ( get_query_var( 'bk_ukreiif' ) ) {
        $file = plugin_dir_path( __FILE__ ) . 'ukreiif.html';

        if ( file_exists( $file ) ) {
            header( 'Content-Type: text/html; charset=utf-8' );
            $html = file_get_contents( $file );
            $html = str_replace( '{{PLUGIN_URL}}', plugins_url( '', __FILE__ ), $html );
            echo $html;
            exit;
        }

        wp_die( 'UKREiiF lander not found.' );
    }
}
add_action( 'template_redirect', 'bk_ukreiif_template_redirect' );

/**
 * Flush rewrite rules on activation.
 */
function bk_ukreiif_activate() {
    bk_ukreiif_add_rewrite_rule();
    flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'bk_ukreiif_activate' );

/**
 * Flush rewrite rules on deactivation.
 */
function bk_ukreiif_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'bk_ukreiif_deactivate' );
