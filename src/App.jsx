import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, ShoppingCart, Package, Users, FileText, BarChart2, Settings as SettingsIcon,
  Plus, X, Wallet, TrendingUp, TrendingDown, AlertTriangle, ChevronRight, ChevronLeft,
  Moon, Sun, Crown, Check, Search, Trash2, Edit2, ArrowLeft, Receipt, Download,
  Building2, Bell, Sparkles, CircleDollarSign, Boxes, UserPlus, CreditCard,
  Mail, Lock, Eye, EyeOff, LogOut, Store, Utensils, Laptop, Briefcase, ShoppingBag,
  PackagePlus, Camera, ImagePlus, Trash, QrCode
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

/* ---------------------------------------------------------
   Bizora — Small Business Manager for Filipino entrepreneurs
   Single-file React artifact. Data persisted via window.storage.
--------------------------------------------------------- */

// Fallback so the app also works outside the Claude artifacts sandbox
// (e.g. once deployed to Vercel), where window.storage doesn't exist.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => {
      const v = window.localStorage.getItem(key);
      return v === null ? null : { key, value: v, shared: false };
    },
    set: async (key, value) => {
      window.localStorage.setItem(key, value);
      return { key, value, shared: false };
    },
    delete: async (key) => {
      window.localStorage.removeItem(key);
      return { key, deleted: true, shared: false };
    },
    list: async (prefix = "") => {
      const keys = Object.keys(window.localStorage).filter(k => k.startsWith(prefix));
      return { keys, prefix, shared: false };
    },
  };
}

const STORAGE_KEY = "bizora-app-state-v1";

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

const peso = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pesoShort = (n) => {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1000000) return "₱" + (v / 1000000).toFixed(1) + "M";
  if (Math.abs(v) >= 1000) return "₱" + (v / 1000).toFixed(1) + "K";
  return "₱" + v.toFixed(0);
};

const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const fmtDateShort = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" });

const CATEGORIES = ["General", "Food & Beverage", "Grocery", "Household", "Personal Care", "Load & Cards", "Clothing", "Beauty", "Hardware", "Services"];

/* ---------------- Grocery product catalog ----------------
   A searchable library of common Philippine sari-sari / grocery items,
   so owners can add products by picking instead of typing everything
   from scratch. Prices are typical starting points and fully editable. */
const GROCERY_CATALOG = [
  // Rice, grains, baking
  { name: "Rice (1kg, well-milled)", category: "Grocery", purchasePrice: 42, sellingPrice: 50 },
  { name: "Rice (1kg, premium)", category: "Grocery", purchasePrice: 52, sellingPrice: 62 },
  { name: "All-Purpose Flour 1kg", category: "Grocery", purchasePrice: 48, sellingPrice: 58 },
  { name: "White Sugar 1kg", category: "Grocery", purchasePrice: 68, sellingPrice: 78 },
  { name: "Brown Sugar 1kg", category: "Grocery", purchasePrice: 70, sellingPrice: 82 },
  { name: "Baking Powder", category: "Grocery", purchasePrice: 15, sellingPrice: 22 },
  { name: "Cornstarch", category: "Grocery", purchasePrice: 18, sellingPrice: 25 },
  { name: "Oatmeal (Quick Cook)", category: "Grocery", purchasePrice: 45, sellingPrice: 58 },
  { name: "Cereal (Cornflakes)", category: "Grocery", purchasePrice: 85, sellingPrice: 105 },
  // Cooking essentials
  { name: "Cooking Oil 1L", category: "Grocery", purchasePrice: 85, sellingPrice: 100 },
  { name: "Cooking Oil 350ml (sachet)", category: "Grocery", purchasePrice: 30, sellingPrice: 38 },
  { name: "Iodized Salt 1kg", category: "Grocery", purchasePrice: 12, sellingPrice: 18 },
  { name: "White Vinegar 1L", category: "Grocery", purchasePrice: 22, sellingPrice: 30 },
  { name: "Soy Sauce 1L", category: "Grocery", purchasePrice: 35, sellingPrice: 45 },
  { name: "Fish Sauce (Patis) 750ml", category: "Grocery", purchasePrice: 38, sellingPrice: 48 },
  { name: "Oyster Sauce", category: "Grocery", purchasePrice: 40, sellingPrice: 52 },
  { name: "Ketchup (Banana) 320g", category: "Grocery", purchasePrice: 28, sellingPrice: 38 },
  { name: "Mayonnaise 220ml", category: "Grocery", purchasePrice: 45, sellingPrice: 58 },
  { name: "Peanut Butter 220g", category: "Grocery", purchasePrice: 55, sellingPrice: 70 },
  { name: "Fruit Jam", category: "Grocery", purchasePrice: 50, sellingPrice: 65 },
  { name: "Garlic (per kilo)", category: "Grocery", purchasePrice: 90, sellingPrice: 120 },
  { name: "Onion (per kilo)", category: "Grocery", purchasePrice: 70, sellingPrice: 95 },
  // Canned & instant
  { name: "Sardines 155g", category: "Grocery", purchasePrice: 18, sellingPrice: 25 },
  { name: "Corned Beef 150g", category: "Grocery", purchasePrice: 45, sellingPrice: 58 },
  { name: "Luncheon Meat 165g", category: "Grocery", purchasePrice: 55, sellingPrice: 70 },
  { name: "Tuna Flakes in Oil 155g", category: "Grocery", purchasePrice: 30, sellingPrice: 40 },
  { name: "Meat Loaf 150g", category: "Grocery", purchasePrice: 25, sellingPrice: 33 },
  { name: "Instant Pancit Canton", category: "Grocery", purchasePrice: 13, sellingPrice: 18 },
  { name: "Instant Mami Noodles", category: "Grocery", purchasePrice: 12, sellingPrice: 17 },
  { name: "Instant Coffee 3-in-1", category: "Grocery", purchasePrice: 6, sellingPrice: 9 },
  { name: "Powdered Milk (sachet)", category: "Grocery", purchasePrice: 9, sellingPrice: 13 },
  { name: "Condensed Milk 300ml", category: "Grocery", purchasePrice: 40, sellingPrice: 52 },
  { name: "Evaporated Milk 370ml", category: "Grocery", purchasePrice: 32, sellingPrice: 42 },
  { name: "Instant Chocolate Drink (sachet)", category: "Grocery", purchasePrice: 8, sellingPrice: 12 },
  // Bread, eggs, dairy
  { name: "Pandesal (per piece)", category: "Food & Beverage", purchasePrice: 3, sellingPrice: 5 },
  { name: "Loaf Bread (Tasty)", category: "Food & Beverage", purchasePrice: 55, sellingPrice: 68 },
  { name: "Eggs (tray of 30)", category: "Grocery", purchasePrice: 210, sellingPrice: 240 },
  { name: "Butter 200g", category: "Grocery", purchasePrice: 95, sellingPrice: 120 },
  { name: "Cheese (block)", category: "Grocery", purchasePrice: 85, sellingPrice: 105 },
  { name: "Cheese Slices (10s)", category: "Grocery", purchasePrice: 90, sellingPrice: 115 },
  // Beverages
  { name: "Bottled Water 500ml", category: "Food & Beverage", purchasePrice: 8, sellingPrice: 12 },
  { name: "Softdrinks 1.5L", category: "Food & Beverage", purchasePrice: 55, sellingPrice: 70 },
  { name: "Softdrinks (can)", category: "Food & Beverage", purchasePrice: 25, sellingPrice: 35 },
  { name: "Powdered Juice Drink (sachet)", category: "Food & Beverage", purchasePrice: 6, sellingPrice: 9 },
  { name: "Juice Drink (box)", category: "Food & Beverage", purchasePrice: 12, sellingPrice: 18 },
  { name: "Energy Drink (can)", category: "Food & Beverage", purchasePrice: 30, sellingPrice: 40 },
  { name: "Beer (bottle)", category: "Food & Beverage", purchasePrice: 45, sellingPrice: 60 },
  // Snacks
  { name: "Siomai (pack of 10)", category: "Food & Beverage", purchasePrice: 60, sellingPrice: 90 },
  { name: "Potato Chips (Piattos)", category: "Food & Beverage", purchasePrice: 20, sellingPrice: 28 },
  { name: "Corn Chips (Nova)", category: "Food & Beverage", purchasePrice: 12, sellingPrice: 17 },
  { name: "Crackers (SkyFlakes)", category: "Food & Beverage", purchasePrice: 8, sellingPrice: 12 },
  { name: "Biscuits (assorted)", category: "Food & Beverage", purchasePrice: 15, sellingPrice: 22 },
  { name: "Chocolate Bar", category: "Food & Beverage", purchasePrice: 15, sellingPrice: 22 },
  { name: "Candy (per piece)", category: "Food & Beverage", purchasePrice: 0.5, sellingPrice: 1 },
  { name: "Chewing Gum", category: "Food & Beverage", purchasePrice: 5, sellingPrice: 8 },
  { name: "Ice Candy (per piece)", category: "Food & Beverage", purchasePrice: 3, sellingPrice: 5 },
  { name: "Polvoron (per piece)", category: "Food & Beverage", purchasePrice: 4, sellingPrice: 7 },
  // Personal care & beauty
  { name: "Shampoo (sachet)", category: "Personal Care", purchasePrice: 5, sellingPrice: 8 },
  { name: "Conditioner (sachet)", category: "Personal Care", purchasePrice: 5, sellingPrice: 8 },
  { name: "Bar Soap", category: "Personal Care", purchasePrice: 18, sellingPrice: 25 },
  { name: "Liquid Hand Soap", category: "Personal Care", purchasePrice: 35, sellingPrice: 48 },
  { name: "Toothpaste", category: "Personal Care", purchasePrice: 30, sellingPrice: 42 },
  { name: "Toothbrush", category: "Personal Care", purchasePrice: 15, sellingPrice: 22 },
  { name: "Deodorant Roll-On", category: "Beauty", purchasePrice: 65, sellingPrice: 85 },
  { name: "Lotion (small)", category: "Beauty", purchasePrice: 20, sellingPrice: 30 },
  { name: "Facial Wash", category: "Beauty", purchasePrice: 45, sellingPrice: 60 },
  { name: "Sanitary Napkins (pack)", category: "Personal Care", purchasePrice: 35, sellingPrice: 48 },
  { name: "Diapers (pack, small)", category: "Personal Care", purchasePrice: 120, sellingPrice: 150 },
  { name: "Baby Wipes", category: "Personal Care", purchasePrice: 55, sellingPrice: 72 },
  { name: "Cotton Buds", category: "Personal Care", purchasePrice: 15, sellingPrice: 22 },
  { name: "Rubbing Alcohol 500ml", category: "Personal Care", purchasePrice: 45, sellingPrice: 60 },
  { name: "Hand Sanitizer (small)", category: "Personal Care", purchasePrice: 25, sellingPrice: 38 },
  { name: "Face Mask (pack)", category: "Personal Care", purchasePrice: 40, sellingPrice: 55 },
  // Household
  { name: "Dishwashing Liquid", category: "Household", purchasePrice: 30, sellingPrice: 42 },
  { name: "Dishwashing Paste (sachet)", category: "Household", purchasePrice: 5, sellingPrice: 8 },
  { name: "Detergent Powder (sachet)", category: "Household", purchasePrice: 6, sellingPrice: 9 },
  { name: "Detergent Bar", category: "Household", purchasePrice: 20, sellingPrice: 28 },
  { name: "Fabric Conditioner (sachet)", category: "Household", purchasePrice: 6, sellingPrice: 9 },
  { name: "Bleach 500ml", category: "Household", purchasePrice: 35, sellingPrice: 48 },
  { name: "Trash Bags (roll)", category: "Household", purchasePrice: 25, sellingPrice: 35 },
  { name: "Candles", category: "Household", purchasePrice: 10, sellingPrice: 15 },
  { name: "Matches", category: "Household", purchasePrice: 3, sellingPrice: 5 },
  { name: "Tissue Paper (roll)", category: "Household", purchasePrice: 15, sellingPrice: 22 },
  { name: "Toilet Paper (roll)", category: "Household", purchasePrice: 18, sellingPrice: 25 },
  { name: "Insecticide Spray", category: "Household", purchasePrice: 90, sellingPrice: 115 },
  { name: "Light Bulb (LED)", category: "Hardware", purchasePrice: 45, sellingPrice: 65 },
  { name: "Batteries AA (2-pack)", category: "Household", purchasePrice: 25, sellingPrice: 38 },
  { name: "Batteries AAA (2-pack)", category: "Household", purchasePrice: 25, sellingPrice: 38 },
  // Load & cards
  { name: "Load - Globe ₱50", category: "Load & Cards", purchasePrice: 47, sellingPrice: 50 },
  { name: "Load - Globe ₱100", category: "Load & Cards", purchasePrice: 95, sellingPrice: 100 },
  { name: "Load - Smart ₱50", category: "Load & Cards", purchasePrice: 47, sellingPrice: 50 },
  { name: "Load - Smart ₱100", category: "Load & Cards", purchasePrice: 95, sellingPrice: 100 },
  { name: "Load - DITO ₱50", category: "Load & Cards", purchasePrice: 47, sellingPrice: 50 },
  // Clothing
  { name: "Cotton T-Shirt (M)", category: "Clothing", purchasePrice: 120, sellingPrice: 220 },
  { name: "Slippers (pair)", category: "Clothing", purchasePrice: 60, sellingPrice: 95 },
  { name: "Socks (pair)", category: "Clothing", purchasePrice: 25, sellingPrice: 40 },
];

/* ---------------- Profile avatar gallery ----------------
   A curated set of preset profile pictures (emoji on a colored ring),
   plus support for uploading a custom photo from the device. */
const AVATAR_PRESETS = [
  { id: "biz1", emoji: "🧑‍💼", bg: "#0E6E5C" },
  { id: "biz2", emoji: "👩‍💼", bg: "#0A5548" },
  { id: "biz3", emoji: "🧕", bg: "#C97F1E" },
  { id: "biz4", emoji: "👨🏽", bg: "#2E9E6C" },
  { id: "biz5", emoji: "👩🏻", bg: "#D6584A" },
  { id: "biz6", emoji: "🧔", bg: "#6E7C76" },
  { id: "biz7", emoji: "👵", bg: "#E3A23C" },
  { id: "biz8", emoji: "👴", bg: "#4B6FAE" },
  { id: "biz9", emoji: "🏪", bg: "#0E6E5C" },
  { id: "biz10", emoji: "🛒", bg: "#C97F1E" },
  { id: "biz11", emoji: "🥕", bg: "#2E9E6C" },
  { id: "biz12", emoji: "📦", bg: "#6E7C76" },
];

// Every account gets a default profile picture on registration instead of a
// blank initial — picked deterministically from their email so it's stable
// across sessions/devices without needing to store anything extra.
function defaultAvatarPreset(seed) {
  const s = String(seed || "biz");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  const preset = AVATAR_PRESETS[hash % AVATAR_PRESETS.length];
  return `preset:${preset.id}`;
}
const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", qr: false },
  { id: "gcash", label: "GCash", qr: true },
  { id: "maya", label: "Maya", qr: true },
  { id: "bank", label: "Bank Transfer", qr: true },
  { id: "card", label: "Card", qr: false },
];

const BIZORA_SUBSCRIPTION_QR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAQDAwMDAgQDAwMEBAQFBgoGBgUFBgwICQcKDgwPDg4MDQ0PERYTDxAVEQ0NExoTFRcYGRkZDxIbHRsYHRYYGRj/2wBDAQQEBAYFBgsGBgsYEA0QGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/wAARCAHmAfQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD77jBCc07FA6YpaLgFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVGyc5OKkprjikwIApUfd3E85oqTBHSilyvuTfyJaKKKooKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigApG6UtIelACUUUUAOooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigApD0paQ9KAEooooAdRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABSHpS0h6UAJRRRQA6iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACkPSlpD0oASiiigB1FFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFIelLSHpQAlFFFADqKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKQ9KWkPSgBKKKKAHUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFHejtQAUUUnNAC0UmaM0ALRSZozzQAtFNzjk9KXJxmgBaKTODzRn14oAWik3Y68UZ4yKAFopMn0o5oAWim7uM9qXdnpzQAtFJu4JNGeaAFopM0ZNAC0UmaM0ALRTd3OKC4HegB1FJmjJoAWikHFGcHkigBaKQE0tABRRSUALRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABSHpS0h6UAJRRRQA6iiigAooooAKKKKACiiigAooooAKKKKACiiigD5p/bl8T+IPCX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neadboLq41KH7XHPOuf3mJRknnqea76ztLaw0+CxsoI4LeBBHFDGNqxqBgKB2AHarFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABSHpS0h6UAJRRRQA6iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACkPSlpD0oASiiigB1FFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFIelLSHpQAlFFFADqKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoozRmgAoozRQAUUZFGaACiiigAooooAKKKKACiiigAooooAKKM0ZoAKKKM0AFFFITigBaKM0UAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABSHpS0h6UAJRRRQA6iiigAooooAKKKKACiiigAooooAKKKKACiiigAqrqEt1Dpk8ljCk1yqExRucB2xwCe1WqRgD1oA8H1D4r/ABg03xZpnhu78BaHHqOpBjax/anIYKCeTnjoa9T8M63q914Yjn8V21jpuqjebi0gmDJEu47GyTnldp/GuC8cgD9qj4f8D/UT/wAmrH1fwjp/jL9qfWdN1d7hrGHS4J2top2iWZ8IFDFSDgZNAHt8+oWVs6Jc3tvCznCCWQIX9hk8077Zb7XIuYf3f+sO8YT688V4V4E8KaD8RNd8V6z41WS91K31OWxjtJbh1FnCmNm1Qcg4P3j6Vz+iWttpvgv4u2VhfzXtrakRw3Esm9mVQP4u+On4UAfSK6nZNOluL+1MzjKxiVdzD1Az6U+6v7Wyj8y9uoLdMgb5mCDPpk185at4B0DS/wBl6y8Z2ccya/DaW14l+JmL72ZBjk4xhgMV0Xjjw7rXiDxN4b8SjSYPFFmmmqbnQGuxA+XXmZBnnkr2/nwAepeMPF9h4Q8DX3iW7Imit496RxuMzHjA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";
const BIZORA_SUBSCRIPTION_QR_LABEL = "Bizora Official — GCash / InstaPay";

/* ---------------- Real backend: Supabase ----------------
   Bizora talks to a real Supabase project over plain fetch (REST + Auth
   endpoints) — no SDK import needed, and crucially no Claude account is
   required for any of this. Customers sign up with a real email/password
   (handled by Supabase Auth), their profile + subscription requests are
   stored in Postgres, and Row Level Security enforces that:
     - a customer can only ever read/write their OWN profile & requests
     - only the admin account (ADMIN_EMAIL) can read/write EVERYONE's
   Approving a request in the Admin panel flips `is_premium` on that
   user's profile row; every signed-in device polls its own profile to
   pick up the change within ~15s.
--------------------------------------------------------------- */
const ADMIN_EMAIL = "ersonmangaliman9@gmail.com";
const ADMIN_MESSENGER_URL = "https://m.me/happy9m";
const ADMIN_MESSENGER_LABEL = "Messenger: happy9m";
const isAdminEmail = (email) => !!email && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

