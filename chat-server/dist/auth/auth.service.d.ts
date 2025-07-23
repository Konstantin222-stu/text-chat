import { JwtService } from '@nestjs/jwt';
import { User } from "src/models/user.model";
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
    }>;
    register(userData: {
        username: string;
        email: string;
        password: string;
    }): Promise<User>;
}
