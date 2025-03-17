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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
exports.__esModule = true;
exports.db = exports.auth = exports.onAuthStateChange = exports.getCurrentUser = exports.signOut = exports.updateUserInFirestore = exports.getUserFromFirestore = exports.storeUserInFirestore = exports.signInWithGoogle = void 0;
var app_1 = require("firebase/app");
var auth_1 = require("firebase/auth");
var firestore_1 = require("firebase/firestore");
var config_1 = require("./config");
// Initialize Firebase
var app = (0, app_1.initializeApp)(config_1.firebaseConfig);
var auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
var db = (0, firestore_1.getFirestore)(app);
exports.db = db;
var googleProvider = new auth_1.GoogleAuthProvider();
// Sign in with Google and store user in Firestore
var signInWithGoogle = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, auth_1.signInWithPopup)(auth, googleProvider)];
            case 1:
                result = _a.sent();
                user = result.user;
                // Store user in Firestore
                return [4 /*yield*/, (0, exports.storeUserInFirestore)(user)];
            case 2:
                // Store user in Firestore
                _a.sent();
                return [2 /*return*/, user];
            case 3:
                error_1 = _a.sent();
                console.error('Error signing in with Google:', error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.signInWithGoogle = signInWithGoogle;
// Store user in Firestore
var storeUserInFirestore = function (user) { return __awaiter(void 0, void 0, void 0, function () {
    var userRef, userSnap, userData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!user.uid)
                    return [2 /*return*/];
                userRef = (0, firestore_1.doc)(db, 'users', user.uid);
                return [4 /*yield*/, (0, firestore_1.getDoc)(userRef)];
            case 1:
                userSnap = _a.sent();
                if (!userSnap.exists()) return [3 /*break*/, 3];
                // Update existing user
                return [4 /*yield*/, (0, firestore_1.updateDoc)(userRef, {
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        lastLogin: (0, firestore_1.serverTimestamp)()
                    })];
            case 2:
                // Update existing user
                _a.sent();
                return [3 /*break*/, 5];
            case 3:
                userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    lastLogin: (0, firestore_1.serverTimestamp)(),
                    createdAt: (0, firestore_1.serverTimestamp)(),
                    settings: {
                        theme: 'light',
                        notifications: true
                    }
                };
                return [4 /*yield*/, (0, firestore_1.setDoc)(userRef, userData)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.storeUserInFirestore = storeUserInFirestore;
// Get user from Firestore
var getUserFromFirestore = function (uid) { return __awaiter(void 0, void 0, void 0, function () {
    var userRef, userSnap, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userRef = (0, firestore_1.doc)(db, 'users', uid);
                return [4 /*yield*/, (0, firestore_1.getDoc)(userRef)];
            case 1:
                userSnap = _a.sent();
                if (userSnap.exists()) {
                    return [2 /*return*/, userSnap.data()];
                }
                return [2 /*return*/, null];
            case 2:
                error_2 = _a.sent();
                console.error('Error getting user from Firestore:', error_2);
                return [2 /*return*/, null];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getUserFromFirestore = getUserFromFirestore;
// Update user in Firestore
var updateUserInFirestore = function (uid, data) { return __awaiter(void 0, void 0, void 0, function () {
    var userRef, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userRef = (0, firestore_1.doc)(db, 'users', uid);
                return [4 /*yield*/, (0, firestore_1.updateDoc)(userRef, data)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Error updating user in Firestore:', error_3);
                throw error_3;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateUserInFirestore = updateUserInFirestore;
// Sign out
var signOut = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, auth_1.signOut)(auth)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Error signing out:', error_4);
                throw error_4;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.signOut = signOut;
// Get current user
var getCurrentUser = function () {
    return auth.currentUser;
};
exports.getCurrentUser = getCurrentUser;
// Auth state observer
var onAuthStateChange = function (callback) {
    return (0, auth_1.onAuthStateChanged)(auth, callback);
};
exports.onAuthStateChange = onAuthStateChange;
