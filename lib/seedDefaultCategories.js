"use strict";
/**
 * Seed script for adding default habit categories to Firestore
 * Run this script once to populate the defaultCategories collection
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.resetDefaultCategories = exports.seedDefaultCategories = void 0;
var firebase_1 = require("./firebase");
var firestore_1 = require("firebase/firestore");
var defaultCategories = [
    {
        name: 'Health',
        color: '#e74c3c',
        icon: 'favorite',
        isDefault: true
    },
    {
        name: 'Fitness',
        color: '#2ecc71',
        icon: 'fitness_center',
        isDefault: true
    },
    {
        name: 'Learning',
        color: '#3498db',
        icon: 'school',
        isDefault: true
    },
    {
        name: 'Productivity',
        color: '#f39c12',
        icon: 'work',
        isDefault: true
    },
    {
        name: 'Mindfulness',
        color: '#9b59b6',
        icon: 'self_improvement',
        isDefault: true
    },
    {
        name: 'Finance',
        color: '#1abc9c',
        icon: 'savings',
        isDefault: true
    },
    {
        name: 'Social',
        color: '#e67e22',
        icon: 'people',
        isDefault: true
    }
];
/**
 * Seeds the default categories to Firestore
 */
var seedDefaultCategories = function () { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot, categoriesRef, _i, defaultCategories_1, category, newDocRef, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                console.log('Starting to seed default categories...');
                return [4 /*yield*/, (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'defaultCategories'))];
            case 1:
                snapshot = _a.sent();
                if (!snapshot.empty) {
                    console.log('Default categories already exist. Skipping seeding.');
                    return [2 /*return*/];
                }
                categoriesRef = (0, firestore_1.collection)(firebase_1.db, 'defaultCategories');
                _i = 0, defaultCategories_1 = defaultCategories;
                _a.label = 2;
            case 2:
                if (!(_i < defaultCategories_1.length)) return [3 /*break*/, 5];
                category = defaultCategories_1[_i];
                newDocRef = (0, firestore_1.doc)(categoriesRef);
                return [4 /*yield*/, (0, firestore_1.setDoc)(newDocRef, __assign(__assign({}, category), { id: newDocRef.id }))];
            case 3:
                _a.sent();
                console.log("Added category: ".concat(category.name));
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                console.log('Successfully seeded default categories');
                return [3 /*break*/, 7];
            case 6:
                error_1 = _a.sent();
                console.error('Error seeding default categories:', error_1);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.seedDefaultCategories = seedDefaultCategories;
/**
 * Resets (deletes and recreates) the default categories in Firestore
 * Use with caution - this will delete all existing default categories
 */
var resetDefaultCategories = function () { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot, deletePromises_1, categoriesRef, _i, defaultCategories_2, category, newDocRef, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                console.log('Resetting default categories...');
                return [4 /*yield*/, (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'defaultCategories'))];
            case 1:
                snapshot = _a.sent();
                deletePromises_1 = [];
                snapshot.forEach(function (doc) {
                    deletePromises_1.push((0, firestore_1.deleteDoc)(doc.ref));
                });
                return [4 /*yield*/, Promise.all(deletePromises_1)];
            case 2:
                _a.sent();
                console.log('Deleted existing default categories');
                categoriesRef = (0, firestore_1.collection)(firebase_1.db, 'defaultCategories');
                _i = 0, defaultCategories_2 = defaultCategories;
                _a.label = 3;
            case 3:
                if (!(_i < defaultCategories_2.length)) return [3 /*break*/, 6];
                category = defaultCategories_2[_i];
                newDocRef = (0, firestore_1.doc)(categoriesRef);
                return [4 /*yield*/, (0, firestore_1.setDoc)(newDocRef, __assign(__assign({}, category), { id: newDocRef.id }))];
            case 4:
                _a.sent();
                console.log("Added category: ".concat(category.name));
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6:
                console.log('Successfully reset default categories');
                return [3 /*break*/, 8];
            case 7:
                error_2 = _a.sent();
                console.error('Error resetting default categories:', error_2);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.resetDefaultCategories = resetDefaultCategories;
// Call this function to seed the database
// Uncomment the line below to run the script
// seedDefaultCategories(); 
