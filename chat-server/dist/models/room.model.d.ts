import { Model } from 'sequelize-typescript';
import { Message } from './message.model';
import { UserRoom } from './user-room.model';
export declare class Room extends Model {
    name: string;
    isPrivate: boolean;
    password: string;
    messages: Message[];
    userRooms: UserRoom[];
}
