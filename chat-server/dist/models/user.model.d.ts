import { Model } from 'sequelize-typescript';
import { Message } from './message.model';
import { UserRoom } from './user-room.model';
export declare class User extends Model {
    username: string;
    email: string;
    password: string;
    messages: Message[];
    userRooms: UserRoom[];
}
