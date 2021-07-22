export type ParameterSpec =
  | ParameterSpecText
  | ParameterSpecPassword
  | ParameterSpecCheckbox
  | ParameterSpecSelect;

export interface ParameterSpecBase {
  /**
   * Custom label to be shown in custom run build dialog
   * instead of parameter name.
   */
  label?: string;

  /**
   * Description to be shown in custom run build dialog.
   */
  description?: string;

  /**
   * Use 'Hidden' to hide parameter from custom run dialog.
   *
   * Use 'Prompt' to force custom run dialog with the parameter
   * displayed on every build start.
   */
  display?: "hidden" | "prompt" | "normal";

  /**
   * Make the parameter impossible to override with another value.
   */
  readOnly?: boolean;
}

export interface ParameterSpecPassword extends ParameterSpecBase {
  /**
   * The value will be masked with `***`.
   *
   * WARNING: You should probably be using secure tokens instead of password
   * parameters. As the value of a password parameter although encrypted still
   * ends up in your source control. Where as secure tokens are just a UUID that
   * points to a value stored on the TeamCity server's disk.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/storing-project-settings-in-version-control.html#Storing+Secure+Settings
   */
  type: "password";
}

export interface ParameterSpecText extends ParameterSpecBase {
  /**
   * A normal text based parameter type, the default if no spec is provided.
   */
  type: "text";

  /**
   * A text value can be anything (ie: no validation) or it can be checked that
   * isn't not an empty string or it can be validated against a regular expression.
   *
   * Defaults to: `any`.
   */
  validationMode?: "any" | "not_empty" | "regex";

  /**
   * Specify text to show if regexp validation fails.
   */
  validationMessage?: string;

  /**
   * Specify a Java-style regular expression to validate field value.
   */
  regexp?: string;
}

export interface ParameterSpecCheckbox extends ParameterSpecBase {
  /**
   * A parameter that is useful for boolean values and
   * is rendered as HTML checkbox in the Teamcity UI.
   */
  type: "checkbox";

  /**
   * If the checkbox is checked then this value will be used instead of the
   * value defined in `ParameterSpec.value`.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/?Typed+Parameters#TypedParameters-Checkbox
   */
  checkedValue: string;

  /**
   * If this is defined and the checkbox is unchecked then this value will be
   * used instead of the value defined in `ParameterSpec.value`, otherwise the
   * value of `ParameterSpec.value` is used.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/?Typed+Parameters#TypedParameters-Checkbox
   */
  uncheckedValue?: string;
}

export interface ParameterSpecSelect extends ParameterSpecBase {
  /**
   * A parameter that ise useful for ENUM like values and
   * is rendered as a HTML select control in the TeamCity UI.
   */
  type: "select";

  /**
   * Valid values for this parameter, specified as either a list of values
   * or as a dictionary of label => value pairs.
   */
  items: string[] | Record<string, string>;

  /**
   * Are multiple values allowed to be selected?
   */
  multiple?: boolean;

  /**
   * If multiple are allowed, how will they be separated.
   *
   * By default this is: `,`
   */
  valueSeparator?: string;
}
