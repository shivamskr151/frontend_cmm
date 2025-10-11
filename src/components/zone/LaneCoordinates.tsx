import React from 'react';
import type { ZoneCoordinates as ZoneCoordinatesType } from '../../types/dashboard';
import { copyToClipboard } from '../../utils/dashboardUtils';

interface LaneCoordinatesProps {
  currentZoneType: string;
  zoneCoordinates: ZoneCoordinatesType;
  zoneDrawerRef: React.RefObject<any>;
}

const LaneCoordinates: React.FC<LaneCoordinatesProps> = ({
  currentZoneType,
  zoneCoordinates,
  zoneDrawerRef
}) => {
  // Only show when zone type includes lanes
  if (currentZoneType !== 'rectangle-with-lanes' && currentZoneType !== 'polygon-with-lanes') {
    return null;
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-gray-200/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <div>
            <h6 className="text-gray-800 font-bold text-base sm:text-lg">Lane Coordinates</h6>
          </div>
        </div>
        <button 
          onClick={() => copyToClipboard(JSON.stringify(zoneCoordinates.lanes))}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30 flex items-center gap-2 transform hover:-translate-y-0.5"
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
          // Get structured zone data from the zone drawer if available
          let zonesWithLanes: any[] = [];
          
          // Check for different zone drawer types
          if (zoneDrawerRef.current) {
            if (typeof (zoneDrawerRef.current as any).getZones === 'function') {
              // Rectangle zones with lanes
              zonesWithLanes = (zoneDrawerRef.current as any).getZones();
            } else if (typeof (zoneDrawerRef.current as any).getZonesWithLanes === 'function') {
              // Polygon zones with lanes
              zonesWithLanes = (zoneDrawerRef.current as any).getZonesWithLanes();
            }
          }
          
          // If we have structured data, show lanes grouped by zones
          if (zonesWithLanes.length > 0) {
            return zonesWithLanes.map((zone, zoneIndex) => {
              const lanes = zone.lanes || [];
              if (lanes.length > 0) {
                return (
                  <div key={zoneIndex} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                          {zoneIndex + 1}
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-gray-800">Zone {zoneIndex + 1}</h4>
                          <p className="text-sm text-gray-600">{lanes.length} lane{lanes.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(JSON.stringify(lanes))}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30 flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {lanes.map((lane: any, laneIndex: number) => (
                        <div key={laneIndex} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {laneIndex + 1}
                              </div>
                              <span className="text-sm font-semibold text-gray-800">Lane {laneIndex + 1}</span>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(JSON.stringify(lane))}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs font-medium text-gray-600 mb-1">Start Point</div>
                              <div className="text-gray-800 font-mono">
                                {lane.start ? 
                                  `(${lane.start.x.toFixed(1)}, ${lane.start.y.toFixed(1)})` :
                                  `(${lane.x1.toFixed(1)}, ${lane.y1.toFixed(1)})`
                                }
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs font-medium text-gray-600 mb-1">End Point</div>
                              <div className="text-gray-800 font-mono">
                                {lane.end ? 
                                  `(${lane.end.x.toFixed(1)}, ${lane.end.y.toFixed(1)})` :
                                  `(${lane.x2.toFixed(1)}, ${lane.y2.toFixed(1)})`
                                }
                              </div>
                            </div>
                          </div>
                          {lane.color && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="text-xs font-medium text-gray-600">Color:</div>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded border border-gray-300 bg-green-500" 
                                ></div>
                                <span className="text-xs font-mono text-gray-700">{lane.color}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }).filter(Boolean);
          }
          
          // Fallback to flat lane display if no structured data
          if (zoneCoordinates.lanes.length > 0) {
            return (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-gray-700 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
                  {JSON.stringify(zoneCoordinates.lanes, null, 2)}
                </div>
              </div>
            );
          }
          
          // No lanes message
          return (
            <div className="text-center py-8 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <p>No lanes drawn yet</p>
              <p className="text-xs mt-1">Use the "Draw Lane" tool to create traffic lanes</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default LaneCoordinates;
