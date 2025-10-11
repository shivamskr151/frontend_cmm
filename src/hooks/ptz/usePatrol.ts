import { useState, useCallback } from 'react';

export interface PatrolPattern {
  id: number;
  name: string;
  pan: number;
  tilt: number;
  zoom: number;
}

export type PatrolStatus = 'idle' | 'running' | 'paused';

export const usePatrol = (sendPatrolCommand: (action: string, patternId?: number, pattern?: any) => void) => {
  const [patrolStatus, setPatrolStatus] = useState<PatrolStatus>('idle');
  const [currentPatrolStep, setCurrentPatrolStep] = useState(0);
  const [patrolProgress, setPatrolProgress] = useState(0);
  const [selectedPatrolPatterns, setSelectedPatrolPatterns] = useState<number[]>([]);
  const [showEditPatrolModal, setShowEditPatrolModal] = useState(false);
  const [editingPatrolPattern, setEditingPatrolPattern] = useState<PatrolPattern | null>(null);

  // Patrol patterns data
  const patrolPatterns: PatrolPattern[] = [
    { id: 1, name: "Standard Patrol", pan: 0.5, tilt: 0.3, zoom: 50 },
    { id: 2, name: "Quick Scan", pan: 0.8, tilt: 0.7, zoom: 75 },
    { id: 3, name: "Detailed Survey", pan: 0.2, tilt: 0.4, zoom: 90 },
    { id: 4, name: "Perimeter Check", pan: 0.9, tilt: 0.1, zoom: 25 },
    { id: 5, name: "Entrance Monitor", pan: 0.1, tilt: 0.8, zoom: 60 },
    { id: 6, name: "Parking Lot View", pan: 0.7, tilt: 0.6, zoom: 40 },
    { id: 7, name: "Building Corner", pan: 0.3, tilt: 0.2, zoom: 80 },
    { id: 8, name: "Main Gate", pan: 0.6, tilt: 0.9, zoom: 35 }
  ];

  const startPatrol = useCallback((patternId: number) => {
    const pattern = patrolPatterns.find(p => p.id === patternId);
    if (!pattern) return;

    sendPatrolCommand("start_patrol", patternId, pattern);
    setPatrolStatus('running');
    setCurrentPatrolStep(0);
    setPatrolProgress(0);
    console.log("🚀 Started patrol:", pattern);
  }, [patrolPatterns, sendPatrolCommand]);

  const stopPatrol = useCallback(() => {
    sendPatrolCommand("stop_patrol");
    setPatrolStatus('idle');
    setCurrentPatrolStep(0);
    setPatrolProgress(0);
    console.log("🛑 Stopped patrol");
  }, [sendPatrolCommand]);

  const pausePatrol = useCallback(() => {
    sendPatrolCommand("pause_patrol");
    setPatrolStatus('paused');
    console.log("⏸️ Paused patrol");
  }, [sendPatrolCommand]);

  const resumePatrol = useCallback(() => {
    sendPatrolCommand("resume_patrol");
    setPatrolStatus('running');
    console.log("▶️ Resumed patrol");
  }, [sendPatrolCommand]);

  // Patrol Pattern Management Functions
  const handlePatrolPatternSelect = useCallback((patternId: number) => {
    setSelectedPatrolPatterns(prev => 
      prev.includes(patternId) 
        ? prev.filter(id => id !== patternId)
        : [...prev, patternId]
    );
  }, []);

  const handleSelectAllPatrolPatterns = useCallback(() => {
    if (selectedPatrolPatterns.length === patrolPatterns.length) {
      setSelectedPatrolPatterns([]);
    } else {
      setSelectedPatrolPatterns(patrolPatterns.map(p => p.id));
    }
  }, [selectedPatrolPatterns.length, patrolPatterns]);

  const handleDeleteSelectedPatrolPatterns = useCallback(() => {
    if (selectedPatrolPatterns.length === 0) return;
    
    // Here you would typically make an API call to delete the patterns
    console.log("Deleting patrol patterns:", selectedPatrolPatterns);
    
    // For now, just clear the selection
    setSelectedPatrolPatterns([]);
  }, [selectedPatrolPatterns]);

  const handleEditPatrolPattern = useCallback((pattern: PatrolPattern) => {
    setEditingPatrolPattern(pattern);
    setShowEditPatrolModal(true);
  }, []);

  const handleSavePatrolPattern = useCallback((updatedPattern: PatrolPattern) => {
    // Here you would typically make an API call to update the pattern
    console.log("Saving patrol pattern:", updatedPattern);
    
    setShowEditPatrolModal(false);
    setEditingPatrolPattern(null);
  }, []);

  return {
    patrolStatus,
    currentPatrolStep,
    patrolProgress,
    selectedPatrolPatterns,
    showEditPatrolModal,
    editingPatrolPattern,
    patrolPatterns,
    startPatrol,
    stopPatrol,
    pausePatrol,
    resumePatrol,
    handlePatrolPatternSelect,
    handleSelectAllPatrolPatterns,
    handleDeleteSelectedPatrolPatterns,
    handleEditPatrolPattern,
    handleSavePatrolPattern,
    setShowEditPatrolModal
  };
};
