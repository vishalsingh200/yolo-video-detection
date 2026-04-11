# YOLO Video Detection - React Frontend

Modern, responsive React frontend for YOLO video object detection system.

## Features

- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- 📱 **Responsive**: Works on desktop, tablet, and mobile
- 🎯 **Interactive**: Drag-and-drop video upload, live progress tracking
- 📊 **Visualizations**: Charts and statistics with Recharts
- ⚡ **Fast**: Built with Vite for instant hot module replacement
- 🎭 **Animations**: Smooth transitions with Framer Motion

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Axios** - HTTP client

## Setup

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── VideoUpload.jsx       # Drag-and-drop upload
│   │   ├── ObjectClassSelector.jsx  # Multi-select classes
│   │   ├── DetectionConfig.jsx   # Settings panel
│   │   └── ResultsDisplay.jsx    # Charts and results
│   ├── utils/
│   │   └── api.js                # API service layer
│   ├── App.jsx                   # Main application
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── public/                       # Static assets
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Components

### VideoUpload
- Drag-and-drop interface
- File validation
- Video preview
- Remove functionality

### ObjectClassSelector
- Search functionality
- Popular/All classes toggle
- Multi-select with visual feedback
- Selected count display

### DetectionConfig
- Model selection (5 YOLO variants)
- Confidence threshold slider
- Device selection (CPU/GPU)
- Advanced options (skip frames, max frames)

### ResultsDisplay
- Statistics cards
- Per-class data table
- Timeline chart
- Bar chart
- Download buttons

## Customization

### Colors

Edit `tailwind.config.js`:

```js
colors: {
  primary: {
    500: '#667eea',  // Main brand color
  },
  secondary: {
    500: '#764ba2',  // Accent color
  }
}
```

### API Endpoint

Edit `src/utils/api.js`:

```js
const API_BASE_URL = 'http://your-backend-url';
```

## API Integration

The frontend expects these endpoints:

- `POST /detect` - Upload video and start detection
- `GET /classes` - Get available object classes
- `GET /models` - Get available YOLO models
- `GET /status/:jobId` - Get detection status
- `GET /download/:jobId/excel` - Download Excel report
- `GET /download/:jobId/video` - Download annotated video

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

## Features in Detail

### Step-by-Step Workflow

1. **Upload Video** - Drag & drop or browse
2. **Select Objects** - Choose from 80 classes
3. **Configure** - Select model and settings
4. **Process** - Real-time progress tracking
5. **Results** - Interactive charts and downloads

### Responsive Design

- Mobile: Stacked layout
- Tablet: 2-column grid
- Desktop: Full width with sidebars

### Dark Mode (Coming Soon)

Toggle between light and dark themes.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

- Code splitting with React lazy loading
- Optimized bundle size with Vite
- Efficient re-renders with React.memo
- Smooth 60fps animations

## Deployment

### Vercel

```bash
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License

---

**Built with ❤️ using React and Tailwind CSS**
