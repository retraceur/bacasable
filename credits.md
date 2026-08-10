# Credits
 
## Original project: wp-now
 
bacÀsable started as a fork of `wp-now`, developed by the WP Playground team.
 
- **Source project**: https://github.com/wordpress/playground-tools
- **Original package**: @wp-now/wp-now
- **License**: GPL-2.0-or-later
- **Original authors**: WP Playground team

## Current architecture: WP Playground CLI
 
Since v1.0.0, bacÀsable is powered by `@wp-playground/cli`, the official
WP Playground CLI, also developed by the WP Playground team.
 
- **Package**: @wp-playground/cli
- **Source**: https://github.com/wordpress/wordpress-playground
- **License**: GPL-2.0-or-later

## Modifications for Retraceur
 
bacÀsable adapts WP Playground to work with [Retraceur](https://github.com/retraceur/coeur),
a fork of WP focused on personal publishing.
 
### Main changes:
 
- Download from GitHub (retraceur/coeur) instead of wordpress.org
- Support for Retraceur versions with local caching
- Automatic mode detection (plugin, theme, wp-content, retraceur)
- Local Retraceur installation support (no download)
- Retraceur branding

## Acknowledgments
 
Thanks to the WP Playground team for their excellent work on:
 
- **@wp-playground/cli**: The WP Playground CLI
- **@php-wasm/node** and **@php-wasm/universal**: PHP in WebAssembly
- **WP Playground**: Virtualization infrastructure
- **wp-now**: Original concept and architecture

Without their innovative WebAssembly PHP infrastructure, bacÀsable would not be possible.
 
## License
 
Like the parent project, bacÀsable is distributed under the **GPL-2.0-or-later** license.
 
See [LICENSE](./LICENSE.md) for the full license text.
