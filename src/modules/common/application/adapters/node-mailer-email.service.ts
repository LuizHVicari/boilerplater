import { Injectable } from "@nestjs/common";
import { EmailService, SendEmailProps } from "../ports/email.service";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class NodeMailerEmailService implements EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail({ email, subject, template, context }: SendEmailProps): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject,
      template,
      context,
    });
  }
}
