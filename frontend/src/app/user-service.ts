import { Injectable } from "@angular/core";
import { RegisterForm } from "./form-validator";

@Injectable ({
    providedIn: 'root'
})

export class UserService{

    //To be changed before production.
    private baseUrl = 'http://localhost:4200/api/users';

    async addUser(userData: RegisterForm): Promise<RegisterForm> {
        let header = new Headers();
        header.set('Content-Type', 'application/json');
        const res = await fetch(this.baseUrl, {
            method: 'POST',
            headers: header,
            body: JSON.stringify(userData),
        });
        let data: any = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }
        if (!res.ok) {
            throw {
                status : res.status,
                error: data,
            };
        }

        return data;
    }

    removeUser(userData: RegisterForm){

    }


}