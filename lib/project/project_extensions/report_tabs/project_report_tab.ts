import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import { BaseReportTab, BaseReportTabProps } from "./base_report_tab.ts";

export interface ProjectReportTabProps extends BaseReportTabProps {
  /**
   * Select the build configuration and specify the build whose artifacts will
   * be shown on the tab.
   */
  readonly buildTypeId: string;

  /**
   * Select whether the report should be taken from the last successful,
   * pinned, finished build or the build with the specified build number
   * or the last build with the specified tag.
   */
  readonly revisionRuleName:
    | "lastSuccessful"
    | "lastPinned"
    | "lastFinished"
    | "buildNumber"
    | "buildTag";

  /**
   * If `revisionRuleName=buildNumber` or `revisionRuleName=buildTag`
   * this is the value of the build number or tag.
   */
  revisionRuleValue?: string;
}

/**
 * Here you can define custom artifact-based tabs for the Project Home page.
 *
 * Appears on the Project Home page for a particular project only if a build
 * within the project produces the specified reports' artifact.
 */
export class ProjectReportTab extends BaseReportTab<ProjectReportTabProps> {
  constructor(scope: Project, props: ProjectReportTabProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("ProjectReportTab", (x) => {
      x.Node("param", {
        name: "buildTypeId",
        value: this.props.buildTypeId,
      });

      x.Node("param", {
        name: "revisionRuleName",
        value: this.props.revisionRuleName,
      });

      if (this.props.revisionRuleName === "buildNumber") {
        if (typeof this.props.revisionRuleValue === "undefined") {
          throw new Error(
            "revisionRuleName=buildNumber but no value for revisionRuleValue",
          );
        }
        x.Node("param", {
          name: "revisionRuleBuildNumber",
          value: this.props.revisionRuleValue,
        });
      }

      if (this.props.revisionRuleName === "buildTag") {
        if (typeof this.props.revisionRuleValue === "undefined") {
          throw new Error(
            "revisionRuleName=buildTag but no value for revisionRuleValue",
          );
        }
        x.Node("param", {
          name: "revisionRuleBuildTag",
          value: this.props.revisionRuleValue,
        });
      }
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new ProjectReportTab to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.ProjectReport({ });
     * });
     * ```
     */
    ProjectReport(props: ProjectReportTabProps): ProjectReportTab;
  }
}

Project.prototype.ProjectReport = function (
  this: Project,
  props: ProjectReportTabProps,
) {
  return new ProjectReportTab(this, props);
};
