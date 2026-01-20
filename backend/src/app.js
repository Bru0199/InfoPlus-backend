"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var express_session_1 = require("express-session");
var connect_pg_simple_1 = require("connect-pg-simple");
var passport_ts_1 = require("../src/auth/passport.ts");
var routes_ts_1 = require("./auth/routes.ts");
var routes_ts_2 = require("./chat/routes.ts");
var index_ts_1 = require("./db/index.ts"); // Ensure you export 'pool' from your db file
var env_ts_1 = require("./env.ts");
var middleware_ts_1 = require("./auth/middleware.ts");
var app = (0, express_1.default)();
var PostgresStore = (0, connect_pg_simple_1.default)(express_session_1.default);
app.use((0, express_session_1.default)({
    store: new PostgresStore({
        pool: index_ts_1.pool,
        tableName: "session", // Ensure you ran the SQL to create this table
    }),
    secret: env_ts_1.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
}));
// 2. Middleware
var allowedOrigins = [env_ts_1.env.FRONTEND_URL, "http://localhost:3000"];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
// 3. Initialize Passport
app.use(passport_ts_1.default.initialize());
app.use(passport_ts_1.default.session());
// 4. Routes
app.use("/api/auth", routes_ts_1.default);
app.use("/api/chat", middleware_ts_1.isAuthenticated, routes_ts_2.default);
app.get("/api/health", function (req, res) {
    res.status(200).json({ status: "UP", user: req.user });
});
exports.default = app;
