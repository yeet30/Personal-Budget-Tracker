import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-home-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Home page</h1>
    <p>You are logged in 🎉</p>
  `,
})
export class HomePage {}
