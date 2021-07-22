import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import { BaseReportTab, BaseReportTabProps } from "./base_report_tab.ts";

// deno-lint-ignore no-empty-interface
export interface BuildReportTabProps extends BaseReportTabProps {}

/**
 * Here you can define artifact-based tabs for build results.
 *
 * Appears on the Build Results page for each build that produced an artifact
 * with the specified name. These report tabs are defined in a project and are
 * inherited in its subprojects.
 *
 * To override an inherited Report tab in a subproject, create a new report
 * tab with the same name as the inherited one in the subproject.
 */
export class BuildReportTab extends BaseReportTab<BuildReportTabProps> {
  constructor(scope: Project, props: BuildReportTabProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("BuildReportTab");
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new BuildReportTab to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.BuildReport({ });
     * });
     * ```
     */
    BuildReport(props: BuildReportTabProps): BuildReportTab;
  }
}

Project.prototype.BuildReport = function (
  this: Project,
  props: BuildReportTabProps,
) {
  return new BuildReportTab(this, props);
};
