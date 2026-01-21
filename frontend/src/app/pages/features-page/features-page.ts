import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

type Feature = {
  title: string;
  description: string;
};

@Component({
  selector: "app-features-page",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./features-page.html",
  styleUrl: "./features-page.scss",
})
export class FeaturesPage {
  features: Feature[] = [
    {
      title: "User Registration & Login",
      description:
        "Create an account and securely log in using session-based authentication.",
    },
    {
      title: "Password Hashing",
      description:
        "Passwords are stored securely using salted hashing (scrypt) instead of plain text.",
    },
    {
      title: "Session Management",
      description:
        "Persistent sessions using SQLite session store, with automatic login status check.",
    },
    {
      title: "Role-Based Access Control",
      description:
        "Different roles (User, Admin, Control User) with protected routes and permissions.",
    },
    {
      title: "Admin User Management (CRUD)",
      description:
        "Admins can view, create, update, and delete users from an admin panel.",
    },
    {
      title: "Form Validation",
      description:
        "Client and server validation for email, username, and password rules with clear messages.",
    },
    {
      title: "Protected Pages",
      description:
        "Guards prevent access to pages that require authentication or admin privileges.",
    },
    {
      title: "Project Documentation Page",
      description:
        "Access ER model, REST endpoint docs, and project documents in one place.",
    },
  ];
}
