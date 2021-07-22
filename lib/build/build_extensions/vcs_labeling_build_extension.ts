import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface VcsLabelingBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * The ID of a `VcsRoot` object to label.
   *
   * > HINT: If not set all "attached" VcsRoots will be labeled.
   */
  vcsRootId?: string;

  /**
   * The pattern to use, eg: `build-%system.build.number%`.
   */
  labelingPattern: string;

  /**
   * Which branches to label.
   *
   * Defaults to `+:*`.
   *
   * see: https://www.jetbrains.com/help/teamcity/branch-filter.html
   */
  branchFilter?: string[];

  /**
   * Label successful builds only.
   *
   * Defaults to `false`.
   */
  successfulOnly?: boolean;
}

/**
 * TeamCity can label (tag) sources of a particular build (automatically or
 * manually) in your Version Control System. The list of applied labels and
 * their application status is displayed on the Changes tab of the Build
 * Results page.
 *
 * see: https://www.jetbrains.com/help/teamcity/vcs-labeling.html
 */
export class VcsLabelingBuildExtension
  extends BaseBuildExtension<VcsLabelingBuildExtensionProps> {
  constructor(scope: Build, props: VcsLabelingBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("VcsLabeling", (x) => {
      x.Node("parameters", (x) => {
        if (typeof this.props.vcsRootId !== "undefined") {
          x.Node("param", { name: "vcsRootId", value: this.props.vcsRootId });
        }

        x.Node("param", {
          name: "labelingPattern",
          value: this.props.labelingPattern,
        });

        x.Node(
          "param",
          { name: "branchFilter" },
          (x) => x.CDATA((this.props.branchFilter ?? ["+:*"]).join("\n")),
        );

        x.Node("param", {
          name: "successfulOnly",
          value: (this.props.successfulOnly ?? false) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new VcsLabelingBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.VcsLabelingExtension({ ... });
     *  });
     * });
     * ```
     */
    VcsLabelingExtension(
      props: VcsLabelingBuildExtensionProps,
    ): VcsLabelingBuildExtension;
  }
}

Build.prototype.VcsLabelingExtension = function (
  this: Build,
  props: VcsLabelingBuildExtensionProps,
) {
  return new VcsLabelingBuildExtension(this, props);
};
