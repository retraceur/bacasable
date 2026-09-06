# bacÀsable

Instantly start a Retraceur development environment in Node.js with WebAssembly PHP and SQLite.

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/gpl-2.0)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)

---

## Use bacÀsable

### Requirements

- **Node.js** >= 22.0.0
- **Systems**: macOS, Linux, Windows (WSL recommended)

### Quick Start

No installation required! Use directly with npx:

```bash
# In a plugin directory
cd my-retraceur-plugin
npx @retraceur/bacasable start

# In a theme directory
cd my-retraceur-theme
npx @retraceur/bacasable start --php=8.3

# With a specific Retraceur version
npx @retraceur/bacasable start --retraceur=4.2.0

# In a complete Retraceur installation
cd ~/projects/retraceur/coeur
npx @retraceur/bacasable start
```

### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--path=<path>` | Project path | Current directory |
| `--php=<version>` | PHP version (8.0, 8.1, 8.2, 8.3) | `8.3` |
| `--port=<port>` | Server port | `8881` |
| `--retraceur=<version>` | Retraceur version | `latest` |
| `--mode=<mode>` | Force a mode (plugin\|theme\|wp-content\|retraceur) | Auto-detected |

### Automatic Mode Detection

bacÀsable automatically detects your project type:

#### 🔌 Plugin

Plugin development (detects `Plugin Name:` in PHP header)

```bash
cd my-plugin
npx @retraceur/bacasable start
# → Mounts plugin in wp-content/plugins
```

#### 🎨 Theme

Block theme development (detects `style.css` with `Theme Name:`)

```bash
cd my-theme
npx @retraceur/bacasable start
# → Mounts theme in wp-content/themes
```

#### 📁 wp-content

Development with multiple plugins and themes

```bash
cd my-wp-content
npx @retraceur/bacasable start
# → Uses the entire wp-content directory
```

#### 🏠 retraceur

Complete local Retraceur installation

```bash
cd ~/retraceur/coeur
npx @retraceur/bacasable start
# → Uses local installation (no download)
```

#### β Testing Retraceur pre-releases

Contribute to next Retraceur major releases testing betas & release candidates.

```bash
mkdir ~/test-retraceur-5-beta
cd ~/test-retraceur-5-beta
npx @retraceur/bacasable start --retraceur=5.0.0-beta1
```

### Email Interception

bacÀsable automatically intercepts all outgoing emails during development.
Emails are saved to `wp-content/bacasable-emails.json` instead of being sent.

### Debug

bacÀsable enables WordPress debug constants by default:

| Constant | plugin / theme | wp-content / retraceur |
|----------|---------------|------------------------|
| `WP_DEBUG` | `true` | `true` |
| `WP_SCRIPT_DEBUG` | `true` | `true` |
| `WP_DEBUG_DISPLAY` | `true` | `false` |
| `WP_DEBUG_LOG` | `false` | `true` → `wp-content/debug.log` |

### Supported Retraceur Versions

- `latest` → Latest stable release (resolved dynamically from GitHub)
- `trunk` → Main development branch
- Any release tag from [Retraceur Releases](https://github.com/retraceur/coeur/releases) (e.g. `4.2.0`, `4.0.0-RC1`, `4.0.0-beta1`)

### Known Limitations

- 📝 No support for old Retraceur versions (< 2.0.0)
- 🔌 Plugins requiring system dependencies may not work
- 🌐 No native multisite support
- 🔍 No xdebug support (PHP WebAssembly limitation)

---

## Contribute to bacÀsable

### Requirements

- **Node.js** >= 22.0.0
- **npm** >= 9.0.0

### Local Setup

```bash
git clone https://github.com/retraceur/bacasable.git
cd bacasable
npm install
```

### Build

```bash
npm run build
```

### Use Your Local Build

```bash
# In the bacasable repository
npm link

# Now usable anywhere
cd ~/projects/my-plugin
bacasable start
```

### Development Workflow

```bash
# Terminal 1: watch mode
npm run dev

# Terminal 2: test your changes
cd ~/projects/my-plugin
bacasable start
```

### Architecture

```
bacasable/
├── src/
│   ├── main.ts                       # CLI entry point + startBacasable()
│   ├── download.ts                   # Retraceur download & caching
│   ├── retraceur-versions.ts         # Version management (GitHub Atom feed)
│   ├── constants.ts                  # Global constants
│   ├── output.ts                     # Logging utilities
│   ├── port-finder.ts                # Port management
│   ├── get-bacasable-path.ts         # Cache path utilities
│   ├── get-bacasable-tmp-path.ts
│   ├── get-retraceur-versions-path.ts
│   ├── github-codespaces.ts          # GitHub Codespaces support
│   ├── index.ts                      # Public API exports
│   └── utils/                        # Mode detection utilities
│       ├── is-retraceur-directory.ts
│       ├── is-plugin-directory.ts
│       ├── is-theme-directory.ts
│       ├── is-wp-content-directory.ts
│       ├── get-plugin-file.ts
│       └── read-file-head.ts
├── build/                            # Compiled output
└── esbuild.mjs                       # Build configuration
```

### Technologies

- **Node.js** >= 22: JavaScript runtime
- **TypeScript**: Typed language
- **esbuild**: Ultra-fast bundler
- **@wp-playground/cli**: WP Playground CLI (WebAssembly PHP engine)
- **SQLite**: Lightweight database (managed by Playground)

### How to Contribute

1. **Fork** the project
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Commit**: `git commit -m 'Add: My feature'`
4. **Push**: `git push origin feature/my-feature`
5. **Pull Request**: Open a PR on GitHub

### Support

- 🐛 [GitHub Issues](https://github.com/retraceur/bacasable/issues)
- 💬 [Discussions](https://github.com/retraceur/bacasable/discussions)

---

## What is Retraceur?

[Retraceur](https://github.com/retraceur/coeur) is a WordPress fork focused on personal publishing:

- ✅ No dependency on wordpress.org
- ✅ Libravatar instead of Gravatar
- ✅ OpenMojis integrated
- ✅ Block Editor required
- ✅ Block themes only

Learn more: [github.com/retraceur/coeur](https://github.com/retraceur/coeur)

---

## Credits

Learn more about [bacÀsable credits](./credits.md)

---

**Made with ❤️ by the Retraceur community**
