
import { ForeignKey, Table, Model, Column } from "sequelize-typescript";
import { User } from "./user.model";
import { Room } from "./room.model";

@Table
export class UserRoom extends Model{
    @ForeignKey(()=>User)
    @Column
    userId: number

    @ForeignKey(()=>Room)
    @Column
    roomId: number
}