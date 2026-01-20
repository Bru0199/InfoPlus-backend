"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var passport_1 = require("passport");
var env_ts_1 = require("../env.ts");
var authRouter = (0, express_1.Router)();
var REDIRECT_URL = env_ts_1.env.FRONTEND_URL || "http://localhost:3000";
authRouter.get("/google", function (req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("".concat(REDIRECT_URL, "/chat"));
    }
    passport_1.default.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
authRouter.get("/github", function (req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("".concat(REDIRECT_URL, "/chat"));
    }
    passport_1.default.authenticate("github", { scope: ["user:email"] })(req, res, next);
});
// --- Callbacks ---
authRouter.get("/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/login" }), function (req, res) { return res.redirect("".concat(REDIRECT_URL, "/chat")); });
authRouter.get("/github/callback", passport_1.default.authenticate("github", { failureRedirect: "/login" }), function (req, res) { return res.redirect("".concat(REDIRECT_URL, "/chat")); });
// --- Session Management ---
authRouter.get("/me", function (req, res) {
    res.json({ user: req.user || null });
});
authRouter.get("/logout", function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.session.destroy(function (err) {
            if (err) {
                return res.status(500).json({ message: "Could not log out" });
            }
            res.clearCookie("connect.sid");
            res.json({ success: true, message: "Logged out successfully" });
        });
    });
});
exports.default = authRouter;
