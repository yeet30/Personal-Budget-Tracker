import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { RegisterForm } from "./form-validator";

@Injectable({ providedIn: "root" })
export class UserService {
  constructor(private http: HttpClient) {}

  async addUser(userData: RegisterForm) {
    // koristi proxy => relative URL, bez localhost:4200
    return firstValueFrom(this.http.post("/api/users", userData));
  }
}
