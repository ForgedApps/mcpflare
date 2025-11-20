import type { JSONSchemaProperty, MCPTool } from '../types/mcp.js'
import logger from '../utils/logger.js'

export class SchemaConverter {
  /**
   * Convert MCP tool schemas to TypeScript API definitions
   */
  convertToTypeScript(tools: MCPTool[]): string {
    logger.info(
      { toolCount: tools.length },
      'Converting MCP schema to TypeScript',
    )

    const interfaceDefinitions = tools
      .map((tool) => this.generateInterfaceForTool(tool))
      .join('\n\n')

    const apiDefinition = this.generateAPIObject(tools)

    return `${interfaceDefinitions}\n\n${apiDefinition}`
  }

  private generateInterfaceForTool(tool: MCPTool): string {
    const inputInterfaceName = `${this.toPascalCase(tool.name)}Input`
    const outputInterfaceName = `${this.toPascalCase(tool.name)}Output`

    const inputProps = tool.inputSchema.properties || {}
    const required = tool.inputSchema.required || []

    const inputFields = Object.entries(inputProps)
      .map(([key, schema]) => {
        const optional = !required.includes(key)
        // Type assertion: properties are JSONSchemaProperty based on MCPTool type
        const schemaProperty = schema as JSONSchemaProperty
        const tsType = this.jsonSchemaToTypeScript(schemaProperty)
        const description = schemaProperty.description
          ? `\n  /**\n   * ${schemaProperty.description}\n   */\n  `
          : '\n  '

        return `${description}${key}${optional ? '?' : ''}: ${tsType};`
      })
      .join('\n')

    return `interface ${inputInterfaceName} {\n${inputFields}\n}\n\ninterface ${outputInterfaceName} {\n  [key: string]: unknown;\n}`
  }

  private generateAPIObject(tools: MCPTool[]): string {
    const methods = tools
      .map((tool) => {
        const inputType = `${this.toPascalCase(tool.name)}Input`
        const outputType = `${this.toPascalCase(tool.name)}Output`
        const description = tool.description
          ? `\n  /**\n   * ${tool.description}\n   */\n  `
          : '\n  '

        return `${description}${tool.name}: (input: ${inputType}) => Promise<${outputType}>;`
      })
      .join('\n')

    return `declare const mcp: {\n${methods}\n};`
  }

  private jsonSchemaToTypeScript(schema: JSONSchemaProperty): string {
    if (!schema.type) {
      return 'unknown'
    }

    switch (schema.type) {
      case 'string':
        return 'string'
      case 'number':
      case 'integer':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'array': {
        const itemType = schema.items
          ? this.jsonSchemaToTypeScript(schema.items)
          : 'unknown'
        return `${itemType}[]`
      }
      case 'object':
        if (schema.properties) {
          const props = Object.entries(schema.properties)
            .map(([key, value]) => {
              const optional = !(schema.required || []).includes(key)
              // Type assertion: nested properties are JSONSchemaProperty
              return `${key}${optional ? '?' : ''}: ${this.jsonSchemaToTypeScript(value as JSONSchemaProperty)}`
            })
            .join('; ')
          return `{ ${props} }`
        }
        return 'Record<string, unknown>'
      default:
        return 'unknown'
    }
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }
}
