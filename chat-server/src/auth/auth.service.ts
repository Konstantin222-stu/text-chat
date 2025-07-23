import { Injectable } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { User } from "src/models/user.model";
import * as bcrypt from "bcrypt"


@Injectable()
export class AuthService{
    constructor(
        private jwtService: JwtService,
    ){}

    async validateUser(email: string, pass: string):Promise<any>{
        const user = await User.findOne({where:{email}})
        if(user && await bcrypt.compare(pass, user.password)){
            const {password, ...result} = user.get()
            return result;
        }
        return null
    }
    
    async login(user: any){
        const payload = {email: user.email, sub: user.id}
        return{
            access_token: this.jwtService.sign(payload)
        }
    }

    async register(userData: {username: string; email: string; password: string;}){
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        return User.create({
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
        })
    }
}

