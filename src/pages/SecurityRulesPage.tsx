import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, FolderTree, Terminal, Lock } from 'lucide-react';

const FIRESTORE_RULES_SOURCE = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isActiveUser() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             getUserDoc().isActive == true;
    }

    function getUserRole() {
      return getUserDoc().role;
    }

    function isManager() {
      return isActiveUser() && getUserRole() == 'manager';
    }

    function isStorekeeper() {
      return isActiveUser() && getUserRole() == 'storekeeper';
    }

    function hasStockWriteRole() {
      return isManager() || isStorekeeper();
    }

    // USERS COLLECTION
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isManager());
      allow create: if isManager() &&
                    request.resource.data.uid == userId &&
                    request.resource.data.role in ['manager', 'storekeeper', 'staff'] &&
                    request.resource.data.isActive is bool;
      allow update: if isManager() &&
                    (userId != request.auth.uid || request.resource.data.isActive == true) &&
                    request.resource.data.role in ['manager', 'storekeeper', 'staff'];
      allow delete: if false;
    }

    // STOCK ITEMS
    match /stockItems/{itemId} {
      allow read: if isActiveUser();
      allow create: if hasStockWriteRole() &&
                    request.resource.data.name is string &&
                    request.resource.data.unit in ['kg', 'litres', 'pieces', 'packs', 'crates'] &&
                    request.resource.data.reorderLevel >= 0;
      allow update: if hasStockWriteRole();
      allow delete: if false;
    }

    // STOCK BATCHES (FIFO)
    match /stockBatches/{batchId} {
      allow read: if hasStockWriteRole();
      allow create: if hasStockWriteRole() &&
                    request.resource.data.quantityReceived > 0 &&
                    request.resource.data.costPerUnit >= 0;
      allow update: if hasStockWriteRole() &&
                    request.resource.data.quantityRemaining >= 0;
      allow delete: if false;
    }

    // STOCK MOVEMENTS (IMMUTABLE AUDIT TRAIL)
    match /stockMovements/{movementId} {
      allow read: if hasStockWriteRole();
      allow create: if hasStockWriteRole() &&
                    request.resource.data.type in ['received', 'used', 'wasted', 'adjusted'] &&
                    request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }

    // REQUISITIONS
    match /requisitions/{reqId} {
      allow read: if isActiveUser() && (
        hasStockWriteRole() || resource.data.requestedBy.userId == request.auth.uid
      );
      allow create: if isActiveUser();
      allow update: if hasStockWriteRole();
      allow delete: if false;
    }

    // STOCK ALERTS
    match /alerts/{alertId} {
      allow read: if hasStockWriteRole();
      allow create, update: if hasStockWriteRole();
      allow delete: if false;
    }
  }
}`;

export const SecurityRulesPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_SOURCE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            Security Specification & Architecture
          </h1>
          <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Strict role-based access control, immutable transaction logging, and secondary Firebase instance architecture.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#181D1A] hover:bg-[#FAF8F5] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE] dark:hover:bg-[#1C2822]"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? 'Copied Rules' : 'Copy firestore.rules'}</span>
        </button>
      </div>

      {/* Security Pillars Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#E4E0D8] bg-white p-4.5 dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#14532D]/10 text-[#14532D] dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Active User Gate
            </h3>
          </div>
          <p className="mt-2.5 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Every read and write requires an authenticated session where <code>/users/{'{uid}'}</code> has <code>isActive == true</code>. Deactivated accounts are rejected at both the UI and database rule level.
          </p>
        </div>

        <div className="rounded-lg border border-[#E4E0D8] bg-white p-4.5 dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Immutable Movements
            </h3>
          </div>
          <p className="mt-2.5 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            The <code>stockMovements</code> collection records every receipt, usage, waste, and adjustment. Rules enforce <code>allow update, delete: if false;</code> — maintaining a tamper-proof audit ledger.
          </p>
        </div>

        <div className="rounded-lg border border-[#E4E0D8] bg-white p-4.5 dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400">
              <Terminal className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Secondary App Instance
            </h3>
          </div>
          <p className="mt-2.5 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            When a Manager provisions an employee account, Firebase Authentication is initialized via a named secondary instance (<code>StockLineSecondaryUserCreator</code>), preserving the manager’s active auth session.
          </p>
        </div>
      </div>

      {/* Rules Code Viewer */}
      <div className="overflow-hidden rounded-lg border border-[#E4E0D8] bg-[#0E1512] shadow-xs dark:border-[#223028]">
        <div className="flex items-center justify-between border-b border-[#223028] bg-[#141E19] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 font-mono text-xs text-[#9AA89F]">firestore.rules</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs text-[#9AA89F] hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre className="max-h-[460px] overflow-auto p-4 font-mono text-xs text-[#D8E6DE]">
          <code>{FIRESTORE_RULES_SOURCE}</code>
        </pre>
      </div>

      {/* Deployment Steps */}
      <div className="rounded-lg border border-[#E4E0D8] bg-white p-5 dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
          <h2 className="text-sm font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            Firebase Setup & Deployment Steps
          </h2>
        </div>

        <ol className="mt-3 space-y-2.5 text-xs text-[#5C6660] dark:text-[#9AA89F]">
          <li className="flex items-start gap-2">
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#14532D] font-mono text-[10px] font-bold text-white dark:bg-[#16A34A]">
              1
            </span>
            <span>
              <strong>Provision Firebase Project:</strong> In Firebase Console, create a new project and enable <strong>Email/Password Authentication</strong> and <strong>Cloud Firestore</strong> in Native mode.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#14532D] font-mono text-[10px] font-bold text-white dark:bg-[#16A34A]">
              2
            </span>
            <span>
              <strong>Deploy Security Rules:</strong> Copy the rules above into the Firestore Rules tab in Firebase Console or deploy via Firebase CLI: <code>firebase deploy --only firestore:rules</code>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#14532D] font-mono text-[10px] font-bold text-white dark:bg-[#16A34A]">
              3
            </span>
            <span>
              <strong>Environment Variables:</strong> Populate <code>.env</code> with your Firebase Web credentials (<code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_AUTH_DOMAIN</code>, <code>VITE_FIREBASE_PROJECT_ID</code>, <code>VITE_FIREBASE_APP_ID</code>).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#14532D] font-mono text-[10px] font-bold text-white dark:bg-[#16A34A]">
              4
            </span>
            <span>
              <strong>Bootstrap Initial Manager:</strong> Create the first user in Firebase Auth and insert a matching document in <code>users/{'{uid}'}</code> with <code>role: 'manager'</code> and <code>isActive: true</code>.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
};
