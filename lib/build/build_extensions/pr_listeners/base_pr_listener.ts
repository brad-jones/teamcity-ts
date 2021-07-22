import { Build } from "../../build.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "../base_build_extension.ts";

export interface BasePrListenerProps extends BaseBuildExtensionProps {
  /**
   * The id of a `VcsRootGit` object.
   */
  vcsRootId: string;
}

/**
 * The Pull Requests build feature lets you automatically load pull request*
 * information and run builds on pull request branches in GitHub, Bitbucket
 * Server, Bitbucket Cloud, GitLab, and Azure DevOps.
 *
 *  _* Or merge requests in case of GitLab._
 *
 * When adding this build feature, you need to specify a VCS root and select
 * a VCS hosting type. Other settings depend on the selected VCS hosting type.
 *
 * This feature extends the original branch specification of VCS roots,
 * attached to the current build configuration, to include pull requests
 * that match the specified filtering criteria.
 *
 * > HINT: The branch specification of the VCS root must not contain patterns
 * > matching pull request branches. If you want to trigger builds only on
 * > pull requests, leave the branch specification of the VCS root empty.
 *
 * see: https://www.jetbrains.com/help/teamcity/pull-requests.html
 */
export abstract class BasePrListener<
  TProps extends BasePrListenerProps,
> extends BaseBuildExtension<TProps> {
  constructor(scope: Build, props: TProps) {
    super(scope, props);
  }

  protected _baseToXml(
    providerType: string,
    builder: (x: XmlElement) => void,
  ): XmlElement {
    return super._baseToXml("pullRequests", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "vcsRootId", value: this.props.vcsRootId });
        x.Node("param", { name: "providerType", value: providerType });
        builder(x);
      });
    });
  }

  abstract toXml(): XmlElement;
}
