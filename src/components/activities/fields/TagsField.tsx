import React, { useState } from 'react';
import type { FieldConfig } from '../../../types/activityFields';

interface TagsFieldProps {
  field: FieldConfig;
  value: string[];
  onChange: (value: string[]) => void;
}

export const TagsField: React.FC<TagsFieldProps> = ({
  field,
  value = [],
  onChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const [removedItems, setRemovedItems] = useState<string[]>([]);

  const addTag = (tagValue: string) => {
    const trimmedValue = tagValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      const newTags = [...value, trimmedValue];
      onChange(newTags);
      setInputValue('');
      // Remove from removed items if it was there
      setRemovedItems(prev => prev.filter(item => item !== trimmedValue));
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = value.filter(tag => tag !== tagToRemove);
    onChange(newTags);
    setRemovedItems(prev => [...prev, tagToRemove]);
  };

  const restoreTag = (tagToRestore: string) => {
    setRemovedItems(prev => prev.filter(item => item !== tagToRestore));
    addTag(tagToRestore);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input and Add Button */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={field.placeholder || `Add ${field.label.toLowerCase()}`}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => addTag(inputValue)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Active Tags */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {value.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Removed Items Dropdown */}
      {removedItems.length > 0 && (
        <div className="relative">
          <button
            type="button"
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <span>Restore removed items</span>
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {removedItems.length}
            </span>
          </button>
          
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
            <div className="py-1">
              {removedItems.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => restoreTag(item)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
};
