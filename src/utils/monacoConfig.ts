import * as monaco from 'monaco-editor';

export const configureMonacoEditor = () => {
  // Configure JSON language features
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [
      {
        uri: 'http://myserver/activity-schema.json',
        fileMatch: ['*'],
        schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE'],
              description: 'Activity status'
            },
            parameters: {
              type: 'object',
              description: 'Activity parameters'
            },
            zones: {
              type: 'object',
              description: 'Zone coordinates'
            },
            lanes: {
              type: 'object',
              description: 'Lane coordinates'
            },
            polygons: {
              type: 'array',
              description: 'Polygon coordinates'
            }
          },
          required: ['status', 'parameters']
        }
      }
    ]
  });

  // Configure editor theme
  monaco.editor.defineTheme('custom-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '9cdcfe' },
      { token: 'string.value.json', foreground: 'ce9178' },
      { token: 'number.json', foreground: 'b5cea8' },
      { token: 'keyword.json', foreground: '569cd6' },
    ],
    colors: {
      'editor.background': '#1e293b',
      'editor.foreground': '#e2e8f0',
      'editorLineNumber.foreground': '#64748b',
      'editorLineNumber.activeForeground': '#94a3b8',
      'editor.selectionBackground': '#334155',
      'editor.inactiveSelectionBackground': '#334155',
      'editorCursor.foreground': '#3b82f6',
      'editorWhitespace.foreground': '#475569',
      'editorIndentGuide.background': '#334155',
      'editorIndentGuide.activeBackground': '#475569',
    }
  });

  // Note: setDefaultOptions doesn't exist in Monaco Editor
  // These options will be set per editor instance
};
