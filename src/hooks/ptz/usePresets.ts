import { useState, useCallback } from 'react';

export interface Preset {
  id: number;
  name: string;
  pan: number;
  tilt: number;
  zoom: number;
}

export const usePresets = () => {
  const [selectedPresets, setSelectedPresets] = useState<number[]>([]);
  const [showEditPresetModal, setShowEditPresetModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [showCreatePresetModal, setShowCreatePresetModal] = useState(false);
  const [useCurrentPosition, setUseCurrentPosition] = useState(false);

  // Preset Management Functions
  const handlePresetSelect = useCallback((presetId: number) => {
    setSelectedPresets(prev => 
      prev.includes(presetId) 
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  }, []);

  const handleSelectAllPresets = useCallback(() => {
    const allPresets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    if (selectedPresets.length === allPresets.length) {
      setSelectedPresets([]);
    } else {
      setSelectedPresets(allPresets);
    }
  }, [selectedPresets.length]);

  const handleDeleteSelectedPresets = useCallback(() => {
    if (selectedPresets.length === 0) return;
    
    // Here you would typically make an API call to delete the presets
    console.log("Deleting presets:", selectedPresets);
    
    // For now, just clear the selection
    setSelectedPresets([]);
  }, [selectedPresets]);

  const handleEditPreset = useCallback((preset: Preset) => {
    setEditingPreset(preset);
    setShowEditPresetModal(true);
  }, []);

  const handleSavePreset = useCallback((updatedPreset: Preset) => {
    // Here you would typically make an API call to update the preset
    console.log("Saving preset:", updatedPreset);
    
    setShowEditPresetModal(false);
    setEditingPreset(null);
  }, []);

  return {
    selectedPresets,
    showEditPresetModal,
    editingPreset,
    showCreatePresetModal,
    useCurrentPosition,
    handlePresetSelect,
    handleSelectAllPresets,
    handleDeleteSelectedPresets,
    handleEditPreset,
    handleSavePreset,
    setShowCreatePresetModal,
    setUseCurrentPosition,
    setShowEditPresetModal
  };
};
