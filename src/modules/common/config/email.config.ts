import { registerAs } from "@nestjs/config";

export default registerAs("email", () => ({
  host: process.env.EMAIL_HOST ?? "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT ?? "587", 10),
  user: process.env.EMAIL_USER ?? "",
  password: process.env.EMAIL_PASSWORD ?? "",
  secure: (process.env.EMAIL_SECURE ?? "false") === "true",
  sender: process.env.EMAIL_SENDER ?? '"My App" <noreply@myapp.com>',
}));
