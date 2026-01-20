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
exports.allTools = void 0;
var ai_1 = require("ai");
var zod_1 = require("zod");
var weather_service_ts_1 = require("../services/weather.service.ts");
var stock_service_ts_1 = require("../services/stock.service.ts");
var f1_service_ts_1 = require("../services/f1.service.ts");
exports.allTools = {
    // 1. Weather Tool
    getWeather: (0, ai_1.tool)({
        description: "Get the current weather for a specific city.",
        parameters: zod_1.z.object({
            location: zod_1.z
                .string()
                .describe("The name of the city, e.g., Bengaluru, London, or New York"),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var location = _b.location;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log("passing the value location", { location: location });
                        if (!location || location.trim() === "") {
                            return [2 /*return*/, "⚠️ I need a valid city name to provide weather info. Please specify one."];
                        }
                        console.log("Calling getWeather API with location:", location);
                        return [4 /*yield*/, (0, weather_service_ts_1.getWeather)(location)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
    }),
    // 2. Stock Tool
    getStockPrice: (0, ai_1.tool)({
        description: "Get the real-time stock price for a ticker symbol.",
        parameters: zod_1.z.object({
            symbol: zod_1.z.string().describe("The stock ticker symbol, e.g. AAPL, TSLA"),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var symbol = _b.symbol;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log("passing the value symbol", { symbol: symbol });
                        if (!symbol || symbol.trim() === "") {
                            return [2 /*return*/, "⚠️ I need a valid symbol to provide stock info. Please specify one."];
                        }
                        console.log("Calling getStockPrice API with symbol:", symbol);
                        return [4 /*yield*/, (0, stock_service_ts_1.getStockPrice)(symbol)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
    }),
    // 3. F1 Tool
    getF1Matches: (0, ai_1.tool)({
        description: "Get information about the next upcoming Formula 1 race.",
        parameters: zod_1.z.object({}), // No parameters needed for "next race"
        execute: function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, f1_service_ts_1.getF1Matches)()];
                    case 1:
                        result = _a.sent();
                        console.log("---------------------------");
                        console.log("Called tool.js: nextrace");
                        console.log("---------------------------");
                        return [2 /*return*/, result];
                }
            });
        }); },
    }),
};
