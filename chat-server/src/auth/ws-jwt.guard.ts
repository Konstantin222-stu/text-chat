import { JwtService } from '@nestjs/jwt';
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private jwtService: JwtService){}

    canActivate(context: ExecutionContext):boolean{
        const client = context.switchToWs().getClient()
        const token = client.handshake.auth.token

        try{
            const payload = this.jwtService.verify(token)
            client.user = payload
            return true
        } catch(error){
            throw new WsException('Invalid credentials')
        }
    }
}