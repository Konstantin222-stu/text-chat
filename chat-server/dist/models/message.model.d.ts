import { Model } from "sequelize-typescript";
import { User } from "./user.model";
import { Room } from "./room.model";
export declare class Message extends Model {
    text: string;
    userId: number;
    user: User;
    roomId: number;
    room: Room;
}
