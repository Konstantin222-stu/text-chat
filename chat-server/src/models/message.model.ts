import { BelongsTo, Column, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "./user.model";
import { Room } from "./room.model";

@Table
export class Message extends Model{
    @Column({allowNull:false})
    text:string

    @ForeignKey(()=>User)
    @Column
    userId: number

    @BelongsTo(()=>User)
    user: User
    
    @ForeignKey(()=>Room)
    @Column
    roomId: number
    
    @BelongsTo(()=>Room)
    room:Room
}