import { AnonymousAuthMethod } from "./anonymous_auth_method.ts";
import { CustomSshKeyAuthMethod } from "./custom_ssh_key_auth_method.ts";
import { DefaultSshKeyAuthMethod } from "./default_ssh_key_auth_method.ts";
import { PasswordAuthMethod } from "./password_auth_method.ts";
import { SshKeyAuthMethod } from "./ssh_key_auth_method.ts";

export type AuthMethod =
  | AnonymousAuthMethod
  | CustomSshKeyAuthMethod
  | DefaultSshKeyAuthMethod
  | PasswordAuthMethod
  | SshKeyAuthMethod;
