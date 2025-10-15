# Camera Management & Surveillance System

A comprehensive React-based frontend application for camera management, zone monitoring, and PTZ (Pan-Tilt-Zoom) control. This system provides real-time camera surveillance capabilities with advanced zone drawing, activity monitoring, ONVIF camera control, and WebSocket-based communication.

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
- ONVIF-compliant preset position management
- Automated patrol pattern configuration and execution
- Speed control for smooth camera movements
- Real-time video streaming with WebSocket communication
- PTZ status monitoring and position tracking

### 📊 Activity Monitoring
- Dynamic activity configuration with form generation
- Traffic monitoring and speed detection
- Vehicle classification and tracking
- Customizable alert parameters
- JSON-based activity configuration editor with Monaco Editor
- Activity import/export functionality
- Real-time activity status management
- Advanced field types: sliders, time ranges, coordinates, arrays

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS 4.1.13
- Beautiful gradient backgrounds and animations
- Mobile-optimized interface with touch-friendly controls
- Error boundary implementation for robust error handling
- Intuitive navigation with React Router
- Context-based state management for seamless user experience

## 🛠️ Tech Stack

- **Frontend Framework**: React 19.1.1 with TypeScript 5.8.3
- **Build Tool**: Vite 7.1.2
- **Styling**: Tailwind CSS 4.1.13
- **Routing**: React Router DOM 7.9.1
- **HTTP Client**: Axios 1.12.2
- **State Management**: React Context API + TanStack React Query 5.90.2
- **Code Editor**: Monaco Editor 0.54.0 + @monaco-editor/react 4.7.0
- **Joystick Control**: NippleJS 0.10.2
- **WebSocket Communication**: Native WebSocket API
- **ONVIF Support**: Custom ONVIF API integration
- **Linting**: ESLint 9.33.0 with TypeScript support

## 📁 Project Structure

```text
src/
├── api/                    # API services and configurations
│   ├── activities/         # Activity management APIs
│   ├── auth/              # Authentication APIs
│   ├── camera/            # Camera management APIs
│   ├── configuration/     # Configuration management APIs
│   ├── onvif/             # ONVIF camera control APIs
│   ├── config.ts          # API configuration
│   └── index.ts           # API exports
├── components/            # Reusable UI components
│   ├── activities/        # Activity-related components
│   │   ├── fields/        # Dynamic form field components
│   │   ├── AddConfigDropdown.tsx
│   │   ├── DynamicActivityForm.tsx
│   │   ├── ImportActivitiesModal.tsx
│   │   ├── JsonEditor.tsx
│   │   └── JsonEditorModal.tsx
│   ├── ptz/              # PTZ control components
│   ├── zone/             # Zone management components
│   ├── ui/               # Base UI components (Button, Card, Input, Modal)
│   ├── ErrorBoundary.tsx # Error handling component
│   ├── Login.tsx         # Authentication component
│   └── Navbar.tsx        # Navigation component
├── contexts/             # React Context providers
│   ├── CameraContext.tsx # Camera state management
│   └── UserContext.tsx   # User authentication state
├── hooks/                # Custom React hooks
│   ├── api/              # API-related hooks
│   ├── ptz/              # PTZ control hooks
│   ├── useActivities.ts  # Activity management hook
│   └── useZoneDrawing.ts # Zone drawing functionality
├── pages/                # Main application pages
│   ├── Zone.tsx          # Zone management page
│   └── PTZ.tsx           # PTZ control page
├── providers/            # React providers
│   └── QueryProvider.tsx # TanStack React Query provider
├── types/                # TypeScript type definitions
│   ├── activity.ts       # Activity-related types
│   ├── activityFields.ts # Activity field types
│   └── dashboard.ts      # Dashboard-related types
├── utils/                # Utility functions
│   ├── auth.ts           # Authentication utilities
│   ├── config.ts         # Configuration utilities
│   ├── dashboardUtils.ts # Dashboard utilities
│   ├── fieldTypeDetector.ts # Field type detection
│   ├── monacoConfig.ts   # Monaco editor configuration
│   └── polygon-*.ts      # Zone drawing utilities
├── config/               # Application configuration
│   └── activityFieldConfigs.ts # Activity field configurations
├── data/                 # Sample data
│   └── sampleActivitiesData.json
├── lib/                  # Library configurations
│   └── react-query.ts    # React Query configuration
├── services/             # Service layer (currently empty)
├── App.tsx               # Main application component
├── main.tsx              # Application entry point
└── index.css             # Global styles
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

   The application will automatically redirect to the login page if you're not authenticated.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### API Configuration

The application connects to a backend API running on `http://localhost:8000`. The API configuration is centralized in `src/api/config.ts` and includes:

- **Base URL**: Configurable via `VITE_API_BASE_URL` environment variable
- **Endpoints**:
  - Authentication: `/client/login`
  - Camera management: `/camera`
  - Configuration: `/configuration`
  - ONVIF controls: `/onvif/presets`, `/onvif/presets/set`, etc.
- **WebSocket**: Real-time communication for PTZ controls and camera status
- **Token Management**: JWT-based authentication with automatic refresh

Update the proxy configuration in `vite.config.ts` if your backend runs on a different port:

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

### WebSocket Configuration

The application uses WebSocket connections for real-time PTZ control and camera status updates. WebSocket connections are automatically established when accessing the PTZ page and are managed through custom hooks in `src/hooks/ptz/`.

### ONVIF Integration

The system includes comprehensive ONVIF support for:
- Preset management (create, update, delete, goto)
- Patrol pattern configuration
- Camera discovery and control
- Real-time status monitoring

## 📱 Features Overview

### Zone Management
- Draw rectangular and polygon zones on camera snapshots
- Configure lane detection for traffic monitoring
- Set up speed limits for different vehicle types
- Export zone coordinates and configurations

### PTZ Control
- Intuitive joystick control for camera movement using NippleJS
- ONVIF-compliant preset position management
- Automated patrol patterns with customizable tours
- Zoom control with real-time feedback
- WebSocket-based real-time communication
- PTZ status monitoring and position tracking

### Activity Configuration
- Dynamic form generation based on activity type
- Monaco Editor-based JSON editor for advanced configuration
- Real-time parameter validation with field type detection
- Activity status management (ACTIVE/INACTIVE)
- Import/export functionality for activity configurations
- Advanced field types: sliders, time ranges, coordinates, arrays, mappings

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

- **v0.0.0** - Current development version
  - React 19.1.1 with TypeScript 5.8.3
  - Vite 7.1.2 build system
  - Tailwind CSS 4.1.13 styling
  - TanStack React Query 5.90.2 for state management
  - ONVIF camera control integration
  - WebSocket-based real-time communication
  - Monaco Editor for JSON configuration
  - Comprehensive zone drawing and activity monitoring
  - Mobile-responsive design with error boundaries
