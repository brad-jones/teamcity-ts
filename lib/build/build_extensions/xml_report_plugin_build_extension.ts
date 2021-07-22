import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface XmlReportPluginBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * XML Report Processing supports:
   *
   * Testing frameworks:
   * - JUnit Ant task
   * - Maven Surefire/Failsafe plugin
   * - NUnit-Console XML reports
   * - TRX reports
   * - Google Test XML reports
   * - XML output from CTest
   *
   * Code inspection tools:
   * - SpotBugs, formerly FindBugs (code inspections only): only SpotBugs native
   *   format is supported (see the corresponding xsd ). The XML report generated
   *   by the SpotBugs Maven plugin is NOT supported: it has a completely different
   *   schema layout and elements.
   * - PMD
   * - Checkstyle
   * - JSLint XML reports
   *
   * Code duplicates tools:
   * - PMD Copy/Paste Detector XML reports
   */
  reportType:
    | "checkstyle"
    | "ctest"
    | "findBugs"
    | "gtest"
    | "jslint"
    | "junit"
    | "mstest"
    | "nunit"
    | "pmd"
    | "pmdCpd"
    | "surefire"
    | "testng"
    | "trx"
    | "vstest";

  /**
   * Specify monitoring rules in the form of `+|-:path`.
   */
  monitoringRules: string[];

  /**
   * Enable detailed logging to the build log.
   *
   * Defaults to `false`.
   */
  verbose?: boolean;
}

/**
 * The XML Report Processing build feature allows using report files produced
 * by an external tool in TeamCity. TeamCity parses the specified files on the
 * disk and reports the results as the build results.
 *
 * see: https://www.jetbrains.com/help/teamcity/xml-report-processing.html
 */
export class XmlReportPluginBuildExtension
  extends BaseBuildExtension<XmlReportPluginBuildExtensionProps> {
  constructor(scope: Build, props: XmlReportPluginBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("xml-report-plugin", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "xmlReportParsing.reportType",
          value: this.props.reportType,
        });

        x.Node(
          "param",
          { name: "xmlReportParsing.reportDirs" },
          (x) => x.CDATA(this.props.monitoringRules.join("\n")),
        );

        x.Node("param", {
          name: "xmlReportParsing.verboseOutput",
          value: (this.props.verbose ?? false) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new XmlReportPluginBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.XmlReportPluginExtension({ ... });
     *  });
     * });
     * ```
     */
    XmlReportPluginExtension(
      props: XmlReportPluginBuildExtensionProps,
    ): XmlReportPluginBuildExtension;
  }
}

Build.prototype.XmlReportPluginExtension = function (
  this: Build,
  props: XmlReportPluginBuildExtensionProps,
) {
  return new XmlReportPluginBuildExtension(this, props);
};
