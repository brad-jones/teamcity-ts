import { Build } from "../../build.ts";
import { XmlElement } from "../../../xml.ts";
import { UniqueArray } from "../../../types.ts";
import { changeCase } from "../../../../deps.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "../base_build_extension.ts";

const _events = [
  "BUILD_FAILED_TO_START",
  "BUILD_FAILED",
  "BUILD_FINISHED_SUCCESSFULLY",
  "BUILD_PROBABLY_HANGING",
  "BUILD_STARTED",
  "FIRST_BUILD_ERROR_OCCURS",
  "FIRST_FAILURE_AFTER_SUCCESS",
  "FIRST_SUCCESS_AFTER_FAILURE",
  "NEW_BUILD_PROBLEM_OCCURRED",
] as const;

export interface BaseNotifierProps extends BaseBuildExtensionProps {
  /**
   * Configure a branch filter. If it is not configured, you will receive
   * notifications about the default branch only.
   *
   * see: https://www.jetbrains.com/help/teamcity/branch-filter.html
   */
  branchFilter?: string[];

  /**
   * A list of events to subscribe to.
   */
  events: UniqueArray<typeof _events>;
}

/**
 * The Notifications build feature is responsible for sending notifications
 * about build statuses and events to external services. Currently, the
 * feature provides Email Notifier and Slack Notifier.
 *
 * This feature adds to the functionality of user-level notifications that can
 * be assigned to a particular user or user group, but it allows configuring
 * notifications per build configuration. This approach does not require
 * referencing a specific TeamCity user and works better for group notifications.
 *
 * see: https://www.jetbrains.com/help/teamcity/notifications.html
 */
export abstract class BaseNotifier<
  TProps extends BaseNotifierProps,
> extends BaseBuildExtension<TProps> {
  constructor(scope: Build, props: TProps) {
    super(scope, props);
  }

  protected _baseToXml(
    notifier: string,
    builder: (x: XmlElement) => void,
  ): XmlElement {
    return super._baseToXml("notifications", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "notifier", value: notifier });

        if (
          Array.isArray(this.props.branchFilter) &&
          this.props.branchFilter.length > 0
        ) {
          x.Node(
            "param",
            { name: "branchFilter" },
            (x) => x.CDATA(this.props.branchFilter!.join("\n")),
          );
        }

        for (const e of this.props.events) {
          x.Node("param", { name: changeCase.camelCase(e), value: "true" });
        }

        builder(x);
      });
    });
  }

  abstract toXml(): XmlElement;
}
