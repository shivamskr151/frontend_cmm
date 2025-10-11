# Camera Management & Surveillance System

A comprehensive React-based frontend application for camera management, zone monitoring, and PTZ (Pan-Tilt-Zoom) control. This system provides real-time camera surveillance capabilities with advanced zone drawing, activity monitoring, and camera control features.

## 🚀 Features

### 🔐 Authentication & Security
- Secure login system with JWT token authentication
- User session management with automatic token refresh
- Protected routes with authentication guards

### 📹 Camera Management
- Multi-camera support with real-time status monitoring
- Camera selection and configuration
- Live snapshot capture and display
- Camera health monitoring and error handling

### 🎯 Zone Management
- Interactive zone drawing with multiple zone types:
  - Rectangle zones
  - Polygon zones
  - Lane detection zones
- Real-time coordinate tracking and analytics
- Zone statistics and measurements
- Export/import zone configurations

### 🎮 PTZ Control
- Pan-Tilt-Zoom camera control with joystick interface
- Preset position management
- Patrol pattern configuration
- Speed control for smooth camera movements
- Real-time video streaming

### 📊 Activity Monitoring
- Dynamic activity configuration
- Traffic monitoring and speed detection
- Vehicle classification and tracking
- Customizable alert parameters
- JSON-based activity configuration editor

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Beautiful gradient backgrounds and animations
- Mobile-optimized interface
- Dark/light theme support
- Intuitive navigation with React Router

## 🛠️ Tech Stack

- **Frontend Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.2
- **Styling**: Tailwind CSS 4.1.13
- **Routing**: React Router DOM 7.9.1
- **HTTP Client**: Axios 1.12.2
- **Code Editor**: Monaco Editor 0.54.0
- **Joystick Control**: NippleJS 0.10.2
- **State Management**: React Context API
- **Linting**: ESLint with TypeScript support

## 📁 Project Structure

```
src/
├── api/                    # API services and configurations
│   ├── activities/         # Activity management APIs
│   ├── auth/              # Authentication APIs
│   ├── camera/            # Camera management APIs
│   └── config.ts          # API configuration
├── components/            # Reusable UI components
│   ├── activities/        # Activity-related components
│   ├── ptz/              # PTZ control components
│   ├── zone/             # Zone management components
│   └── ui/               # Base UI components
├── contexts/             # React Context providers
│   ├── CameraContext.tsx # Camera state management
│   └── UserContext.tsx   # User authentication state
├── hooks/                # Custom React hooks
│   ├── ptz/              # PTZ control hooks
│   ├── useActivities.ts  # Activity management hook
│   └── useZoneDrawing.ts # Zone drawing functionality
├── pages/                # Main application pages
│   ├── Zone.tsx          # Zone management page
│   └── PTZ.tsx           # PTZ control page
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── config/               # Application configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### API Configuration

The application connects to a backend API running on `http://localhost:8000`. Update the proxy configuration in `vite.config.ts` if your backend runs on a different port:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### Environment Variables

Create a `.env` file in the root directory for environment-specific configurations:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Camera Management System
```

## 📱 Features Overview

### Zone Management
- Draw rectangular and polygon zones on camera snapshots
- Configure lane detection for traffic monitoring
- Set up speed limits for different vehicle types
- Export zone coordinates and configurations

### PTZ Control
- Intuitive joystick control for camera movement
- Preset position management
- Automated patrol patterns
- Zoom control with real-time feedback

### Activity Configuration
- Dynamic form generation based on activity type
- JSON editor for advanced configuration
- Real-time parameter validation
- Activity status management

## 🔒 Security Features

- JWT token-based authentication
- Automatic token refresh
- Secure API communication
- Input validation and sanitization
- Protected route access

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices:
- Touch-friendly controls
- Responsive grid layouts
- Mobile-optimized navigation
- Gesture support for PTZ controls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔄 Version History

- **v1.0.0** - Initial release with basic camera management
- **v1.1.0** - Added PTZ controls and zone drawing
- **v1.2.0** - Enhanced activity monitoring and mobile support
- **v1.3.0** - Improved UI/UX and performance optimizations
