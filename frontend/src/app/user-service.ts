import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { RegisterForm } from "./form-validator";

@Injectable({ providedIn: "root" })
export class UserService {
  constructor(private http: HttpClient) {}

  async addUser(userData: RegisterForm) {
    try {
      return await firstValueFrom(this.http.post("/api/users", userData));
    } catch (e) {
      const err = e as HttpErrorResponse;

      throw {
        status: err.status,
        error: err.error,
        message: err.message,
      };
    }
  }
}
