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

  // Configure white theme
  monaco.editor.defineTheme('custom-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '0451a5' },
      { token: 'string.value.json', foreground: '0a7a0a' },
      { token: 'number.json', foreground: '098658' },
      { token: 'keyword.json', foreground: '0000ff' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#237893',
      'editorLineNumber.activeForeground': '#0b216f',
      'editor.selectionBackground': '#add6ff',
      'editor.inactiveSelectionBackground': '#e5ebf1',
      'editorCursor.foreground': '#000000',
      'editorWhitespace.foreground': '#bfbfbf',
      'editorIndentGuide.background': '#d3d3d3',
      'editorIndentGuide.activeBackground': '#939393',
    }
  });

  // Note: setDefaultOptions doesn't exist in Monaco Editor
  // These options will be set per editor instance
};
