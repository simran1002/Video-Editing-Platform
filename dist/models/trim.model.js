"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trim = exports.EditStatus = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var EditStatus;
(function (EditStatus) {
    EditStatus["PENDING"] = "PENDING";
    EditStatus["PROCESSING"] = "PROCESSING";
    EditStatus["COMPLETED"] = "COMPLETED";
    EditStatus["FAILED"] = "FAILED";
})(EditStatus || (exports.EditStatus = EditStatus = {}));
class Trim extends sequelize_1.Model {
}
exports.Trim = Trim;
Trim.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    videoId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'videos',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    startTime: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    endTime: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    outputPath: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(EditStatus)),
        allowNull: false,
        defaultValue: EditStatus.PENDING
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    }
}, {
    sequelize: database_1.sequelize,
    modelName: 'Trim',
    tableName: 'trims',
    timestamps: true
});
