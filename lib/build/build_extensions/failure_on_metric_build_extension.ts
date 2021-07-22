import { Build } from "../build.ts";
import { AllXOR } from "../../types.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface FailureOnMetricBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * The build metric to compare.
   */
  metric:
    | "artifactsSize"
    | "buildDurationSecs"
    | "buildLogSize"
    | "numberOfClasses"
    | "numberOfCodeDuplicates"
    | "numberOfCoveredClasses"
    | "numberOfCoveredLines"
    | "numberOfCoveredMethods"
    | "numberOfFailedTests"
    | "numberOfIgnoredTests"
    | "numberOfInspectionErrors"
    | "numberOfInspectionWarnings"
    | "numberOfLinesOfCode"
    | "numberOfMethods"
    | "numberOfPassedTests"
    | "numberOfTests"
    | "percentageOfBlockCoverage"
    | "percentageOfBranchCoverage"
    | "percentageOfClassCoverage"
    | "percentageOfLineCoverage"
    | "percentageOfMethodCoverage"
    | "percentageOfStatementCoverage"
    | "testsDurationSecs"
    | "totalArtifactsSize";

  /**
   * In general, there are two ways to configure this build fail condition:
   *
   * A build metric exceeds or is less than the specified constant value (threshold).
   * For example, Fail build if its "build duration (secs) ", compared to the
   * constant value, is "more" than "300 ". In this case, a build will fail if
   * it runs more than 300 seconds.
   *
   * A build metric has changed comparing to a specific build by a specified value.
   * For example, Fail build if its "build duration (secs)" compared to a value
   * from another build is "more" by at least "300" default units for this metric
   * than the value in the "Last successful build ". In this case, a build will
   * fail if it runs 300 seconds longer than the last successful build.
   *
   * Defaults to `CONSTANT_VALUE`.
   */
  comparedTo?:
    | "CONSTANT_VALUE"
    | "LATEST_SUCCESSFUL_BUILD"
    | "LATEST_PINNED_BUILD"
    | "LATEST_FINISHED_BUILD"
    | AllXOR<[{
      /**
       * Build with specified build number.
       *
       * see: https://www.jetbrains.com/help/teamcity/build-number.html
       */
      buildNumber: number;
    }, {
      /**
       * Latest finished build with specified tag.
       *
       * see: https://www.jetbrains.com/help/teamcity/build-tag.html
       */
      buildTag: string;
    }]>;

  /**
   * How to apply `byAtLeast` to the `metric`.
   */
  is: "more" | "less" | "different";

  /**
   * A numeric value for the comparison.
   */
  byAtLeast: number;

  /**
   * If enabled `byAtLeast` is treated as a percentage instead of a raw unit.
   *
   * Defaults to `false`.
   *
   * > HINT: If set to `true`, `comparedTo` can not be set to `CONSTANT_VALUE`
   * > as you are checking for a percentage change from some other build.
   */
  percent?: boolean;

  /**
   * Immediately stop the build if it fails due to the condition.
   *
   * Defaults to `true`.
   */
  stopBuild?: boolean;
}

/**
 * When your build uses code examining tools like code coverage, duplicates
 * finders, or inspections, it generates various numeric metrics. For these
 * metrics, you can specify a threshold which, when exceeded, will fail a build.
 *
 * see: https://www.jetbrains.com/help/teamcity/build-failure-conditions.html#Fail+build+on+metric+change
 */
