# UI Component Guidelines

## Component Library Standards

This project follows shadcn/ui design patterns for consistency across the webview UI.

## Rules

1. **Use shadcn-style components**: All UI components should follow shadcn/ui design patterns and API conventions.

2. **Switch Component**: 
   - Use the `Switch` component for all binary toggle controls
   - Do NOT create custom toggle implementations
   - The Switch component handles proper alignment, accessibility, and consistent styling
   - Props: `checked`, `onCheckedChange`, `disabled?`, `className?`

3. **Component Consistency**:
   - All interactive components should follow the same design language
   - Use existing components from `components.tsx` before creating new ones
   - When creating new components, follow shadcn/ui patterns

4. **Accessibility**:
   - All interactive components must be keyboard accessible
   - Use proper ARIA attributes (role, aria-checked, etc.)
   - Support Enter and Space key for activation

## Examples

### ✅ Correct: Using Switch component
```tsx
<Switch 
  checked={isGuarded} 
  onCheckedChange={(checked) => setGuarded(checked)}
/>
```

### ❌ Incorrect: Custom toggle implementation
```tsx
<div onClick={() => toggle()}>
  <div style={{ /* custom styles */ }} />
</div>
```

## Component Reference

- `Switch`: Binary toggle control (shadcn-style)
- `Toggle`: Toggle with label/description wrapper (uses Switch internally)
- `Button`: Standard button component
- `Input`: Text input component
- `TagInput`: Tag input component



