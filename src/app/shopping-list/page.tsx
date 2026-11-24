"use client";

import { useState } from "react";
import { ShoppingCart, Plus, Trash2, CheckCircle2, Circle, Package, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { ShoppingListItem, Unit, InventoryItem } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { dataService } from "@/lib/data-service";
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
};

export default function ShoppingListPage() {
  const t = useTranslations("shoppingList");
  const tCommon = useTranslations("common");
  const { getUnitLabel, UNITS } = useUnits();
  const [items, setItems] = useLocalStorage<ShoppingListItem[]>(
    "shopping-list",
    []
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const addItem = () => {
    if (!form.name.trim() || !form.quantity) return;
    const newItem: ShoppingListItem = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      quantity: Number(form.quantity),
      unit: form.unit,
      category: form.category,
      checked: false,
      addedAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const toggleItem = (id: string) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const startEdit = (item: ShoppingListItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      category: item.category,
    });
  };

  const saveEdit = () => {
    if (!editingId || !editForm.name.trim() || !editForm.quantity) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === editingId
          ? { ...i, name: editForm.name.trim(), quantity: Number(editForm.quantity), unit: editForm.unit, category: editForm.category }
          : i
      )
    );
    setEditingId(null);
  };

  const clearChecked = () =>
    setItems((prev) => prev.filter((i) => !i.checked));

  const moveCheckedToPantry = () => {
    const checkedItems = items.filter((i) => i.checked);
    const inventory = dataService.inventory.getAll();

    for (const item of checkedItems) {
      const existing = inventory.find(
        (inv) => inv.name.toLowerCase() === item.name.toLowerCase() && inv.unit === item.unit
      );
      if (existing) {
        existing.quantity += item.quantity;
        dataService.inventory.save(existing);
      } else {
        const newItem: InventoryItem = {
          id: crypto.randomUUID(),
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          addedAt: new Date().toISOString(),
          source: "shopping-list",
        };
        dataService.inventory.save(newItem);
      }
    }

    setItems((prev) => prev.filter((i) => !i.checked));
  };

  const renderItem = (item: ShoppingListItem) => {
    if (editingId === item.id) {
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
        className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 shadow-sm transition-opacity ${
          item.checked ? "opacity-60 border-gray-100" : "border-gray-200"
        }`}
      >
        <button
          onClick={() => toggleItem(item.id)}
          className="shrink-0 text-brand-500 hover:text-brand-700 transition-colors"
          aria-label={item.checked ? t("markNeeded") : t("markPickedUp")}
        >
          {item.checked ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5 text-gray-300" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <span
            className={`font-medium text-gray-900 ${
              item.checked ? "line-through text-gray-400" : ""
            }`}
          >
            {item.name}
          </span>
          <div className="text-xs text-gray-400 mt-0.5 flex gap-3">
            <span>
              {item.quantity} {getUnitLabel(item.unit)}
            </span>
            <span>{item.category}</span>
          </div>
        </div>
        {!item.checked && (
          <button
            onClick={() => startEdit(item)}
            className="p-1.5 text-gray-300 hover:text-brand-600 transition-colors"
            title={tCommon("edit")}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => removeItem(item.id)}
          className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          {unchecked.length > 0 && (
            <span className="bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unchecked.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("addItem")}
        </button>
      </div>

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

      {/* To-buy list */}
      {unchecked.length > 0 && (
        <div className="space-y-2">{unchecked.map(renderItem)}</div>
      )}

      {/* Picked-up section */}
      {checked.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-400">
              {t("pickedUp", { count: checked.length })}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={moveCheckedToPantry}
                className="text-xs text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
              >
                <Package className="w-3 h-3" />
                {t("moveToPantry")}
              </button>
              <button
                onClick={clearChecked}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                {t("clearAll")}
              </button>
            </div>
          </div>
          {checked.map(renderItem)}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-center text-gray-400 py-10">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
