import {Table, Column, Model, HasMany, AllowNull} from 'sequelize-typescript'
import { Message } from './message.model'
import { UserRoom } from './user-room.model'



@Table
export class User extends Model{
    @Column({allowNull: false})
    username: string

    @Column({allowNull: false, unique: true})
    email: string

    @Column({allowNull: false})
    password: string

    @HasMany (()=>Message)
    messages: Message[]

    @HasMany (()=>UserRoom)
    userRooms: UserRoom[]
}