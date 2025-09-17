import { Inject, Injectable } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";

import emailConfig from "../../config/email.config";
import { EmailConfigService } from "../ports/email-config.service";

@Injectable()
export class NestJSEmailConfigService implements EmailConfigService {
  constructor(
    @Inject(emailConfig.KEY)
    private readonly config: ConfigType<typeof emailConfig>,
  ) {}

  get appName(): string {
    return this.config.appName;
  }

  get supportEmail(): string {
    return this.config.supportEmail;
  }

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  get verificationPath(): string {
    return this.config.verificationPath;
  }

  get resetPasswordPath(): string {
    return this.config.resetPasswordPath;
  }
}
