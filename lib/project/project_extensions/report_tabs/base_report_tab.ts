import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import { Construct } from "../../../construct.ts";
import { BaseProjectExtensionProps } from "../base_project_extension.ts";

export interface BaseReportTabProps extends BaseProjectExtensionProps {
  /**
   * Specify a unique title of the report tab that will be displayed in the web UI.
   */
  readonly title: string;

  /**
   * Specify the path to the artifacts to be displayed as the contents
   * of the report page. The path must be relative to the root of the
   * build artifact directory.
   *
   * To use a file from an archive, use the `path-to-archive!relative-path`
   * syntax, for example: `javadoc.zip!/index.html`.
   *
   * See the list of supported archives.
   * https://www.jetbrains.com/help/teamcity/2020.2/patterns-for-accessing-build-artifacts.html#Obtaining+Artifacts+from+a+Build+Script
   *
   * You can use the file browser next to the field to select artifacts.
   * Parameter references are supported here, for example,
   * `%parameter%.zip!index.htm`.
   */
  startPage: string;
}

/**
 * see: https://www.jetbrains.com/help/teamcity/2020.2/including-third-party-reports-in-the-build-results.html
 */
export abstract class BaseReportTab<
  TProps extends BaseReportTabProps,
> extends Construct<TProps, Project> {
  constructor(scope: Project, props: TProps) {
    super(scope, props);
  }

  protected _baseToXml(
    subType: "ProjectReportTab" | "BuildReportTab",
    builder?: (x: XmlElement) => void,
  ): XmlElement {
    return new XmlElement(
      "extension",
      { id: this.props.id, type: "ReportTab" },
      (x) => {
        x.Node("param", {
          name: "type",
          value: subType,
        });

        x.Node("param", {
          name: "title",
          value: this.props.title,
        });

        x.Node("param", {
          name: "startPage",
          value: this.props.startPage,
        });

        if (typeof builder !== "undefined") {
          builder(x);
        }
      },
    );
  }

  abstract toXml(): XmlElement;
}
