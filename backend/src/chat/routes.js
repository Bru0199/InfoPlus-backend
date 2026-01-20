"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var middleware_ts_1 = require("../auth/middleware.ts");
var chathandler_ts_1 = require("../chat/chathandler.ts");
var conversationService_ts_1 = require("../services/conversationService.ts");
var router = (0, express_1.Router)();
router.post("/message", middleware_ts_1.isAuthenticated, chathandler_ts_1.chatHandler);
router.get("/conversations", middleware_ts_1.isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, list, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return [4 /*yield*/, conversationService_ts_1.conversationService.getUserConversations(userId)];
            case 1:
                list = _b.sent();
                res.json(list);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                res.status(500).json({ error: "Failed to fetch conversations" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.delete("/conversation/:conversationId", middleware_ts_1.isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var conversationId, userId, wasDeleted, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                conversationId = req.params.conversationId;
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                // Check if conversationId is a valid UUID format if necessary
                if (!conversationId) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ success: false, message: "ID is required" })];
                }
                return [4 /*yield*/, conversationService_ts_1.conversationService.deleteById(userId, conversationId)];
            case 1:
                wasDeleted = _b.sent();
                if (wasDeleted) {
                    console.log("\u2705 Chat ".concat(conversationId, " removed."));
                    return [2 /*return*/, res
                            .status(200)
                            .json({ success: true, message: "Deleted successfully" })];
                }
                else {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: "Conversation not found or unauthorized",
                        })];
                }
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                return [2 /*return*/, res
                        .status(500)
                        .json({ success: false, message: "Server error during deletion" })];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get("/conversation/:conversationId", middleware_ts_1.isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var conversationId, userId, messages, error_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                conversationId = req.params.conversationId;
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return [4 /*yield*/, conversationService_ts_1.conversationService.getMessagesByConversationId(userId, conversationId)];
            case 1:
                messages = _b.sent();
                if (!messages || messages.length === 0) {
                    return [2 /*return*/, res.status(404).json({ error: "Conversation not found" })];
                }
                res.json(messages);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error("Fetch Messages Error:", error_3);
                res.status(500).json({ error: "Failed to fetch messages" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
