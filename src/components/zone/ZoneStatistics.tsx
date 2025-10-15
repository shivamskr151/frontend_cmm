import React, { useMemo } from 'react';
import type { ZoneCoordinates as ZoneCoordinatesType } from '../../types/dashboard';

interface ZoneStatisticsProps {
  currentZoneType: string;
  zoneCoordinates: ZoneCoordinatesType;
}

const ZoneStatistics: React.FC<ZoneStatisticsProps> = React.memo(({
  currentZoneType,
  zoneCoordinates
}) => {
  // Ensure zoneCoordinates properties are always arrays
  const safeZoneCoordinates = {
    zones: Array.isArray(zoneCoordinates.zones) ? zoneCoordinates.zones : [],
    lanes: Array.isArray(zoneCoordinates.lanes) ? zoneCoordinates.lanes : [],
    polygons: Array.isArray(zoneCoordinates.polygons) ? zoneCoordinates.polygons : []
  };

  // Memoize statistics calculations to prevent unnecessary recalculations
  const statistics = useMemo(() => {
    const zonesCount = currentZoneType === 'polygon' || currentZoneType === 'polygon-with-lanes' 
      ? safeZoneCoordinates.polygons.length 
      : safeZoneCoordinates.zones.length;
    
    const lanesCount = safeZoneCoordinates.lanes.length;
    const zoneTypeDisplay = currentZoneType.replace('-', ' ');
    
    return {
      zonesCount,
      lanesCount,
      zoneTypeDisplay
    };
  }, [currentZoneType, safeZoneCoordinates.polygons.length, safeZoneCoordinates.zones.length, safeZoneCoordinates.lanes.length]);
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-gray-200/10 w-full">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
          </svg>
        </div>
        <div className="flex-1">
          <h6 className="text-gray-800 font-bold text-base sm:text-lg">Zone Statistics</h6>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200 min-h-[60px]">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-blue-800">Zones Created</span>
          </div>
          <span className="text-2xl font-bold text-blue-900">
            {statistics.zonesCount}
          </span>
        </div>
        
        {(currentZoneType === 'rectangle-with-lanes' || currentZoneType === 'polygon-with-lanes') && (
          <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200 min-h-[60px]">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-green-800">Lanes Created</span>
            </div>
            <span className="text-2xl font-bold text-green-900">{statistics.lanesCount}</span>
          </div>
        )}
        
        <div className={`flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px] ${(currentZoneType === 'rectangle-with-lanes' || currentZoneType === 'polygon-with-lanes') ? 'sm:col-span-2' : 'sm:col-span-2'}`}>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">Zone Type</span>
          </div>
          <span className="text-lg font-bold text-gray-900 capitalize text-right">
            {statistics.zoneTypeDisplay}
          </span>
        </div>
      </div>
    </div>
  );
});

ZoneStatistics.displayName = 'ZoneStatistics';

export default ZoneStatistics;
