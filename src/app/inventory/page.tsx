"use client";

import { useState } from "react";
import { Package, Plus, Trash2, AlertCircle, ShoppingCart, CheckSquare, Square, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { InventoryItem, ShoppingListItem, Unit } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { isNearExpiry, isExpired } from "@/lib/inventory-utils";
import { useUnits } from "@/lib/use-units";

const CATEGORIES = [
  "Produce", "Dairy", "Meat & Fish", "Grains", "Canned Goods",
  "Spices", "Condiments", "Frozen", "Bakery", "Other",
];

const EMPTY_FORM = {
  name: "",
  quantity: "",
  unit: "piece" as Unit,
  category: "Other",
  expiresAt: "",
};

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const { getUnitLabel, UNITS } = useUnits();
  const [items, setItems] = useLocalStorage<InventoryItem[]>("inventory", []);
  const [shoppingList, setShoppingList] = useLocalStorage<ShoppingListItem[]>("shopping-list", []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterCategory, setFilterCategory] = useState("All");
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const selectMode = selectedIds.size > 0;

  const showToast = (msg: string) => {
    setAddedToast(msg);
    setTimeout(() => setAddedToast(null), 2000);
  };

  const addItemsToShoppingList = (itemsToAdd: InventoryItem[]) => {
    const newItems: ShoppingListItem[] = [];
    let skipped = 0;
    for (const item of itemsToAdd) {
      const existing = shoppingList.find(
        (s) => s.name.toLowerCase() === item.name.toLowerCase() && !s.checked
      );
      if (existing) {
        skipped++;
        continue;
      }
      newItems.push({
        id: crypto.randomUUID(),
        name: item.name,
        quantity: item.quantity > 0 ? item.quantity : 1,
        unit: item.unit,
        category: item.category,
        checked: false,
        addedAt: new Date().toISOString(),
        source: "manual",
      });
    }
    if (newItems.length > 0) {
      setShoppingList((prev) => [...prev, ...newItems]);
    }
    if (newItems.length === 1 && skipped === 0) {
      showToast(t("addedToList", { name: newItems[0].name }));
    } else if (newItems.length > 0) {
      showToast(t("addedCountToList", { count: newItems.length }));
    } else {
      showToast(t("allAlreadyInList"));
    }
    setSelectedIds(new Set());
  };

  const addToShoppingList = (item: InventoryItem) => addItemsToShoppingList([item]);

  const addSelectedToShoppingList = () => {
    const selected = items.filter((i) => selectedIds.has(i.id));
    addItemsToShoppingList(selected);
  };

  const restockAllEmpty = () => {
    const emptyItems = items.filter((i) => i.quantity === 0);
    if (emptyItems.length === 0) return;
    addItemsToShoppingList(emptyItems);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
    }
  };

  const addItem = () => {
    if (!form.name.trim() || !form.quantity) return;
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      quantity: Number(form.quantity),
      unit: form.unit,
      category: form.category,
      expiresAt: form.expiresAt || undefined,
      addedAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      category: item.category,
      expiresAt: item.expiresAt || "",
    });
  };

  const saveEdit = () => {
    if (!editingId || !editForm.name.trim() || !editForm.quantity) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === editingId
          ? { ...i, name: editForm.name.trim(), quantity: Number(editForm.quantity), unit: editForm.unit, category: editForm.category, expiresAt: editForm.expiresAt || undefined }
          : i
      )
    );
    setEditingId(null);
  };

  const categories = [
    "All",
    ...Array.from(new Set(items.map((i) => i.category))),
  ];

  const filtered = (
    filterCategory === "All"
      ? items
      : items.filter((i) => i.category === filterCategory)
  ).sort((a, b) => {
    // Zero-quantity items go to bottom
    if (a.quantity === 0 && b.quantity !== 0) return 1;
    if (a.quantity !== 0 && b.quantity === 0) return -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          {items.some((i) => i.quantity === 0) && (
            <button
              onClick={restockAllEmpty}
              className="flex items-center gap-2 border border-brand-200 text-brand-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-brand-50 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              {t("restockEmpty")}
            </button>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("addItem")}
          </button>
        </div>
      </div>

      {/* Selection action bar */}
      {selectMode && (
        <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5">
          <button
            onClick={toggleSelectAll}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            {selectedIds.size === filtered.length ? t("deselectAll") : t("selectAll")}
          </button>
          <span className="text-sm text-gray-500">
            {t("selectedCount", { count: selectedIds.size })}
          </span>
          <div className="flex-1" />
          <button
            onClick={addSelectedToShoppingList}
            className="flex items-center gap-1.5 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {t("addSelectedToList")}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {tCommon("cancel")}
          </button>
        </div>
      )}

      {/* Add item form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">{t("formTitle")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{tCommon("name")} *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  {tCommon("quantity")} *
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{tCommon("unit")}</label>
                <select
                  className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={form.unit}
                  onChange={(e) =>
                    setForm({ ...form, unit: e.target.value as Unit })
                  }
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {getUnitLabel(u)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {tCommon("category")}
              </label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {t("expiryLabel")}
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {tCommon("cancel")}
            </button>
            <button
              onClick={addItem}
              className="px-4 py-2 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-colors"
            >
              {tCommon("save")}
            </button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterCategory === c
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Item list */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-10">
          {items.length === 0
            ? t("emptyNew")
            : t("emptyFiltered")}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const expired = isExpired(item.expiresAt);
            const nearExpiry = !expired && isNearExpiry(item.expiresAt);
            const isEmpty = item.quantity === 0;
            const isEditing = editingId === item.id;

            if (isEditing) {
              return (
                <div key={item.id} className="bg-white border border-brand-200 rounded-xl px-4 py-3 shadow-sm space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{tCommon("name")}</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">{tCommon("quantity")}</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{tCommon("unit")}</label>
                        <select
                          className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                          value={editForm.unit}
                          onChange={(e) => setEditForm({ ...editForm, unit: e.target.value as Unit })}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>{getUnitLabel(u)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{tCommon("category")}</label>
                      <select
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t("expiryLabel")}</label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        value={editForm.expiresAt}
                        onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {tCommon("cancel")}
                    </button>
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1.5 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-colors"
                    >
                      {tCommon("save")}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 bg-white border rounded-xl px-4 py-3 shadow-sm ${
                  isEmpty
                    ? "border-gray-100 opacity-60"
                    : expired
                    ? "border-red-200"
                    : nearExpiry
                    ? "border-amber-200"
                    : "border-gray-200"
                }`}
              >
                {/* Checkbox for multi-select */}
                <button
                  onClick={() => toggleSelect(item.id)}
                  className="p-0.5 text-gray-300 hover:text-brand-600 transition-colors shrink-0"
                >
                  {selectedIds.has(item.id) ? (
                    <CheckSquare className="w-5 h-5 text-brand-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate ${isEmpty ? "text-gray-400" : "text-gray-900"}`}>
                      {item.name}
                    </span>
                    {isEmpty && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded-full font-medium">
                        {t("outOfStock")}
                      </span>
                    )}
                    {!isEmpty && (expired || nearExpiry) && (
                      <AlertCircle
                        className={`w-4 h-4 shrink-0 ${
                          expired ? "text-red-500" : "text-amber-500"
                        }`}
                      />
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex gap-3">
                    <span>
                      {item.quantity} {getUnitLabel(item.unit)}
                    </span>
                    <span>{item.category}</span>
                    {item.expiresAt && (
                      <span className={expired ? "text-red-400" : nearExpiry ? "text-amber-400" : ""}>
                        {t("expires")}{" "}
                        {new Date(item.expiresAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => startEdit(item)}
                  className="p-1.5 text-gray-300 hover:text-brand-600 transition-colors"
                  title={tCommon("edit")}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => addToShoppingList(item)}
                  className="p-1.5 text-gray-300 hover:text-brand-600 transition-colors"
                  aria-label={t("addToListAriaLabel", { name: item.name })}
                  title={t("addToListTooltip")}
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {/* Toast */}
      {addedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-xl text-sm shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          {addedToast}
        </div>
      )}
    </div>
  );
}
