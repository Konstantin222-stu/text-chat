"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const message_model_1 = require("./message.model");
const user_room_model_1 = require("./user-room.model");
let Room = class Room extends sequelize_typescript_1.Model {
    name;
    isPrivate;
    password;
    messages;
    userRooms;
};
exports.Room = Room;
__decorate([
    (0, sequelize_typescript_1.Column)({ allowNull: false }),
    __metadata("design:type", String)
], Room.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ defaultValue: false }),
    __metadata("design:type", Boolean)
], Room.prototype, "isPrivate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ allowNull: true }),
    __metadata("design:type", String)
], Room.prototype, "password", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => message_model_1.Message),
    __metadata("design:type", Array)
], Room.prototype, "messages", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => user_room_model_1.UserRoom),
    __metadata("design:type", Array)
], Room.prototype, "userRooms", void 0);
exports.Room = Room = __decorate([
    sequelize_typescript_1.Table
], Room);
//# sourceMappingURL=room.model.js.map