import { WithValueBuildCondition } from "./with_value_build_condition.ts";
import { WithoutValueBuildCondition } from "./without_value_build_condition.ts";

export type BuildCondition =
  | WithValueBuildCondition
  | WithoutValueBuildCondition;
