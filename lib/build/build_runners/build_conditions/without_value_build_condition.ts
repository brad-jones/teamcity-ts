import { BaseBuildCondition } from "./base_build_condition.ts";

export interface WithoutValueBuildCondition extends BaseBuildCondition {
  /**
   * A logical condition to apply to the parameter.
   */
  condition:
    | "exists"
    | "not-exists";
}
