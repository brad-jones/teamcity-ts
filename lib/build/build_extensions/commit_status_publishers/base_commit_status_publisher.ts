import { Build } from "../../build.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "../base_build_extension.ts";

export interface BaseCommitStatusPublisherProps
  extends BaseBuildExtensionProps {
  /**
   * The VCSRoot to publish commits status to.
   *
   * > HINT: If left undefined the Commit Status Publisher will attempt
   * >       publishing statuses for commits in all attached VCS roots.
   */
  vcsRootId?: string;
}

/**
 * Commit Status Publisher is a build feature which allows TeamCity to
 * automatically send build statuses of your commits to an external system.
 *
 * see: https://www.jetbrains.com/help/teamcity/commit-status-publisher.html
 */
export abstract class BaseCommitStatusPublisher<
  TProps extends BaseCommitStatusPublisherProps,
> extends BaseBuildExtension<TProps> {
  constructor(scope: Build, props: TProps) {
    super(scope, props);
  }

  protected _baseToXml(
    publisherId: string,
    builder: (x: XmlElement) => void,
  ): XmlElement {
    return super._baseToXml("commit-status-publisher", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "publisherId", value: publisherId });

        if (typeof this.props.vcsRootId !== "undefined") {
          x.Node("param", { name: "vcsRootId", value: this.props.vcsRootId });
        }

        builder(x);
      });
    });
  }

  abstract toXml(): XmlElement;
}
