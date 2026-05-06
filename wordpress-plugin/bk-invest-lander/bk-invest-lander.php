<?php
/**
 * Plugin Name: Business Kirklees — Invest Lander
 * Description: Serves the UKREiiF "Invest in Kirklees" landing page at /invest using a self-contained static HTML file. Used by Kirklees Council delegates at UKREiiF 2026 (19–21 May).
 * Version: 1.0.0
 * Author: Kirklees Council Comms — Max Youell
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Add rewrite rule for /invest.
 */
function bk_invest_add_rewrite_rule() {
    add_rewrite_rule( '^invest/?$', 'index.php?bk_invest=1', 'top' );
}
add_action( 'init', 'bk_invest_add_rewrite_rule' );

/**
 * Register custom query var.
 */
function bk_invest_add_query_var( $vars ) {
    $vars[] = 'bk_invest';
    return $vars;
}
add_filter( 'query_vars', 'bk_invest_add_query_var' );

/**
 * Output the lander HTML when /invest is requested.
 * Replaces {{PLUGIN_URL}} placeholders with the live plugin URL so fonts and
 * images resolve correctly regardless of where the plugin is installed.
 */
function bk_invest_template_redirect() {
    if ( get_query_var( 'bk_invest' ) ) {
        $file = plugin_dir_path( __FILE__ ) . 'invest.html';

        if ( file_exists( $file ) ) {
            header( 'Content-Type: text/html; charset=utf-8' );
            $html = file_get_contents( $file );
            $html = str_replace( '{{PLUGIN_URL}}', plugins_url( '', __FILE__ ), $html );
            echo $html;
            exit;
        }

        wp_die( 'Invest lander not found.' );
    }
}
add_action( 'template_redirect', 'bk_invest_template_redirect' );

/**
 * Flush rewrite rules on activation.
 */
function bk_invest_activate() {
    bk_invest_add_rewrite_rule();
    flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'bk_invest_activate' );

/**
 * Flush rewrite rules on deactivation.
 */
function bk_invest_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'bk_invest_deactivate' );