// Operational data (products, customers, sales, expenses, invoices) is kept
// per-account so a brand-new registration always starts from a clean slate
// instead of inheriting whatever the previous person left behind. The admin
// account is the one exception: it keeps reading/writing the original
// shared key so none of the existing admin data is lost by this change.
const dataKeyFor = (email) => {
  if (isAdminEmail(email)) return STORAGE_KEY;
  const e = (email || "").trim().toLowerCase();
  return e ? `${STORAGE_KEY}:user:${e}` : STORAGE_KEY;
};

const SUPABASE_URL = "https://ykoiznwzzehuakbmvkka.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9NvX3dv2EWKzp4QDePKgPg_pzsC1QEm";

// fetch() throws a generic TypeError for several different reasons — the
// device is actually offline, the request timed out, a CORS/server error,
// etc. — and it's misleading to label all of them "No internet connection"
// when the person's connection might be completely fine. Check the one
// signal the browser actually gives us (navigator.onLine) and word the
// message accordingly instead of guessing wrong.
const networkErrorMessage = () => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "No internet connection. Please check your network and try again.";
  }
  return "Couldn't reach Bizora's server. Please try again in a moment.";
};

// A stalled request (bad wifi, sleeping server) would otherwise hang the UI
// forever with no error and no way out — abort it after 15s so the person
// always gets a clear result instead of an infinite spinner.
async function fetchWithTimeout(url, options, ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sbAuth(path, body) {
  let res;
  try {
    res = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(networkErrorMessage());
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.msg || data.error || "Something went wrong. Please try again.");
  return data;
}
const sbSignUp = (email, password) => sbAuth("/signup", { email, password });
const sbSignIn = (email, password) => sbAuth("/token?grant_type=password", { email, password });
const sbRecoverPassword = (email) => sbAuth("/recover", { email });

// Fetch the account behind an access token — used right after a Google
// redirect, since Supabase only hands back the token in the URL, not the
// user's email/id/name.
async function sbGetUser(token) {
  let res;
  try {
    res = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    throw new Error(networkErrorMessage());
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || data.error || "Couldn't verify that Google sign-in.");
  return data;
}

async function sbRest(path, { method = "GET", token, body } = {}) {
  const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    Prefer: "return=representation",
  };
  let res;
  try {
    res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1${path}`, {
      method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(networkErrorMessage());
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && (data.message || data.error)) || "Request failed.");
  return data;
}

// Redirect-based Google sign-in via Supabase Auth's hosted OAuth flow. This
// works with ZERO extra credentials on our side — Supabase handles the
// actual Google handshake — but it only works once Google is turned on as
// a provider in the Supabase dashboard (Authentication → Providers →
// Google) with a Client ID/Secret, and that provider's redirect URI
// (`${SUPABASE_URL}/auth/v1/callback`) is registered in Google Cloud
// Console. Without that one-time setup on the project, this button will
// reach Google but then fail to complete the login.
const googleSignInUrl = () =>
  `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.href.split("#")[0])}`;

// After a Google redirect, Supabase appends the session to the URL as a
// hash fragment (#access_token=...&...) rather than a query string.
// Pull it out once on load and clear it from the address bar.
function consumeOAuthHashSession() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash || !hash.includes("access_token")) return null;
  const params = new URLSearchParams(hash.slice(1));
  const access_token = params.get("access_token");
  if (!access_token) return null;
  const refresh_token = params.get("refresh_token") || null;
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return { access_token, refresh_token };
}

// If Google auth itself succeeds but Supabase fails to complete the login
// on its end (e.g. it can't create the account record), it redirects back
// with #error=...&error_description=... instead of a session — and this
// was previously being silently ignored, which is why a failed Google
// sign-in looked like nothing happened at all. Surface it instead.
function consumeOAuthHashError() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const search = window.location.search;
  let params = null;
  if (hash && hash.includes("error")) params = new URLSearchParams(hash.slice(1));
  else if (search && search.includes("error")) params = new URLSearchParams(search.slice(1));
  if (!params) return null;
  const error = params.get("error") || params.get("error_code");
  if (!error) return null;
  const description = params.get("error_description") || error;
  window.history.replaceState(null, "", window.location.pathname);
  try { return decodeURIComponent(description.replace(/\+/g, " ")); } catch (e) { return description; }
}

// --- Persistent login ("remember me") ---------------------------------
// Keeps a signed-in person logged in across reloads/app reopens by saving
// the refresh token (not the short-lived access token) via window.storage,
// then silently exchanging it for a fresh session on the next visit. If
// the refresh token is missing, invalid, or expired, this just fails
// quietly and the person sees the normal sign-in screen — same as before.
const SB_SESSION_KEY = "bizora-sb-session-v1";

async function saveSbSession(session) {
  try {
    await window.storage.set(SB_SESSION_KEY, JSON.stringify(session), false);
  } catch (e) { /* best-effort only — a failed save just means no auto-login next time */ }
}

async function loadSbSession() {
  try {
    const res = await window.storage.get(SB_SESSION_KEY, false);
    return res && res.value ? JSON.parse(res.value) : null;
  } catch (e) {
    return null;
  }
}

async function clearSbSession() {
  try { await window.storage.delete(SB_SESSION_KEY, false); } catch (e) {}
}

const sbRefreshToken = (refresh_token) => sbAuth("/token?grant_type=refresh_token", { refresh_token });

const skuFromName = (name, i) => {
  const words = name.replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  const letters = words.slice(0, 2).map(w => w.slice(0, 3).toUpperCase()).join("-");
  return `${letters || "ITM"}-${String(i + 1).padStart(3, "0")}`;
};

// A handful of named regulars (in addition to Walk-in Customer) so the demo
// data has repeat customers, not just anonymous foot traffic.
const DEMO_CUSTOMER_NAMES = [
  { name: "Maria Santos", phone: "0917 234 5678" },
  { name: "Josefina Cruz", phone: "0928 111 2233" },
  { name: "Ramon Dela Cruz", phone: "0939 445 6677" },
  { name: "Ana Reyes", phone: "0905 998 7766" },
  { name: "Bernard Tolentino", phone: "0917 555 4433" },
  { name: "Ligaya Bautista", phone: "0946 223 1190" },
  { name: "Carlos Villanueva", phone: "0921 887 3345" },
];

const seedData = () => {
  // Stock every product in the app straight from the grocery catalog, so a
  // demo store already has a full, believable product line in Inventory.
  const products = GROCERY_CATALOG.map((item, i) => {
    const isLoad = item.category === "Load & Cards";
    const stock = isLoad ? 999 : 15 + Math.floor(Math.random() * 60);
    const minStock = isLoad ? 20 : 5 + Math.floor(Math.random() * 10);
    return {
      id: uid(), name: item.name, sku: skuFromName(item.name, i), category: item.category,
      purchasePrice: item.purchasePrice, sellingPrice: item.sellingPrice, stock, minStock, image: "",
    };
  });

  const customers = [
    { id: uid(), name: "Walk-in Customer", phone: "", notes: "Default" },
    ...DEMO_CUSTOMER_NAMES.map(c => ({ id: uid(), name: c.name, phone: c.phone, notes: "Regular customer" })),
  ];
  const walkIn = customers[0];
  const regulars = customers.slice(1);

  const sales = [];
  const expenses = [];
  const invoices = [];
  const now = new Date();
  const DAYS = 30;

  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getDay(); // 0 = Sun … 6 = Sat
    const isWeekend = dow === 0 || dow === 6;

    // A gentle upward trend across the month, plus a weekend bump and some
    // day-to-day noise — reads as a real, growing store rather than flat
    // random numbers when you screenshot the dashboard/reports.
    const trend = Math.floor(((DAYS - 1 - i) / (DAYS - 1)) * 6); // 0 → 6 over the month
    const base = 6 + trend + (isWeekend ? 4 : 0);
    const txCount = Math.max(3, base + Math.floor(Math.random() * 5) - 2);

    for (let t = 0; t < txCount; t++) {
      const p = products[Math.floor(Math.random() * products.length)];
      const qty = 1 + Math.floor(Math.random() * (p.category === "Load & Cards" ? 1 : 5));
      const useRegular = regulars.length && Math.random() < 0.35;
      const customer = useRegular ? regulars[Math.floor(Math.random() * regulars.length)] : walkIn;
      const sale = {
        id: uid(), date: iso, productId: p.id, productName: p.name, qty,
        unitPrice: p.sellingPrice, total: qty * p.sellingPrice, customerId: customer.id,
        payment: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)].id,
        notes: "", invoiced: false,
      };
      // Roughly a fifth of regulars' purchases get invoiced, so the
      // Invoices tab isn't empty in the demo either.
      if (useRegular && Math.random() < 0.5) {
        sale.invoiced = true;
        invoices.push({
          id: uid(), number: "INV-" + (1000 + invoices.length + 1), saleId: sale.id, date: sale.date,
          customerId: sale.customerId,
          items: [{ name: sale.productName, qty: sale.qty, unitPrice: sale.unitPrice, total: sale.total }],
          total: sale.total, payment: sale.payment,
        });
      }
      sales.push(sale);
    }

    // Restocking — roughly every other day.
    if (Math.random() > 0.35) {
      expenses.push({ id: uid(), date: iso, category: "Supplies", amount: 300 + Math.floor(Math.random() * 1200), notes: "Restock" });
    }
    // Transportation — a few times a week (palengke run, deliveries).
    if (Math.random() > 0.6) {
      expenses.push({ id: uid(), date: iso, category: "Transportation", amount: 100 + Math.floor(Math.random() * 250), notes: "Tricycle / delivery fare" });
    }
    // Utilities — roughly weekly, every Monday.
    if (dow === 1) {
      expenses.push({ id: uid(), date: iso, category: "Utilities", amount: 400 + Math.floor(Math.random() * 500), notes: "Electricity & water" });
    }
    // Marketing — occasional small spend (boosted posts, flyers).
    if (Math.random() > 0.85) {
      expenses.push({ id: uid(), date: iso, category: "Marketing", amount: 150 + Math.floor(Math.random() * 350), notes: "Facebook post boost" });
    }
  }

  // Rent & a helper's part-time pay — once each across the month.
  const rentDate = new Date(now); rentDate.setDate(now.getDate() - (DAYS - 2));
  expenses.push({ id: uid(), date: rentDate.toISOString().slice(0, 10), category: "Rent", amount: 6500, notes: "Store space rent" });
  const salaryDate = new Date(now); salaryDate.setDate(now.getDate() - Math.floor(DAYS / 2));
  expenses.push({ id: uid(), date: salaryDate.toISOString().slice(0, 10), category: "Salaries", amount: 4000, notes: "Part-time helper" });

  return { products, customers, sales, expenses, invoices };
};

/* ---------------- Bizora Logo ----------------
   Mark: a rounded square holding a coin/peso motif made from a stylized
   "B" whose spine doubles as the peso sign's crossbar+curves — a nod to
   currency + the brand initial in one continuous stroke. */

function BizoraMark({ size = 40, radius = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bizoraGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14876F" />
          <stop offset="1" stopColor="#0A5548" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx={radius} fill="url(#bizoraGrad)" />
      {/* peso-inspired B: vertical spine + two lobes + crossbars */}
      <path d="M15 9 V31" stroke="#F6F4EE" strokeWidth="3" strokeLinecap="round" />
      <path d="M15 10.5 H21.5 C25 10.5 27 12.3 27 15 C27 17.7 25 19.3 21.5 19.3 H15"
            stroke="#F6F4EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M15 19.3 H22.5 C26.2 19.3 28.3 21.2 28.3 24.1 C28.3 27.1 26.2 29.5 22.5 29.5 H15"
            stroke="#F6F4EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M10.5 15 H16.5" stroke="#E3A23C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10.5 19.8 H17.5" stroke="#E3A23C" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function BizoraWordmark({ size = 20, color = "var(--text)" }) {
  return (
    <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: size, letterSpacing: -0.3, color }}>
      Bizora
    </span>
  );
}

function BizoraLogo({ mark = 34, word = 19, color = "var(--text)", gap = 9 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <BizoraMark size={mark} />
      <BizoraWordmark size={word} color={color} />
    </div>
  );
}

/* A little brand mascot moment: tap the everyday header logo and it does a
   cheeky wiggle-wink with a random one-liner speech bubble — the same "coin
   that became a business" wit as the splash screen, but as a tiny reusable
   easter egg wherever the mark shows up day-to-day. */
const WITTY_LINES = [
  "Ka-ching! 💰", "Counting pesos, not sheep 🐑", "B is for Bizora (& Business)",
  "Sari-sari, everywhere!", "Receipts → results", "Tinda ngayon, tubo bukas 📈",
  "Boss mode: ON", "Every peso, accounted for ✓",
];
function WittyLogo({ size = 38, radius = 11 }) {
  const [spin, setSpin] = useState(0);
  const [bubble, setBubble] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const trigger = () => {
    setSpin(s => s + 1);
    setBubble(WITTY_LINES[Math.floor(Math.random() * WITTY_LINES.length)]);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setBubble(null), 1400);
  };

  return (
    <button onClick={trigger} title="Tap me 😉" style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}>
      <div key={spin} style={{ animation: spin ? "bzWittyWiggle .65s cubic-bezier(.34,1.56,.64,1)" : "none", transformOrigin: "50% 60%" }}>
        <BizoraMark size={size} radius={radius} />
      </div>
      {bubble && (
        <div style={{
          position: "absolute", left: "50%", bottom: "112%", transform: "translateX(-50%)",
          background: "var(--text)", color: "var(--bg)", fontSize: 10.5, fontWeight: 700,
          padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap",
          animation: "bzBubblePop .35s ease", boxShadow: "0 4px 12px rgba(0,0,0,0.25)", zIndex: 5,
        }}>
          {bubble}
          <div style={{ position: "absolute", left: "50%", top: "100%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid var(--text)" }} />
        </div>
      )}
    </button>
  );
}

/* ---------------- Cinematic splash sequence ----------------
   ~10 seconds, entirely CSS-timeline driven (animation-delay per element)
   so the whole build-up plays smoothly without React re-renders:
     0.0s – swirling particles converge toward center
     2.3s – impact flash, logo backdrop spins/scales in
     2.6s – the B letterform strokes draw themselves on, one at a time
     4.8s – settle pulse + glow burst
     5.3s – wordmark letters cascade in
     6.3s – tagline fades up
     9.3s – whole scene fades out, then hands off to the app
   Layered chime tones are scheduled against the same timestamps.
   Tap anywhere at any point to skip straight through. */
function AnimatedBizoraMark({ size = 84 }) {
  const dash = { strokeDasharray: 1, strokeDashoffset: 1, fill: "none" };
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="bzSplashGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1CA383" />
          <stop offset="1" stopColor="#0A5548" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#bzSplashGrad)"
        style={{ transformOrigin: "20px 20px", transform: "scale(0) rotate(-35deg)", animation: "bzMarkIn .4s cubic-bezier(.2,.85,.25,1.3) 1.38s forwards" }} />
      <path d="M15 9 V31" stroke="#F6F4EE" strokeWidth="3" strokeLinecap="round" pathLength="1"
        style={{ ...dash, animation: "bzDraw .33s ease 1.59s forwards" }} />
      <path d="M15 10.5 H21.5 C25 10.5 27 12.3 27 15 C27 17.7 25 19.3 21.5 19.3 H15"
        stroke="#F6F4EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1"
        style={{ ...dash, animation: "bzDraw .3s ease 1.86s forwards" }} />
      <path d="M15 19.3 H22.5 C26.2 19.3 28.3 21.2 28.3 24.1 C28.3 27.1 26.2 29.5 22.5 29.5 H15"
        stroke="#F6F4EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1"
        style={{ ...dash, animation: "bzDraw .3s ease 2.13s forwards" }} />
      <path d="M10.5 15 H16.5" stroke="#E3A23C" strokeWidth="2.4" strokeLinecap="round"
        style={{ opacity: 0, transformOrigin: "13.5px 15px", animation: "bzBarIn .21s ease 2.46s forwards" }} />
      <path d="M10.5 19.8 H17.5" stroke="#E3A23C" strokeWidth="2.4" strokeLinecap="round"
        style={{ opacity: 0, transformOrigin: "14px 19.8px", animation: "bzBarIn .21s ease 2.58s forwards" }} />
    </svg>
  );
}

/* A witty little pun for a business/finance app: the mark doesn't just fade
   in — a spinning ₱ coin flips itself into the Bizora "B", as if the coin
   literally turned into the brand. */
function CoinFlipIntro({ size = 84 }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", perspective: 600 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg,#F0C36B,#C97F1E)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: size * 0.46, color: "#4A320F",
        boxShadow: "0 8px 22px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.25)",
        animation: "bzCoinFlip 1.05s cubic-bezier(.32,.1,.28,1) 0s 1 both, bzCoinFade .32s ease 1.02s forwards",
      }}>
        ₱
      </div>
    </div>
  );
}

/* A quick cheeky sparkle + wobble once the mark has settled — the logo's
   little "ta-da!" moment. */
function LogoSparkle() {
  const pts = [
    { x: 30, y: -8, delay: 0 }, { x: -26, y: 4, delay: 0.08 }, { x: 18, y: 30, delay: 0.05 }, { x: -14, y: -26, delay: 0.12 },
  ];
  return (
    <>
      {pts.map((p, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 10 10" style={{
          position: "absolute", left: "50%", top: "50%", marginLeft: p.x, marginTop: p.y,
          opacity: 0, animation: `bzSparklePop .5s ease ${4.32 + p.delay}s forwards`,
        }}>
          <path d="M5 0 L6.1 3.9 L10 5 L6.1 6.1 L5 10 L3.9 6.1 L0 5 L3.9 3.9 Z" fill="#E3A23C" />
        </svg>
      ))}
    </>
  );
}

function SplashScreen({ onDone }) {
  const [exiting, setExiting] = useState(false);
  const doneRef = useRef(false);
  const ctxRef = useRef(null);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (ctxRef.current) { try { ctxRef.current.close(); } catch (e) {} }
    onDone();
  };

  const skip = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(finish, 350);
  };

  useEffect(() => {
    // Layered chime cues timed to the visual milestones.
    let cancelled = false;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;

      const schedule = () => {
        if (cancelled) return;
        const now = ctx.currentTime;
        const tone = (freq, start, dur, peak = 0.2, type = "sine") => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, now + start);
          gain.gain.linearRampToValueAtTime(peak, now + start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.05);
        };
        // Continuous ambient pad underneath the whole sequence — two detuned
        // low tones a fifth apart, fading in at the start and out at the end,
        // so the accent chimes above sit inside one connected "sound logo"
        // rather than isolated blips.
        const padGain = ctx.createGain();
        padGain.gain.setValueAtTime(0, now);
        padGain.connect(ctx.destination);
        const pad1 = ctx.createOscillator();
        const pad2 = ctx.createOscillator();
        pad1.type = "sine"; pad1.frequency.value = 110;
        pad2.type = "sine"; pad2.frequency.value = 164.8; // perfect fifth above
        pad1.connect(padGain); pad2.connect(padGain);
        padGain.gain.linearRampToValueAtTime(0.05, now + 0.9);
        padGain.gain.setValueAtTime(0.05, now + 5.0);
        padGain.gain.linearRampToValueAtTime(0, now + 5.9);
        pad1.start(now); pad2.start(now);
        pad1.stop(now + 6); pad2.stop(now + 6);

        tone(220, 1.38, 0.24, 0.16);           // impact as the mark spins in
        tone(660, 2.88, 0.3, 0.22);            // settle chime, note 1
        tone(880, 2.95, 0.3, 0.22);            // settle chime, note 2
        tone(1320, 3.02, 0.36, 0.2);           // settle chime, note 3
        tone(1760, 3.78, 0.42, 0.1, "triangle"); // soft shimmer as wordmark reveals
      };

      // Most browsers start a freshly-created AudioContext in "suspended"
      // state and require an explicit resume() before any sound is audible
      // — without this, the chimes were scheduled but silently dropped.
      if (ctx.state === "suspended") {
        ctx.resume().then(schedule).catch(() => { try { schedule(); } catch (e) {} });
      } else {
        schedule();
      }

      // Fallback: if the browser still won't let audio start until it sees
      // a real user gesture, unlock it the moment the person taps/clicks
      // anywhere (including the "tap to skip" splash itself).
      const unlock = () => { if (ctx.state === "suspended") ctx.resume().catch(() => {}); };
      window.addEventListener("pointerdown", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });
    } catch (e) { /* Web Audio unavailable or blocked — animation still plays */ }

    const t1 = setTimeout(() => setExiting(true), 5580);
    const t2 = setTimeout(finish, 5970);
    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const particles = React.useMemo(() => {
    const arr = [];
    const n = 20;
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const dist = 90 + Math.random() * 90;
      arr.push({
        sx: Math.cos(angle) * dist,
        sy: Math.sin(angle) * dist,
        size: 2.5 + Math.random() * 3,
        delay: Math.random() * 0.24,
        dur: 1.02 + Math.random() * 0.42,
        color: i % 3 === 0 ? "#E3A23C" : "#F6F4EE",
      });
    }
    return arr;
  }, []);

  const word = "Bizora".split("");

  return (
    <div onClick={skip} className="bz-frame" style={{
      minHeight: "100svh", width: "100%", maxWidth: 420, margin: "0 auto", boxSizing: "border-box",
      background: "radial-gradient(circle at 50% 42%, #0F7A63 0%, #0A5548 55%, #072F28 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      cursor: "pointer", overflow: "hidden", position: "relative",
      opacity: exiting ? 0 : 1, transform: exiting ? "scale(1.05)" : "scale(1)",
      transition: "opacity .5s ease, transform .5s ease",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@800&display=swap');
        @keyframes bzParticle { 0% { transform: translate(var(--sx), var(--sy)) scale(.4); opacity:0; } 18% { opacity:1; } 82% { opacity:.9; } 100% { transform: translate(0,0) scale(.15); opacity:0; } }
        @keyframes bzRingSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bzRingSpinRev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes bzFlash { 0% { opacity:0; transform:scale(.3);} 40% { opacity:.65; transform:scale(1.3);} 100% { opacity:0; transform:scale(2.4);} }
        @keyframes bzMarkIn { 0% { transform:scale(0) rotate(-35deg);} 65% { transform:scale(1.12) rotate(4deg);} 85% { transform:scale(.96) rotate(-1deg);} 100% { transform:scale(1) rotate(0deg);} }
        @keyframes bzDraw { to { stroke-dashoffset:0; } }
        @keyframes bzBarIn { 0% { opacity:0; transform:scaleX(0);} 100% { opacity:1; transform:scaleX(1);} }
        @keyframes bzSettleGlow { 0% { opacity:0; transform:scale(.5);} 45% { opacity:.55;} 100% { opacity:0; transform:scale(2.2);} }
        @keyframes bzLetterIn { 0% { opacity:0; transform:translateY(14px);} 100% { opacity:1; transform:translateY(0);} }
        @keyframes bzTagIn { 0% { opacity:0; transform:translateY(8px);} 100% { opacity:1; transform:translateY(0);} }
      `}</style>

      {/* ambient rotating rings, present throughout */}
      <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", border: "1px solid rgba(246,244,238,0.08)", animation: "bzRingSpin 11s linear infinite" }} />
      <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", border: "1px dashed rgba(227,162,60,0.15)", animation: "bzRingSpinRev 14s linear infinite" }} />

      {/* converging particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute", width: p.size, height: p.size, borderRadius: "50%", background: p.color,
          "--sx": `${p.sx}px`, "--sy": `${p.sy}px`,
          animation: `bzParticle ${p.dur}s cubic-bezier(.3,.6,.3,1) ${p.delay}s forwards`,
        }} />
      ))}

      {/* impact flash at the handoff moment */}
      <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(246,244,238,0.9), transparent 70%)", animation: "bzFlash .42s ease 1.29s forwards" }} />

      {/* the logo mark itself, drawn on */}
      <div style={{ position: "relative", opacity: 0, animation: "bzTagIn .1s linear 1.32s forwards" }}>
        <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "radial-gradient(circle, rgba(227,162,60,0.6), transparent 70%)", animation: "bzSettleGlow .54s ease 2.85s forwards" }} />
        <AnimatedBizoraMark size={84} />
      </div>

      {/* wordmark, letter by letter */}
      <div style={{ display: "flex", marginTop: 20 }}>
        {word.map((ch, i) => (
          <span key={i} style={{
            fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: -0.3, color: "#F6F4EE",
            opacity: 0, display: "inline-block",
            animation: `bzLetterIn .3s cubic-bezier(.2,.8,.3,1) ${3.18 + i * 0.036}s forwards`,
          }}>{ch}</span>
        ))}
      </div>

      {/* tagline */}
      <div style={{ marginTop: 8, fontSize: 12.5, color: "rgba(246,244,238,0.75)", opacity: 0, animation: "bzTagIn .3s ease 3.78s forwards" }}>
        Track your business. Grow your future.
      </div>

      <div style={{ position: "absolute", bottom: 26, fontSize: 10.5, color: "rgba(246,244,238,0.4)", opacity: 0, animation: "bzTagIn .3s ease 4.2s forwards" }}>
        Tap to skip
      </div>
    </div>
  );
}

