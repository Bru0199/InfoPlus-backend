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
exports.ChatService = void 0;
var ai_1 = require("ai");
var ai_ts_1 = require("../chat/ai.ts");
var tools_ts_1 = require("../chat/tools.ts");
var index_ts_1 = require("../db/index.ts");
var schema_ts_1 = require("../db/schema.ts");
var drizzle_orm_1 = require("drizzle-orm");
exports.ChatService = {
    processRequest: function (userId, conversationId, messages) {
        return __awaiter(this, void 0, void 0, function () {
            var existingConvo, lastUserMessage, safeMessages, coreMessages;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, index_ts_1.db
                            .select()
                            .from(schema_ts_1.conversations)
                            .where((0, drizzle_orm_1.eq)(schema_ts_1.conversations.id, conversationId))
                            .limit(1)];
                    case 1:
                        existingConvo = _c.sent();
                        if (!(existingConvo.length === 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, index_ts_1.db.insert(schema_ts_1.conversations).values({
                                id: conversationId,
                                userId: userId,
                                title: ((_b = (_a = messages[0]) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.substring(0, 40)) || "New Chat",
                            })];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, index_ts_1.db
                            .update(schema_ts_1.conversations)
                            .set({ updatedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_ts_1.conversations.id, conversationId))];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5:
                        lastUserMessage = messages[messages.length - 1];
                        if (!(lastUserMessage.role === "user")) return [3 /*break*/, 7];
                        return [4 /*yield*/, index_ts_1.db.insert(schema_ts_1.messages).values({
                                conversationId: conversationId,
                                userId: userId,
                                role: "user",
                                content: lastUserMessage.content,
                            })];
                    case 6:
                        _c.sent();
                        _c.label = 7;
                    case 7:
                        safeMessages = Array.isArray(messages) ? messages : [];
                        if (safeMessages.length === 0) {
                            throw new Error("ChatService received an empty or undefined messages array.");
                        }
                        coreMessages = safeMessages.map(function (m) {
                            var _a;
                            return ({
                                role: (_a = m.role) !== null && _a !== void 0 ? _a : "user", // Fallback role
                                content: m.content
                                    ? typeof m.content === "string"
                                        ? m.content
                                        : JSON.stringify(m.content)
                                    : "",
                            });
                        });
                        return [2 /*return*/, (0, ai_1.streamText)({
                                model: ai_ts_1.geminiModel,
                                system: "\nYou are a real-time assistant. \n- If the user asks about weather in any way, detect the city or location they mention, and call the 'getWeather' tool and Put the detected city/location directly into the 'location' parameter. \n- Do not answer about weather yourself; always use the tool.\n\n- If the user asks about stock prices, detect the ticker symbol and call 'getStockPrice'. Put that detected symbol into 'symbol' parameter\n\n- If the user asks about F1 races, call 'getF1Matches'.\n\nAlways extract the necessary value from the user's message automatically.\n- For weather, stock prices, or F1, call the appropriate tool immediately.\n- DO NOT explain that you are calling a tool. \n- DO NOT provide internal reasoning or \"Chain of Thought.\"\n- Only output the final tool call or the final natural language response based on the tool's result.\n\n",
                                messages: coreMessages,
                                tools: tools_ts_1.allTools,
                                maxSteps: 5,
                                retries: 0,
                                onFinish: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                    var _i, _c, msg, toolCalls, toolResults;
                                    var response = _b.response;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                console.log("---------------------------");
                                                console.log("Called OnFinish");
                                                console.log("---------------------------");
                                                _i = 0, _c = response.messages;
                                                _d.label = 1;
                                            case 1:
                                                if (!(_i < _c.length)) return [3 /*break*/, 4];
                                                msg = _c[_i];
                                                if (msg.role === "user")
                                                    return [3 /*break*/, 3];
                                                toolCalls = msg.toolCalls ||
                                                    (Array.isArray(msg.content)
                                                        ? msg.content.filter(function (p) { return p.type === "tool-call"; })
                                                        : null);
                                                toolResults = msg.toolResults ||
                                                    (Array.isArray(msg.content)
                                                        ? msg.content.filter(function (p) { return p.type === "tool-result"; })
                                                        : null);
                                                return [4 /*yield*/, index_ts_1.db.insert(schema_ts_1.messages).values({
                                                        conversationId: conversationId,
                                                        userId: userId,
                                                        role: msg.role,
                                                        content: typeof msg.content === "string"
                                                            ? msg.content
                                                            : JSON.stringify(msg.content),
                                                        // If it's the assistant, we save the call. If it's the tool, we save the result.
                                                        toolCalls: (toolCalls === null || toolCalls === void 0 ? void 0 : toolCalls.length) ? JSON.stringify(toolCalls) : null,
                                                        toolResult: (toolResults === null || toolResults === void 0 ? void 0 : toolResults.length)
                                                            ? JSON.stringify(toolResults)
                                                            : null,
                                                    })];
                                            case 2:
                                                _d.sent();
                                                _d.label = 3;
                                            case 3:
                                                _i++;
                                                return [3 /*break*/, 1];
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                }); },
                            })];
                }
            });
        });
    },
};
