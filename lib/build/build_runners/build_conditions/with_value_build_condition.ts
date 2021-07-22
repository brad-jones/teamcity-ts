import { BaseBuildCondition } from "./base_build_condition.ts";

export interface WithValueBuildCondition extends BaseBuildCondition {
  /**
   * A logical condition to apply to the parameter.
   */
  condition:
    | "equals"
    | "does-not-equal"
    | "more-than"
    | "no-more-than"
    | "less-than"
    | "no-less-than"
    | "starts-with"
    | "contains"
    | "does-not-contain"
    | "ends-with"
    | "matches"
    | "does-not-match"
    | "ver-more-than"
    | "ver-no-more-than"
    | "ver-less-than"
    | "ver-no-less-than";

  /**
   * The expected value for this build requirement to evaluate to true.
   *
   * > HINT: The right hand side of the expression.
   */
  value?: string;
}