export class FailureOnMetricBuildExtension
  extends BaseBuildExtension<FailureOnMetricBuildExtensionProps> {
  constructor(scope: Build, props: FailureOnMetricBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("BuildFailureOnMetric", (x) => {
      x.Node("parameters", (x) => {
        const comparedTo = this.props.comparedTo ?? "CONSTANT_VALUE";

        x.Node("param", {
          name: "withBuildAnchor",
          value: comparedTo === "CONSTANT_VALUE" ? "false" : "true",
        });

        if (comparedTo !== "CONSTANT_VALUE") {
          x.Node("param", {
            name: "anchorBuild",
            value: comparedToMapper(comparedTo),
          });

          if (typeof comparedTo === "object" && comparedTo !== null) {
            const keys = Object.keys(comparedTo);
            if (keys.includes("buildNumber")) {
              x.Node("param", {
                name: "buildNumberPattern",
                value: comparedTo.buildNumber!.toString(),
              });
            } else {
              if (keys.includes("buildTag")) {
                x.Node("param", {
                  name: "buildTag",
                  value: comparedTo.buildTag!,
                });
              } else {
                throw new Error("unexpected this.props.comparedTo object");
              }
            }
          }
        }

        x.Node("param", {
          name: "metricKey",
          value: metricNameMapper(this.props.metric),
        });

        x.Node("param", { name: "moreOrLess", value: this.props.is });

        x.Node("param", {
          name: "metricThreshold",
          value: this.props.byAtLeast.toString(),
        });

        x.Node("param", {
          name: "metricUnits",
          value: (this.props.percent ?? false)
            ? "metricUnitsPercents"
            : "metricUnitsDefault",
        });

        x.Node("param", {
          name: "stopBuildOnFailure",
          value: (this.props.stopBuild ?? true) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new FailureOnMetricBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.FailureOnMetricExtension({ ... });
     *  });
     * });
     * ```
     */
    FailureOnMetricExtension(
      props: FailureOnMetricBuildExtensionProps,
    ): FailureOnMetricBuildExtension;
  }
}

Build.prototype.FailureOnMetricExtension = function (
  this: Build,
  props: FailureOnMetricBuildExtensionProps,
) {
  return new FailureOnMetricBuildExtension(this, props);
};

const metricNames: Record<string, string> = {
  "artifactsSize": "VisibleArtifactsSize",
  "buildDurationSecs": "BuildDurationNetTime",
  "buildLogSize": "buildLogSize",
  "numberOfClasses": "CodeCoverageAbsCTotal",
  "numberOfCodeDuplicates": "DuplicatorStats",
  "numberOfCoveredClasses": "CodeCoverageAbsCCovered",
  "numberOfCoveredLines": "CodeCoverageAbsLCovered",
  "numberOfCoveredMethods": "CodeCoverageAbsMCovered",
  "numberOfFailedTests": "buildFailedTestCount",
  "numberOfIgnoredTests": "buildIgnoredTestCount",
  "numberOfInspectionErrors": "InspectionStatsE",
  "numberOfInspectionWarnings": "InspectionStatsW",
  "numberOfLinesOfCode": "CodeCoverageAbsLTotal",
  "numberOfMethods": "CodeCoverageAbsMTotal",
  "numberOfPassedTests": "buildPassedTestCount",
  "numberOfTests": "buildTestCount",
  "percentageOfBlockCoverage": "CodeCoverageB",
  "percentageOfBranchCoverage": "CodeCoverageR",
  "percentageOfClassCoverage": "CodeCoverageC",
  "percentageOfLineCoverage": "CodeCoverageL",
  "percentageOfMethodCoverage": "CodeCoverageM",
  "percentageOfStatementCoverage": "CodeCoverageS",
  "testsDurationSecs": "TestsDuration",
  "totalArtifactsSize": "ArtifactsSize",
};
function metricNameMapper(input: string) {
  return metricNames[input];
}

const comparedNames: Record<string, string> = {
  "LATEST_SUCCESSFUL_BUILD": "lastSuccessful",
  "LATEST_PINNED_BUILD": "lastPinned",
  "LATEST_FINISHED_BUILD": "lastFinished",
};
function comparedToMapper(input: unknown): string {
  if (typeof input === "string") {
    return comparedNames[input];
  }

  if (typeof input === "object" && input !== null) {
    return Object.keys(input)[0];
  }

  throw new Error("failed to map comparedTo value");
}
