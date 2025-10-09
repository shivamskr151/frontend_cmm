# Dynamic Activity Parameters UI

This system provides a dynamic, type-safe UI for configuring activity parameters based on the selected activity type.

## Features

- **Dynamic Form Generation**: Automatically generates appropriate UI fields based on activity type
- **Type-Safe**: Full TypeScript support with proper type definitions
- **Field Types Supported**:
  - Number inputs with validation
  - Sliders with visual feedback
  - Tag management with add/remove functionality
  - Time range pickers
  - Boolean toggles
  - Coordinate inputs
  - Speed limit management
  - Scheduled time configuration

## Usage

### Basic Integration

```tsx
import { DynamicActivityForm } from '../components/activities/DynamicActivityForm';

function MyComponent() {
  const [selectedActivity, setSelectedActivity] = useState('');
  const [parameters, setParameters] = useState({});

  return (
    <DynamicActivityForm
      selectedActivity={selectedActivity}
      initialValues={parameters}
      onChange={setParameters}
    />
  );
}
```

### Activity Configuration

Activities are configured in `src/config/activityFieldConfigs.ts`. Each activity can have:

- **Categories**: Group related fields together
- **Fields**: Individual parameter configurations with:
  - Type (number, slider, tags, etc.)
  - Validation rules (min, max, required)
  - Default values
  - Descriptions

### Example Activity Configuration

```typescript
export const activityFieldConfigs: ActivityFieldConfig = {
  person_violations: {
    categories: ['Detection', 'Thresholds', 'Time Settings'],
    fields: [
      {
        id: 'iou',
        label: 'IoU Threshold',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.8,
        category: 'Thresholds'
      },
      {
        id: 'acts',
        label: 'Actions',
        type: 'tags',
        defaultValue: [],
        category: 'Detection'
      }
    ]
  }
};
```

## Field Types

### Number Field
- Standard number input with min/max validation
- Supports step values for decimal precision

### Slider Field
- Visual slider with real-time value display
- Supports direct input for precise values
- Custom styling with hover effects

### Tags Field
- Add/remove tags with validation
- Removed items can be restored
- Supports duplicate prevention

### Time Range Field
- Multiple time range configuration
- Add/remove time periods
- Time picker interface

### Boolean Field
- Simple checkbox toggle
- Clear labeling and descriptions

### Coordinates Field
- X/Y coordinate pairs
- Add/remove coordinate points
- Number validation

### Speed Limits Field
- Vehicle type and speed limit pairs
- Dynamic add/remove functionality
- Input validation

### Scheduled Time Field
- Complex scheduling with time ranges, days, and timezones
- Multiple schedule support
- Day selection with visual feedback

## Styling

The components use Tailwind CSS classes and include custom CSS for enhanced styling (e.g., slider components). All components are responsive and follow the existing design system.

## Data Flow

1. User selects an activity
2. System loads field configuration for that activity
3. Form renders appropriate field types
4. User interactions update the parameter values
5. Changes are propagated via the `onChange` callback
6. Parent component can save/process the updated parameters

## Extending the System

To add new field types:

1. Create a new field component in `src/components/activities/fields/`
2. Add the field type to the `FieldConfig` type definition
3. Update the `DynamicActivityForm` to handle the new field type
4. Add the new field type to activity configurations as needed

## Performance

- Fields are only rendered when the activity is selected
- Efficient re-rendering with React's reconciliation
- Minimal bundle size impact with tree-shaking support
