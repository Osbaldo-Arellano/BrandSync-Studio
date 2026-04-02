import nodemailer from "nodemailer";

export function createTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export const FROM = `Hustle Runner <${process.env.SMTP_USER}>`;
