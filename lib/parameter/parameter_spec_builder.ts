import { ParameterSpec } from "./parameter_spec.ts";

/** TODO: escape quotes??? */
export function specBuilder(input: ParameterSpec): string {
  let output = `${input.type} `;

  if (typeof input.label === "string") {
    output += `label='${input.label}' `;
  }

  if (typeof input.display === "string") {
    output += `display='${input.display}' `;
  }

  if (typeof input.description === "string") {
    output += `description='${input.description}' `;
  }

  if (typeof input.readOnly === "boolean" && input.readOnly) {
    output += `readOnly='true' `;
  }

  switch (input.type) {
    case "password":
      // Nothing to do here
      break;
    case "text":
      output += `validationMode='${input?.validationMode ?? "any"}' `;

      if (typeof input.validationMessage === "string") {
        output += `validationMessage='${input.validationMessage}' `;
      }

      if (input?.validationMode === "regex") {
        if (typeof input?.regexp !== "string") {
          throw new Error("validationMode=regex but no regex has been set");
        }
        output += `regexp='${input.regexp}' `;
      }

      break;
    case "checkbox":
      output += `checkedValue='${input.checkedValue}' `;

      if (typeof input.uncheckedValue === "string") {
        output += `uncheckedValue='${input.uncheckedValue}' `;
      }

      break;
    case "select": {
      if (typeof input.multiple === "boolean" && input.multiple) {
        output += `multiple='true' `;
      }

      if (typeof input.valueSeparator === "string") {
        output += `valueSeparator='${input.valueSeparator}' `;
      }

      const data = Array.isArray(input.items)
        ? input.items
        : Object.values(input.items);
      data.forEach((v, i) => {
        output += `data_${i++}='${v}' `;
      });

      if (!Array.isArray(input.items)) {
        Object.keys(input.items).forEach((v, i) => {
          output += `label_${i++}='${v}' `;
        });
      }

      break;
    }
    default:
      throw new Error("unsupported parameter spec type");
  }

  return output.trimEnd();
}
