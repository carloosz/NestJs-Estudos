import { AuthResponseInterface } from '../interfaces/auth-response.interface';

export class AuthResponseDto implements AuthResponseInterface {
    constructor(accessToken: string, refreshToken: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
    accessToken!: string;
    refreshToken!: string;
}