import { Table, Column, Model, HasMany } from 'sequelize-typescript';
import { Message } from './message.model';
import { UserRoom } from './user-room.model';

@Table
export class Room extends Model {
  @Column({ allowNull: false })
  name: string;

  @Column({ defaultValue: false })
  isPrivate: boolean;

  @Column({ allowNull: true })
  password: string;

  @HasMany(() => Message)
  messages: Message[];

  @HasMany(() => UserRoom)
  userRooms: UserRoom[];
}