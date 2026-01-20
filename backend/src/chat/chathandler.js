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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatHandler = exports.maxDuration = void 0;
var chatService_ts_1 = require("../services/chatService.ts");
exports.maxDuration = 30;
var chatHandler = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, messages, conversationId, userId, result, streamResponse, toolCalls, streamResponse_1, reader, _b, done, value, _c, _d, _e, part, cleanOutput, e_1_1, error_1;
    var _f, e_1, _g, _h;
    var _j, _k;
    return __generator(this, function (_l) {
        switch (_l.label) {
            case 0:
                _l.trys.push([0, 20, , 21]);
                _a = req.body, messages = _a.messages, conversationId = _a.conversationId;
                userId = (_j = req.user) === null || _j === void 0 ? void 0 : _j.id;
                if (!messages || !conversationId || !userId) {
                    return [2 /*return*/, res.status(400).json({ error: "Missing required fields" })];
                }
                return [4 /*yield*/, chatService_ts_1.ChatService.processRequest(userId, conversationId, messages)];
            case 1:
                result = _l.sent();
                streamResponse = result.toTextStreamResponse();
                return [4 /*yield*/, result.toolCalls];
            case 2:
                toolCalls = _l.sent();
                if (!(!toolCalls || toolCalls.length === 0)) return [3 /*break*/, 6];
                res.setHeader("Content-Type", "text/plain; charset=utf-8");
                streamResponse_1 = result.toTextStreamResponse();
                reader = (_k = streamResponse_1.body) === null || _k === void 0 ? void 0 : _k.getReader();
                if (!reader) return [3 /*break*/, 5];
                _l.label = 3;
            case 3:
                if (!true) return [3 /*break*/, 5];
                return [4 /*yield*/, reader.read()];
            case 4:
                _b = _l.sent(), done = _b.done, value = _b.value;
                if (done)
                    return [3 /*break*/, 5];
                res.write(value);
                return [3 /*break*/, 3];
            case 5: return [2 /*return*/, res.end()];
            case 6:
                res.setHeader("Content-Type", "application/json");
                _l.label = 7;
            case 7:
                _l.trys.push([7, 12, 13, 18]);
                _c = true, _d = __asyncValues(result.fullStream);
                _l.label = 8;
            case 8: return [4 /*yield*/, _d.next()];
            case 9:
                if (!(_e = _l.sent(), _f = _e.done, !_f)) return [3 /*break*/, 11];
                _h = _e.value;
                _c = false;
                part = _h;
                if (part.type === "tool-result") {
                    cleanOutput = part.output;
                    if (cleanOutput) {
                        // Sends ONLY the clean JSON content
                        res.write(JSON.stringify(cleanOutput));
                    }
                }
                _l.label = 10;
            case 10:
                _c = true;
                return [3 /*break*/, 8];
            case 11: return [3 /*break*/, 18];
            case 12:
                e_1_1 = _l.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 18];
            case 13:
                _l.trys.push([13, , 16, 17]);
                if (!(!_c && !_f && (_g = _d.return))) return [3 /*break*/, 15];
                return [4 /*yield*/, _g.call(_d)];
            case 14:
                _l.sent();
                _l.label = 15;
            case 15: return [3 /*break*/, 17];
            case 16:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 17: return [7 /*endfinally*/];
            case 18: return [2 /*return*/, res.end()];
            case 19: return [3 /*break*/, 21];
            case 20:
                error_1 = _l.sent();
                console.error("Chat API Error:", error_1);
                if (!res.headersSent) {
                    res.status(500).json({ error: "Internal Server Error" });
                }
                return [3 /*break*/, 21];
            case 21: return [2 /*return*/];
        }
    });
}); };
exports.chatHandler = chatHandler;
