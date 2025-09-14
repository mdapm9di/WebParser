# WebParser

A cross-platform desktop application for parsing websites built with Electron (Frontend) and Python/Flask (Backend). Extract text, images, and video data from web pages using CSS selectors with an intuitive GUI interface.

## Features

- **Desktop GUI** - Native application experience with dark theme UI
- **Multi-URL Processing** - Parse multiple websites simultaneously
- **Flexible Selectors** - Extract elements by tag, class, or ID
- **Multiple Data Types** - Support for text, images, and video content
- **Smart Language Detection** - Automatic Russian language encoding correction
- **Export Options** - Save results as JSON or CSV
- **Media Downloading** - Automatically download images and videos
- **Auto-Save Functionality** - Results are automatically organized in dated folders

## Project Structure

```
webparser/
├── backend/            
│   ├── src/
│   │   ├── core/
│   │   │   └── parser.py         
│   │   └── utils/
│   │       ├── language_utils.py  
│   │       ├── file_utils.py      
│   │       └── network_utils.py   
│   └── app.py           
├── frontend/             
│   ├── src/
│   │   ├── js/
│   │   │   ├── renderer.js      
│   │   │   └── content-extractor-ui.js 
│   │   └── styles/
│   │       └── scss/
│   │           └── style.scss   
│   ├── index.html       
│   └── main.js            
├── requirements.txt   
└── package.json         
```

## Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- pip (Python package manager)
- npm (Node.js package manager)

### Steps

1. Clone the repository:
```bash
git clone https://github.com/your-username/webparser.git
cd webparser
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install Node.js dependencies:
```bash
npm install
```

4. Build the CSS styles:
```bash
npm run build-css-once
```

5. Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Usage

1. **Add URLs**: Enter one or more website URLs to parse
2. **Configure Selector**: Choose to select elements by tag, class, or ID
3. **Set Extraction Mode**:
   - Automatic: The app detects what type of content to extract
   - Manual: Specify exactly what to extract (txt, img, video)
4. **Start Parsing**: Click the "Start Parsing" button
5. **Save Results**: Choose to save automatically or select a custom location

### Examples

- Extract all paragraphs: Select "tag" and enter "p"
- Extract navigation: Select "class" and enter "nav, menu, navigation"
- Extract hero image: Select "id" and enter "hero-image"

## Development

The application consists of two main parts:

1. **Backend (Flask API)** - Handles web requests and parsing logic
2. **Frontend (Electron)** - Provides the user interface and manages application lifecycle

To modify the application:

- Edit frontend styles in `frontend/src/styles/scss/style.scss`
- Modify parsing logic in `backend/src/core/parser.py`
- Change UI behavior in `frontend/src/js/renderer.js`

## Building for Distribution

To create distributable packages:

```bash
npm run build
```

This will create platform-specific installers in the `dist/` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Known Issues

- Some websites with complex JavaScript rendering may not parse correctly
- Video extraction works best with direct video links
- Large numbers of simultaneous URLs may cause performance issues

## Changelog

### v1.0.0
**Full Changelog**: https://github.com/mdapm9di/WebParser/commits/1.0.0
- Initial release
- Basic text, image, and video extraction
- JSON/CSV export functionality
- Automatic Russian encoding detection

---

For questions or support, please open an issue on GitHub.
