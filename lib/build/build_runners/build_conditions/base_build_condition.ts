export interface BaseBuildCondition {
  /**
   * The name of some parameter to match against.
   *
   * eg: `teamcity.agent.jvm.os.name`
   *
   * > HINT: The left hand side of the expression.
   */
  name: string;
}
