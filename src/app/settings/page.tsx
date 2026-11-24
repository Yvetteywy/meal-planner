"use client";

import { useState, useRef } from "react";
import { Settings, Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { dataService } from "@/lib/data-service";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingJson, setPendingJson] = useState("");

  const handleExport = () => {
    const json = dataService.exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().split("T")[0];
    a.download = `meal-planner-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPendingJson(text);
      setShowConfirm(true);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const confirmImport = () => {
    const result = dataService.importAll(pendingJson);
    if (result.success) {
      setImportStatus("success");
      setImportMessage(t("importSuccess"));
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setImportStatus("error");
      setImportMessage(result.error || t("importError"));
    }
    setShowConfirm(false);
    setPendingJson("");
    setTimeout(() => setImportStatus("idle"), 4000);
  };

  // Parse pending backup for preview
  let previewSummary = "";
  if (pendingJson) {
    try {
      const parsed = JSON.parse(pendingJson);
      const d = parsed.data;
      const parts = [];
      if (d?.recipes?.length) parts.push(`${d.recipes.length} ${t("recipes")}`);
      if (d?.meals?.length) parts.push(`${d.meals.length} ${t("meals")}`);
      if (d?.inventory?.length) parts.push(`${d.inventory.length} ${t("inventoryItems")}`);
      if (d?.shoppingList?.length) parts.push(`${d.shoppingList.length} ${t("shoppingItems")}`);
      previewSummary = parts.join(", ");
      if (parsed.exportedAt) {
        previewSummary += ` · ${t("exportedOn")} ${new Date(parsed.exportedAt).toLocaleDateString()}`;
      }
    } catch {
      previewSummary = t("invalidFile");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {/* Export */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">{t("exportTitle")}</h2>
        <p className="text-sm text-gray-500">{t("exportDescription")}</p>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t("exportButton")}
        </button>
      </div>

      {/* Import */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">{t("importTitle")}</h2>
        <p className="text-sm text-gray-500">{t("importDescription")}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 border border-brand-200 text-brand-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {t("importButton")}
        </button>

        {/* Import status toast */}
        {importStatus !== "idle" && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${
            importStatus === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {importStatus === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {importMessage}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{t("confirmTitle")}</h3>
            </div>
            <p className="text-sm text-gray-600">{t("confirmDescription")}</p>
            {previewSummary && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
                {previewSummary}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowConfirm(false); setPendingJson(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {t("confirmCancel")}
              </button>
              <button
                onClick={confirmImport}
                className="px-4 py-2 text-sm bg-amber-600 text-white hover:bg-amber-700 rounded-xl transition-colors font-medium"
              >
                {t("confirmReplace")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