/* ---------------- Scroll-reveal animation system ----------------
   Reveal wraps any element and fades/slides it in the first time it
   scrolls into view inside the app's internal scroll container. */

const ScrollRootCtx = React.createContext({ current: null });

function Reveal({ children, delay = 0, y = 16, style = {} }) {
  const ref = useRef(null);
  const rootRef = React.useContext(ScrollRootCtx);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }); },
      { root: rootRef?.current || null, threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootRef]);

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : `translateY(${y}px) scale(0.985)`,
      transition: `opacity .6s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .6s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      willChange: "opacity, transform",
      ...style,
    }}>{children}</div>
  );
}

/* Animated numeric count-up, used for hero/stat figures. */
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    const from = prevTarget.current;
    const to = Number(target) || 0;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevTarget.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ---------------- New-user tutorial ----------------
   A short, swipeable walkthrough shown once, automatically, right after a
   brand-new account finishes registering (see the pendingTutorialRef logic
   in the main component). Replayable any time from Settings. */
const TUTORIAL_STEPS = [
  { icon: Sparkles, title: "Welcome to Bizora!", desc: "Your all-in-one business partner for tracking sales, expenses, and inventory — built for Filipino entrepreneurs. Here's a quick, 30-second tour.", accent: "#E3A23C" },
  { icon: Home, title: "Your Dashboard", desc: "See today's sales, profit, and low-stock alerts the moment you open the app — no digging through notebooks or spreadsheets.", accent: "#0E6E5C" },
  { icon: ShoppingCart, title: "Record Sales in Seconds", desc: "Tap the floating + button anytime to log a sale. Stock and profit totals update automatically the moment you save.", accent: "#2E9E6C" },
  { icon: Boxes, title: "Track Your Inventory", desc: "Add your products, watch stock levels in real time, and get a heads-up before anything runs out.", accent: "#14876F" },
  { icon: Wallet, title: "Log Every Expense", desc: "Restocking costs, bills, rent — keep it all in one place so your profit numbers are always accurate.", accent: "#D6584A" },
  { icon: BarChart2, title: "Reports & Customers", desc: "Head to the More tab for deeper reports, customer records, and invoices whenever you need them.", accent: "#0A5548" },
  { icon: Check, title: "You're All Set!", desc: "That's the whole tour. Try adding your first sale or product now — Bizora will handle the rest.", accent: "#E3A23C" },
];

function TutorialOverlay({ colors, onClose }) {
  const [step, setStep] = useState(0);
  const total = TUTORIAL_STEPS.length;
  const current = TUTORIAL_STEPS[step];
  const Icon = current.icon;
  const isLast = step === total - 1;

  const next = () => { if (isLast) onClose(); else setStep(s => Math.min(total - 1, s + 1)); };
  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(8,14,12,0.62)", backdropFilter: "blur(2px)", padding: 22, animation: "bzTutFade .25s ease",
    }}>
      <div key={step} className="bz-card" style={{
        position: "relative", width: "100%", maxWidth: 340, background: "var(--surface)", padding: "30px 22px 22px",
        borderRadius: 22, textAlign: "center", animation: "bzTutCardIn .34s cubic-bezier(.22,1,.36,1)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
      }}>
        <button onClick={onClose} aria-label="Skip tutorial" style={{
          position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: "50%", border: "none",
          background: "var(--surface2)", color: "var(--muted)", display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer",
        }}>
          <X size={14} />
        </button>

        {/* Animated icon graphic — pulsing ring behind a gradient badge,
            replayed on every step since the card remounts via key={step}. */}
        <div style={{ position: "relative", width: 84, height: 84, margin: "4px auto 18px" }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%", background: current.accent, opacity: 0.18,
            animation: "bzTutRingPulse 1.8s ease-out infinite",
          }} />
          <div style={{
            position: "absolute", inset: 10, borderRadius: "50%",
            background: `linear-gradient(135deg, ${current.accent}, ${colors.primaryDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "bzTutIconPop .4s cubic-bezier(.34,1.56,.64,1)",
            boxShadow: `0 8px 20px ${current.accent}55`,
          }}>
            <Icon size={30} color="#fff" strokeWidth={2.2} />
          </div>
        </div>

        <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{current.title}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, marginBottom: 22 }}>{current.desc}</div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 18 : 6, height: 6, borderRadius: 999,
              background: i === step ? "var(--primary)" : "var(--border)",
              transition: "width .25s ease, background .25s ease",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {step > 0 && (
            <button onClick={back} style={{
              flex: 1, padding: "12px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)",
              color: "var(--text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              <ChevronLeft size={15} /> Back
            </button>
          )}
          <button onClick={next} className="bz-btn-primary" style={{
            flex: 1, padding: "12px", fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          }}>
            {isLast ? "Get Started" : "Next"} {!isLast && <ChevronRight size={15} />}
          </button>
        </div>

        {!isLast && (
          <button onClick={onClose} style={{ marginTop: 14, background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}

export default function Bizora() {
  // Skip the splash animation when we're returning from a Google sign-in
  // redirect — it was masking any error toast underneath it (the splash
  // runs ~4s, but toasts auto-dismiss after 2.2s, so a failed Google
  // sign-in used to fail completely silently).
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      return !(typeof window !== "undefined" && (hash.includes("access_token") || hash.includes("error") || search.includes("error")));
    } catch (e) {
      return true;
    }
  });
  const [loaded, setLoaded] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [authScreen, setAuthScreen] = useState("signin"); // signin | signup | forgot | onboarding
  const [authUser, setAuthUser] = useState(null); // { name, email }
  const [theme, setTheme] = useState("light");
  const [isPremium, setIsPremium] = useState(false);
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [tab, setTab] = useState("dashboard");
  const [moreScreen, setMoreScreen] = useState(null); // customers | invoices | reports | settings | upgrade
  const [showAddSale, setShowAddSale] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [restockProduct, setRestockProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [notifyLowStock, setNotifyLowStock] = useState(true);

  const saveTimer = useRef(null);
  const loadedDataKeyRef = useRef(null); // which account's data is currently loaded in memory
  const pendingTutorialRef = useRef(false); // set true when a brand-new account's data key is first created
  const [showTutorial, setShowTutorial] = useState(false);
  const scrollRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  const isAdmin = isAdminEmail(authUser?.email);
  const premiumPollRef = useRef(null);
  const lastKnownPremiumRef = useRef(false);
  // Real Supabase session — lives only in memory (no Claude account, no
  // browser storage needed), so a full page reload requires logging back
  // in, same as most real apps without a "remember me" option.
  const [sbToken, setSbToken] = useState(null);
  const [sbUserId, setSbUserId] = useState(null);
  // True only while checking for a saved session on load — kept separate
  // from `loaded` (per-account data) so we don't briefly flash the sign-in
  // screen for someone who's actually about to be auto-logged-in.
  const [restoringSession, setRestoringSession] = useState(true);

  // The app frame itself is a fixed-size card centered on the page (like a
  // phone mockup). Only that card's background was following the theme —
  // anything outside it (e.g. top/bottom or side letterboxing on a taller
  // or wider window) was left showing the page's plain white default, which
  // is why dark mode never looked "fully dark". Keep the real page
  // background in sync with the theme too.
  useEffect(() => {
    const bg = theme === "dark" ? DARK.bg : LIGHT.bg;
    try {
      document.documentElement.style.background = bg;
      document.body.style.background = bg;
      document.body.style.margin = "0";
      document.body.style.minHeight = "100vh";
    } catch (e) {}
  }, [theme]);

  // On a real phone the app IS the screen — no rounded "card" corners, no
  // side letterboxing. On a wider desktop window it renders as a centered
  // phone-shaped card instead. One rule, injected once, shared by every
  // top-level screen (splash, loading, auth, dashboard).
  useEffect(() => {
    try {
      if (!document.getElementById("bz-frame-style")) {
        const styleEl = document.createElement("style");
        styleEl.id = "bz-frame-style";
        styleEl.textContent = `.bz-frame { border-radius: 28px; } @media (max-width: 440px) { .bz-frame { border-radius: 0; } }`;
        document.head.appendChild(styleEl);
      }
    } catch (e) {}
  }, []);

  // Load — only device-local preferences & POS working data are cached
  // here. Identity, business profile, and Premium status now come fresh
  // from Supabase on every login instead, since they must work for
  // customers who have no Claude account at all.
  //
  // This is keyed per-account (see dataKeyFor) so it only runs once we
  // actually know who's signed in, and re-runs whenever the signed-in
  // account changes — e.g. someone logs out and a different person logs
  // in. A brand-new registration has no key yet, so it naturally starts
  // from an empty slate; the admin account is the sole exception and keeps
  // reading the original shared key so its existing data stays intact.
  useEffect(() => {
    if (!authUser?.email) return;
    const key = dataKeyFor(authUser.email);
    if (loadedDataKeyRef.current === key) return; // already loaded for this account
    loadedDataKeyRef.current = key;
    setLoaded(false);
    (async () => {
      try {
        const res = await window.storage.get(key, false);
        if (res && res.value) {
          const d = JSON.parse(res.value);
          setTheme(d.theme || "light");
          setNotifyLowStock(d.notifyLowStock !== false);
          setProducts(d.products || []);
          setCustomers(d.customers || []);
          setSales(d.sales || []);
          setExpenses(d.expenses || []);
          setInvoices(d.invoices || []);
        } else {
          setProducts([]);
          setCustomers([]);
          setSales([]);
          setExpenses([]);
          setInvoices([]);
          // No saved key yet for this account = a brand-new registration.
          // Queue the walkthrough to appear once the dashboard is ready.
          pendingTutorialRef.current = true;
        }
      } catch (e) {
        setProducts([]);
        setCustomers([]);
        setSales([]);
        setExpenses([]);
        setInvoices([]);
        // window.storage.get throws (rather than resolving null) when the
        // key has never been written — which is exactly the "brand-new
        // account" case, so treat it the same as the empty-result branch
        // above and queue the walkthrough.
        pendingTutorialRef.current = true;
      }
      setLoaded(true);
    })();
  }, [authUser?.email]);

  // Save (debounced) — always writes to the currently signed-in account's
  // own key, never the shared one (unless that account IS the admin).
  useEffect(() => {
    if (!loaded || !authUser?.email) return;
    const key = dataKeyFor(authUser.email);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(key, JSON.stringify({
          theme, notifyLowStock, products, customers, sales, expenses, invoices,
        }), false);
      } catch (e) { /* silent */ }
    }, 400);
  }, [loaded, authUser?.email, theme, notifyLowStock, products, customers, sales, expenses, invoices]);

  // Fire the walkthrough once — right after a brand-new account's data has
  // finished loading (empty) AND their business profile exists (onboarding
  // complete). Both need to be true so the tutorial never appears mid-setup.
  useEffect(() => {
    if (pendingTutorialRef.current && loaded && business) {
      pendingTutorialRef.current = false;
      setShowTutorial(true);
    }
  }, [loaded, business]);

  const showToast = (msg, ms = 2200) => { setToast(msg); setTimeout(() => setToast(null), ms); };

  // Poll every ~15s for admin approval of a pending subscription request.
  // Real backend now, but still polling rather than push, since a plain
  // fetch-based client has no realtime channel open.
  useEffect(() => {
    if (!loaded || !authed || !sbToken || !sbUserId) return;
    const check = async () => {
      try {
        const rows = await sbRest(`/profiles?id=eq.${sbUserId}&select=is_premium`, { token: sbToken });
        const rec = rows && rows[0];
        if (rec && !!rec.is_premium !== lastKnownPremiumRef.current) {
          lastKnownPremiumRef.current = !!rec.is_premium;
          setIsPremium(!!rec.is_premium);
          if (rec.is_premium) showToast("You've been approved — Bizora Premium unlocked ✨");
        }
      } catch (e) { /* offline or session expired — try again next tick */ }
    };
    premiumPollRef.current = setInterval(check, 15000);
    return () => clearInterval(premiumPollRef.current);
  }, [loaded, authed, sbToken, sbUserId]);

  const colors = theme === "dark" ? DARK : LIGHT;

  // ---- Derived data ----
  const today = todayISO();
  const todaySales = useMemo(() => sales.filter(s => s.date === today), [sales, today]);
  const todayExpenses = useMemo(() => expenses.filter(e => e.date === today), [expenses, today]);
  const todaySalesTotal = todaySales.reduce((a, s) => a + s.total, 0);
  const todayExpTotal = todayExpenses.reduce((a, e) => a + e.amount, 0);
  const todayProfit = todaySalesTotal - todayExpTotal;

  const monthStr = today.slice(0, 7);
  const monthSales = useMemo(() => sales.filter(s => s.date.slice(0, 7) === monthStr), [sales, monthStr]);
  const monthExpenses = useMemo(() => expenses.filter(e => e.date.slice(0, 7) === monthStr), [expenses, monthStr]);
  const monthRevenue = monthSales.reduce((a, s) => a + s.total, 0);
  const monthCost = monthSales.reduce((a, s) => {
    const p = products.find(pr => pr.id === s.productId);
    return a + (p ? p.purchasePrice * s.qty : 0);
  }, 0);
  const monthExpTotal = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const monthProfit = monthRevenue - monthCost - monthExpTotal;

  const lowStock = products.filter(p => p.stock <= p.minStock);
  const recentTx = [...sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const bestSellers = useMemo(() => {
    const map = {};
    sales.forEach(s => { map[s.productId] = (map[s.productId] || 0) + s.qty; });
    return Object.entries(map)
      .map(([pid, qty]) => ({ product: products.find(p => p.id === pid), qty }))
      .filter(x => x.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, products]);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const s = sales.filter(x => x.date === iso).reduce((a, x) => a + x.total, 0);
      const e = expenses.filter(x => x.date === iso).reduce((a, x) => a + x.amount, 0);
      days.push({ day: fmtDateShort(iso).replace(/ /, "\n"), sales: s, expenses: e, profit: s - e });
    }
    return days;
  }, [sales, expenses]);

  // ---- Actions ----
  const addSale = (sale) => {
    setSales(prev => [{ ...sale, id: uid() }, ...prev]);
    setProducts(prev => prev.map(p => p.id === sale.productId ? { ...p, stock: Math.max(0, p.stock - sale.qty) } : p));
    showToast("Sale recorded ✓");
  };
  const addProduct = (p) => { setProducts(prev => [{ ...p, id: uid() }, ...prev]); showToast("Product added ✓"); };
  const addProductsBulk = (list) => {
    setProducts(prev => {
      const existingNames = new Set(prev.map(x => x.name.toLowerCase()));
      const fresh = list.filter(it => !existingNames.has(it.name.toLowerCase()))
        .map(it => ({ id: uid(), name: it.name, sku: "", category: it.category, purchasePrice: it.purchasePrice, sellingPrice: it.sellingPrice, stock: 0, minStock: 5, image: "" }));
      if (fresh.length === 0) { showToast("Those products are already in your inventory"); return prev; }
      showToast(`Added ${fresh.length} product${fresh.length === 1 ? "" : "s"} ✓`);
      return [...fresh, ...prev];
    });
  };
  const updateProduct = (p) => { setProducts(prev => prev.map(x => x.id === p.id ? p : x)); showToast("Product updated ✓"); };
  const restockProductQty = (product, qty, cost, note) => {
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: p.stock + qty } : p));
    if (cost > 0) {
      setExpenses(prev => [{ id: uid(), date: todayISO(), category: "Supplies", amount: cost, notes: note || `Restock: ${product.name} x${qty}` }, ...prev]);
    }
    showToast(`+${qty} added to ${product.name} ✓`);
  };
  const deleteProduct = (id) => { setProducts(prev => prev.filter(x => x.id !== id)); showToast("Product removed"); };
  const addExpense = (e) => { setExpenses(prev => [{ ...e, id: uid() }, ...prev]); showToast("Expense added ✓"); };
  const deleteExpense = (id) => { setExpenses(prev => prev.filter(x => x.id !== id)); showToast("Expense removed"); };
  const addCustomer = (c) => { setCustomers(prev => [{ ...c, id: uid() }, ...prev]); showToast("Customer added ✓"); };
  const deleteCustomer = (id) => { setCustomers(prev => prev.filter(x => x.id !== id)); showToast("Customer removed"); };
  const makeInvoice = (sale) => {
    const inv = {
      id: uid(), number: "INV-" + (1000 + invoices.length + 1), saleId: sale.id, date: sale.date,
      customerId: sale.customerId, items: [{ name: sale.productName, qty: sale.qty, unitPrice: sale.unitPrice, total: sale.total }],
      total: sale.total, payment: sale.payment,
    };
    setInvoices(prev => [inv, ...prev]);
    setSales(prev => prev.map(s => s.id === sale.id ? { ...s, invoiced: true } : s));
    showToast("Invoice generated ✓");
    return inv;
  };

  // Admin-only: fills the current account with a month of realistic-looking
  // sales/expenses/customers/invoices for screenshots & demos. Overwrites
  // whatever is currently in this account, so it's gated behind a confirm
  // step in the UI (Settings) before it's called.
  const loadDemoData = () => {
    const demo = seedData();
    setProducts(demo.products);
    setCustomers(demo.customers);
    setSales(demo.sales);
    setExpenses(demo.expenses);
    setInvoices(demo.invoices);
    showToast("Demo data loaded ✓");
  };

  const finishOnboarding = async (biz, greeting) => {
    const avatar = defaultAvatarPreset(authUser?.email || biz.owner);
    const name = authUser?.name || biz.owner;
    if (sbUserId && sbToken) {
      try {
        await sbRest("/profiles", {
          method: "POST", token: sbToken,
          body: { id: sbUserId, email: authUser?.email, name, business_name: biz.name, business_type: biz.type, avatar, is_premium: false },
        });
      } catch (e) {
        // A duplicate-key error just means this profile row already exists
        // (e.g. re-running onboarding) — fine, keep going. Anything else is
        // worth flagging, since it means the cloud copy is now out of sync.
        if (!/duplicate|already exists/i.test(e.message || "")) {
          showToast(`Saved locally — ${e.message ? e.message[0].toLowerCase() + e.message.slice(1) : "couldn't sync your profile to the cloud yet."}`);
        }
      }
    }
    setBusiness({ avatar, ...biz });
    lastKnownPremiumRef.current = false;
    setOnboarded(true);
    setAuthed(true);
    showToast(greeting);
  };

  // Real Supabase Auth sign-in: exchange email/password (or a Google OAuth
  // token) for a session, then hydrate this device with that account's
  // actual cloud profile (business info + Premium status) instead of
  // forcing them through onboarding again.
  const handleSignedIn = async ({ name, email, token, id, refreshToken }) => {
    setSbToken(token || null);
    setSbUserId(id || null);
    if (token && id && refreshToken) {
      saveSbSession({ access_token: token, refresh_token: refreshToken, id, email, name });
    }
    let profile = null;
    if (token && id) {
      try {
        const rows = await sbRest(`/profiles?id=eq.${id}&select=*`, { token });
        profile = (rows && rows[0]) || null;
      } catch (e) {
        showToast(e.message || "Signed in, but couldn't reach the server for your profile.");
      }
    }
    const finalName = profile?.name || name;
    setAuthUser({ name: finalName, email });
    if (profile) {
      setBusiness(prev => ({
        ...(prev || {}),
        name: profile.business_name || prev?.name || "",
        type: profile.business_type || prev?.type || "Sari-Sari Store",
        owner: profile.name || finalName,
        avatar: profile.avatar || prev?.avatar || defaultAvatarPreset(email),
      }));
      setIsPremium(!!profile.is_premium);
      lastKnownPremiumRef.current = !!profile.is_premium;
      setOnboarded(true);
    } else if (!token) {
      showToast("Signed in, but couldn't reach the server — showing your last saved info.");
    }
    // If there's still no business on file at all (brand-new device, no
    // cloud profile, nothing cached locally either), the !business screen
    // further down will catch it and ask for onboarding.
    setAuthed(true);
    showToast(`Welcome back, ${finalName.split(" ")[0]}!`);
  };

  // Real Supabase Auth sign-up: creates the auth user (email/password may
  // still need confirming, per project settings — SignUpScreen handles
  // that case itself and only calls this once a session actually exists).
  const handleSignedUp = ({ name, email, token, id, refreshToken }) => {
    setSbToken(token || null);
    setSbUserId(id || null);
    if (token && id && refreshToken) {
      saveSbSession({ access_token: token, refresh_token: refreshToken, id, email, name });
    }
    setAuthUser({ name, email });
    setAuthScreen("onboarding");
  };

  // Completes a Google sign-in after Supabase redirects back here with the
  // session in the URL hash. Runs once on mount; a no-op on every normal
  // load since consumeOAuthHashSession() only finds something right after
  // that redirect.
  useEffect(() => {
    (async () => {
      // Case 0: Google succeeded but Supabase's own callback failed —
      // surface the real reason instead of silently landing on sign-in.
      const oauthError = consumeOAuthHashError();
      if (oauthError) {
        showToast(`Google sign-in failed: ${oauthError}`, 8000);
        setRestoringSession(false);
        return;
      }
      // Case 1: fresh redirect back from Google — session is in the URL hash.
      const hashSession = consumeOAuthHashSession();
      if (hashSession) {
        try {
          const user = await sbGetUser(hashSession.access_token);
          const name = (user.email || "").split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          await handleSignedIn({
            name: user.user_metadata?.full_name || name || "Business Owner",
            email: user.email, token: hashSession.access_token, id: user.id,
            refreshToken: hashSession.refresh_token,
          });
        } catch (e) {
          showToast(e.message || "Couldn't complete Google sign-in. Please try again.", 5000);
        }
        setRestoringSession(false);
        return;
      }
      // Case 2: no fresh redirect — check for a saved session from a
      // previous visit and silently log back in using the refresh token.
      const saved = await loadSbSession();
      if (!saved?.refresh_token) { setRestoringSession(false); return; }
      try {
        const refreshed = await sbRefreshToken(saved.refresh_token);
        if (!refreshed?.access_token) throw new Error("Session expired.");
        await handleSignedIn({
          name: saved.name || "Business Owner",
          email: saved.email, token: refreshed.access_token, id: saved.id,
          refreshToken: refreshed.refresh_token || saved.refresh_token,
        });
      } catch (e) {
        // Refresh token is invalid/expired (or offline) — clear it and
        // just show the normal sign-in screen, no error needed.
        clearSbSession();
      }
      setRestoringSession(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Belt-and-suspenders: make sure a proper viewport meta tag is present.
  // The font-size fix above is what actually stops iOS/Android from
  // auto-zooming when an input is focused, but some hosts (e.g. no <head>
  // control at all) may be missing this tag entirely, which can cause its
  // own zoom/scale quirks on load.
  useEffect(() => {
    if (typeof document === "undefined") return;
    let tag = document.querySelector('meta[name="viewport"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "viewport";
      document.head.appendChild(tag);
    }
    if (!tag.content) tag.content = "width=device-width, initial-scale=1";
  }, []);

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (restoringSession) {
    return (
      <div className="bz-frame" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", minHeight: "100svh", width: "100%", maxWidth: 420, margin: "0 auto", boxSizing: "border-box", overflow: "hidden", background: LIGHT.bg, fontFamily: "'Sora', sans-serif" }}>
        <BizoraMark size={48} />
        <div style={{ color: LIGHT.muted, fontFamily: "Inter, sans-serif", fontSize: 13 }}>Loading Bizora…</div>
      </div>
    );
  }

  // Data loading is per-account, so it can't start until someone is signed
  // in — check auth first, otherwise this screen would block forever.
  if (!authed) {
    return (
      <div style={{ position: "relative" }}>
        <AuthFlow
          screen={authScreen}
          setScreen={setAuthScreen}
          theme={theme}
          authUser={authUser}
          onSignedIn={handleSignedIn}
          onSignedUp={handleSignedUp}
          onOnboardingDone={(biz) => finishOnboarding(biz, "Account created ✓")}
        />
        {toast && (
          <div className="bz-fade-in" style={{
            position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a",
            color: "#fff", padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 999,
            maxWidth: "90vw", textAlign: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          }}>{toast}</div>
        )}
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="bz-frame" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", minHeight: "100svh", width: "100%", maxWidth: 420, margin: "0 auto", boxSizing: "border-box", overflow: "hidden", background: LIGHT.bg, fontFamily: "'Sora', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@800&display=swap');`}</style>
        <BizoraMark size={48} />
        <div style={{ color: LIGHT.muted, fontFamily: "Inter, sans-serif", fontSize: 13 }}>Loading Bizora…</div>
      </div>
    );
  }

  // Signed in but no business profile saved yet (e.g. first-time sign-in) —
  // ask for it so the dashboard always reflects the name they actually registered.
  if (!business) {
    return (
      <AuthFlow
        screen="onboarding"
        setScreen={() => {}}
        theme={theme}
        authUser={authUser}
        onSignedIn={() => {}}
        onSignedUp={() => {}}
        onOnboardingDone={(biz) => finishOnboarding(biz, `Set up ✓ Welcome, ${(authUser?.name || biz.owner || "").split(" ")[0] || "there"}!`)}
      />
    );
  }

  return (
    <div className="bz-frame" style={{
      "--bg": colors.bg, "--surface": colors.surface, "--surface2": colors.surface2,
      "--text": colors.text, "--muted": colors.muted, "--border": colors.border,
      "--primary": colors.primary, "--primaryDark": colors.primaryDark, "--accent": colors.accent,
      "--danger": colors.danger, "--success": colors.success,
      background: "var(--bg)", color: "var(--text)", fontFamily: "'Inter', sans-serif",
      width: "100%", maxWidth: 420, margin: "0 auto", minHeight: "100svh", position: "relative", boxSizing: "border-box",
      overflow: "hidden", boxShadow: theme === "dark" ? "0 0 0 1px #1c2622" : "0 0 0 1px #eae6da",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .bz-num { font-family: 'Sora', sans-serif; font-variant-numeric: tabular-nums; }
        .bz-scroll::-webkit-scrollbar { display: none; }
        .bz-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .bz-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; transition: transform .16s cubic-bezier(.22,1,.36,1), box-shadow .16s ease, border-color .16s ease; }
        button.bz-card:hover, a.bz-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(14,110,92,0.12); border-color: var(--primary); }
        button.bz-card:active, a.bz-card:active { transform: translateY(0) scale(0.98); }
        .bz-btn-primary { background: var(--primary); color: #fff; border: none; border-radius: 14px; font-weight: 600; transition: transform .12s ease, background .15s ease; }
        .bz-btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
        .bz-btn-primary:active { background: var(--primaryDark); transform: translateY(0) scale(0.98); }
        .bz-input { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; color: var(--text); padding: 11px 13px; font-size: 16px; width: 100%; font-family: 'Inter', sans-serif; transition: border-color .15s ease; }
        .bz-input:focus { outline: none; border-color: var(--primary); }
        .bz-fade-in { animation: bzfade .18s ease; }
        @keyframes bzfade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bzpulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
        @keyframes bzWittyWiggle { 0% { transform: rotate(0deg) scale(1); } 18% { transform: rotate(-16deg) scale(1.1); } 40% { transform: rotate(12deg) scale(1.06); } 62% { transform: rotate(-7deg) scale(1.02); } 82% { transform: rotate(3deg) scale(1); } 100% { transform: rotate(0deg) scale(1); } }
        @keyframes bzBubblePop { 0% { opacity: 0; transform: translateX(-50%) translateY(5px) scale(.6); } 55% { opacity: 1; transform: translateX(-50%) translateY(-3px) scale(1.08); } 100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
        @keyframes bzTutFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bzTutCardIn { 0% { opacity: 0; transform: translateY(14px) scale(.94); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes bzTutIconPop { 0% { opacity: 0; transform: scale(.4) rotate(-8deg); } 70% { transform: scale(1.08) rotate(2deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
        @keyframes bzTutRingPulse { 0% { transform: scale(0.85); opacity: 0.35; } 100% { transform: scale(1.35); opacity: 0; } }
        * { box-sizing: border-box; }
      `}</style>

      <div ref={scrollRef} className="bz-scroll" style={{ height: "100svh", overflowY: "auto", paddingBottom: 88 }}
        onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
        <ScrollRootCtx.Provider value={scrollRef}>
        <div key={tab + (moreScreen || "")} className="bz-fade-in">
        {tab === "dashboard" && (
          <Dashboard {...{ business, authUser, colors, theme, setTheme, scrollY, todaySalesTotal, todayExpTotal, todayProfit,
            monthRevenue, monthProfit, products, lowStock, recentTx, customers, bestSellers, chartData, isPremium, notifyLowStock,
            goUpgrade: () => { setTab("more"); setMoreScreen("upgrade"); } }} />
        )}
        {tab === "sales" && (
          <SalesScreen {...{ sales, products, customers, colors, onInvoice: makeInvoice, invoices }} />
        )}
        {tab === "inventory" && (
          <InventoryScreen {...{ products, colors, isPremium, onAdd: () => setShowAddProduct(true),
            onEdit: (p) => { setEditProduct(p); setShowAddProduct(true); }, onDelete: deleteProduct,
            onRestock: (p) => setRestockProduct(p),
            goUpgrade: () => { setTab("more"); setMoreScreen("upgrade"); } }} />
        )}
        {tab === "expenses" && (
          <ExpensesScreen {...{ expenses, colors, onAdd: () => setShowAddExpense(true), onDelete: deleteExpense }} />
        )}
        {tab === "more" && !moreScreen && (
          <MoreMenu {...{ colors, isPremium, isAdmin, setMoreScreen, business, authUser }} />
        )}
        {tab === "more" && moreScreen === "customers" && (
          <CustomersScreen {...{ customers, sales, colors, onAdd: () => setShowAddCustomer(true), onDelete: deleteCustomer, onBack: () => setMoreScreen(null) }} />
        )}
        {tab === "more" && moreScreen === "invoices" && (
          <InvoicesScreen {...{ invoices, customers, colors, business, onBack: () => setMoreScreen(null) }} />
        )}
        {tab === "more" && moreScreen === "reports" && (
          <ReportsScreen {...{ sales, expenses, products, colors, isPremium, business, showToast, onBack: () => setMoreScreen(null), goUpgrade: () => setMoreScreen("upgrade") }} />
        )}
        {tab === "more" && moreScreen === "settings" && (
          <SettingsScreen {...{ business, setBusiness, theme, setTheme, colors, isPremium, authUser, onBack: () => setMoreScreen(null), goUpgrade: () => setMoreScreen("upgrade"),
            onLogout: () => {
              // Fully clear the session — including in-memory operational
              // data and the "which account is loaded" marker — so if a
              // different person signs in next, they don't briefly see (or
              // accidentally save over) the previous account's data before
              // their own loads.
              clearSbSession();
              setAuthed(false);
              setAuthScreen("signin");
              setAuthUser(null);
              setBusiness(null);
              setOnboarded(false);
              setSbToken(null);
              setSbUserId(null);
              setIsPremium(false);
              lastKnownPremiumRef.current = false;
              loadedDataKeyRef.current = null;
              setLoaded(false);
              setProducts([]);
              setCustomers([]);
              setSales([]);
              setExpenses([]);
              setInvoices([]);
              pendingTutorialRef.current = false;
              setShowTutorial(false);
            },
            onReplayTutorial: () => setShowTutorial(true),
            onLoadDemoData: isAdmin ? loadDemoData : undefined,
            showToast, notifyLowStock, setNotifyLowStock }} />
        )}
        {tab === "more" && moreScreen === "upgrade" && (
          <UpgradeScreen {...{ colors, isPremium, authUser, business, sbToken, sbUserId,
            onBack: () => setMoreScreen(null), goSettings: () => setMoreScreen("settings"), showToast }} />
        )}
        {tab === "more" && moreScreen === "admin" && isAdmin && (
          <AdminScreen {...{ colors, sbToken, onBack: () => setMoreScreen(null), showToast }} />
        )}
      </div>
      </ScrollRootCtx.Provider>
      </div>

      {/* Floating Add Sale button */}
      {(tab === "dashboard" || tab === "sales") && (
        <button onClick={() => setShowAddSale(true)} style={{
          position: "absolute", right: 18, bottom: 96, width: 56, height: 56, borderRadius: 28,
          background: "var(--primary)", color: "#fff", border: "none", display: "flex", alignItems: "center",
          justifyContent: "center", boxShadow: "0 8px 20px rgba(14,110,92,0.35)", cursor: "pointer", zIndex: 20,
        }}>
          <Plus size={26} />
        </button>
      )}

      {/* Bottom nav */}
      <BottomNav tab={tab} setTab={(t) => { setTab(t); setMoreScreen(null); }} colors={colors} />

      {/* Toast */}
      {toast && (
        <div className="bz-fade-in" style={{
          position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: colors.text,
          color: colors.bg, padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 60,
          whiteSpace: "nowrap",
        }}>{toast}</div>
      )}

      {/* Modals */}
      {showAddSale && (
        <AddSaleModal {...{ products, customers, colors, business, onClose: () => setShowAddSale(false), onSave: (s) => { addSale(s); setShowAddSale(false); } }} />
      )}
      {showAddProduct && (
        <AddProductModal {...{ colors, product: editProduct, onClose: () => { setShowAddProduct(false); setEditProduct(null); },
          onSave: (p) => { editProduct ? updateProduct(p) : addProduct(p); setShowAddProduct(false); setEditProduct(null); },
          onAddAll: (list) => { addProductsBulk(list); setShowAddProduct(false); } }} />
      )}
      {restockProduct && (
        <RestockModal {...{ colors, product: restockProduct, onClose: () => setRestockProduct(null),
          onSave: ({ qty, cost, note }) => { restockProductQty(restockProduct, qty, cost, note); setRestockProduct(null); } }} />
      )}
      {showAddExpense && (
        <AddExpenseModal {...{ colors, onClose: () => setShowAddExpense(false), onSave: (e) => { addExpense(e); setShowAddExpense(false); } }} />
      )}
      {showAddCustomer && (
        <AddCustomerModal {...{ colors, onClose: () => setShowAddCustomer(false), onSave: (c) => { addCustomer(c); setShowAddCustomer(false); } }} />
      )}

      {/* New-account walkthrough */}
      {showTutorial && (
        <TutorialOverlay colors={colors} onClose={() => setShowTutorial(false)} />
      )}
    </div>
  );
}

const LIGHT = {
  bg: "#F6F4EE", surface: "#FFFFFF", surface2: "#F0EDE3", text: "#16241F", muted: "#6E7C76",
  border: "#E6E1D3", primary: "#0E6E5C", primaryDark: "#0A5548", accent: "#E3A23C", danger: "#D6584A", success: "#2E9E6C",
};
const DARK = {
  bg: "#0D1613", surface: "#16211D", surface2: "#1D2925", text: "#EDF3EF", muted: "#8FA39B",
  border: "#25322C", primary: "#22A187", primaryDark: "#1B8570", accent: "#E3A23C", danger: "#E17263", success: "#3FBE8B",
};

/* ---------------- Shared bits ---------------- */

function SectionHeader({ title, subtitle, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "20px 18px 6px", gap: 10 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: "var(--surface2)", border: "none", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}>
          <ArrowLeft size={17} />
        </button>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 20 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 1 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 30px", color: "var(--muted)" }}>
      <Icon size={30} style={{ opacity: 0.5, marginBottom: 10 }} />
      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14.5 }}>{title}</div>
      <div style={{ fontSize: 12.5, marginTop: 3 }}>{subtitle}</div>
    </div>
  );
}

function Modal({ title, onClose, children, colors }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div className="bz-fade-in" onClick={(e) => e.stopPropagation()} style={{
        background: "var(--bg)", width: "100%", maxHeight: "88%", borderRadius: "22px 22px 0 0", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 16.5 }}>{title}</div>
          <button onClick={onClose} style={{ background: "var(--surface2)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}>
            <X size={16} />
          </button>
        </div>
        <div className="bz-scroll" style={{ padding: 18, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function resizeImageFile(file, opts = {}) {
  const { maxDim = 260, format = "image/jpeg", quality = 0.85 } = opts;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height) { if (width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; } }
        else { if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; } }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (format === "image/png") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height); }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(format, quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ProfileAvatar({ avatar, size = 42, fallback = "?" }) {
  const base = { width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" };
  if (avatar && avatar.startsWith("data:")) {
    return <div style={base}><img src={avatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>;
  }
  if (avatar && avatar.startsWith("preset:")) {
    const preset = AVATAR_PRESETS.find(p => p.id === avatar.slice(7));
    if (preset) return <div style={{ ...base, background: preset.bg, fontSize: size * 0.52 }}>{preset.emoji}</div>;
  }
  return <div style={{ ...base, background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: size * 0.4 }}>{fallback}</div>;
}

function PremiumBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "linear-gradient(135deg,#E3A23C,#C97F1E)", color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "2.5px 7px", borderRadius: 999 }}>
      <Crown size={10} /> PREMIUM
    </span>
  );
}

/* ---------------- Bottom Nav ---------------- */

function BottomNav({ tab, setTab, colors }) {
  const items = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "sales", label: "Sales", icon: ShoppingCart },
    { id: "inventory", label: "Stock", icon: Boxes },
    { id: "expenses", label: "Expenses", icon: Wallet },
    { id: "more", label: "More", icon: SettingsIcon },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--surface)",
      borderTop: "1px solid var(--border)", display: "flex", padding: "8px 6px 14px", zIndex: 30,
    }}>
      {items.map(it => {
        const active = tab === it.id;
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => setTab(it.id)} style={{
            flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 0",
          }}>
            <div style={{
              width: 40, height: 26, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? "var(--primary)" : "transparent", transition: "background .15s",
            }}>
              <Icon size={17} color={active ? "#fff" : "var(--muted)"} strokeWidth={active ? 2.3 : 2} />
            </div>
            <div style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, color: active ? "var(--primary)" : "var(--muted)" }}>{it.label}</div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Dashboard ---------------- */

function Dashboard(props) {
  const { business, authUser, theme, setTheme, todaySalesTotal, todayExpTotal, todayProfit, monthRevenue, monthProfit,
    products, lowStock, recentTx, customers, bestSellers, chartData, isPremium, notifyLowStock, goUpgrade } = props;

  const firstName = (authUser?.name || "").trim().split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Magandang umaga" : hour < 18 ? "Magandang hapon" : "Magandang gabi";

  const animatedProfit = useCountUp(todayProfit);
  const animatedSales = useCountUp(todaySalesTotal);
  const animatedExp = useCountUp(todayExpTotal);
  const showLowStockAlert = lowStock.length > 0 && (isPremium ? notifyLowStock : true);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 18px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <WittyLogo size={38} radius={11} />
          <div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 17.5 }}>{greeting}, {firstName} 👋</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{business.name} · {business.type}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ background: "var(--surface2)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {!isPremium && (
            <button onClick={goUpgrade} style={{ background: "linear-gradient(135deg,#E3A23C,#C97F1E)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <Crown size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Hero stat */}
      <Reveal>
        <div style={{ margin: "14px 18px 0", background: "linear-gradient(135deg, var(--primary), var(--primaryDark))", borderRadius: 20, padding: "18px 20px", color: "#fff" }}>
          <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>TODAY'S PROFIT</div>
          <div className="bz-num" style={{ fontSize: 30, fontWeight: 800, marginTop: 3 }}>{peso(animatedProfit)}</div>
          <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Sales</div>
              <div className="bz-num" style={{ fontSize: 15, fontWeight: 700 }}>{peso(animatedSales)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Expenses</div>
              <div className="bz-num" style={{ fontSize: 15, fontWeight: 700 }}>{peso(animatedExp)}</div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "14px 18px 0" }}>
        <Reveal delay={40}><StatCard icon={CircleDollarSign} label="Monthly Revenue" value={pesoShort(monthRevenue)} color="var(--success)" /></Reveal>
        <Reveal delay={80}><StatCard icon={TrendingUp} label="Monthly Profit" value={pesoShort(monthProfit)} color="var(--primary)" /></Reveal>
        <Reveal delay={120}><StatCard icon={Package} label="Products" value={products.length} color="var(--accent)" /></Reveal>
        <Reveal delay={160}><StatCard icon={AlertTriangle} label="Low Stock" value={lowStock.length} color="var(--danger)" /></Reveal>
      </div>

      {/* Chart */}
      <Reveal delay={60}>
        <div className="bz-card" style={{ margin: "16px 18px 0", padding: "14px 10px 6px" }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, padding: "0 8px 8px" }}>7-Day Sales vs Expenses</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ left: 0, right: 4, top: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 9.5, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => peso(v)} contentStyle={{ fontSize: 11, borderRadius: 10 }} />
              <Bar dataKey="sales" fill="var(--primary)" radius={[4, 4, 0, 0]} animationDuration={700} />
              <Bar dataKey="expenses" fill="var(--danger)" radius={[4, 4, 0, 0]} animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Reveal>

      {showLowStockAlert && (
        <Reveal>
          <div style={{ margin: "16px 18px 0", background: "rgba(214,88,74,0.1)", border: "1px solid var(--danger)", borderRadius: 16, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, color: "var(--danger)" }}>
              <AlertTriangle size={15} /> Low Stock Alerts
            </div>
            {lowStock.slice(0, 3).map(p => (
              <div key={p.id} style={{ fontSize: 12.5, marginTop: 5, color: "var(--text)" }}>{p.name} — only {p.stock} left</div>
            ))}
          </div>
        </Reveal>
      )}

      {/* Best sellers */}
      <SectionHeader title="Best-Selling Products" subtitle={null} />
      <div style={{ padding: "0 18px" }}>
        {bestSellers.length === 0 ? (
          <EmptyState icon={Sparkles} title="No sales yet" subtitle="Record a sale to see your top products." />
        ) : bestSellers.map((b, i) => (
          <Reveal key={b.product.id} delay={i * 40}>
            <div className="bz-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{b.product.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{b.qty} sold</div>
              </div>
              <div className="bz-num" style={{ fontWeight: 700, fontSize: 13 }}>{peso(b.product.sellingPrice * b.qty)}</div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Recent transactions */}
      <SectionHeader title="Recent Transactions" />
      <div style={{ padding: "0 18px 20px" }}>
        {recentTx.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions" subtitle="Your recent sales will appear here." />
        ) : recentTx.map((s, i) => {
          const c = customers.find(cu => cu.id === s.customerId);
          return (
            <Reveal key={s.id} delay={i * 35}>
              <div className="bz-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(14,110,92,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShoppingCart size={15} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.productName}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{c?.name || "Walk-in"} · {fmtDateShort(s.date)}</div>
                </div>
                <div className="bz-num" style={{ fontWeight: 700, fontSize: 13 }}>{peso(s.total)}</div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bz-card" style={{ padding: "13px 13px" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Icon size={15} color={color} />
      </div>
      <div className="bz-num" style={{ fontSize: 17, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{label}</div>
    </div>
  );
}

/* ---------------- Sales ---------------- */

function SalesScreen({ sales, products, customers, colors, onInvoice, invoices }) {
  const [filter, setFilter] = useState("");
  const sorted = [...sales].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted.filter(s => s.productName.toLowerCase().includes(filter.toLowerCase()));
  const total = filtered.reduce((a, s) => a + s.total, 0);

  return (
    <div>
      <SectionHeader title="Sales" subtitle={`${filtered.length} transactions · ${peso(total)}`} />
      <div style={{ padding: "8px 18px" }}>
        <div style={{ position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
          <input className="bz-input" style={{ paddingLeft: 34 }} placeholder="Search product…" value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </div>
      <div style={{ padding: "6px 18px 90px" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No sales found" subtitle="Tap the + button to record a sale." />
        ) : filtered.map((s, i) => {
          const c = customers.find(cu => cu.id === s.customerId);
          const pm = PAYMENT_METHODS.find(p => p.id === s.payment);
          const alreadyInvoiced = invoices.some(i => i.saleId === s.id);
          return (
            <Reveal key={s.id} delay={Math.min(i, 8) * 30}>
            <div className="bz-card" style={{ padding: "12px 13px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.productName}</div>
                <div className="bz-num" style={{ fontWeight: 700, fontSize: 13.5 }}>{peso(s.total)}</div>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                {c?.name || "Walk-in"} · {s.qty} pc(s) × {peso(s.unitPrice)} · {pm?.label} · {fmtDateShort(s.date)}
              </div>
              {s.notes && <div style={{ fontSize: 11.5, marginTop: 3, color: "var(--muted)" }}>Note: {s.notes}</div>}
              <div style={{ marginTop: 8 }}>
                {alreadyInvoiced ? (
                  <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 600 }}>✓ Invoiced</span>
                ) : (
                  <button onClick={() => onInvoice(s)} style={{ background: "var(--surface2)", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11.5, fontWeight: 600, color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <FileText size={12} /> Generate Invoice
                  </button>
                )}
              </div>
            </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Inventory ---------------- */

function InventoryScreen({ products, colors, isPremium, onAdd, onEdit, onDelete, onRestock, goUpgrade }) {
  const [filter, setFilter] = useState("");
  const filtered = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
  const FREE_LIMIT = 50;
  const atLimit = !isPremium && products.length >= FREE_LIMIT;

  return (
    <div>
      <SectionHeader title="Inventory" subtitle={`${products.length} products`} right={
        <button onClick={atLimit ? goUpgrade : onAdd} className="bz-btn-primary" style={{ padding: "8px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
          {atLimit ? <Crown size={14} /> : <Plus size={14} />} Add
        </button>
      } />
      <div style={{ padding: "8px 18px" }}>
        <div style={{ position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
          <input className="bz-input" style={{ paddingLeft: 34 }} placeholder="Search products…" value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </div>
      {atLimit && (
        <button onClick={goUpgrade} style={{ margin: "8px 18px", display: "block", width: "calc(100% - 36px)", textAlign: "left", background: "rgba(227,162,60,0.12)", border: "1px solid var(--accent)", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
          You've reached the Free plan's 50-product limit. <b>Upgrade to Premium</b> for unlimited products.
        </button>
      )}
      <div style={{ padding: "6px 18px 90px" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="No products yet" subtitle="Add your first product to start tracking stock." />
        ) : filtered.map((p, i) => {
          const low = p.stock <= p.minStock;
          return (
            <Reveal key={p.id} delay={Math.min(i, 8) * 30}>
            <div className="bz-card" style={{ padding: "12px 13px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{p.sku} · {p.category}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onRestock(p)} title="Restock" style={{ background: "rgba(14,110,92,0.1)", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--primary)" }}><PackagePlus size={13} /></button>
                  <button onClick={() => onEdit(p)} style={{ background: "var(--surface2)", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}><Edit2 size={12} /></button>
                  <button onClick={() => onDelete(p.id)} style={{ background: "var(--surface2)", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--danger)" }}><Trash2 size={12} /></button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 9 }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: "var(--muted)" }}>Sells for</div>
                    <div className="bz-num" style={{ fontWeight: 700, fontSize: 13 }}>{peso(p.sellingPrice)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: "var(--muted)" }}>Stock</div>
                    <div className="bz-num" style={{ fontWeight: 700, fontSize: 13, color: low ? "var(--danger)" : "var(--text)" }}>{p.stock}</div>
                  </div>
                </div>
                {low && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--danger)", display: "flex", alignItems: "center", gap: 3, background: "rgba(214,88,74,0.12)", padding: "3px 8px", borderRadius: 999 }}>
                    <AlertTriangle size={10} /> Low stock
                  </span>
                )}
              </div>
            </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Expenses ---------------- */

function ExpensesScreen({ expenses, colors, onAdd, onDelete }) {
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const total = sorted.reduce((a, e) => a + e.amount, 0);
  return (
    <div>
      <SectionHeader title="Expenses" subtitle={`${sorted.length} entries · ${peso(total)} total`} right={
        <button onClick={onAdd} className="bz-btn-primary" style={{ padding: "8px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
          <Plus size={14} /> Add
        </button>
      } />
      <div style={{ padding: "10px 18px 90px" }}>
        {sorted.length === 0 ? (
          <EmptyState icon={Wallet} title="No expenses logged" subtitle="Track supplies, rent, and other costs here." />
        ) : sorted.map((e, i) => (
          <Reveal key={e.id} delay={Math.min(i, 8) * 30}>
          <div className="bz-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 13px", marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(214,88,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingDown size={15} color="var(--danger)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.category}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{fmtDateShort(e.date)}{e.notes ? " · " + e.notes : ""}</div>
            </div>
            <div className="bz-num" style={{ fontWeight: 700, fontSize: 13.5, color: "var(--danger)" }}>-{peso(e.amount)}</div>
            <button onClick={() => onDelete(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><Trash2 size={13} /></button>
          </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ---------------- More menu ---------------- */

function MoreMenu({ colors, isPremium, isAdmin, setMoreScreen, business, authUser }) {
  const items = [
    { id: "customers", label: "Customers", icon: Users, desc: "Manage your customer list" },
    { id: "invoices", label: "Invoices & Receipts", icon: FileText, desc: "Generated invoices", premium: true },
    { id: "reports", label: "Reports", icon: BarChart2, desc: "Sales, expense & profit reports" },
    { id: "settings", label: "Settings", icon: SettingsIcon, desc: "Business profile & preferences" },
  ];
  const displayName = authUser?.name || business?.owner || "?";
  return (
    <div>
      <SectionHeader title="More" subtitle="Manage your business" />
      <div style={{ padding: "10px 18px" }}>
        {business && (
          <button onClick={() => setMoreScreen("settings")} className="bz-card" style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", marginBottom: 14,
            cursor: "pointer", textAlign: "left", border: "1px solid var(--border)",
          }}>
            <ProfileAvatar avatar={business.avatar} size={44} fallback={displayName.charAt(0).toUpperCase()} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{displayName}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{business.name}</div>
            </div>
            <ChevronRight size={16} color="var(--muted)" />
          </button>
        )}
        {!isPremium && (
          <button onClick={() => setMoreScreen("upgrade")} style={{
            width: "100%", textAlign: "left", background: "linear-gradient(135deg,#0E6E5C,#0A5548)", border: "none", borderRadius: 18,
            padding: "16px 16px", marginBottom: 14, cursor: "pointer", color: "#fff",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14.5 }}><Crown size={16} color="#E3A23C" /> Go Bizora Premium</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>Unlimited products, PDF/Excel reports, AI insights, and more.</div>
          </button>
        )}
        {isAdmin && (
          <button onClick={() => setMoreScreen("admin")} className="bz-card" style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", marginBottom: 14,
            cursor: "pointer", textAlign: "left", border: "1.5px solid var(--accent)", background: "rgba(227,162,60,0.08)",
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown size={16} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>Admin</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>Registered users & subscription requests</div>
            </div>
            <ChevronRight size={16} color="var(--muted)" />
          </button>
        )}
        {items.map(it => {
          const Icon = it.icon;
          const locked = it.premium && !isPremium;
          return (
            <button key={it.id} onClick={() => setMoreScreen(locked ? "upgrade" : it.id)} className="bz-card" style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", marginBottom: 9,
              cursor: "pointer", textAlign: "left", border: "1px solid var(--border)",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6 }}>{it.label} {it.premium && !isPremium && <PremiumBadge />}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>{it.desc}</div>
              </div>
              <ChevronRight size={16} color="var(--muted)" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Customers ---------------- */

function CustomersScreen({ customers, sales, colors, onAdd, onDelete, onBack }) {
  return (
    <div>
      <SectionHeader title="Customers" subtitle={`${customers.length} customers`} onBack={onBack} right={
        <button onClick={onAdd} className="bz-btn-primary" style={{ padding: "8px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
          <UserPlus size={14} /> Add
        </button>
      } />
      <div style={{ padding: "10px 18px 90px" }}>
        {customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers yet" subtitle="Add customers to track their purchases." />
        ) : customers.map((c, i) => {
          const purchases = sales.filter(s => s.customerId === c.id);
          const spent = purchases.reduce((a, s) => a + s.total, 0);
          return (
            <Reveal key={c.id} delay={Math.min(i, 8) * 30}>
            <div className="bz-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 13px", marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.phone || "No phone"} · {purchases.length} orders</div>
              </div>
              <div className="bz-num" style={{ fontWeight: 700, fontSize: 12.5 }}>{peso(spent)}</div>
              <button onClick={() => onDelete(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><Trash2 size={13} /></button>
            </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Invoices ---------------- */

function InvoicesScreen({ invoices, customers, colors, business, onBack }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <SectionHeader title="Invoices & Receipts" subtitle={`${invoices.length} generated`} onBack={onBack} />
      <div style={{ padding: "10px 18px 90px" }}>
        {invoices.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices yet" subtitle="Generate one from the Sales tab." />
        ) : invoices.map(inv => {
          const c = customers.find(cu => cu.id === inv.customerId);
          const pm = PAYMENT_METHODS.find(p => p.id === inv.payment);
          const canShowQR = pm?.qr && business?.paymentQR;
          const isOpen = expanded === inv.id;
          return (
            <div key={inv.id} className="bz-card" style={{ padding: "13px 14px", marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{inv.number}</div>
                <div className="bz-num" style={{ fontWeight: 700, fontSize: 13.5 }}>{peso(inv.total)}</div>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>{c?.name || "Walk-in"} · {fmtDate(inv.date)}{pm ? " · " + pm.label : ""}</div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--border)" }}>
                {inv.items.map((it, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                    <span style={{ color: "var(--muted)" }}>{it.name} × {it.qty}</span>
                    <span className="bz-num">{peso(it.total)}</span>
                  </div>
                ))}
              </div>
              {canShowQR && (
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => setExpanded(isOpen ? null : inv.id)} style={{
                    width: "100%", padding: "8px", borderRadius: 10, border: "1px dashed var(--primary)", background: "rgba(14,110,92,0.06)",
                    color: "var(--primary)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <QrCode size={13} /> {isOpen ? "Hide QR Code" : `Show ${business.paymentQRLabel || "Payment"} QR`}
                  </button>
                  {isOpen && (
                    <div className="bz-fade-in" style={{ marginTop: 8, textAlign: "center", background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 12px" }}>
                      <img src={business.paymentQR} alt="Payment QR" style={{ width: 170, height: 170, objectFit: "contain", margin: "0 auto" }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#16241F", marginTop: 8 }}>{business.paymentQRLabel || "Scan to Pay"}</div>
                      <div style={{ fontSize: 10.5, color: "#6E7C76", marginTop: 2 }}>Transfer fees may apply.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Reports ---------------- */

function downloadTextFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function buildReportCSV({ business, sales, expenses, totalRevenue, totalExpenses, totalProfit, inventoryValuation, bestSellers }) {
  const lines = [];
  lines.push(`Bizora Report — ${business?.name || ""}`);
  lines.push(`Generated,${fmtDate(todayISO())}`);
  lines.push("");
  lines.push("Summary");
  lines.push(["Metric", "Amount (PHP)"].join(","));
  lines.push(["Total Revenue", totalRevenue.toFixed(2)].join(","));
  lines.push(["Total Expenses", totalExpenses.toFixed(2)].join(","));
  lines.push(["Total Profit", totalProfit.toFixed(2)].join(","));
  lines.push(["Inventory Value (cost)", inventoryValuation.toFixed(2)].join(","));
  lines.push("");
  lines.push("Best-Selling Products");
  lines.push(["Product", "Qty Sold", "Revenue (PHP)"].join(","));
  bestSellers.forEach(b => lines.push([csvEscape(b.product.name), b.qty, (b.product.sellingPrice * b.qty).toFixed(2)].join(",")));
  lines.push("");
  lines.push("Sales");
  lines.push(["Date", "Product", "Qty", "Unit Price", "Total", "Payment"].join(","));
  sales.forEach(s => lines.push([s.date, csvEscape(s.productName), s.qty, s.unitPrice.toFixed(2), s.total.toFixed(2), s.payment].join(",")));
  lines.push("");
  lines.push("Expenses");
  lines.push(["Date", "Category", "Amount", "Notes"].join(","));
  expenses.forEach(e => lines.push([e.date, csvEscape(e.category), e.amount.toFixed(2), csvEscape(e.notes || "")].join(",")));
  return lines.join("\n");
}

function openPrintableReport({ business, totalRevenue, totalExpenses, totalProfit, inventoryValuation, inventoryRetailValue, bestSellers, sales, expenses }) {
  const rowsSales = sales.slice(0, 100).map(s => `<tr><td>${fmtDate(s.date)}</td><td>${s.productName}</td><td>${s.qty}</td><td>${peso(s.unitPrice)}</td><td>${peso(s.total)}</td></tr>`).join("");
  const rowsExp = expenses.slice(0, 100).map(e => `<tr><td>${fmtDate(e.date)}</td><td>${e.category}</td><td>${peso(e.amount)}</td><td>${e.notes || ""}</td></tr>`).join("");
  const rowsBest = bestSellers.map(b => `<tr><td>${b.product.name}</td><td>${b.qty}</td><td>${peso(b.product.sellingPrice * b.qty)}</td></tr>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bizora Report — ${business?.name || ""}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;color:#16241F;padding:32px;max-width:760px;margin:0 auto;}
    h1{color:#0E6E5C;margin-bottom:2px;} h2{color:#0E6E5C;font-size:15px;margin-top:28px;border-bottom:2px solid #0E6E5C;padding-bottom:4px;}
    table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;} th,td{border:1px solid #E6E1D3;padding:6px 8px;text-align:left;}
    th{background:#F0EDE3;} .meta{color:#6E7C76;font-size:12px;margin-bottom:18px;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;}
    .stat{border:1px solid #E6E1D3;border-radius:10px;padding:10px 12px;} .stat .l{font-size:11px;color:#6E7C76;} .stat .v{font-size:18px;font-weight:800;}
  </style></head><body>
  <h1>${business?.name || "Business"} — Report</h1>
  <div class="meta">${business?.owner ? "Owner: " + business.owner + " · " : ""}Generated ${fmtDate(todayISO())}</div>
  <div class="grid">
    <div class="stat"><div class="l">Total Revenue</div><div class="v">${peso(totalRevenue)}</div></div>
    <div class="stat"><div class="l">Total Expenses</div><div class="v">${peso(totalExpenses)}</div></div>
    <div class="stat"><div class="l">Total Profit</div><div class="v">${peso(totalProfit)}</div></div>
    <div class="stat"><div class="l">Inventory Value</div><div class="v">${peso(inventoryValuation)}</div></div>
  </div>
  <h2>Best-Selling Products</h2>
  <table><tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr>${rowsBest || "<tr><td colspan=3>No sales data yet.</td></tr>"}</table>
  <h2>Sales</h2>
  <table><tr><th>Date</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>${rowsSales || "<tr><td colspan=5>No sales yet.</td></tr>"}</table>
  <h2>Expenses</h2>
  <table><tr><th>Date</th><th>Category</th><th>Amount</th><th>Notes</th></tr>${rowsExp || "<tr><td colspan=4>No expenses yet.</td></tr>"}</table>
  <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open(); w.document.write(html); w.document.close();
  return true;
}

function ReportsScreen({ sales, expenses, products, colors, isPremium, onBack, goUpgrade, business, showToast }) {
  const totalRevenue = sales.reduce((a, s) => a + s.total, 0);
  const totalCost = sales.reduce((a, s) => {
    const p = products.find(pr => pr.id === s.productId);
    return a + (p ? p.purchasePrice * s.qty : 0);
  }, 0);
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
  const totalProfit = totalRevenue - totalCost - totalExpenses;
  const inventoryValuation = products.reduce((a, p) => a + p.purchasePrice * p.stock, 0);
  const inventoryRetailValue = products.reduce((a, p) => a + p.sellingPrice * p.stock, 0);

  const bestSellers = useMemo(() => {
    const map = {};
    sales.forEach(s => { map[s.productId] = (map[s.productId] || 0) + s.qty; });
    return Object.entries(map).map(([pid, qty]) => ({ product: products.find(p => p.id === pid), qty }))
      .filter(x => x.product).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [sales, products]);

  return (
    <div>
      <SectionHeader title="Reports" subtitle="Daily, weekly & monthly insights" onBack={onBack} />
      <div style={{ padding: "10px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <ReportStat label="Total Revenue" value={peso(totalRevenue)} color="var(--success)" />
          <ReportStat label="Total Expenses" value={peso(totalExpenses)} color="var(--danger)" />
          <ReportStat label="Total Profit" value={peso(totalProfit)} color="var(--primary)" />
          <ReportStat label="Inventory Value" value={peso(inventoryValuation)} color="var(--accent)" />
        </div>

        <div className="bz-card" style={{ padding: "13px 14px", marginTop: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>Inventory Valuation</div>
          <Row label="At cost price" value={peso(inventoryValuation)} />
          <Row label="At selling price" value={peso(inventoryRetailValue)} />
          <Row label="Potential margin" value={peso(inventoryRetailValue - inventoryValuation)} />
        </div>

        <div className="bz-card" style={{ padding: "13px 14px", marginTop: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>Best-Selling Products</div>
          {bestSellers.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>No sales data yet.</div>
          ) : bestSellers.map(b => (
            <Row key={b.product.id} label={`${b.product.name} (${b.qty} sold)`} value={peso(b.product.sellingPrice * b.qty)} />
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          {isPremium ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button className="bz-btn-primary" style={{ flex: 1, padding: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}
                onClick={() => {
                  const ok = openPrintableReport({ business, totalRevenue, totalExpenses, totalProfit, inventoryValuation, inventoryRetailValue, bestSellers, sales, expenses });
                  showToast && showToast(ok ? "Report opened — choose \u201cSave as PDF\u201d ✓" : "Please allow pop-ups to export PDF");
                }}>
                <Download size={14} /> Export PDF
              </button>
              <button className="bz-btn-primary" style={{ flex: 1, padding: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, background: "var(--surface2)", color: "var(--text)" }}
                onClick={() => {
                  const csv = buildReportCSV({ business, sales, expenses, totalRevenue, totalExpenses, totalProfit, inventoryValuation, bestSellers });
                  downloadTextFile(`bizora-report-${todayISO()}.csv`, csv, "text/csv;charset=utf-8;");
                  showToast && showToast("Excel (CSV) report downloaded ✓");
                }}>
                <Download size={14} /> Export Excel
              </button>
            </div>
          ) : (
            <button onClick={goUpgrade} style={{ width: "100%", padding: "12px", borderRadius: 14, border: "1px dashed var(--accent)", background: "rgba(227,162,60,0.1)", color: "var(--text)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Crown size={14} color="var(--accent)" /> Upgrade to export PDF & Excel reports
            </button>
          )}
        </div>
      </div>
      <div style={{ height: 30 }} />
    </div>
  );
}

function ReportStat({ label, value, color }) {
  return (
    <div className="bz-card" style={{ padding: "12px 13px" }}>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div className="bz-num" style={{ fontSize: 16, fontWeight: 800, color, marginTop: 3 }}>{value}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span className="bz-num" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsScreen({ business, setBusiness, theme, setTheme, colors, isPremium, authUser, onBack, goUpgrade, onLogout, onReplayTutorial, onLoadDemoData, showToast, notifyLowStock, setNotifyLowStock }) {
  const [form, setForm] = useState(business);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [qrLabel, setQrLabel] = useState(business.paymentQRLabel || "GCash / InstaPay");
  const [uploadingQR, setUploadingQR] = useState(false);
  const qrInputRef = useRef(null);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);

  useEffect(() => { setForm(business); }, [business]);

  const dirty = form.name !== business.name || form.owner !== business.owner || form.type !== business.type;
  const canSave = dirty && form.name.trim().length > 0 && form.owner.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const cleaned = { ...form, name: form.name.trim(), owner: form.owner.trim() };
    setBusiness(cleaned);
    setForm(cleaned);
    showToast && showToast("Business profile saved ✓");
  };

  const setAvatar = (value) => {
    setBusiness({ ...business, avatar: value });
    setForm(f => ({ ...f, avatar: value }));
    setShowAvatarPicker(false);
    showToast && showToast(value ? "Profile photo updated ✓" : "Profile photo removed");
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast && showToast("Please choose an image file"); return; }
    try {
      setUploading(true);
      const dataUrl = await resizeImageFile(file);
      setAvatar(dataUrl);
    } catch (err) {
      showToast && showToast("Couldn't load that photo");
    } finally {
      setUploading(false);
    }
  };

  const displayName = authUser?.name || business.owner || "?";

  const handleQRFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast && showToast("Please choose an image file"); return; }
    try {
      setUploadingQR(true);
      const dataUrl = await resizeImageFile(file, { maxDim: 640, format: "image/png" });
      setBusiness({ ...business, paymentQR: dataUrl, paymentQRLabel: qrLabel.trim() || "GCash / Bank Transfer" });
      showToast && showToast("Payment QR code saved ✓");
    } catch (err) {
      showToast && showToast("Couldn't load that QR image");
    } finally {
      setUploadingQR(false);
    }
  };

  const removeQR = () => {
    setBusiness({ ...business, paymentQR: null });
    showToast && showToast("Payment QR code removed");
  };

  const saveQRLabel = () => {
    if (!business.paymentQR) return;
    setBusiness({ ...business, paymentQRLabel: qrLabel.trim() || "GCash / Bank Transfer" });
    showToast && showToast("Label updated ✓");
  };

  return (
    <div>
      <SectionHeader title="Settings" onBack={onBack} />
      <div style={{ padding: "0 18px 4px" }}>
        <div className="bz-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <div style={{ position: "relative" }}>
              <ProfileAvatar avatar={business.avatar} size={72} fallback={displayName.charAt(0).toUpperCase()} />
              <button onClick={() => setShowAvatarPicker(v => !v)} style={{
                position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%",
                background: "var(--primary)", border: "2px solid var(--surface)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}>
                <Camera size={13} />
              </button>
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{displayName}</div>
          {authUser?.email && <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{authUser.email}</div>}

          {showAvatarPicker && (
            <div className="bz-fade-in" style={{ marginTop: 14, textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8, letterSpacing: 0.3 }}>CHOOSE A PHOTO</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 12 }}>
                {AVATAR_PRESETS.map(p => {
                  const active = business.avatar === "preset:" + p.id;
                  return (
                    <button key={p.id} onClick={() => setAvatar("preset:" + p.id)} style={{
                      width: "100%", aspectRatio: "1", borderRadius: "50%",
                      border: active ? "2.5px solid var(--primary)" : "2.5px solid transparent",
                      background: p.bg, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "transform .12s ease", transform: active ? "scale(1.06)" : "scale(1)",
                    }}>{p.emoji}</button>
                  );
                })}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={uploading}
                  className="bz-btn-primary" style={{ flex: 1, padding: "10px", fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: uploading ? 0.6 : 1 }}>
                  <ImagePlus size={14} /> {uploading ? "Uploading…" : "Upload from Device"}
                </button>
                {business.avatar && (
                  <button onClick={() => setAvatar(null)} style={{
                    padding: "10px 14px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)",
                    color: "var(--danger)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <Trash size={13} /> Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "10px 18px 40px" }}>
        <div className="bz-card" style={{ padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={19} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Business Profile</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{isPremium ? "Multiple profiles enabled" : "1 profile · Free plan"}</div>
            </div>
          </div>
          <Field label="Business name">
            <input className="bz-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Owner name">
            <input className="bz-input" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
          </Field>
          <Field label="Business type">
            <select className="bz-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {["Sari-Sari Store", "Food Business", "Online Seller", "Freelancer", "Service Provider", "Retail"].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <button disabled={!canSave} className="bz-btn-primary" style={{ width: "100%", padding: "11px", fontSize: 13.5, opacity: canSave ? 1 : 0.5 }} onClick={save}>
            {dirty ? "Save Changes" : "Saved"}
          </button>
        </div>

        <div className="bz-card" style={{ padding: "14px", marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#4B6FAE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <QrCode size={19} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Payment QR Code</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>GCash, Maya, or bank transfer — customers scan to pay</div>
            </div>
          </div>

          {business.paymentQR ? (
            <div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 96, height: 96, borderRadius: 12, border: "1px solid var(--border)", padding: 6, background: "#fff", flexShrink: 0 }}>
                  <img src={business.paymentQR} alt="Payment QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Field label="Label shown to customers">
                    <input className="bz-input" value={qrLabel} onChange={e => setQrLabel(e.target.value)} onBlur={saveQRLabel} placeholder="e.g. GCash / InstaPay" />
                  </Field>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQRFile} style={{ display: "none" }} />
                <button onClick={() => qrInputRef.current && qrInputRef.current.click()} disabled={uploadingQR}
                  className="bz-btn-primary" style={{ flex: 1, padding: "10px", fontSize: 12.5, background: "var(--surface2)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: uploadingQR ? 0.6 : 1 }}>
                  <ImagePlus size={14} /> {uploadingQR ? "Uploading…" : "Replace"}
                </button>
                <button onClick={removeQR} style={{
                  padding: "10px 14px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)",
                  color: "var(--danger)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Trash size={13} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div>
              <Field label="Label shown to customers">
                <input className="bz-input" value={qrLabel} onChange={e => setQrLabel(e.target.value)} placeholder="e.g. GCash / InstaPay" />
              </Field>
              <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQRFile} style={{ display: "none" }} />
              <button onClick={() => qrInputRef.current && qrInputRef.current.click()} disabled={uploadingQR}
                className="bz-btn-primary" style={{ width: "100%", padding: "11px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: uploadingQR ? 0.6 : 1 }}>
                <QrCode size={15} /> {uploadingQR ? "Uploading…" : "Upload Payment QR Code"}
              </button>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Upload a screenshot of your GCash, Maya, or InstaPay bank transfer QR. It'll show on invoices when customers pay via QR.</div>
            </div>
          )}
        </div>

        <div className="bz-card" style={{ padding: "14px", marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Preferences</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>{theme === "dark" ? <Moon size={15} /> : <Sun size={15} />} Appearance</div>
            <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
              <button onClick={() => setTheme("light")} style={{ border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", background: theme === "light" ? "var(--primary)" : "transparent", color: theme === "light" ? "#fff" : "var(--text)" }}>Light</button>
              <button onClick={() => setTheme("dark")} style={{ border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", background: theme === "dark" ? "var(--primary)" : "transparent", color: theme === "dark" ? "#fff" : "var(--text)" }}>Dark</button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><Bell size={15} /> Low-stock notifications</div>
            {isPremium ? (
              <button onClick={() => { setNotifyLowStock(!notifyLowStock); showToast && showToast(!notifyLowStock ? "Low-stock alerts enabled" : "Low-stock alerts turned off"); }}
                style={{
                  width: 40, height: 23, borderRadius: 999, border: "none", cursor: "pointer", position: "relative",
                  background: notifyLowStock ? "var(--primary)" : "var(--surface2)", transition: "background .18s ease",
                }}>
                <div style={{
                  position: "absolute", top: 2.5, left: notifyLowStock ? 19 : 2.5, width: 18, height: 18, borderRadius: "50%",
                  background: "#fff", transition: "left .18s ease", boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                }} />
              </button>
            ) : (
              <button onClick={goUpgrade} style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Premium only</button>
            )}
          </div>
          {onReplayTutorial && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 4px", borderTop: "1px solid var(--border)", marginTop: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><Sparkles size={15} /> App walkthrough</div>
              <button onClick={onReplayTutorial} style={{ fontSize: 11.5, color: "var(--primary)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Replay tour</button>
            </div>
          )}
        </div>

        <div className="bz-card" style={{ padding: "14px", marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>Subscription</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>You're on the {isPremium ? "Bizora Premium" : "Free"} plan.</div>
          <button onClick={goUpgrade} className="bz-btn-primary" style={{ width: "100%", padding: "11px", fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Crown size={14} /> {isPremium ? "Manage Subscription" : "Upgrade to Premium"}
          </button>
        </div>

        {onLoadDemoData && (
          <div className="bz-card" style={{ padding: "14px", marginTop: 12, border: "1px dashed var(--accent)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>
              <Sparkles size={15} color="var(--accent)" /> Demo Data <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(227,162,60,0.15)", padding: "2px 7px", borderRadius: 999 }}>ADMIN</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
              Fill this account with a month of realistic sales, expenses, customers, and invoices — handy for screenshots and demos when marketing the app.
            </div>
            {!showDemoConfirm ? (
              <button onClick={() => setShowDemoConfirm(true)} className="bz-btn-primary" style={{
                width: "100%", padding: "11px", fontSize: 13, background: "var(--accent)", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Sparkles size={14} /> Load Demo Data
              </button>
            ) : (
              <div className="bz-fade-in">
                <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={13} /> This replaces this account's current products, sales, expenses & invoices. Continue?
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowDemoConfirm(false)} style={{
                    flex: 1, padding: "11px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)",
                    color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>
                    Cancel
                  </button>
                  <button onClick={() => { onLoadDemoData(); setShowDemoConfirm(false); }} className="bz-btn-primary" style={{
                    flex: 1, padding: "11px", fontSize: 13, background: "var(--danger)",
                  }}>
                    Yes, Load It
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={onLogout} style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--danger)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <LogOut size={15} /> Log Out
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--muted)" }}>Bizora v1.0 · Made for Filipino entrepreneurs 🇵🇭</div>
      </div>
    </div>
  );
}

/* ---------------- Upgrade / Subscription ---------------- */

function UpgradeScreen({ colors, isPremium, authUser, business, sbToken, sbUserId, onBack, goSettings, showToast }) {
  const [cycle, setCycle] = useState("yearly");
  const [step, setStep] = useState("plan"); // "plan" | "pay" | "sent"
  const [refNo, setRefNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(undefined); // undefined = loading, null = none
  const price = cycle === "monthly" ? 349 : 4199;
  const priceLabel = cycle === "monthly" ? "₱349" : "₱4,199";

  // Check if this user already has a pending/approved/rejected request on file.
  useEffect(() => {
    let alive = true;
    if (!sbUserId || !sbToken) { setPendingRequest(null); return; }
    sbRest(`/subscription_requests?user_id=eq.${sbUserId}&order=requested_at.desc&limit=1`, { token: sbToken })
      .then(rows => { if (alive) setPendingRequest((rows && rows[0]) || null); })
      .catch(() => { if (alive) setPendingRequest(null); });
    return () => { alive = false; };
  }, [sbUserId, sbToken]);

  const submitRequest = async () => {
    if (!sbUserId || !sbToken) { showToast("Please log in again."); return; }
    setSubmitting(true);
    try {
      const rows = await sbRest("/subscription_requests", {
        method: "POST", token: sbToken,
        body: {
          user_id: sbUserId, email: authUser?.email || "", name: authUser?.name || "",
          business_name: business?.name || "", cycle, price, ref_no: refNo.trim(), status: "pending",
        },
      });
      setPendingRequest((rows && rows[0]) || { status: "pending" });
      setStep("sent");
    } catch (e) {
      showToast(e.message || "Couldn't submit — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    "Unlimited products & multiple business profiles",
    "Advanced inventory management & low-stock alerts",
    "Unlimited customers",
    "Professional invoice & receipt generator",
    "PDF and Excel report exports",
    "Advanced sales & profit analytics",
    "Employee accounts",
    "Cloud backup & sync",
    "Recurring expenses",
    "AI-powered business recommendations",
    "Automatic weekly & monthly reports",
  ];

  if (isPremium) {
    return (
      <div>
        <SectionHeader title="Bizora Premium" onBack={onBack} />
        <div style={{ padding: "10px 18px" }}>
          <div className="bz-card" style={{ padding: 18, textAlign: "center" }}>
            <Crown size={30} color="var(--accent)" style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 700, fontSize: 15 }}>You're a Premium member!</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>Enjoy unlimited access to every Bizora feature.</div>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
            Subscription changes (like cancelling) are handled by our team — message us if you need anything.
          </div>
          <a href={ADMIN_MESSENGER_URL} target="_blank" rel="noreferrer"
            style={{ width: "100%", marginTop: 10, padding: "11px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, textDecoration: "none" }}>
            <Mail size={14} /> Message us — {ADMIN_MESSENGER_LABEL}
          </a>
        </div>
      </div>
    );
  }

  if (step === "pay") {
    return (
      <div>
        <SectionHeader title="Pay for Premium" onBack={() => setStep("plan")} subtitle={`${cycle === "monthly" ? "Monthly" : "Yearly"} plan`} />
        <div style={{ padding: "6px 18px 30px" }}>
          <div className="bz-card" style={{ padding: "14px 14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>Amount due</span>
              <span className="bz-num" style={{ fontSize: 20, fontWeight: 800 }}>{priceLabel}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Bizora Premium · {cycle === "monthly" ? "billed monthly" : "billed yearly"}</div>
          </div>

          <div className="bz-card bz-fade-in" style={{ marginTop: 12, padding: "18px 14px", textAlign: "center", background: "#fff" }}>
            <img src={BIZORA_SUBSCRIPTION_QR} alt="Bizora payment QR" style={{ width: 200, height: 200, objectFit: "contain", margin: "0 auto" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#16241F", marginTop: 10 }}>{BIZORA_SUBSCRIPTION_QR_LABEL}</div>
            <div style={{ fontSize: 11, color: "#6E7C76", marginTop: 3 }}>Scan with your GCash or banking app · Transfer fees may apply.</div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Field label="Reference / transaction number (optional)">
              <input className="bz-input" value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="e.g. GCash ref. no." />
            </Field>
          </div>

          <button onClick={submitRequest} disabled={submitting}
            className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: submitting ? 0.7 : 1 }}>
            <Check size={15} /> {submitting ? "Submitting…" : "I've Sent the Payment"}
          </button>
          <div style={{ textAlign: "center", fontSize: 10.5, color: "var(--muted)", marginTop: 8 }}>
            We'll manually confirm your {priceLabel} payment after you message us.
          </div>
        </div>
      </div>
    );
  }

  if (step === "sent") {
    return (
      <div>
        <SectionHeader title="Request sent" onBack={onBack} />
        <div style={{ padding: "20px 18px 40px" }}>
          <div className="bz-card bz-fade-in" style={{ padding: 22, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(46,158,108,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Check size={22} color="var(--success)" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Your subscription request is in</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>
              To finish, message us on Messenger with a screenshot of your {priceLabel} payment{refNo ? ` and ref. no. ${refNo}` : ""}. We'll verify it and switch on Premium for your account — <b style={{ color: "var(--text)" }}>{authUser?.email}</b>.
            </div>
          </div>
          <a href={ADMIN_MESSENGER_URL} target="_blank" rel="noreferrer" className="bz-btn-primary"
            style={{ width: "100%", padding: "13px", fontSize: 14, marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, textDecoration: "none" }}>
            <Mail size={15} /> Message us — {ADMIN_MESSENGER_LABEL}
          </a>
          <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "11px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Back to More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Bizora Premium" onBack={onBack} subtitle="Grow your business further" />
      <div style={{ padding: "6px 18px" }}>
        {pendingRequest?.status === "pending" && (
          <button onClick={() => setStep("sent")} style={{
            width: "100%", textAlign: "left", background: "rgba(227,162,60,0.12)", border: "1px solid var(--accent)", borderRadius: 14,
            padding: "12px 13px", marginBottom: 12, cursor: "pointer", color: "var(--text)",
          }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Request pending review</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>Tap for how to reach us on Messenger to confirm payment.</div>
          </button>
        )}
        {pendingRequest?.status === "rejected" && (
          <div style={{
            width: "100%", background: "rgba(220,80,80,0.1)", border: "1px solid var(--danger)", borderRadius: 14,
            padding: "12px 13px", marginBottom: 12,
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--danger)" }}>Previous request wasn't approved</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>Message us on Messenger if you think this was a mistake, or subscribe again below.</div>
          </div>
        )}
        <div style={{ background: "linear-gradient(135deg,#0E6E5C,#0A5548)", borderRadius: 20, padding: "20px 18px", color: "#fff", textAlign: "center" }}>
          <Crown size={26} color="#E3A23C" />
          <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 18, marginTop: 6 }}>Unlock Bizora Premium</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>Built for growing sari-sari stores, food businesses, and online sellers.</div>
        </div>

        <div style={{ display: "flex", gap: 8, margin: "14px 0" }}>
          <PlanOption active={cycle === "monthly"} onClick={() => setCycle("monthly")} title="Monthly" price="₱349/mo" note="Billed monthly" />
          <PlanOption active={cycle === "yearly"} onClick={() => setCycle("yearly")} title="Yearly" price="₱4,199/yr" note="≈ ₱350/mo · billed yearly" />
        </div>

        <div className="bz-card" style={{ padding: "14px" }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Everything in Premium</div>
          {features.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 17, height: 17, borderRadius: "50%", background: "rgba(46,158,108,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
                <Check size={10} color="var(--success)" />
              </div>
              <div style={{ fontSize: 12.5 }}>{f}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setStep("pay")} className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <QrCode size={15} /> Subscribe · Pay {priceLabel} via GCash/QR
        </button>
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
          Then {cycle === "monthly" ? "₱349/month" : "₱4,199/year"}. We activate Premium manually after payment is confirmed.
        </div>
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}

function PlanOption({ active, onClick, title, price, note, badge }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, textAlign: "left", padding: "12px 13px", borderRadius: 14, cursor: "pointer", position: "relative",
      border: active ? "2px solid var(--primary)" : "1px solid var(--border)", background: active ? "rgba(14,110,92,0.08)" : "var(--surface)",
    }}>
      {badge && <div style={{ position: "absolute", top: -9, right: 8, background: "var(--accent)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>{badge}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{title}</div>
      <div className="bz-num" style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{price}</div>
      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{note}</div>
    </button>
  );
}

/* ---------------- Admin: registered users & subscription requests ---------------- */

function AdminScreen({ colors, sbToken, onBack, showToast }) {
  const [tabView, setTabView] = useState("requests"); // "requests" | "users"
  const [requests, setRequests] = useState(null); // null = loading
  const [users, setUsers] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  const loadAll = async () => {
    setRequests(null); setUsers(null);
    try {
      const [reqs, usrs] = await Promise.all([
        sbRest("/subscription_requests?order=requested_at.desc", { token: sbToken }),
        sbRest("/profiles?order=registered_at.desc", { token: sbToken }),
      ]);
      setRequests(reqs || []);
      setUsers(usrs || []);
    } catch (e) {
      showToast(e.message || "Couldn't load — check your connection and try again.");
      setRequests([]); setUsers([]);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const decide = async (req, approve) => {
    setBusyKey(req.id);
    try {
      // Grant/revoke the actual access FIRST. If this fails, we bail out
      // before marking the request "approved" — otherwise an admin could
      // see "Approved ✓" while the user never actually got Premium, which
      // is exactly the kind of silent mismatch this panel needs to avoid.
      if (approve) {
        const rows = await sbRest(`/profiles?id=eq.${req.user_id}`, { method: "PATCH", token: sbToken, body: { is_premium: true } });
        if (!rows || rows.length === 0) {
          throw new Error("Couldn't find that user's profile to upgrade — they may need to log in at least once first.");
        }
      }
      await sbRest(`/subscription_requests?id=eq.${req.id}`, {
        method: "PATCH", token: sbToken,
        body: { status: approve ? "approved" : "rejected", decided_at: new Date().toISOString() },
      });
      showToast(approve ? `Approved ✓ ${req.email} is now Premium` : `Rejected — ${req.email}`);
      await loadAll();
    } catch (e) {
      showToast(e.message || "Something went wrong, try again");
    } finally {
      setBusyKey(null);
    }
  };

  const togglePremium = async (u) => {
    setBusyKey(u.id);
    try {
      const rows = await sbRest(`/profiles?id=eq.${u.id}`, { method: "PATCH", token: sbToken, body: { is_premium: !u.is_premium } });
      if (!rows || rows.length === 0) throw new Error("Couldn't update that user's profile — please refresh and try again.");
      showToast(!u.is_premium ? `Premium granted to ${u.email}` : `Premium revoked from ${u.email}`);
      await loadAll();
    } catch (e) {
      showToast(e.message || "Something went wrong, try again");
    } finally {
      setBusyKey(null);
    }
  };

  const pending = (requests || []).filter(r => r.status === "pending");
  const decided = (requests || []).filter(r => r.status !== "pending");

  return (
    <div>
      <SectionHeader title="Admin" subtitle="Registered users & subscription requests" onBack={onBack} />
      <div style={{ padding: "6px 18px 40px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => setTabView("requests")} style={{
            flex: 1, padding: "9px", borderRadius: 12, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
            border: tabView === "requests" ? "1.5px solid var(--primary)" : "1px solid var(--border)",
            background: tabView === "requests" ? "rgba(14,110,92,0.08)" : "var(--surface)", color: "var(--text)",
          }}>Requests {pending.length > 0 ? `(${pending.length})` : ""}</button>
          <button onClick={() => setTabView("users")} style={{
            flex: 1, padding: "9px", borderRadius: 12, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
            border: tabView === "users" ? "1.5px solid var(--primary)" : "1px solid var(--border)",
            background: tabView === "users" ? "rgba(14,110,92,0.08)" : "var(--surface)", color: "var(--text)",
          }}>Registered Users {users ? `(${users.length})` : ""}</button>
        </div>

        {tabView === "requests" && (
          requests === null ? (
            <div style={{ textAlign: "center", padding: 30, color: "var(--muted)", fontSize: 12.5 }}>Loading requests…</div>
          ) : requests.length === 0 ? (
            <EmptyState icon={QrCode} title="No requests yet" subtitle="Subscription requests will show up here." />
          ) : (
            <>
              {pending.length > 0 && <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)", margin: "4px 0 8px", textTransform: "uppercase", letterSpacing: 0.3 }}>Pending</div>}
              {pending.map(r => (
                <div key={r.id} className="bz-card" style={{ padding: "13px 14px", marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.name || "—"}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{r.email}</div>
                      {r.business_name && <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.business_name}</div>}
                    </div>
                    <div className="bz-num" style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
                      {r.price ? peso(r.price) : ""}{r.cycle ? <span style={{ fontSize: 10, color: "var(--muted)" }}> /{r.cycle === "monthly" ? "mo" : "yr"}</span> : null}
                    </div>
                  </div>
                  {r.ref_no && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Ref: {r.ref_no}</div>}
                  <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4 }}>{r.requested_at ? new Date(r.requested_at).toLocaleString("en-PH") : ""}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button disabled={busyKey === r.id} onClick={() => decide(r, true)} className="bz-btn-primary"
                      style={{ flex: 1, padding: "9px", fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, opacity: busyKey === r.id ? 0.6 : 1 }}>
                      <Check size={13} /> Approve
                    </button>
                    <button disabled={busyKey === r.id} onClick={() => decide(r, false)}
                      style={{ flex: 1, padding: "9px", fontSize: 12.5, borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--danger)", fontWeight: 600, cursor: "pointer", opacity: busyKey === r.id ? 0.6 : 1 }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {decided.length > 0 && <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)", margin: "16px 0 8px", textTransform: "uppercase", letterSpacing: 0.3 }}>Past requests</div>}
              {decided.map(r => (
                <div key={r.id} className="bz-card" style={{ padding: "11px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{r.name || r.email}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.email}</div>
                  </div>
                  <div style={{
                    fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
                    color: r.status === "approved" ? "var(--success)" : "var(--danger)",
                    background: r.status === "approved" ? "rgba(46,158,108,0.12)" : "rgba(220,80,80,0.12)",
                  }}>{r.status === "approved" ? "Approved" : "Rejected"}</div>
                </div>
              ))}
            </>
          )
        )}

        {tabView === "users" && (
          users === null ? (
            <div style={{ textAlign: "center", padding: 30, color: "var(--muted)", fontSize: 12.5 }}>Loading users…</div>
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="No registered users yet" subtitle="Everyone who signs up will show up here." />
          ) : users.map(u => (
            <div key={u.id} className="bz-card" style={{ padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <ProfileAvatar avatar={u.avatar} size={38} fallback={(u.name || u.email || "?").charAt(0).toUpperCase()} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name || "—"}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{u.email}</div>
                {u.business_name && <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{u.business_name}</div>}
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Registered {u.registered_at ? new Date(u.registered_at).toLocaleDateString("en-PH") : "—"}</div>
              </div>
              {u.is_premium && <PremiumBadge />}
              <button disabled={busyKey === u.id} onClick={() => togglePremium(u)} style={{
                fontSize: 10.5, fontWeight: 700, padding: "4px 9px", borderRadius: 999, cursor: "pointer",
                border: u.is_premium ? "1px solid var(--danger)" : "1px solid var(--primary)",
                background: "var(--surface)", color: u.is_premium ? "var(--danger)" : "var(--primary)",
                opacity: busyKey === u.id ? 0.5 : 1,
              }}>
                {u.is_premium ? "Revoke" : "Grant"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- Modals: Add Sale / Product / Expense / Customer ---------------- */

function AddSaleModal({ products, customers, colors, business, onClose, onSave }) {
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [payment, setPayment] = useState("cash");
  const [notes, setNotes] = useState("");
  const [showQR, setShowQR] = useState(false);
  const product = products.find(p => p.id === productId);
  const total = product ? product.sellingPrice * qty : 0;
  const insufficientStock = product && qty > product.stock;
  const selectedMethod = PAYMENT_METHODS.find(pm => pm.id === payment);
  const canShowQR = selectedMethod?.qr && business?.paymentQR;

  return (
    <Modal title="Record a Sale" onClose={onClose} colors={colors}>
      <Field label="Product">
        <select className="bz-input" value={productId} onChange={e => setProductId(e.target.value)}>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} — {peso(p.sellingPrice)} ({p.stock} in stock)</option>)}
        </select>
      </Field>
      <Field label="Quantity">
        <input className="bz-input" type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))} />
      </Field>
      {insufficientStock && <div style={{ fontSize: 11.5, color: "var(--danger)", marginTop: -8, marginBottom: 12 }}>Only {product.stock} in stock.</div>}
      <Field label="Customer">
        <select className="bz-input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Payment Method">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {PAYMENT_METHODS.map(pm => (
            <button key={pm.id} onClick={() => { setPayment(pm.id); setShowQR(false); }} style={{
              padding: "7px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: payment === pm.id ? "1.5px solid var(--primary)" : "1px solid var(--border)",
              background: payment === pm.id ? "rgba(14,110,92,0.1)" : "var(--surface2)", color: "var(--text)",
            }}>{pm.label}</button>
          ))}
        </div>
      </Field>

      {canShowQR && (
        <div style={{ marginBottom: 14 }}>
          <button onClick={() => setShowQR(v => !v)} style={{
            width: "100%", padding: "9px", borderRadius: 12, border: "1px dashed var(--primary)", background: "rgba(14,110,92,0.06)",
            color: "var(--primary)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <QrCode size={14} /> {showQR ? "Hide QR Code" : `Show ${business.paymentQRLabel || "Payment"} QR to Customer`}
          </button>
          {showQR && (
            <div className="bz-fade-in" style={{ marginTop: 10, textAlign: "center", background: "#fff", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 14px" }}>
              <img src={business.paymentQR} alt="Payment QR" style={{ width: 190, height: 190, objectFit: "contain", margin: "0 auto" }} />
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#16241F", marginTop: 8 }}>{business.paymentQRLabel || "Scan to Pay"}</div>
              <div style={{ fontSize: 10.5, color: "#6E7C76", marginTop: 2 }}>Transfer fees may apply.</div>
            </div>
          )}
        </div>
      )}

      <Field label="Notes (optional)">
        <input className="bz-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Utang, deliver later…" />
      </Field>

      <div className="bz-card" style={{ padding: "12px 14px", marginBottom: 14, background: "var(--surface2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
          <span className="bz-num" style={{ fontSize: 17, fontWeight: 800 }}>{peso(total)}</span>
        </div>
      </div>

      <button disabled={!product || insufficientStock} className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: (!product || insufficientStock) ? 0.5 : 1 }}
        onClick={() => onSave({ date: todayISO(), productId, productName: product.name, qty, unitPrice: product.sellingPrice, total, customerId, payment, notes, invoiced: false })}>
        Save Transaction
      </button>
    </Modal>
  );
}

function AddProductModal({ colors, product, onClose, onSave, onAddAll }) {
  const [mode, setMode] = useState(product ? "manual" : "catalog");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [form, setForm] = useState(product || {
    name: "", sku: "", category: CATEGORIES[0], purchasePrice: "", sellingPrice: "", stock: "", minStock: "5", image: "",
  });
  const valid = form.name && form.sellingPrice !== "" && form.stock !== "";

  const catalogResults = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return GROCERY_CATALOG;
    return GROCERY_CATALOG.filter(it => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q));
  }, [catalogSearch]);

  const pickFromCatalog = (item) => {
    setForm({
      name: item.name, sku: form.sku, category: item.category,
      purchasePrice: item.purchasePrice, sellingPrice: item.sellingPrice,
      stock: form.stock || "", minStock: form.minStock || "5", image: "",
    });
    setMode("manual");
  };

  const toggleSelect = (name) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <Modal title={product ? "Edit Product" : "Add Product"} onClose={onClose} colors={colors}>
      {!product && (
        <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 12, padding: 3, marginBottom: 16 }}>
          <button onClick={() => setMode("catalog")} style={{
            flex: 1, border: "none", borderRadius: 9, padding: "8px 0", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            background: mode === "catalog" ? "var(--primary)" : "transparent", color: mode === "catalog" ? "#fff" : "var(--text)",
          }}>Pick from Catalog</button>
          <button onClick={() => setMode("manual")} style={{
            flex: 1, border: "none", borderRadius: 9, padding: "8px 0", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            background: mode === "manual" ? "var(--primary)" : "transparent", color: mode === "manual" ? "#fff" : "var(--text)",
          }}>Enter Manually</button>
        </div>
      )}

      {mode === "catalog" ? (
        <div>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
            <input className="bz-input" style={{ paddingLeft: 34 }} autoFocus placeholder="Search groceries e.g. rice, sardines, shampoo…"
              value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} />
          </div>

          <button onClick={() => onAddAll(GROCERY_CATALOG)} className="bz-btn-primary" style={{
            width: "100%", padding: "10px", fontSize: 12.5, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <PackagePlus size={15} /> Add All {GROCERY_CATALOG.length} Grocery Items
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {catalogSearch ? `${catalogResults.length} match${catalogResults.length === 1 ? "" : "es"}` : `${GROCERY_CATALOG.length} common grocery items`}
            </div>
            {selected.size > 0 && (
              <button onClick={() => setSelected(new Set())} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>Clear ({selected.size})</button>
            )}
          </div>

          <div style={{ maxHeight: 300, overflowY: "auto" }} className="bz-scroll">
            {catalogResults.length === 0 ? (
              <EmptyState icon={Search} title="No matches" subtitle="Try another search, or switch to Enter Manually." />
            ) : catalogResults.map((it, i) => (
              <div key={it.name + i} className="bz-card" style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", marginBottom: 7, border: "1px solid var(--border)",
              }}>
                <button onClick={() => toggleSelect(it.name)} aria-label="select" style={{
                  width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${selected.has(it.name) ? "var(--primary)" : "var(--border)"}`,
                  background: selected.has(it.name) ? "var(--primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}>
                  {selected.has(it.name) && <Check size={13} color="#fff" />}
                </button>
                <button onClick={() => pickFromCatalog(it)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, color: "var(--text)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{it.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{it.category}</div>
                  </div>
                  <div className="bz-num" style={{ fontWeight: 700, fontSize: 12.5, color: "var(--primary)" }}>{peso(it.sellingPrice)}</div>
                </button>
              </div>
            ))}
          </div>

          {selected.size > 0 && (
            <button onClick={() => onAddAll(GROCERY_CATALOG.filter(it => selected.has(it.name)))} className="bz-btn-primary" style={{ width: "100%", padding: "12px", fontSize: 13.5, marginTop: 10 }}>
              Add Selected ({selected.size})
            </button>
          )}
        </div>
      ) : (
        <div>
          <Field label="Product name"><input className="bz-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sardines 155g" /></Field>
          <Field label="SKU"><input className="bz-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. SRD-155" /></Field>
          <Field label="Category">
            <select className="bz-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><Field label="Purchase price (₱)"><input className="bz-input" type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: Number(e.target.value) })} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Selling price (₱)"><input className="bz-input" type="number" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: Number(e.target.value) })} /></Field></div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><Field label="Current stock"><input className="bz-input" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Min stock level"><input className="bz-input" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} /></Field></div>
          </div>
          <button disabled={!valid} className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: valid ? 1 : 0.5 }}
            onClick={() => onSave({ ...form, purchasePrice: Number(form.purchasePrice) || 0, sellingPrice: Number(form.sellingPrice) || 0, stock: Number(form.stock) || 0, minStock: Number(form.minStock) || 0 })}>
            {product ? "Save Changes" : "Add Product"}
          </button>
        </div>
      )}
    </Modal>
  );
}

function RestockModal({ colors, product, onClose, onSave }) {
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const n = Number(qty);
  const valid = qty !== "" && n > 0;
  const newTotal = valid ? product.stock + n : product.stock;

  return (
    <Modal title={`Restock — ${product.name}`} onClose={onClose} colors={colors}>
      <div style={{ display: "flex", gap: 14, marginBottom: 4, fontSize: 12, color: "var(--muted)" }}>
        <div>Current stock: <b style={{ color: "var(--text)" }}>{product.stock}</b></div>
        {valid && <div>→ New total: <b style={{ color: "var(--primary)" }}>{newTotal}</b></div>}
      </div>
      <Field label="Units received">
        <input className="bz-input" type="number" autoFocus placeholder="e.g. 20" value={qty} onChange={e => setQty(e.target.value)} />
      </Field>
      <Field label="Cost of this restock (₱, optional)">
        <input className="bz-input" type="number" placeholder="0.00 — logs a Supplies expense automatically" value={cost} onChange={e => setCost(e.target.value)} />
      </Field>
      <Field label="Note (optional)">
        <input className="bz-input" placeholder="e.g. From ABC Distributor" value={note} onChange={e => setNote(e.target.value)} />
      </Field>
      <button disabled={!valid} className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: valid ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
        onClick={() => onSave({ qty: n, cost: Number(cost) || 0, note: note.trim() })}>
        <PackagePlus size={15} /> Add {valid ? n : ""} to Stock
      </button>
    </Modal>
  );
}

function AddExpenseModal({ colors, onClose, onSave }) {
  const [category, setCategory] = useState("Supplies");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const cats = ["Supplies", "Rent", "Utilities", "Transportation", "Salaries", "Marketing", "Other"];
  return (
    <Modal title="Add Expense" onClose={onClose} colors={colors}>
      <Field label="Category">
        <select className="bz-input" value={category} onChange={e => setCategory(e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Amount (₱)"><input className="bz-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></Field>
      <Field label="Date"><input className="bz-input" type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Field label="Notes (optional)"><input className="bz-input" value={notes} onChange={e => setNotes(e.target.value)} /></Field>
      <button disabled={!amount} className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: amount ? 1 : 0.5 }}
        onClick={() => onSave({ category, amount: Number(amount), date, notes })}>
        Save Expense
      </button>
    </Modal>
  );
}

function AddCustomerModal({ colors, onClose, onSave }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <Modal title="Add Customer" onClose={onClose} colors={colors}>
      <Field label="Name"><input className="bz-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maria Santos" /></Field>
      <Field label="Phone (optional)"><input className="bz-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="09XX XXX XXXX" /></Field>
      <Field label="Notes (optional)"><input className="bz-input" value={notes} onChange={e => setNotes(e.target.value)} /></Field>
      <button disabled={!name} className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: name ? 1 : 0.5 }}
        onClick={() => onSave({ name, phone, notes })}>
        Add Customer
      </button>
    </Modal>
  );
}

/* =========================================================
   AUTH FLOW — Sign In / Sign Up / Forgot Password / Onboarding
========================================================= */

function AuthFlow({ screen, setScreen, theme, authUser, onSignedIn, onSignedUp, onOnboardingDone }) {
  const colors = theme === "dark" ? DARK : LIGHT;
  return (
    <div className="bz-frame" style={{
      "--bg": colors.bg, "--surface": colors.surface, "--surface2": colors.surface2,
      "--text": colors.text, "--muted": colors.muted, "--border": colors.border,
      "--primary": colors.primary, "--primaryDark": colors.primaryDark, "--accent": colors.accent,
      "--danger": colors.danger, "--success": colors.success,
      background: "var(--bg)", color: "var(--text)", fontFamily: "'Inter', sans-serif",
      width: "100%", maxWidth: 420, margin: "0 auto", minHeight: "100svh", height: "100svh", position: "relative", boxSizing: "border-box",
      overflow: "hidden", boxShadow: theme === "dark" ? "0 0 0 1px #1c2622" : "0 0 0 1px #eae6da",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .bz-num { font-family: 'Sora', sans-serif; font-variant-numeric: tabular-nums; }
        .bz-scroll::-webkit-scrollbar { display: none; }
        .bz-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .bz-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; }
        .bz-btn-primary { background: var(--primary); color: #fff; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; }
        .bz-btn-primary:active { background: var(--primaryDark); }
        .bz-input { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; color: var(--text); padding: 11px 13px; font-size: 16px; width: 100%; font-family: 'Inter', sans-serif; }
        .bz-input:focus { outline: none; border-color: var(--primary); }
        .bz-fade-in { animation: bzfade .18s ease; }
        @keyframes bzfade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>
      <div className="bz-scroll bz-fade-in" style={{ height: "100%", overflowY: "auto" }}>
        {screen === "signin" && <SignInScreen colors={colors} onSignedIn={onSignedIn} goSignUp={() => setScreen("signup")} goForgot={() => setScreen("forgot")} />}
        {screen === "signup" && <SignUpScreen colors={colors} onSignedUp={onSignedUp} goSignIn={() => setScreen("signin")} />}
        {screen === "forgot" && <ForgotPasswordScreen colors={colors} goSignIn={() => setScreen("signin")} />}
        {screen === "onboarding" && <BusinessSetupScreen colors={colors} authUser={authUser} onDone={onOnboardingDone} />}
      </div>
    </div>
  );
}

function AuthHeader({ title, subtitle }) {
  return (
    <Reveal y={10}>
      <div style={{ padding: "42px 26px 10px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <BizoraMark size={54} radius={16} />
        </div>
        <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 22 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 5 }}>{subtitle}</div>
      </div>
    </Reveal>
  );
}

function GoogleButton({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "11px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)",
      color: "var(--text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center",
      justifyContent: "center", gap: 9,
    }}>
      <svg width="17" height="17" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l6-6C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.3-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.3 1 7.3 2.7l6-6C33.6 6.5 29 4.5 24 4.5c-7.5 0-14 4.2-17.3 10.2z"/>
        <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.7 26.7 35.5 24 35.5c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.9 39.2 16.4 43.5 24 43.5z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.8 36 43.5 30.6 43.5 24c0-1.2-.1-2.4-.3-3.5z"/>
      </svg>
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ fontSize: 11, color: "var(--muted)" }}>OR</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <Lock size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
      <input className="bz-input" style={{ paddingLeft: 34, paddingRight: 38 }} type={show ? "text" : "password"}
        value={value} onChange={onChange} placeholder={placeholder} />
      <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 10, top: 9, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 3 }}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function SignInScreen({ colors, onSignedIn, goSignUp, goForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = email.trim().length > 3 && password.length >= 6;

  const submit = async () => {
    if (!valid) { setError("Enter a valid email and a password of at least 6 characters."); return; }
    setError(""); setBusy(true);
    try {
      const data = await sbSignIn(email.trim(), password);
      const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      await onSignedIn({ name: name || "Business Owner", email: email.trim(), token: data.access_token, id: data.user?.id, refreshToken: data.refresh_token });
    } catch (e) {
      setError(e.message || "Couldn't log in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AuthHeader title="Welcome back" subtitle="Log in to manage your business" />
      <div style={{ padding: "10px 26px 40px" }}>
        <Field label="Email">
          <div style={{ position: "relative" }}>
            <Mail size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
            <input className="bz-input" style={{ paddingLeft: 34 }} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
        </Field>
        <div style={{ textAlign: "right", marginTop: -6, marginBottom: 16 }}>
          <button onClick={goForgot} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Forgot password?</button>
        </div>
        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 12 }}>{error}</div>}
        <button className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: busy ? 0.7 : 1 }} disabled={busy} onClick={submit}>{busy ? "Logging in…" : "Log In"}</button>
        <Divider />
        <GoogleButton label="Continue with Google" onClick={() => { window.location.href = googleSignInUrl(); }} />
        <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--muted)", marginTop: 22 }}>
          Don't have an account? <button onClick={goSignUp} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Sign up</button>
        </div>
      </div>
    </div>
  );
}

function SignUpScreen({ colors, onSignedUp, goSignIn }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const valid = name.trim().length > 1 && email.includes("@") && password.length >= 6 && agree;

  const submit = async () => {
    if (!valid) {
      if (!agree) setError("Please agree to the Terms and Privacy Policy.");
      else setError("Fill in your name, a valid email, and a password of at least 6 characters.");
      return;
    }
    setError(""); setBusy(true);
    try {
      const data = await sbSignUp(email.trim(), password);
      // Response shape varies slightly by Supabase project/version — the
      // user object is sometimes nested under .user, sometimes at the top
      // level directly. Handle both.
      const sessionUser = data.user || (data.id ? data : null);
      if (data.access_token && sessionUser?.id) {
        // Email confirmation is off for this project — signed in right away.
        await onSignedUp({ name, email: email.trim(), token: data.access_token, id: sessionUser.id, refreshToken: data.refresh_token });
      } else if (sessionUser?.identities && sessionUser.identities.length === 0) {
        // Supabase's way of saying this email is already registered, without leaking that fact outright.
        setError("This email is already registered. Try logging in instead.");
      } else {
        // Email confirmation is required before a session can be issued.
        setConfirmSent(true);
      }
    } catch (e) {
      setError(e.message || "Couldn't create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (confirmSent) {
    return (
      <div style={{ padding: "60px 30px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(46,158,108,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Mail size={24} color="var(--success)" />
        </div>
        <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 17 }}>Check your email</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
          We sent a confirmation link to<br /><b style={{ color: "var(--text)" }}>{email.trim()}</b><br />Confirm it, then log in below.
        </div>
        <button className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, marginTop: 24 }} onClick={goSignIn}>Back to Log In</button>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader title="Create your account" subtitle="Set up Bizora for your business in minutes" />
      <div style={{ padding: "10px 26px 40px" }}>
        <Field label="Full name">
          <input className="bz-input" placeholder="Juan Dela Cruz" value={name} onChange={e => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <div style={{ position: "relative" }}>
            <Mail size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
            <input className="bz-input" style={{ paddingLeft: 34 }} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" />
        </Field>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
          <span style={{ fontSize: 11.5, color: "var(--muted)" }}>I agree to Bizora's Terms of Service and Privacy Policy.</span>
        </label>
        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 12 }}>{error}</div>}
        <button className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: busy ? 0.7 : 1 }} disabled={busy} onClick={submit}>{busy ? "Creating…" : "Create Account"}</button>
        <Divider />
        <GoogleButton label="Sign up with Google" onClick={() => { window.location.href = googleSignInUrl(); }} />
        <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--muted)", marginTop: 22 }}>
          Already have an account? <button onClick={goSignIn} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Log in</button>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordScreen({ colors, goSignIn }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div style={{ padding: "60px 30px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(46,158,108,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Check size={24} color="var(--success)" />
        </div>
        <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 17 }}>Check your email</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
          We sent password reset instructions to<br /><b style={{ color: "var(--text)" }}>{email}</b>
        </div>
        <button className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, marginTop: 24 }} onClick={goSignIn}>Back to Log In</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: "20px 18px 0" }}>
        <button onClick={goSignIn} style={{ background: "var(--surface2)", border: "none", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}>
          <ArrowLeft size={17} />
        </button>
      </div>
      <AuthHeader title="Reset your password" subtitle="Enter your email and we'll send you a reset link" />
      <div style={{ padding: "10px 26px 40px" }}>
        <Field label="Email">
          <div style={{ position: "relative" }}>
            <Mail size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
            <input className="bz-input" style={{ paddingLeft: 34 }} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </Field>
        <button disabled={!email.includes("@")} className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: email.includes("@") ? 1 : 0.5, marginTop: 6 }}
          onClick={() => setSent(true)}>
          Send Reset Link
        </button>
      </div>
    </div>
  );
}

function BusinessSetupScreen({ colors, authUser, onDone }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Sari-Sari Store");
  const types = [
    { id: "Sari-Sari Store", icon: Store },
    { id: "Food Business", icon: Utensils },
    { id: "Online Seller", icon: ShoppingBag },
    { id: "Freelancer", icon: Laptop },
    { id: "Service Provider", icon: Briefcase },
    { id: "Retail", icon: Package },
  ];
  const valid = name.trim().length > 1;
  return (
    <div>
      <div style={{ padding: "34px 26px 6px", textAlign: "center" }}>
        <BizoraMark size={44} radius={14} />
        <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 20, marginTop: 14 }}>Set up your business</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 5 }}>One last step before your dashboard is ready</div>
      </div>
      <div style={{ padding: "14px 26px 40px" }}>
        <Field label="Business name">
          <input className="bz-input" placeholder="e.g. Cruz General Merchandise" value={name} onChange={e => setName(e.target.value)} />
        </Field>
        <Field label="What kind of business is it?">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {types.map(t => {
              const Icon = t.icon;
              const active = type === t.id;
              return (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 11px", borderRadius: 12, cursor: "pointer",
                  border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                  background: active ? "rgba(14,110,92,0.08)" : "var(--surface)", color: "var(--text)", textAlign: "left",
                }}>
                  <Icon size={15} color={active ? "var(--primary)" : "var(--muted)"} />
                  <span style={{ fontSize: 12 }}>{t.id}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <button disabled={!valid} className="bz-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: valid ? 1 : 0.5, marginTop: 8 }}
          onClick={() => onDone({ name, owner: authUser?.name || name, type })}>
          Go to My Dashboard
        </button>
      </div>
    </div>
  );
}
