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

        if (!res.ok) {
            throw new Error('Failed to create user');
        }

        return await res.json();
    }

    removeUser(userData: RegisterForm){

    }


}