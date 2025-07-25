"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const message_model_1 = require("../models/message.model");
const room_model_1 = require("../models/room.model");
const user_room_model_1 = require("../models/user-room.model");
const user_model_1 = require("../models/user.model");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sequelize_1.SequelizeModule.forRoot({
                dialect: 'mssql',
                host: 'localhost',
                port: 3306,
                username: 'root',
                password: 'QAZWSXEDC',
                database: 'chat',
                models: [user_model_1.User, room_model_1.Room, message_model_1.Message, user_room_model_1.UserRoom],
                autoLoadModels: true,
                synchronize: true
            }),
            sequelize_1.SequelizeModule.forFeature([user_model_1.User, room_model_1.Room, message_model_1.Message, user_room_model_1.UserRoom])
        ],
        exports: [sequelize_1.SequelizeModule]
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map