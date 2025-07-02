# 📁 Repos Manager

A powerful VS Code extension for managing and organizing your Git repositories with intelligent analysis and intuitive UI.

## ✨ Features

### 🔍 Smart Repository Discovery

- **Automatic Scanning**: Detects all Git repositories in your workspace folders
- **Deep Analysis**: Identifies primary programming languages and project metadata
- **Real-time Progress**: Shows scanning progress with detailed status messages
- **Intelligent Filtering**: Excludes common directories (node_modules, .git, etc.)

### 🎨 Rich Visual Interface

- **Language Icons**: 20+ programming language icons with color coding
- **Git Status Indicators**: Visual representation of repository health
- **Favorites System**: Star your most important repositories
- **Compact Display**: Space-efficient tree view in the sidebar
- **Loading States**: Smooth animations during data fetching

### 🔎 Advanced Search & Filtering

- **Quick Search**: Find repositories by name instantly
- **Language Filtering**: Filter by programming language
- **Favorites Filter**: Show only starred repositories
- **Recent Activity**: Sort by last modified date
- **Advanced Filter Options**: Comprehensive filtering with categories
- **Git Status Filtering**: Filter by clean, modified, or behind status
- **Date Range Filtering**: Show repositories by last activity (today, week, month)
- **Project Features**: Filter by tests, CI/CD, or project size
- **Multiple Criteria**: Combine filters for precise results

### 📊 Repository Information

- **Language Detection**: Primary programming language identification
- **Last Modified**: Relative time display (e.g., "2 days ago")
- **Git Status**: Clean, modified, or behind indicators
- **Project Metadata**: File counts and project analysis

## 🚀 Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Repos Manager"
4. Click "Install"

### Manual Installation

