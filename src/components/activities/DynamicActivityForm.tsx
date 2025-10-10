import React, { useState, useEffect } from 'react';
import type { FieldConfig, FieldValue } from '../../types/activityFields';
import { activityFieldConfigs } from '../../config/activityFieldConfigs';
import { FieldTypeDetector } from '../../utils/fieldTypeDetector';
import {
  NumberField,
  SliderField,
  TagsField,
  TimeRangeField,
  BooleanField,
  CoordinatesField,
  SpeedLimitsField,
  ScheduledTimeField,
  TimeWindowField,
  MappingField,
  ArrayField,
  ObjectField
} from './fields';

interface DynamicActivityFormProps {
  selectedActivity: string;
  initialValues?: FieldValue;
  onChange: (values: FieldValue) => void;
  className?: string;
}

export const DynamicActivityForm: React.FC<DynamicActivityFormProps> = ({
  selectedActivity,
  initialValues = {},
  onChange,
  className = ''
}) => {
  const [values, setValues] = useState<FieldValue>(initialValues);
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setError(null);
      console.log('DynamicActivityForm - Activity changed to:', selectedActivity);
      
      if (selectedActivity) {
        let configFields: FieldConfig[] = [];
        
        // First try to get predefined config
        if (activityFieldConfigs[selectedActivity]) {
          configFields = activityFieldConfigs[selectedActivity].fields;
          console.log('Using predefined config for:', selectedActivity, 'fields:', configFields.length);
        } else {
          // Auto-generate field configs from activity parameters
          const activityData = initialValues || {};
          configFields = FieldTypeDetector.generateFieldConfigs(selectedActivity, activityData);
          console.log('Auto-generated config for:', selectedActivity, 'fields:', configFields.length);
        }
        
        setFieldConfigs(configFields);
        
        // Initialize values with defaults
        const defaultValues: FieldValue = {};
        configFields.forEach(field => {
          try {
            if (field.defaultValue !== undefined && !(field.id in initialValues)) {
              defaultValues[field.id] = field.defaultValue;
            }
            // Special handling for time_window - ensure it has at least one default window
            if (field.id === 'time_window' && (!initialValues[field.id] || (Array.isArray(initialValues[field.id]) && initialValues[field.id].length === 0))) {
              defaultValues[field.id] = [{
                time_start_end: [['08:00', '18:00']],
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                timezone: 'Asia/Kolkata'
              }];
            }
          } catch (fieldError) {
            console.error('Error processing field:', field.id, fieldError);
          }
        });
        
        const newValues = { ...defaultValues, ...initialValues };
        console.log('Setting values for:', selectedActivity, newValues);
        setValues(newValues);
        onChange(newValues);
      } else {
        setFieldConfigs([]);
        setValues({});
        onChange({});
      }
    } catch (error) {
      console.error('Error in DynamicActivityForm useEffect:', error);
      setError(`Error loading activity configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedActivity]); // Removed initialValues and onChange from dependencies to prevent infinite loops

  const handleFieldChange = (fieldId: string, value: unknown) => {
    const newValues = { ...values, [fieldId]: value };
    setValues(newValues);
    onChange(newValues);
  };

  const renderField = (field: FieldConfig) => {
    try {
      const commonProps = {
        field,
        value: values[field.id],
        onChange: (value: unknown) => handleFieldChange(field.id, value)
      };

    switch (field.type) {
      case 'number':
        return <NumberField key={field.id} {...commonProps} />;
      case 'slider':
        return <SliderField key={field.id} {...commonProps} />;
      case 'tags':
        return <TagsField key={field.id} {...commonProps} />;
      case 'timeRange':
        return <TimeRangeField key={field.id} {...commonProps} />;
      case 'boolean':
        return <BooleanField key={field.id} {...commonProps} />;
      case 'coordinates':
        return <CoordinatesField key={field.id} {...commonProps} />;
      case 'speedLimits':
        return <SpeedLimitsField key={field.id} {...commonProps} />;
      case 'scheduledTime':
        return <ScheduledTimeField key={field.id} {...commonProps} />;
      case 'timeWindow':
        return <TimeWindowField key={field.id} {...commonProps} />;
      case 'mapping':
        return <MappingField key={field.id} {...commonProps} />;
      case 'array':
        return <ArrayField key={field.id} {...commonProps} />;
      case 'object':
        return <ObjectField key={field.id} {...commonProps} />;
      default:
        return (
          <div key={field.id} className="text-red-500">
            Unknown field type: {field.type}
          </div>
        );
    }
    } catch (fieldError) {
      console.error('Error rendering field:', field.id, fieldError);
      return (
        <div key={field.id} className="text-red-500 p-2 border border-red-300 rounded">
          Error rendering field "{field.id}": {fieldError instanceof Error ? fieldError.message : 'Unknown error'}
        </div>
      );
    }
  };

  const groupFieldsByCategory = () => {
    const categories: { [key: string]: FieldConfig[] } = {};
    
    fieldConfigs.forEach(field => {
      const category = field.category || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(field);
    });
    
    return categories;
  };

  if (error) {
    return (
      <div className={`text-center text-red-500 py-8 ${className}`}>
        <div className="text-lg font-medium mb-2">Error Loading Activity</div>
        <div className="text-sm">{error}</div>
        <button 
          onClick={() => setError(null)}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!selectedActivity || fieldConfigs.length === 0) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className}`}>
        <div className="text-lg font-medium mb-2">No Activity Selected</div>
        <div className="text-sm">Select an activity to configure its parameters</div>
      </div>
    );
  }

  const categories = groupFieldsByCategory();

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          {selectedActivity.replace(/_/g, ' ').toUpperCase()} Configuration
        </h3>
        <p className="text-sm text-blue-700">
          Configure parameters for the selected monitoring activity
        </p>
      </div>

      {Object.entries(categories).map(([categoryName, fields]) => (
        <div key={categoryName} className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            {categoryName}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(renderField)}
          </div>
        </div>
      ))}
    </div>
  );
};
