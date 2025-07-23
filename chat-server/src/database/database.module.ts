import { Module } from "@nestjs/common";
import {SequelizeModule} from '@nestjs/sequelize'
import { Message } from "src/models/message.model";
import { Room } from "src/models/room.model";
import { UserRoom } from "src/models/user-room.model";
import { User } from "src/models/user.model";

@Module({
    imports: [
        SequelizeModule.forRoot({
            dialect: 'mssql',
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: 'QAZWSXEDC',
            database: 'chat',
            models: [User, Room, Message, UserRoom],
            autoLoadModels: true,
            synchronize: true
        }),
        SequelizeModule.forFeature([User, Room, Message, UserRoom])
    ],
    exports: [SequelizeModule]
})

export class DatabaseModule {}