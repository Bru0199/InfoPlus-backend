"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({
        success: false,
        message: "Unauthorized: Please log in to use the AI chat.",
    });
};
exports.isAuthenticated = isAuthenticated;
