import { HttpClient } from '@angular/common/http';
import {Injectable} from '@angular/core';
import { BehaviorSubject, tap, catchError, of } from 'rxjs';
import { number } from 'zod';


export interface AuthUser {
    user_id: number;
    roles: number[];
}

@Injectable({ providedIn: 'root' })

export class Auth{
    private userSubject = new BehaviorSubject<AuthUser | null>(null);
    userObservable = this.userSubject.asObservable();

    constructor(private http: HttpClient) {}

    fetchCurrentUser() {
        return this.http.get<AuthUser>('api/auth').pipe(
            tap(user => {
                this.userSubject.next(user ?? null)
            }),
            catchError(()=>{
                this.userSubject.next(null);
                return of(null);
            })
        );
    }

}