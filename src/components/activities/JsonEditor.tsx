import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { configureMonacoEditor } from '../../utils/monacoConfig';
import sampleActivitiesData from '../../data/sampleActivitiesData.json';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  placeholder?: string;
  readOnly?: boolean;
  onValidate?: (isValid: boolean, errors: string[]) => void;
  hideGenerateData?: boolean;
  sensorId?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  height = '400px',
  placeholder = 'Enter JSON data...',
  readOnly = false,
  onValidate,
  hideGenerateData = false,
  sensorId
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor;
    
    // Configure Monaco editor
    configureMonacoEditor();
    
    // Set theme
    monaco.editor.setTheme('custom-light');
    
    // Remove iPad keyboard widget and other problematic widgets
    const removeProblematicWidgets = () => {
      // Remove iPad keyboard widget
      const iPadWidgets = document.querySelectorAll('.iPadShowKeyboard, [widgetid="editor.contrib.ShowKeyboardWidget"]');
      iPadWidgets.forEach(widget => {
        if (widget.parentNode) {
          widget.parentNode.removeChild(widget);
        }
      });
      
      // Remove other problematic Monaco widgets
      const problematicWidgets = document.querySelectorAll('[widgetid*="ShowKeyboard"], [widgetid*="iPad"]');
      problematicWidgets.forEach(widget => {
        if (widget.parentNode) {
          widget.parentNode.removeChild(widget);
        }
      });
    };
    
    // Remove widgets immediately
    removeProblematicWidgets();
    
    // Set up observer to remove widgets as they appear
    const observer = new MutationObserver(() => {
      removeProblematicWidgets();
    });
    
    // Observe the editor container for new widgets
    const editorContainer = editor.getDomNode();
    if (editorContainer) {
      observer.observe(editorContainer, {
        childList: true,
        subtree: true
      });
    }
    
    // Add JSON validation
    const validateJson = () => {
      try {
        if (value.trim()) {
          JSON.parse(value);
          setIsValid(true);
          setErrors([]);
          onValidate?.(true, []);
        } else {
          setIsValid(true);
          setErrors([]);
          onValidate?.(true, []);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
        setIsValid(false);
        setErrors([errorMessage]);
        onValidate?.(false, [errorMessage]);
      }
    };

    // Validate on content change
    editor.onDidChangeModelContent(() => {
      const currentValue = editor.getValue();
      onChange(currentValue);
      validateJson();
    });

    // Initial validation
    validateJson();

    // Clean up observer when component unmounts
    return () => {
      observer.disconnect();
    };
  };

  const formatJson = () => {
    if (editorRef.current && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        const formatted = JSON.stringify(parsed, null, 2);
        editorRef.current.setValue(formatted);
        onChange(formatted);
      } catch (error) {
        console.error('Cannot format invalid JSON:', error);
      }
    }
  };

  const clearEditor = () => {
    if (editorRef.current) {
      editorRef.current.setValue('');
      onChange('');
    }
  };

  const generateData = async () => {
    if (editorRef.current && !isGenerating) {
      setIsGenerating(true);
      
      // Add a small delay to simulate loading
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create data with sensorId if provided
      const dataToGenerate = sensorId 
        ? { sensorId, ...sampleActivitiesData }
        : sampleActivitiesData;
      
      const formattedData = JSON.stringify(dataToGenerate, null, 2);
      editorRef.current.setValue(formattedData);
      onChange(formattedData);
      
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      {/* Hide iPad keyboard widget and other problematic Monaco widgets */}
      <style>
        {`
          /* Hide iPad keyboard widget */
          .iPadShowKeyboard,
          [widgetid="editor.contrib.ShowKeyboardWidget"],
          .monaco-editor .iPadShowKeyboard,
          .monaco-editor [widgetid="editor.contrib.ShowKeyboardWidget"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          
          /* Hide other problematic Monaco widgets on mobile */
          @media (max-width: 768px) {
            .monaco-editor .monaco-widget,
            .monaco-editor .monaco-widget-overlay,
            .monaco-editor .iPadShowKeyboard,
            .monaco-editor [widgetid*="ShowKeyboard"],
            .monaco-editor [widgetid*="iPad"] {
              display: none !important;
              visibility: hidden !important;
            }
          }
        `}
      </style>
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between mb-2 p-2 bg-gray-100 rounded-t-lg border-b border-gray-300">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">JSON Editor</span>
          {!isValid && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              Invalid JSON
            </span>
          )}
          {isValid && value.trim() && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9 12l2 2 4-4"></path>
              </svg>
              Valid JSON
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!hideGenerateData && (
            <button
              type="button"
              onClick={generateData}
              disabled={isGenerating}
              className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded border border-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Generate sample data"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Data'
              )}
            </button>
          )}
          <button
            type="button"
            onClick={formatJson}
            disabled={!value.trim() || !isValid}
            className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded border border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Format JSON"
          >
            Format
          </button>
          <button
            type="button"
            onClick={clearEditor}
            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300 transition-colors"
            title="Clear editor"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="border border-gray-300 rounded-b-lg overflow-hidden">
        <Editor
          height={height}
          defaultLanguage="json"
          value={value}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            theme: 'custom-light',
            selectOnLineNumbers: true,
            renderLineHighlight: 'line',
            cursorStyle: 'line',
            automaticLayout: true,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: 'off',
            parameterHints: {
              enabled: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            bracketPairColorization: {
              enabled: true,
            },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            placeholder: placeholder,
            // Disable mobile-specific widgets
            contextmenu: false,
            mouseWheelZoom: false,
            // Disable iPad keyboard widget
            domReadOnly: false,
            // Disable touch-specific features that cause issues
            disableLayerHinting: true,
            // Ensure proper mobile behavior
            scrollBeyondLastLine: false,
            // Disable problematic mobile widgets
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            // Disable iPad-specific features
            // enableSplitViewResizing: false, // This option doesn't exist in Monaco Editor
            // Additional mobile optimizations
            minimap: {
              enabled: false,
            },
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
            },
          }}
        />
      </div>

      {/* Error Display */}
      {!isValid && errors.length > 0 && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <div>
              <p className="text-red-600 font-medium">JSON Validation Error:</p>
              <p className="text-red-700 text-xs mt-1">{errors[0]}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
