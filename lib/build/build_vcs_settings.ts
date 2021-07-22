import { Build } from "./build.ts";
import { Construct } from "../construct.ts";
import { XmlElement } from "../xml.ts";

export interface BuildVcsSettingsProps extends Record<string, unknown> {
  /**
   * The ID of the VcsRoot to attach.
   */
  readonly vcsRootId: string;

  /**
   * A list of rules in the form of `+|-:VCSPath[=>AgentPath]`
   *
   * e.g. use `-:.` to exclude all, or `-:repository/path` to exclude only
   * the path from checkout or `+:repository/path => another/path` to map
   * to different path.
   *
   * > HINT: Checkout rules can only be set to directories,
   * >       files are not supported.
   *
   * see: https://www.jetbrains.com/help/teamcity/vcs-checkout-rules.html
   */
  readonly checkOutRules?: readonly string[];
}

export class BuildVcsSettings extends Construct<BuildVcsSettingsProps, Build> {
  constructor(scope: Build, props: BuildVcsSettingsProps) {
    super(scope, props);
    Construct.push(scope, "vcsSettings", this);
    scope["_addXmlBuilder"](BuildVcsSettings, (x) => {
      x.Node("vcs-settings", (x) => {
        for (const vcsSettings of scope.vcsSettings ?? []) {
          x.Node(vcsSettings.toXml());
        }
      });
    });
  }

  toXml(): XmlElement {
    return new XmlElement(
      "vcs-entry-ref",
      { "root-id": this.props.vcsRootId },
      (x) => {
        for (const rule of (this.props.checkOutRules ?? [])) {
          x.Node("checkout-rule", { rule });
        }
      },
    );
  }
}

declare module "./build.ts" {
  interface Build {
    /**
     * Attach VcsRoot(s) defined at the Project level to a BuildType.
     *
     * This will ensure the repositories are checked out before your
     * first build step runs.
     *
     * see: https://www.jetbrains.com/help/teamcity/configuring-vcs-settings.html#Attach+VCS+Root
     */
    readonly vcsSettings?: readonly BuildVcsSettings[];

    /**
     * Configures additional options for a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.VcsSettings({ ... });
     *  });
     * });
     * ```
     */
    VcsSettings(props: BuildVcsSettingsProps): BuildVcsSettings;
  }
}

Build.prototype.VcsSettings = function (
  this: Build,
  props: BuildVcsSettingsProps,
) {
  return new BuildVcsSettings(this, props);
};
