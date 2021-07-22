export interface SshKeyAuthMethod {
  /**
   * This refers to an uploaded SSH key.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/ssh-keys-management.html#SSH+Key+Usage
   */
  type: "TEAMCITY_SSH_KEY";

  /**
   * Specify the username if there is no username in the clone URL.
   * The username specified here overrides the username from the URL.
   */
  username?: string;

  /**
   * The name of the uploaded SSH key.
   */
  keyName: string;
}