1. Download the latest `.vsix` file from [Releases](https://github.com/your-username/repos-manager/releases)
2. Open Command Palette (`Ctrl+Shift+P`)
3. Run `Extensions: Install from VSIX...`
4. Select the downloaded file

## 🛠️ Setup & Configuration

### Initial Setup

1. Install the extension
2. Open VS Code in a folder containing Git repositories
3. The extension will automatically scan and display repositories in the sidebar
4. Look for the "📁 Repos Manager" panel in the Explorer sidebar

### Configuration Options

Access settings via `File > Preferences > Settings` and search for "Repos Manager":

```json
{
  "reposManager.scanning.rootPaths": [
    "C:\\Dev\\projects",
    "/Users/username/projects"
  ],
  "reposManager.scanning.scanDepth": 3,
  "reposManager.scanning.excludePaths": [
    "node_modules",
    ".git",
    "dist",
    "build"
  ],
  "reposManager.scanning.includeHidden": false,
  "reposManager.display.compactMode": true,
  "reposManager.display.showLastModified": true,
  "reposManager.display.showLanguageIcons": true
}
```

#### Configuration Details

- **`rootPaths`**: Directories to scan for repositories
- **`scanDepth`**: How deep to search (default: 3 levels)
- **`excludePaths`**: Directories to skip during scanning
- **`includeHidden`**: Whether to scan hidden directories
- **`compactMode`**: Use space-efficient display
- **`showLastModified`**: Display last modification dates
- **`showLanguageIcons`**: Show programming language icons

## 📖 Usage Guide

### Basic Operations

#### Repository Navigation
- **Click repository name**: Open in current window
- **Click 🪟 button**: Open in new window (when visible on hover)
- **Right-click**: Access context menu with more options

#### Favorites Management
- **Click ⭐ (filled star)**: Remove from favorites
- **Click ☆ (empty star)**: Add to favorites
- **Use Quick Filter**: Show only favorites with the favorites button

#### Search & Filtering
1. Click the 🔍 **Search** button in the panel header
2. Enter search terms to find repositories by name
3. Click the 📊 **Filter** button to access filtering options:
   - Filter by programming language
   - Show only favorites
   - Show recently modified
   - Clear all filters

#### Manual Refresh
- Click the 🔄 **Refresh** button to rescan repositories
- Progress bar shows scanning status
- Real-time updates with detailed messages

### Advanced Features

#### Repository Analysis
Each repository displays:
- **Primary Language**: Automatically detected
- **Last Modified**: Relative time (e.g., "3 days ago")
- **Git Status**: Visual indicators for repository health
- **Favorite Status**: Star icon for quick identification

#### Empty State Handling
When no repositories are found:
- Clear message explaining the situation
- Helpful guidance to add folders or refresh
- Easy-to-understand next steps

## 🎯 Supported Languages

Repos Manager recognizes and displays icons for:

| Language | Icon | Language | Icon |
|----------|------|----------|------|
| JavaScript | 🟨 JS | TypeScript | 🔷 TS |
| Python | 🐍 PY | Java | ☕ JAVA |
| C# | 🔵 C# | C++ | ⚡ C++ |
| PHP | 🟣 PHP | Ruby | 💎 RB |
| Go | 🔵 GO | Rust | 🦀 RS |
| Swift | 🟠 SW | Kotlin | 🟣 KT |
| React | ⚛️ RX | Vue | 🟢 VUE |
| Angular | 🔴 NG | Node.js | 🟢 NODE |
| HTML | 🌐 HTML | CSS | 🎨 CSS |
| Shell | 🐚 SH | PowerShell | 💙 PS1 |

## ⚡ Performance

### Optimizations
- **Intelligent Scanning**: Skips unnecessary directories
- **Async Processing**: Non-blocking repository analysis
- **Efficient Caching**: Reduces redundant operations
- **Progress Feedback**: Real-time status updates

### Recommended Limits
- **Repository Count**: Tested with 50+ repositories
- **Scan Depth**: Keep under 5 levels for optimal performance
- **Path Exclusions**: Add large directories (node_modules, etc.) to exclusions

## 🔄 Commands

Access these commands via Command Palette (`Ctrl+Shift+P`):

- `Repos Manager: Refresh Repositories` - Manually rescan repositories
- `Repos Manager: Search Repositories` - Open search dialog
- `Repos Manager: Filter Repositories` - Open basic filter options
- `Repos Manager: Advanced Filter` - Open advanced filtering with categories
- `Repos Manager: Clear Filters` - Remove all active filters
- `Repos Manager: Open Settings` - Access extension settings

## 🐛 Troubleshooting

### Common Issues

#### No Repositories Showing
1. **Check Configuration**: Ensure `rootPaths` includes your project directories
2. **Verify Git Repositories**: Make sure directories contain `.git` folders
3. **Check Exclusions**: Verify your projects aren't in `excludePaths`
4. **Manual Refresh**: Click the refresh button to rescan

#### Slow Performance
1. **Reduce Scan Depth**: Lower the `scanDepth` setting
2. **Add Exclusions**: Exclude large directories like `node_modules`
3. **Limit Root Paths**: Scan only necessary directories

#### Missing Languages
1. **File Structure**: Ensure language files are in the repository root
2. **Manual Refresh**: Rescan to update language detection
3. **Check Support**: Verify the language is in our supported list

### Error Messages

#### "No scan paths configured"
- Add directories to `reposManager.scanning.rootPaths` in settings

#### "Path does not exist or is not accessible"
- Verify the paths in your configuration exist and are readable

#### "Scan cancelled"
- The user or system cancelled the operation - try refreshing again

## 🛣️ Roadmap

### 🔜 Coming Soon (Phase 3)
- **Workspace Management**: Create and manage project workspaces
- **Advanced Analytics**: Repository health scoring and insights
- **Batch Operations**: Perform actions on multiple repositories
- **Custom Tags**: Organize repositories with user-defined tags

### 🔮 Future Plans
- **Remote Repository Integration**: GitHub/GitLab API integration
- **Team Collaboration**: Share repository collections
- **Performance Metrics**: Track development activity
- **Custom Themes**: Personalize the interface

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Clone the repository
2. Run `npm install`
3. Open in VS Code
4. Press `F5` to launch Extension Development Host
5. Make changes and test

### Building
```bash
npm run compile          # TypeScript compilation
npm run package         # Create VSIX package
npm run test           # Run test suite
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- VS Code Extension API documentation
- The open-source community for inspiration
- All contributors and users providing feedback

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/repos-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/repos-manager/discussions)
- **Email**: support@repos-manager.dev

---

**Made with ❤️ for developers who love organized workflows**

*Star ⭐ this repository if you find it useful!*
