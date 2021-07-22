import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import { Construct } from "../../construct.ts";
import { BuildCondition } from "./build_conditions/mod.ts";

export interface BaseBuildRunnerProps extends Record<string, unknown> {
  /**
   * This ID is not exposed in UI and is just an incrementing number.
   *
   * eg: `RUNNER_1`, `RUNNER_2`, `RUNNER_3`, etc...
   *
   * So if not set it will be set for you.
   */
  readonly id: string;

  /**
   * A human friendly name for the runner.
   */
  name?: string;

  /**
   * Determine if a build step should run based on the results of previous steps.
   *
   * - **default:** If all previous steps finished successfully: the build
   *   analyzes only the build step status on the build agent, and doesn't
   *   send a request to the server to check the build status and considers
   *   only important step failures.
   *
   * - **execute_if_success:** Only if build status is successful: before
   *   starting the step, the build agent requests the build status from the
   *   server, and skips the step if the status is failed. This considers the
   *   failure conditions processed by the server, like failure on test failures
   *   or on metric change.
   *
   *   Note that this still can be not exact as some failure conditions are
   *   processed on the server asynchronously (TW-17015)
   *
   * - **execute_if_failed:** Even if some of the previous steps failed: select
   *   to make TeamCity execute this step regardless of the status of previous
   *   steps and status of the build.
   *
   * - **execute_always:** Always, even if build stop command was issued: select
   *   to ensure this step is always executed, even if the build was canceled by
   *   a user. For example, if you have two steps with this option configured,
   *   stopping the build during the first step execution will interrupt this
   *   step, while the second step will still run. Issuing the stop command for
   *   the second time will result in ignoring the execution policy: the build
   *   will be terminated.
   *
   * Defaults to `default`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-build-steps.html#Execution+policy
   */
  executionPolicy?:
    | "default"
    | "execute_if_success"
    | "execute_if_failed"
    | "execute_always";

  /**
   * When configuring a build step, you can choose a general execution policy
   * and, since TeamCity 2020.1, add a parameter-based execution condition.
   *
   * Execution conditions make builds more flexible and address many common use
   * cases, such as:
   *
   * - running the step only in the default branch
   * - running the step only in the release branch
   * - skipping the step in personal builds
   *
   * see: https://www.jetbrains.com/help/teamcity/build-step-execution-conditions.html
   */
  conditions?: BuildCondition[];
}

export abstract class BaseBuildRunner<
  TProps extends BaseBuildRunnerProps,
> extends Construct<TProps, Build> {
  constructor(scope: Build, props: TProps) {
    super(scope, props);
    Construct.push(scope, "runners", this);
    scope["_addXmlBuilder"](
      BaseBuildRunner,
      (x: XmlElement) => {
        x.Node("build-runners", (x) => {
          for (const runner of scope.runners ?? []) {
            x.Node(runner.toXml());
          }
        });
      },
    );
  }

  protected _baseToXml(
    type: string,
    builder: (x: XmlElement) => void,
  ): XmlElement {
    return new XmlElement(
      "runner",
      { id: this.props.id, type: type },
      (x) => {
        builder(x);
      },
    );
  }

  abstract toXml(): XmlElement;
}

declare module "../build.ts" {
  interface Build {
    /** A readonly list of Runners added to this Build. */
    readonly runners?: readonly BaseBuildRunner<
      BaseBuildRunnerProps
    >[];
  }
}
