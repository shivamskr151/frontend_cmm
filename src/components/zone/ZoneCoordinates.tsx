import React from 'react';
import type { ZoneCoordinates as ZoneCoordinatesType } from '../../types/dashboard';
import { calculateRectangleDimensions, calculatePolygonDimensions, copyToClipboard } from '../../utils/dashboardUtils';

interface ZoneCoordinatesProps {
  currentZoneType: string;
  zoneCoordinates: ZoneCoordinatesType;
}

const ZoneCoordinates: React.FC<ZoneCoordinatesProps> = ({
  currentZoneType,
  zoneCoordinates
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-gray-200/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
          </div>
          <div>
            <h6 className="text-gray-800 font-bold text-base sm:text-lg">Zone Coordinates</h6>
          </div>
        </div>
        <button 
          onClick={() => {
            const dataToCopy = (currentZoneType === 'polygon' || currentZoneType === 'polygon-with-lanes') 
              ? zoneCoordinates.polygons 
              : zoneCoordinates.zones;
            copyToClipboard(JSON.stringify(dataToCopy));
          }}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 transform hover:-translate-y-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy All
        </button>
      </div>
      
      <div className="h-80 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {(() => {
          if (currentZoneType === 'polygon' || currentZoneType === 'polygon-with-lanes') {
            if (zoneCoordinates.polygons.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                    <line x1="8" y1="2" x2="8" y2="18"></line>
                    <line x1="16" y1="6" x2="16" y2="22"></line>
                  </svg>
                  <p>No polygons drawn yet</p>
                  <p className="text-xs mt-1">Use the drawing tools above to create zones</p>
                </div>
              );
            }
            
            return zoneCoordinates.polygons
              .map((polygon, index) => {
                // Add safety check for polygon data
                if (!polygon || !Array.isArray(polygon) || polygon.length === 0) {
                  console.warn('Invalid polygon data at index', index, polygon);
                  return null;
                }
                
                // Check if all points in the polygon are valid
                const hasInvalidPoints = polygon.some(point => !point || typeof point.x !== 'number' || typeof point.y !== 'number');
                if (hasInvalidPoints) {
                  console.warn('Polygon has invalid points at index', index, polygon);
                  return null;
                }
                
                const dimensions = calculatePolygonDimensions(polygon);
                return (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-800">Zone {index + 1}</h4>
                        <p className="text-sm text-gray-600">Polygon Zone • {dimensions.area} px² • {dimensions.perimeter} px perimeter</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(JSON.stringify(polygon))}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy
                    </button>
                  </div>
                  
                  {/* Dimensions Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Area</div>
                      <div className="text-gray-800 font-mono">{dimensions.area.toLocaleString()} px²</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Perimeter</div>
                      <div className="text-gray-800 font-mono">{dimensions.perimeter.toLocaleString()} px</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Centroid</div>
                      <div className="text-gray-800 font-mono">({dimensions.centroidX}, {dimensions.centroidY})</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Bounding Box</div>
                      <div className="text-gray-800 font-mono">{dimensions.boundingWidth} × {dimensions.boundingHeight} px</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Points</div>
                      <div className="text-gray-800 font-mono">{dimensions.pointCount} vertices</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Shape Type</div>
                      <div className="text-gray-800 font-mono">
                        {dimensions.pointCount === 3 ? 'Triangle' :
                         dimensions.pointCount === 4 ? 'Quadrilateral' :
                         dimensions.pointCount === 5 ? 'Pentagon' :
                         dimensions.pointCount === 6 ? 'Hexagon' :
                         `${dimensions.pointCount}-gon`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Polygon Points */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-3">Polygon Vertices</div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      {polygon.map((point, pointIndex) => (
                        <div key={pointIndex} className="bg-gray-50 rounded p-2 flex items-center justify-between">
                          <span className="text-gray-600">Point {pointIndex + 1}:</span>
                          <span className="font-mono text-gray-800">({(point.x ?? 0).toFixed(1)}, {(point.y ?? 0).toFixed(1)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
              })
              .filter(Boolean);
          } else {
            if (zoneCoordinates.zones.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  </svg>
                  <p>No zones drawn yet</p>
                  <p className="text-xs mt-1">Use the drawing tools above to create zones</p>
                </div>
              );
            }
            
            return zoneCoordinates.zones
              .map((zone, index) => {
                // Add safety check for zone data
                if (!zone || typeof zone.x !== 'number' || typeof zone.y !== 'number' || typeof zone.width !== 'number' || typeof zone.height !== 'number') {
                  console.warn('Invalid zone data at index', index, zone);
                  return null;
                }
                
                const dimensions = calculateRectangleDimensions(zone);
                return (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-800">Zone {index + 1}</h4>
                        <p className="text-sm text-gray-600">Rectangle Zone • {dimensions.area} px² • {dimensions.perimeter} px perimeter</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(JSON.stringify(zone))}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Position</div>
                      <div className="text-gray-800 font-mono">({(zone.x ?? 0).toFixed(1)}, {(zone.y ?? 0).toFixed(1)})</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Dimensions</div>
                      <div className="text-gray-800 font-mono">{(zone.width ?? 0).toFixed(0)} × {(zone.height ?? 0).toFixed(0)} px</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Center Point</div>
                      <div className="text-gray-800 font-mono">({dimensions.centerX}, {dimensions.centerY})</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Area</div>
                      <div className="text-gray-800 font-mono">{dimensions.area.toLocaleString()} px²</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Perimeter</div>
                      <div className="text-gray-800 font-mono">{dimensions.perimeter.toLocaleString()} px</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Aspect Ratio</div>
                      <div className="text-gray-800 font-mono">{dimensions.aspectRatio}:1</div>
                    </div>
                  </div>
                </div>
              );
              })
              .filter(Boolean);
          }
        })()}
      </div>
    </div>
  );
};

export default ZoneCoordinates;
