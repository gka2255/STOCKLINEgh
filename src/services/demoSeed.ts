import {
  AppUser,
  StockItem,
  StockBatch,
  StockMovement,
  Requisition,
  StockAlert,
  Supplier,
  Purchase,
  SupplierPayment,
  TaxSettings,
  TaxSummary,
  TaxReturn,
} from '../types/stock';
import { getTaxPeriodIds, calculateGraReturnDueDate } from '../utils/formatters';

function daysFromNowIso(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
}

function hoursAgoIso(hoursAgo: number): string {
  const d = new Date(Date.now() - hoursAgo * 3600 * 1000);
  return d.toISOString();
}

export interface DemoAccountCredential {
  user: AppUser;
  passwordPlain: string;
  roleDescription: string;
}

export const INITIAL_DEMO_ACCOUNTS: DemoAccountCredential[] = [
  {
    user: {
      uid: 'usr_kwame_manager',
      name: 'Kwame Mensah',
      email: 'kwame.mensah@stockline.gh',
      role: 'manager',
      isActive: true,
      createdAt: daysFromNowIso(-90),
    },
    passwordPlain: 'AccraKitchen#2026',
    roleDescription: 'Restaurant Manager — Full access to all modules, alerts & user management',
  },
  {
    user: {
      uid: 'usr_abena_storekeeper',
      name: 'Abena Osei',
      email: 'abena.osei@stockline.gh',
      role: 'storekeeper',
      isActive: true,
      createdAt: daysFromNowIso(-75),
    },
    passwordPlain: 'StoreRoom#2026',
    roleDescription: 'Head Storekeeper — Issues requisitions, receives stock, manages alerts',
  },
  {
    user: {
      uid: 'usr_yaw_storekeeper',
      name: 'Yaw Asante',
      email: 'yaw.asante@stockline.gh',
      role: 'storekeeper',
      isActive: true,
      createdAt: daysFromNowIso(-45),
    },
    passwordPlain: 'StoreRoom#2026',
    roleDescription: 'Evening Shift Storekeeper — Issues & records walk-in withdrawals',
  },
  {
    user: {
      uid: 'usr_kofi_staff',
      name: 'Kofi Boateng',
      email: 'kofi.boateng@stockline.gh',
      role: 'staff',
      isActive: true,
      createdAt: daysFromNowIso(-60),
    },
    passwordPlain: 'KitchenStaff#2026',
    roleDescription: 'Executive Chef — Submits Kitchen requisitions, tracks request status',
  },
  {
    user: {
      uid: 'usr_esi_staff',
      name: 'Esi Appiah',
      email: 'esi.appiah@stockline.gh',
      role: 'staff',
      isActive: true,
      createdAt: daysFromNowIso(-40),
    },
    passwordPlain: 'KitchenStaff#2026',
    roleDescription: 'Sous Chef (Prep & Sauces) — Submits Kitchen supply requisitions',
  },
  {
    user: {
      uid: 'usr_mawuli_staff',
      name: 'Mawuli Agbedor',
      email: 'mawuli.agbedor@stockline.gh',
      role: 'staff',
      isActive: true,
      createdAt: daysFromNowIso(-35),
    },
    passwordPlain: 'BarLead#2026',
    roleDescription: 'Bar Lead — Submits Bar & Beverage requisitions',
  },
  {
    user: {
      uid: 'usr_akua_staff',
      name: 'Akua Danquah',
      email: 'akua.danquah@stockline.gh',
      role: 'staff',
      isActive: true,
      createdAt: daysFromNowIso(-30),
    },
    passwordPlain: 'Service#2026',
    roleDescription: 'Service Lead — Submits front-of-house takeaway & supplies requests',
  },
  {
    user: {
      uid: 'usr_ama_deactivated',
      name: 'Ama Darko',
      email: 'ama.darko@stockline.gh',
      role: 'staff',
      isActive: false,
      createdAt: daysFromNowIso(-120),
    },
    passwordPlain: 'FormerStaff#2026',
    roleDescription: 'Deactivated staff account (blocked from signing in)',
  },
];

export function buildGhanaRestaurantDemoSeed(): {
  items: StockItem[];
  batches: StockBatch[];
  movements: StockMovement[];
  requisitions: Requisition[];
  alerts: StockAlert[];
  suppliers: Supplier[];
  purchases: Purchase[];
  supplierPayments: SupplierPayment[];
} {
  const items: StockItem[] = [
    {
      id: 'itm_01_rice',
      name: 'Jasmine Perfumed Rice (Royal Feast)',
      category: 'Grains & Staples',
      unit: 'kg',
      reorderLevel: 50,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-60),
    },
    {
      id: 'itm_02_chicken',
      name: 'Fresh Whole Broiler Chicken',
      category: 'Meat & Poultry',
      unit: 'kg',
      reorderLevel: 25,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-60),
    },
    {
      id: 'itm_03_tomatoes',
      name: 'Local Roma Tomatoes (Navrongo Crate)',
      category: 'Fresh Produce',
      unit: 'crates',
      reorderLevel: 3,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-58),
    },
    {
      id: 'itm_04_palmoil',
      name: 'Zomi Red Palm Oil (Volta Grade)',
      category: 'Oils & Fats',
      unit: 'litres',
      reorderLevel: 20,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-55),
    },
    {
      id: 'itm_05_lpg',
      name: 'LPG Cooking Gas Cylinder (14.5kg Refill)',
      category: 'Gas & Fuel',
      unit: 'pieces',
      reorderLevel: 3,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-55),
    },
    {
      id: 'itm_06_goat',
      name: 'Fresh Goat Meat (Chevon Shoulder)',
      category: 'Meat & Poultry',
      unit: 'kg',
      reorderLevel: 15,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-50),
    },
    {
      id: 'itm_07_plantain',
      name: 'Ripe Kelewele Plantain (Apentu)',
      category: 'Fresh Produce',
      unit: 'kg',
      reorderLevel: 30,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-48),
    },
    {
      id: 'itm_08_yam',
      name: 'Techiman Pona Yam Tubers',
      category: 'Grains & Staples',
      unit: 'pieces',
      reorderLevel: 20,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-45),
    },
    {
      id: 'itm_09_peppers',
      name: 'Scotch Bonnet & Kpakpo Shito Peppers',
      category: 'Fresh Produce',
      unit: 'kg',
      reorderLevel: 8,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-45),
    },
    {
      id: 'itm_10_onions',
      name: 'Bawku Red Onions & Shallots',
      category: 'Fresh Produce',
      unit: 'kg',
      reorderLevel: 25,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-44),
    },
    {
      id: 'itm_11_tilapia',
      name: 'Fresh Lake Volta Tilapia (Cleaned)',
      category: 'Fish & Seafood',
      unit: 'kg',
      reorderLevel: 20,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-42),
    },
    {
      id: 'itm_12_herrings',
      name: 'Smoked Herrings & Amani (Dry)',
      category: 'Fish & Seafood',
      unit: 'packs',
      reorderLevel: 10,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-40),
    },
    {
      id: 'itm_13_groundnut',
      name: 'Smooth Groundnut Paste (Nima Mill)',
      category: 'Spices & Condiments',
      unit: 'kg',
      reorderLevel: 12,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-38),
    },
    {
      id: 'itm_14_cassava',
      name: 'Fermented Cassava Dough (Agbelima)',
      category: 'Grains & Staples',
      unit: 'kg',
      reorderLevel: 25,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-36),
    },
    {
      id: 'itm_15_corndough',
      name: 'Fermented White Corn Dough (Mmore)',
      category: 'Grains & Staples',
      unit: 'kg',
      reorderLevel: 30,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-36),
    },
    {
      id: 'itm_16_sunfloweroil',
      name: 'Refined Frytol Vegetable Cooking Oil',
      category: 'Oils & Fats',
      unit: 'litres',
      reorderLevel: 25,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-35),
    },
    {
      id: 'itm_17_tomatopaste',
      name: 'Gino Double Concentrated Tomato Paste',
      category: 'Spices & Condiments',
      unit: 'packs',
      reorderLevel: 15,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-34),
    },
    {
      id: 'itm_18_maggi',
      name: 'Maggi Crayfish & Shrimp Seasoning Cubes',
      category: 'Spices & Condiments',
      unit: 'packs',
      reorderLevel: 12,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-32),
    },
    {
      id: 'itm_19_charcoal',
      name: 'Kintampo Hardwood Grill Charcoal (50kg Sack)',
      category: 'Gas & Fuel',
      unit: 'packs',
      reorderLevel: 4,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-30),
    },
    {
      id: 'itm_20_salt',
      name: 'Ada Songhor Iodized Fine Sea Salt',
      category: 'Spices & Condiments',
      unit: 'kg',
      reorderLevel: 10,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-28),
    },
    {
      id: 'itm_21_ginger',
      name: 'Fresh Kibi Yellow Ginger Root',
      category: 'Fresh Produce',
      unit: 'kg',
      reorderLevel: 10,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-25),
    },
    {
      id: 'itm_22_gardeneggs',
      name: 'Local White Garden Eggs (Abetifi)',
      category: 'Fresh Produce',
      unit: 'kg',
      reorderLevel: 15,
      defaultSupplierId: null,
      taxCategory: 'exempt',
      isActive: true,
      createdAt: daysFromNowIso(-24),
    },
    {
      id: 'itm_23_sardines',
      name: 'Titus Sardines in Vegetable Oil (Carton)',
      category: 'Fish & Seafood',
      unit: 'crates',
      reorderLevel: 2,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-22),
    },
    {
      id: 'itm_24_takeaway',
      name: 'Biodegradable Kraft Jollof Takeaway Packs (50pc)',
      category: 'Packaging & Beverages',
      unit: 'packs',
      reorderLevel: 10,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-20),
    },
    {
      id: 'itm_25_voltic',
      name: 'Voltic Natural Mineral Water (500ml x 24)',
      category: 'Packaging & Beverages',
      unit: 'crates',
      reorderLevel: 12,
      defaultSupplierId: null,
      taxCategory: 'standard',
      isActive: true,
      createdAt: daysFromNowIso(-18),
    },
  ];

  // Batches
  const batches: StockBatch[] = [
    // 1. Jasmine Rice
    {
      id: 'bat_01a',
      itemId: 'itm_01_rice',
      quantityReceived: 100,
      quantityRemaining: 40,
      costPerUnit: 24.5,
      dateReceived: daysFromNowIso(-25),
      expiryDate: daysFromNowIso(180),
      supplierId: 'sup_tema_grains',
      purchaseId: 'PO-2026-101',
      createdAt: daysFromNowIso(-25),
    },
    {
      id: 'bat_01b',
      itemId: 'itm_01_rice',
      quantityReceived: 75,
      quantityRemaining: 75,
      costPerUnit: 26.0,
      dateReceived: daysFromNowIso(-6),
      expiryDate: daysFromNowIso(240),
      supplierId: 'sup_tema_grains',
      purchaseId: 'PO-2026-119',
      createdAt: daysFromNowIso(-6),
    },

    // 2. Broiler Chicken
    {
      id: 'bat_02a',
      itemId: 'itm_02_chicken',
      quantityReceived: 30,
      quantityRemaining: 13,
      costPerUnit: 68.0,
      dateReceived: daysFromNowIso(-8),
      expiryDate: daysFromNowIso(3), // Expiring in 3d
      supplierId: 'sup_darko_farms',
      purchaseId: 'PO-2026-114',
      createdAt: daysFromNowIso(-8),
    },
    {
      id: 'bat_02b',
      itemId: 'itm_02_chicken',
      quantityReceived: 25,
      quantityRemaining: 25,
      costPerUnit: 70.0,
      dateReceived: daysFromNowIso(-2),
      expiryDate: daysFromNowIso(12),
      supplierId: 'sup_darko_farms',
      purchaseId: 'PO-2026-128',
      createdAt: daysFromNowIso(-2),
    },

    // 3. Roma Tomatoes (Total 2 crates <= 3 Low)
    {
      id: 'bat_03a',
      itemId: 'itm_03_tomatoes',
      quantityReceived: 3,
      quantityRemaining: 0.5,
      costPerUnit: 850.0,
      dateReceived: daysFromNowIso(-11),
      expiryDate: daysFromNowIso(-2), // EXPIRED
      supplierId: 'sup_agbogbloshie_coop',
      purchaseId: 'PO-2026-108',
      createdAt: daysFromNowIso(-11),
    },
    {
      id: 'bat_03b',
      itemId: 'itm_03_tomatoes',
      quantityReceived: 2,
      quantityRemaining: 1.5,
      costPerUnit: 890.0,
      dateReceived: daysFromNowIso(-4),
      expiryDate: daysFromNowIso(4),
      supplierId: 'sup_agbogbloshie_coop',
      purchaseId: 'PO-2026-123',
      createdAt: daysFromNowIso(-4),
    },

    // 4. Palm Oil
    {
      id: 'bat_04a',
      itemId: 'itm_04_palmoil',
      quantityReceived: 50,
      quantityRemaining: 45,
      costPerUnit: 42.0,
      dateReceived: daysFromNowIso(-14),
      expiryDate: daysFromNowIso(120),
      supplierId: 'sup_keta_oils',
      purchaseId: 'PO-2026-110',
      createdAt: daysFromNowIso(-14),
    },

    // 5. LPG Cooking Gas Cylinder (2 remaining <= 3 Low)
    {
      id: 'bat_05a',
      itemId: 'itm_05_lpg',
      quantityReceived: 6,
      quantityRemaining: 2,
      costPerUnit: 235.0,
      dateReceived: daysFromNowIso(-12),
      expiryDate: null,
      supplierId: 'sup_goil_osu',
      purchaseId: 'PO-2026-111',
      createdAt: daysFromNowIso(-12),
    },

    // 6. Goat Meat
    {
      id: 'bat_06a',
      itemId: 'itm_06_goat',
      quantityReceived: 20,
      quantityRemaining: 12,
      costPerUnit: 95.0,
      dateReceived: daysFromNowIso(-5),
      expiryDate: daysFromNowIso(5),
      supplierId: 'sup_madina_abattoir',
      purchaseId: 'PO-2026-120',
      createdAt: daysFromNowIso(-5),
    },

    // 7. Plantain (0 kg remaining = Finished)
    {
      id: 'bat_07a',
      itemId: 'itm_07_plantain',
      quantityReceived: 40,
      quantityRemaining: 0,
      costPerUnit: 14.0,
      dateReceived: daysFromNowIso(-9),
      expiryDate: daysFromNowIso(-1),
      supplierId: 'sup_agbogbloshie_coop',
      purchaseId: 'PO-2026-112',
      createdAt: daysFromNowIso(-9),
    },

    // 8. Techiman Pona Yam
    {
      id: 'bat_08a',
      itemId: 'itm_08_yam',
      quantityReceived: 60,
      quantityRemaining: 48,
      costPerUnit: 22.0,
      dateReceived: daysFromNowIso(-7),
      expiryDate: daysFromNowIso(21),
      supplierId: 'sup_techiman_direct',
      purchaseId: 'PO-2026-116',
      createdAt: daysFromNowIso(-7),
    },

    // 9. Peppers
    {
      id: 'bat_09a',
      itemId: 'itm_09_peppers',
      quantityReceived: 12,
      quantityRemaining: 5,
      costPerUnit: 38.0,
      dateReceived: daysFromNowIso(-6),
      expiryDate: daysFromNowIso(2),
      supplierId: 'sup_agbogbloshie_coop',
      purchaseId: 'PO-2026-118',
      createdAt: daysFromNowIso(-6),
    },

    // 10. Onions
    {
      id: 'bat_10a',
      itemId: 'itm_10_onions',
      quantityReceived: 80,
      quantityRemaining: 62,
      costPerUnit: 19.5,
      dateReceived: daysFromNowIso(-10),
      expiryDate: daysFromNowIso(28),
      supplierId: 'sup_bawku_traders',
      purchaseId: 'PO-2026-113',
      createdAt: daysFromNowIso(-10),
    },

    // 11. Tilapia
    {
      id: 'bat_11a',
      itemId: 'itm_11_tilapia',
      quantityReceived: 28,
      quantityRemaining: 14,
      costPerUnit: 76.0,
      dateReceived: daysFromNowIso(-3),
      expiryDate: daysFromNowIso(4),
      supplierId: 'sup_akosombo_catch',
      purchaseId: 'PO-2026-125',
      createdAt: daysFromNowIso(-3),
    },

    // 12. Smoked Herrings
    {
      id: 'bat_12a',
      itemId: 'itm_12_herrings',
      quantityReceived: 25,
      quantityRemaining: 18,
      costPerUnit: 45.0,
      dateReceived: daysFromNowIso(-15),
      expiryDate: daysFromNowIso(45),
      supplierId: 'sup_chorkor_smokers',
      purchaseId: 'PO-2026-105',
      createdAt: daysFromNowIso(-15),
    },

    // 13. Groundnut Paste
    {
      id: 'bat_13a',
      itemId: 'itm_13_groundnut',
      quantityReceived: 25,
      quantityRemaining: 19,
      costPerUnit: 48.0,
      dateReceived: daysFromNowIso(-12),
      expiryDate: daysFromNowIso(60),
      supplierId: 'sup_nima_mill',
      purchaseId: 'PO-2026-109',
      createdAt: daysFromNowIso(-12),
    },

    // 14. Cassava Dough
    {
      id: 'bat_14a',
      itemId: 'itm_14_cassava',
      quantityReceived: 35,
      quantityRemaining: 18,
      costPerUnit: 11.5,
      dateReceived: daysFromNowIso(-4),
      expiryDate: daysFromNowIso(6),
      supplierId: 'sup_kasoa_mills',
      purchaseId: 'PO-2026-124',
      createdAt: daysFromNowIso(-4),
    },

    // 15. Corn Dough (Finished = 0)
    {
      id: 'bat_15a',
      itemId: 'itm_15_corndough',
      quantityReceived: 40,
      quantityRemaining: 0,
      costPerUnit: 13.0,
      dateReceived: daysFromNowIso(-10),
      expiryDate: daysFromNowIso(-2),
      supplierId: 'sup_kasoa_mills',
      purchaseId: 'PO-2026-112',
      createdAt: daysFromNowIso(-10),
    },

    // 16. Frytol Cooking Oil
    {
      id: 'bat_16a',
      itemId: 'itm_16_sunfloweroil',
      quantityReceived: 75,
      quantityRemaining: 55,
      costPerUnit: 39.0,
      dateReceived: daysFromNowIso(-16),
      expiryDate: daysFromNowIso(210),
      supplierId: 'sup_tema_grains',
      purchaseId: 'PO-2026-104',
      createdAt: daysFromNowIso(-16),
    },

    // 17. Gino Tomato Paste
    {
      id: 'bat_17a',
      itemId: 'itm_17_tomatopaste',
      quantityReceived: 36,
      quantityRemaining: 28,
      costPerUnit: 64.0,
      dateReceived: daysFromNowIso(-18),
      expiryDate: daysFromNowIso(300),
      supplierId: 'sup_makola_wholesale',
      purchaseId: 'PO-2026-102',
      createdAt: daysFromNowIso(-18),
    },

    // 18. Maggi Cubes
    {
      id: 'bat_18a',
      itemId: 'itm_18_maggi',
      quantityReceived: 30,
      quantityRemaining: 22,
      costPerUnit: 32.0,
      dateReceived: daysFromNowIso(-20),
      expiryDate: daysFromNowIso(280),
      supplierId: 'sup_makola_wholesale',
      purchaseId: 'PO-2026-100',
      createdAt: daysFromNowIso(-20),
    },

    // 19. Hardwood Charcoal
    {
      id: 'bat_19a',
      itemId: 'itm_19_charcoal',
      quantityReceived: 10,
      quantityRemaining: 3,
      costPerUnit: 145.0,
      dateReceived: daysFromNowIso(-14),
      expiryDate: null,
      supplierId: 'sup_kintampo_fuel',
      purchaseId: 'PO-2026-107',
      createdAt: daysFromNowIso(-14),
    },

    // 20. Sea Salt
    {
      id: 'bat_20a',
      itemId: 'itm_20_salt',
      quantityReceived: 30,
      quantityRemaining: 24,
      costPerUnit: 8.5,
      dateReceived: daysFromNowIso(-22),
      expiryDate: daysFromNowIso(365),
      supplierId: 'sup_makola_wholesale',
      purchaseId: 'PO-2026-098',
      createdAt: daysFromNowIso(-22),
    },

    // 21. Fresh Ginger
    {
      id: 'bat_21a',
      itemId: 'itm_21_ginger',
      quantityReceived: 20,
      quantityRemaining: 16,
      costPerUnit: 29.0,
      dateReceived: daysFromNowIso(-5),
      expiryDate: daysFromNowIso(18),
      supplierId: 'sup_agbogbloshie_coop',
      purchaseId: 'PO-2026-121',
      createdAt: daysFromNowIso(-5),
    },

    // 22. Garden Eggs
    {
      id: 'bat_22a',
      itemId: 'itm_22_gardeneggs',
      quantityReceived: 18,
      quantityRemaining: 9,
      costPerUnit: 16.0,
      dateReceived: daysFromNowIso(-4),
      expiryDate: daysFromNowIso(3),
      supplierId: 'sup_agbogbloshie_coop',
      purchaseId: 'PO-2026-122',
      createdAt: daysFromNowIso(-4),
    },

    // 23. Titus Sardines
    {
      id: 'bat_23a',
      itemId: 'itm_23_sardines',
      quantityReceived: 6,
      quantityRemaining: 5,
      costPerUnit: 420.0,
      dateReceived: daysFromNowIso(-15),
      expiryDate: daysFromNowIso(400),
      supplierId: 'sup_makola_wholesale',
      purchaseId: 'PO-2026-106',
      createdAt: daysFromNowIso(-15),
    },

    // 24. Takeaway Kraft Packs
    {
      id: 'bat_24a',
      itemId: 'itm_24_takeaway',
      quantityReceived: 25,
      quantityRemaining: 18,
      costPerUnit: 55.0,
      dateReceived: daysFromNowIso(-9),
      expiryDate: null,
      supplierId: 'sup_spintex_pack',
      purchaseId: 'PO-2026-115',
      createdAt: daysFromNowIso(-9),
    },

    // 25. Voltic Mineral Water
    {
      id: 'bat_25a',
      itemId: 'itm_25_voltic',
      quantityReceived: 35,
      quantityRemaining: 26,
      costPerUnit: 38.0,
      dateReceived: daysFromNowIso(-3),
      expiryDate: daysFromNowIso(320),
      supplierId: 'sup_voltic_depot',
      purchaseId: 'PO-2026-126',
      createdAt: daysFromNowIso(-3),
    },
  ];

  // Initial Movements
  const movements: StockMovement[] = [
    {
      id: 'mov_01',
      itemId: 'itm_01_rice',
      batchId: 'bat_01b',
      type: 'received',
      quantity: 75,
      userId: 'usr_abena_storekeeper',
      userName: 'Abena Osei',
      timestamp: hoursAgoIso(140),
      note: 'Received 3 x 25kg bags Royal Feast Jasmine Rice from Tema depot.',
    },
    {
      id: 'mov_02',
      itemId: 'itm_02_chicken',
      batchId: 'bat_02b',
      type: 'received',
      quantity: 25,
      userId: 'usr_abena_storekeeper',
      userName: 'Abena Osei',
      timestamp: hoursAgoIso(46),
      note: 'Morning cold-van delivery from Darko Farms, blast-chilled at 2°C.',
    },
    {
      id: 'mov_03',
      itemId: 'itm_01_rice',
      batchId: 'bat_01a',
      type: 'used',
      quantity: 35,
      userId: 'usr_yaw_storekeeper',
      userName: 'Yaw Asante',
      timestamp: hoursAgoIso(28),
      note: 'Issued for REQ-0001 (Kofi Boateng) - Friday Jollof lunch prep.',
      requisitionId: 'req_0001',
      requisitionNumber: 'REQ-0001',
    },
    {
      id: 'mov_04',
      itemId: 'itm_03_tomatoes',
      batchId: 'bat_03a',
      type: 'wasted',
      quantity: 0.5,
      userId: 'usr_kwame_manager',
      userName: 'Kwame Mensah',
      timestamp: hoursAgoIso(20),
      note: 'Bottom layer of Navrongo crate over-ripened in warm storeroom; discarded.',
    },
    {
      id: 'mov_05',
      itemId: 'itm_11_tilapia',
      batchId: 'bat_11a',
      type: 'used',
      quantity: 14,
      userId: 'usr_abena_storekeeper',
      userName: 'Abena Osei',
      timestamp: hoursAgoIso(15),
      note: 'Issued for REQ-0002 (Mawuli Agbedor / Grill station) - Dinner service.',
      requisitionId: 'req_0002',
      requisitionNumber: 'REQ-0002',
    },
  ];

  // Requisitions (Module 2)
  const requisitions: Requisition[] = [
    {
      id: 'req_0001',
      requisitionNumber: 'REQ-0001',
      requestedBy: {
        userId: 'usr_kofi_staff',
        userName: 'Kofi Boateng',
      },
      department: 'Kitchen',
      status: 'issued',
      lines: [
        {
          itemId: 'itm_01_rice',
          itemName: 'Jasmine Perfumed Rice (Royal Feast)',
          unit: 'kg',
          quantityRequested: 35,
          quantityIssued: 35,
          allocations: [
            {
              batchId: 'bat_01a',
              quantity: 35,
              expiryDate: daysFromNowIso(180),
            },
          ],
        },
      ],
      note: 'Prep for Friday lunch Jollof and fried rice catering order (120 covers).',
      createdAt: hoursAgoIso(29),
      issuedBy: {
        userId: 'usr_yaw_storekeeper',
        userName: 'Yaw Asante',
      },
      issuedAt: hoursAgoIso(28),
      rejectionReason: null,
      isDirectIssue: false,
    },
    {
      id: 'req_0002',
      requisitionNumber: 'REQ-0002',
      requestedBy: {
        userId: 'usr_mawuli_staff',
        userName: 'Mawuli Agbedor',
      },
      department: 'Kitchen',
      status: 'issued',
      lines: [
        {
          itemId: 'itm_11_tilapia',
          itemName: 'Fresh Lake Volta Tilapia (Cleaned)',
          unit: 'kg',
          quantityRequested: 14,
          quantityIssued: 14,
          allocations: [
            {
              batchId: 'bat_11a',
              quantity: 14,
              expiryDate: daysFromNowIso(4),
            },
          ],
        },
      ],
      note: 'Charcoal grill station weekend banquet order.',
      createdAt: hoursAgoIso(16),
      issuedBy: {
        userId: 'usr_abena_storekeeper',
        userName: 'Abena Osei',
      },
      issuedAt: hoursAgoIso(15),
      rejectionReason: null,
      isDirectIssue: false,
    },
    {
      id: 'req_0003',
      requisitionNumber: 'REQ-0003',
      requestedBy: {
        userId: 'usr_esi_staff',
        userName: 'Esi Appiah',
      },
      department: 'Kitchen',
      status: 'pending',
      lines: [
        {
          itemId: 'itm_02_chicken',
          itemName: 'Fresh Whole Broiler Chicken',
          unit: 'kg',
          quantityRequested: 10,
          quantityIssued: 10,
        },
        {
          itemId: 'itm_04_palmoil',
          itemName: 'Zomi Red Palm Oil (Volta Grade)',
          unit: 'litres',
          quantityRequested: 5,
          quantityIssued: 5,
        },
        {
          itemId: 'itm_09_peppers',
          itemName: 'Scotch Bonnet & Kpakpo Shito Peppers',
          unit: 'kg',
          quantityRequested: 3,
          quantityIssued: 3,
        },
      ],
      note: 'Saturday morning chicken light soup and groundnut stew stock prep.',
      createdAt: hoursAgoIso(4),
      issuedBy: null,
      issuedAt: null,
      rejectionReason: null,
      isDirectIssue: false,
    },
    {
      id: 'req_0004',
      requisitionNumber: 'REQ-0004',
      requestedBy: {
        userId: 'usr_akua_staff',
        userName: 'Akua Danquah',
      },
      department: 'Service',
      status: 'pending',
      lines: [
        {
          itemId: 'itm_24_takeaway',
          itemName: 'Biodegradable Kraft Jollof Takeaway Packs (50pc)',
          unit: 'packs',
          quantityRequested: 4,
          quantityIssued: 4,
        },
        {
          itemId: 'itm_25_voltic',
          itemName: 'Voltic Natural Mineral Water (500ml x 24)',
          unit: 'crates',
          quantityRequested: 5,
          quantityIssued: 5,
        },
      ],
      note: 'Front-of-house takeaway packing counter and VIP lounge restock.',
      createdAt: hoursAgoIso(2),
      issuedBy: null,
      issuedAt: null,
      rejectionReason: null,
      isDirectIssue: false,
    },
    {
      id: 'req_0005',
      requisitionNumber: 'REQ-0005',
      requestedBy: {
        userId: 'usr_kofi_staff',
        userName: 'Kofi Boateng',
      },
      department: 'Kitchen',
      status: 'rejected',
      lines: [
        {
          itemId: 'itm_06_goat',
          itemName: 'Fresh Goat Meat (Chevon Shoulder)',
          unit: 'kg',
          quantityRequested: 18,
          quantityIssued: 0,
        },
      ],
      note: 'Extra Chevon requested for walk-in catering group.',
      createdAt: hoursAgoIso(12),
      issuedBy: {
        userId: 'usr_abena_storekeeper',
        userName: 'Abena Osei',
      },
      issuedAt: hoursAgoIso(11),
      rejectionReason: 'Total store stock is below reorder threshold (12 kg on hand). Advance manager authorization required for bulk draw-down.',
      isDirectIssue: false,
    },
  ];

  // Stock Alerts (Module 2)
  const alerts: StockAlert[] = [
    {
      id: 'alt_01',
      type: 'finished_stock',
      itemId: 'itm_07_plantain',
      itemName: 'Ripe Kelewele Plantain (Apentu)',
      message: 'Critical: Ripe Kelewele Plantain has 0 kg remaining in stock. Order fresh supply immediately.',
      severity: 'critical',
      triggeredBy: {
        userId: 'usr_yaw_storekeeper',
        userName: 'Yaw Asante',
      },
      createdAt: hoursAgoIso(11),
      readBy: [],
      resolved: false,
    },
    {
      id: 'alt_02',
      type: 'low_stock',
      itemId: 'itm_03_tomatoes',
      itemName: 'Local Roma Tomatoes (Navrongo Crate)',
      message: 'Warning: Local Roma Tomatoes stock dropped to 2 crates, below reorder level (3 crates).',
      severity: 'warning',
      triggeredBy: {
        userId: 'usr_kwame_manager',
        userName: 'Kwame Mensah',
      },
      createdAt: hoursAgoIso(20),
      readBy: ['usr_abena_storekeeper'],
      resolved: false,
    },
    {
      id: 'alt_03',
      type: 'low_stock',
      itemId: 'itm_05_lpg',
      itemName: 'LPG Cooking Gas Cylinder (14.5kg Refill)',
      message: 'Warning: Cooking Gas Cylinders at 2 pieces (reorder level: 3). Empty exchange required.',
      severity: 'warning',
      triggeredBy: {
        userId: 'usr_kwame_manager',
        userName: 'Kwame Mensah',
      },
      createdAt: hoursAgoIso(3),
      readBy: [],
      resolved: false,
    },
    {
      id: 'alt_04',
      type: 'stock_updated',
      itemId: 'itm_01_rice',
      itemName: 'Jasmine Perfumed Rice (Royal Feast)',
      message: 'Info: Jasmine Perfumed Rice received 75 kg batch. Stock is healthy at 115 kg.',
      severity: 'info',
      triggeredBy: {
        userId: 'usr_abena_storekeeper',
        userName: 'Abena Osei',
      },
      createdAt: hoursAgoIso(140),
      readBy: ['usr_kwame_manager', 'usr_abena_storekeeper'],
      resolved: true,
    },
    {
      id: 'alt_05_due_soon',
      type: 'payment_due_soon',
      purchaseId: 'pur_05',
      purchaseNumber: 'PUR-0005',
      supplierId: 'sup_02_ashaiman',
      message: 'Payment of GH₵ 1,950.00 to Ashaiman Fresh Produce & Meat Hub for PUR-0005 is due in 2 days.',
      severity: 'warning',
      triggeredBy: {
        userId: 'usr_kwame_manager',
        userName: 'Kwame Mensah',
      },
      createdAt: hoursAgoIso(5),
      readBy: [],
      resolved: false,
    },
    {
      id: 'alt_06_overdue',
      type: 'payment_overdue',
      purchaseId: 'pur_04',
      purchaseNumber: 'PUR-0004',
      supplierId: 'sup_04_adum',
      message: 'Critical: Payment of GH₵ 2,200.00 to Oils & Agrilogistics Ghana Ltd for PUR-0004 is OVERDUE (Due: 4 days ago).',
      severity: 'critical',
      triggeredBy: {
        userId: 'usr_kwame_manager',
        userName: 'Kwame Mensah',
      },
      createdAt: hoursAgoIso(24),
      readBy: [],
      resolved: false,
    },
  ];

  // ==========================================
  // MODULE 3: SUPPLIERS DEMO DATA (GHANA)
  // ==========================================
  const suppliers: Supplier[] = [
    {
      id: 'sup_01_tema',
      name: 'Tema Food Distributors Ltd',
      contactPerson: 'Emmanuel Quarshie',
      phone: '024 412 3456',
      email: 'orders@temafoods.com.gh',
      address: 'Plot 14, Light Industrial Area, Tema, Greater Accra',
      tin: 'C0003482910',
      notes: 'Bulk grains, Royal Feast jasmine rice, spices, canned goods. Delivery on Tuesdays & Fridays.',
      isActive: true,
      createdAt: daysFromNowIso(-90),
    },
    {
      id: 'sup_02_ashaiman',
      name: 'Ashaiman Fresh Produce & Meat Hub',
      contactPerson: 'Fati Alhassan',
      phone: '020 891 2345',
      email: 'fati@ashaimanfresh.gh',
      address: 'Opposite Main Timber Market, Ashaiman',
      tin: 'C0015948321',
      notes: 'Fresh boneless chicken breast, beef, mutton, local Roma tomatoes, onions.',
      isActive: true,
      createdAt: daysFromNowIso(-85),
    },
    {
      id: 'sup_03_volta',
      name: 'Volta River Fish & Sea Logistics',
      contactPerson: 'Kojo Agbenu',
      phone: '024 388 9012',
      email: 'sales@voltafish.com.gh',
      address: 'Fisheries Quarters, Tema Fishing Harbour',
      tin: 'C0028471933',
      notes: 'Smoked tilapia, fresh red snapper, prawns, and mackerel.',
      isActive: true,
      createdAt: daysFromNowIso(-80),
    },
    {
      id: 'sup_04_adum',
      name: 'Oils & Agrilogistics Ghana Ltd',
      contactPerson: 'Akua Donkor',
      phone: '055 765 4321',
      email: 'admin@agrioils.com.gh',
      address: 'Spintex Road, Near Papaye, Accra',
      tin: 'C0039201844',
      notes: 'Zomi red palm oil, pure vegetable oil, groundnut paste.',
      isActive: true,
      createdAt: daysFromNowIso(-70),
    },
    {
      id: 'sup_05_gas',
      name: 'Accra Gas & Energy Supplies',
      contactPerson: 'Paa Kwesi Mensah',
      phone: '027 654 3210',
      email: 'orders@accragas.com.gh',
      address: 'Ring Road West Industrial Area, Accra',
      tin: 'C0048192055',
      notes: 'Commercial 14.5kg and 50kg LPG cylinder delivery & safety inspection.',
      isActive: true,
      createdAt: daysFromNowIso(-65),
    },
  ];

  // ==========================================
  // MODULE 3 & 4: PURCHASES & ACT 1151 TAX BREAKDOWN
  // Spanning Month -2, Month -1, and Current Month
  // ==========================================
  const rawPurchasesConfig = [
    // Month - 2 (approx 62 days ago)
    {
      id: 'pur_01',
      purchaseNumber: 'PUR-0001',
      supplierId: 'sup_01_tema',
      supplierName: 'Tema Food Distributors Ltd',
      daysAgo: 62,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-TMA-8710',
      recordedBy: { userId: 'usr_abena_storekeeper', userName: 'Abena Osei' },
      lines: [
        {
          itemId: 'itm_01_rice',
          itemName: 'Jasmine Perfumed Rice (Royal Feast)',
          unit: 'kg' as const,
          quantity: 100,
          costPerUnit: 26,
          taxCategory: 'standard' as const,
          expiryDaysOffset: 200,
        },
        {
          itemId: 'itm_25_voltic',
          itemName: 'Voltic Natural Mineral Water (500ml x 24)',
          unit: 'crates' as const,
          quantity: 20,
          costPerUnit: 40,
          taxCategory: 'standard' as const,
          expiryDaysOffset: 300,
        },
      ],
      amountPaid: 4080, // Subtotal 3400 + 20% Tax (680) = 4080
      paymentMethod: 'cheque' as const,
      paymentRef: 'GCB-CHQ-001928',
    },
    // Month - 2 (approx 55 days ago)
    {
      id: 'pur_02',
      purchaseNumber: 'PUR-0002',
      supplierId: 'sup_02_ashaiman',
      supplierName: 'Ashaiman Fresh Produce & Meat Hub',
      daysAgo: 55,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-ASH-3102',
      recordedBy: { userId: 'usr_kwame_manager', userName: 'Kwame Mensah' },
      lines: [
        {
          itemId: 'itm_06_goat',
          itemName: 'Fresh Goat Meat (Chevon Shoulder)',
          unit: 'kg' as const,
          quantity: 40,
          costPerUnit: 70,
          taxCategory: 'exempt' as const,
          expiryDaysOffset: 15,
        },
        {
          itemId: 'itm_07_plantain',
          itemName: 'Ripe Kelewele Plantain (Apentu)',
          unit: 'kg' as const,
          quantity: 50,
          costPerUnit: 14,
          taxCategory: 'exempt' as const,
          expiryDaysOffset: 7,
        },
      ],
      amountPaid: 3500, // Exempt: Tax 0 -> 3500
      paymentMethod: 'momo' as const,
      paymentRef: 'MTN-MM-71928301',
    },
    // Month - 2 (approx 48 days ago)
    {
      id: 'pur_03',
      purchaseNumber: 'PUR-0003',
      supplierId: 'sup_05_gas',
      supplierName: 'Accra Gas & Energy Supplies',
      daysAgo: 48,
      dueDaysFromSupply: 10,
      invoiceNumber: 'INV-GAS-8109',
      recordedBy: { userId: 'usr_kwame_manager', userName: 'Kwame Mensah' },
      lines: [
        {
          itemId: 'itm_05_lpg',
          itemName: 'LPG Cooking Gas Cylinder (14.5kg Refill)',
          unit: 'pieces' as const,
          quantity: 8,
          costPerUnit: 350,
          taxCategory: 'standard' as const,
          expiryDaysOffset: null,
        },
      ],
      amountPaid: 3360, // 2800 + 20% Tax (560) = 3360
      paymentMethod: 'cheque' as const,
      paymentRef: 'ECOBANK-CHQ-99120',
    },
    // Month - 1 (approx 38 days ago)
    {
      id: 'pur_04',
      purchaseNumber: 'PUR-0004',
      supplierId: 'sup_01_tema',
      supplierName: 'Tema Food Distributors Ltd',
      daysAgo: 38,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-TMA-8921',
      recordedBy: { userId: 'usr_abena_storekeeper', userName: 'Abena Osei' },
      lines: [
        {
          itemId: 'itm_16_sunfloweroil',
          itemName: 'Refined Frytol Vegetable Cooking Oil',
          unit: 'litres' as const,
          quantity: 60,
          costPerUnit: 35,
          taxCategory: 'standard' as const,
          expiryDaysOffset: 180,
        },
        {
          itemId: 'itm_18_maggi',
          itemName: 'Maggi Crayfish & Shrimp Seasoning Cubes',
          unit: 'packs' as const,
          quantity: 30,
          costPerUnit: 25,
          taxCategory: 'standard' as const,
          expiryDaysOffset: 360,
        },
        {
          itemId: 'itm_10_onions',
          itemName: 'Bawku Red Onions & Shallots',
          unit: 'kg' as const,
          quantity: 40,
          costPerUnit: 20,
          taxCategory: 'exempt' as const,
          expiryDaysOffset: 20,
        },
      ],
      amountPaid: 4220, // Standard 2850 + 20% Tax (570) + Exempt 800 = 4220
      paymentMethod: 'momo' as const,
      paymentRef: 'MTN-MM-81920381',
    },
    // Month - 1 (approx 32 days ago)
    {
      id: 'pur_05',
      purchaseNumber: 'PUR-0005',
      supplierId: 'sup_03_volta',
      supplierName: 'Volta River Fish & Sea Logistics',
      daysAgo: 32,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-VRF-1089',
      recordedBy: { userId: 'usr_kwame_manager', userName: 'Kwame Mensah' },
      lines: [
        {
          itemId: 'itm_11_tilapia',
          itemName: 'Fresh Lake Volta Tilapia (Cleaned)',
          unit: 'kg' as const,
          quantity: 35,
          costPerUnit: 75,
          taxCategory: 'exempt' as const,
          expiryDaysOffset: 25,
        },
        {
          itemId: 'itm_12_herrings',
          itemName: 'Smoked Herrings & Amani (Dry)',
          unit: 'packs' as const,
          quantity: 20,
          costPerUnit: 45,
          taxCategory: 'standard' as const,
          expiryDaysOffset: 90,
        },
      ],
      amountPaid: 3705, // Exempt 2625 + Standard 900 + 20% Tax (180) = 3705
      paymentMethod: 'cash' as const,
      paymentRef: 'CSH-REC-7192',
    },
    // Month - 1 (approx 25 days ago)
    {
      id: 'pur_06',
      purchaseNumber: 'PUR-0006',
      supplierId: 'sup_04_adum',
      supplierName: 'Oils & Agrilogistics Ghana Ltd',
      daysAgo: 25,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-OIL-4289',
      recordedBy: { userId: 'usr_abena_storekeeper', userName: 'Abena Osei' },
      lines: [
        {
          itemId: 'itm_04_palmoil',
          itemName: 'Zomi Red Palm Oil (Volta Grade)',
          unit: 'litres' as const,
          quantity: 80,
          costPerUnit: 32,
          taxCategory: 'standard' as const,
          expiryDaysOffset: 120,
        },
      ],
      amountPaid: 3072, // 2560 + 20% Tax (512) = 3072
      paymentMethod: 'momo' as const,
      paymentRef: 'TELECEL-CASH-91024',
    },
    // Current Month (18 days ago)
    {
      id: 'pur_07',
      purchaseNumber: 'PUR-0007',
      supplierId: 'sup_01_tema',
      supplierName: 'Tema Food Distributors Ltd',
      daysAgo: 18,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-TMA-9041',
      recordedBy: { userId: 'usr_abena_storekeeper', userName: 'Abena Osei' },
      lines: [
        {
          itemId: 'itm_01_rice',
          itemName: 'Jasmine Perfumed Rice (Royal Feast)',
          unit: 'kg' as const,
          quantity: 100,
          costPerUnit: 27.5,
          taxCategory: 'standard' as const,
          expiryDaysOffset: 240,
        },
      ],
      amountPaid: 3300, // 2750 + 20% Tax (550) = 3300
      paymentMethod: 'cash' as const,
      paymentRef: 'CSH-RECEIPT-9041',
    },
    // Current Month (15 days ago)
    {
      id: 'pur_08',
      purchaseNumber: 'PUR-0008',
      supplierId: 'sup_03_volta',
      supplierName: 'Volta River Fish & Sea Logistics',
      daysAgo: 15,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-VRF-1102',
      recordedBy: { userId: 'usr_kwame_manager', userName: 'Kwame Mensah' },
      lines: [
        {
          itemId: 'itm_11_tilapia',
          itemName: 'Fresh Lake Volta Tilapia (Cleaned)',
          unit: 'kg' as const,
          quantity: 25,
          costPerUnit: 64,
          taxCategory: 'exempt' as const,
          expiryDaysOffset: 20,
        },
      ],
      amountPaid: 1600, // Exempt 1600 + Tax 0 = 1600
      paymentMethod: 'momo' as const,
      paymentRef: 'MTN-MM-84729103',
    },
    // Current Month (12 days ago, part-paid)
    {
      id: 'pur_09',
      purchaseNumber: 'PUR-0009',
      supplierId: 'sup_02_ashaiman',
      supplierName: 'Ashaiman Fresh Produce & Meat Hub',
      daysAgo: 12,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-ASH-3390',
      recordedBy: { userId: 'usr_abena_storekeeper', userName: 'Abena Osei' },
      lines: [
        {
          itemId: 'itm_02_chicken',
          itemName: 'Fresh Whole Broiler Chicken',
          unit: 'kg' as const,
          quantity: 80,
          costPerUnit: 60,
          taxCategory: 'exempt' as const,
          expiryDaysOffset: 14,
        },
      ],
      amountPaid: 2500, // Total 4800 (exempt), paid 2500, arrears 2300
      paymentMethod: 'cheque' as const,
      paymentRef: 'GCB-CHQ-004812',
    },
    // Current Month (10 days ago, overdue!)
    {
      id: 'pur_010',
      purchaseNumber: 'PUR-0010',
      supplierId: 'sup_04_adum',
      supplierName: 'Oils & Agrilogistics Ghana Ltd',
      daysAgo: 10,
      dueDaysFromSupply: 6, // Due 4 days ago -> OVERDUE!
      invoiceNumber: 'INV-OIL-4512',
      recordedBy: { userId: 'usr_kwame_manager', userName: 'Kwame Mensah' },
      lines: [
        {
          itemId: 'itm_04_palmoil',
          itemName: 'Zomi Red Palm Oil (Volta Grade)',
          unit: 'litres' as const,
          quantity: 100,
          costPerUnit: 32,
          taxCategory: 'standard' as const,
          expiryDaysOffset: 180,
        },
      ],
      amountPaid: 1000, // Total with tax 3840 (3200 + 640 tax), paid 1000, arrears 2840
      paymentMethod: 'momo' as const,
      paymentRef: 'VODAFONE-CASH-77192',
    },
    // Current Month (5 days ago, unpaid, due in 2 days!)
    {
      id: 'pur_011',
      purchaseNumber: 'PUR-0011',
      supplierId: 'sup_02_ashaiman',
      supplierName: 'Ashaiman Fresh Produce & Meat Hub',
      daysAgo: 5,
      dueDaysFromSupply: 7, // Due in 2 days!
      invoiceNumber: 'INV-ASH-3415',
      recordedBy: { userId: 'usr_abena_storekeeper', userName: 'Abena Osei' },
      lines: [
        {
          itemId: 'itm_03_tomatoes',
          itemName: 'Local Roma Tomatoes (Navrongo Crate)',
          unit: 'crates' as const,
          quantity: 6,
          costPerUnit: 325,
          taxCategory: 'exempt' as const,
          expiryDaysOffset: 8,
        },
      ],
      amountPaid: 0, // Total with tax 1950 (exempt), arrears 1950
      paymentMethod: null,
      paymentRef: null,
    },
    // Current Month (4 days ago, paid)
    {
      id: 'pur_012',
      purchaseNumber: 'PUR-0012',
      supplierId: 'sup_05_gas',
      supplierName: 'Accra Gas & Energy Supplies',
      daysAgo: 4,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-GAS-8821',
      recordedBy: { userId: 'usr_kwame_manager', userName: 'Kwame Mensah' },
      lines: [
        {
          itemId: 'itm_05_lpg',
          itemName: 'LPG Cooking Gas Cylinder (14.5kg Refill)',
          unit: 'pieces' as const,
          quantity: 6,
          costPerUnit: 350,
          taxCategory: 'standard' as const,
          expiryDaysOffset: null,
        },
      ],
      amountPaid: 2520, // 2100 + 420 Tax = 2520
      paymentMethod: 'cheque' as const,
      paymentRef: 'ECOBANK-CHQ-109283',
    },
    // Current Month (2 days ago, paid)
    {
      id: 'pur_013',
      purchaseNumber: 'PUR-0013',
      supplierId: 'sup_05_gas',
      supplierName: 'Accra Gas & Energy Supplies',
      daysAgo: 2,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-GAS-8902',
      recordedBy: { userId: 'usr_kwame_manager', userName: 'Kwame Mensah' },
      lines: [
        {
          itemId: 'itm_05_lpg',
          itemName: 'LPG Cooking Gas Cylinder (14.5kg Refill)',
          unit: 'pieces' as const,
          quantity: 3,
          costPerUnit: 400,
          taxCategory: 'standard' as const,
          expiryDaysOffset: null,
        },
      ],
      amountPaid: 1440, // 1200 + 240 Tax = 1440
      paymentMethod: 'cash' as const,
      paymentRef: 'CSH-RECEIPT-8902',
    },
    // Current Month (1 day ago, partial)
    {
      id: 'pur_014',
      purchaseNumber: 'PUR-0014',
      supplierId: 'sup_02_ashaiman',
      supplierName: 'Ashaiman Fresh Produce & Meat Hub',
      daysAgo: 1,
      dueDaysFromSupply: 14,
      invoiceNumber: 'INV-ASH-3498',
      recordedBy: { userId: 'usr_abena_storekeeper', userName: 'Abena Osei' },
      lines: [
        {
          itemId: 'itm_02_chicken',
          itemName: 'Fresh Whole Broiler Chicken',
          unit: 'kg' as const,
          quantity: 60,
          costPerUnit: 60,
          taxCategory: 'exempt' as const,
          expiryDaysOffset: 12,
        },
        {
          itemId: 'itm_03_tomatoes',
          itemName: 'Local Roma Tomatoes (Navrongo Crate)',
          unit: 'crates' as const,
          quantity: 1.5,
          costPerUnit: 333.33,
          taxCategory: 'exempt' as const,
          expiryDaysOffset: 6,
        },
      ],
      amountPaid: 1500, // Total with tax 4100 (exempt), paid 1500, arrears 2600
      paymentMethod: 'momo' as const,
      paymentRef: 'MTN-MM-98310482',
    },
  ];

  const purchases: Purchase[] = [];
  const supplierPayments: SupplierPayment[] = [];

  for (const cfg of rawPurchasesConfig) {
    const dateSupplied = daysFromNowIso(-cfg.daysAgo).split('T')[0];
    const dueDate = daysFromNowIso(-cfg.daysAgo + cfg.dueDaysFromSupply).split('T')[0];
    const createdAt = daysFromNowIso(-cfg.daysAgo);

    let subtotal = 0;
    let standardNet = 0;
    let vatAmount = 0;
    let nhilAmount = 0;
    let getfundAmount = 0;

    const calculatedLines = cfg.lines.map((l) => {
      const lineTotal = Math.round(l.quantity * l.costPerUnit * 100) / 100;
      subtotal += lineTotal;

      let lineTaxable = lineTotal;
      let lineVat = 0;
      let lineNhil = 0;
      let lineGetfund = 0;

      if (l.taxCategory === 'standard') {
        lineVat = Math.round(lineTaxable * 0.15 * 100) / 100;
        lineNhil = Math.round(lineTaxable * 0.025 * 100) / 100;
        lineGetfund = Math.round(lineTaxable * 0.025 * 100) / 100;
        standardNet += lineTaxable;
        vatAmount += lineVat;
        nhilAmount += lineNhil;
        getfundAmount += lineGetfund;
      }

      return {
        itemId: l.itemId,
        itemName: l.itemName,
        unit: l.unit,
        quantity: l.quantity,
        costPerUnit: l.costPerUnit,
        lineTotal,
        expiryDate: l.expiryDaysOffset ? daysFromNowIso(l.expiryDaysOffset).split('T')[0] : null,
        taxCategory: l.taxCategory,
        taxableAmount: lineTaxable,
        vatAmount: lineVat,
        nhilAmount: lineNhil,
        getfundAmount: lineGetfund,
      };
    });

    const totalTax = Math.round((vatAmount + nhilAmount + getfundAmount) * 100) / 100;
    const totalWithTax = Math.round((subtotal + totalTax) * 100) / 100;
    const arrears = Math.max(0, Math.round((totalWithTax - cfg.amountPaid) * 100) / 100);
    const paymentStatus: PaymentStatus =
      arrears === 0 ? 'paid' : cfg.amountPaid > 0 ? 'partial' : 'unpaid';

    const pur: Purchase = {
      id: cfg.id,
      purchaseNumber: cfg.purchaseNumber,
      supplierId: cfg.supplierId,
      supplierName: cfg.supplierName,
      dateSupplied,
      dueDate,
      invoiceNumber: cfg.invoiceNumber,
      lines: calculatedLines,
      subtotal,
      amountPaid: cfg.amountPaid,
      arrears,
      paymentStatus,
      paymentMethod: cfg.paymentMethod,
      recordedBy: cfg.recordedBy,
      createdAt,
      taxableAmount: standardNet,
      vatAmount,
      nhilAmount,
      getfundAmount,
      totalTax,
      totalWithTax,
    };
    purchases.push(pur);

    if (cfg.amountPaid > 0 && cfg.paymentMethod) {
      supplierPayments.push({
        id: `pay_${cfg.id}`,
        purchaseId: cfg.id,
        purchaseNumber: cfg.purchaseNumber,
        supplierId: cfg.supplierId,
        supplierName: cfg.supplierName,
        amount: cfg.amountPaid,
        method: cfg.paymentMethod,
        reference: cfg.paymentRef || 'REF-AUTO-SETTLEMENT',
        paidOn: dateSupplied,
        recordedBy: cfg.recordedBy,
        note: arrears === 0 ? 'Full settlement on delivery.' : 'Part payment on delivery receipt.',
        createdAt,
      });
    }
  }

  // ==========================================
  // MODULE 4: TAX SETTINGS & SUMMARIES & RETURNS
  // ==========================================
  const taxSettings: TaxSettings = {
    id: 'current',
    vatRate: 15,
    nhilRate: 2.5,
    getfundRate: 2.5,
    pricesEnteredAs: 'exclusive',
    isVatRegistered: true,
    businessName: 'StockLine Restaurant Ltd',
    tin: 'C002847192X',
    updatedBy: {
      userId: 'usr_kwame_manager',
      userName: 'Kwame Mensah',
    },
    updatedAt: daysFromNowIso(-90),
  };

  // Build Tax Summaries (Day, Week, Month)
  const summariesMap = new Map<string, TaxSummary>();

  const getOrCreateSummary = (
    id: string,
    period: string,
    periodType: 'day' | 'week' | 'month',
    startDate: string,
    endDate: string
  ): TaxSummary => {
    let s = summariesMap.get(id);
    if (!s) {
      s = {
        id,
        period,
        periodType,
        startDate,
        endDate,
        standardPurchasesNet: 0,
        exemptPurchases: 0,
        zeroRatedPurchases: 0,
        vatInput: 0,
        nhilInput: 0,
        getfundInput: 0,
        totalInputTax: 0,
        purchasesGross: 0,
        stockOutValue: 0,
        purchaseCount: 0,
      };
      summariesMap.set(id, s);
    }
    return s;
  };

  for (const pur of purchases) {
    const pIds = getTaxPeriodIds(pur.dateSupplied);

    const targetSummaries = [
      getOrCreateSummary(pIds.dayId, pIds.dayPeriod, 'day', pur.dateSupplied, pur.dateSupplied),
      getOrCreateSummary(pIds.weekId, pIds.weekPeriod, 'week', pIds.weekStart, pIds.weekEnd),
      getOrCreateSummary(pIds.monthId, pIds.monthPeriod, 'month', pIds.monthStart, pIds.monthEnd),
    ];

    let stdNet = 0;
    let exemptNet = 0;
    let zeroNet = 0;

    for (const l of pur.lines) {
      if (l.taxCategory === 'standard') {
        stdNet += l.taxableAmount ?? l.lineTotal;
      } else if (l.taxCategory === 'exempt') {
        exemptNet += l.lineTotal;
      } else {
        zeroNet += l.lineTotal;
      }
    }

    for (const s of targetSummaries) {
      s.standardPurchasesNet = Math.round((s.standardPurchasesNet + stdNet) * 100) / 100;
      s.exemptPurchases = Math.round((s.exemptPurchases + exemptNet) * 100) / 100;
      s.zeroRatedPurchases = Math.round((s.zeroRatedPurchases + zeroNet) * 100) / 100;
      s.vatInput = Math.round((s.vatInput + (pur.vatAmount || 0)) * 100) / 100;
      s.nhilInput = Math.round((s.nhilInput + (pur.nhilAmount || 0)) * 100) / 100;
      s.getfundInput = Math.round((s.getfundInput + (pur.getfundAmount || 0)) * 100) / 100;
      s.totalInputTax = Math.round((s.totalInputTax + (pur.totalTax || 0)) * 100) / 100;
      s.purchasesGross = Math.round((s.purchasesGross + (pur.totalWithTax || pur.subtotal)) * 100) / 100;
      s.purchaseCount += 1;
    }
  }

  // Stock out cost values from requisitions
  for (const req of requisitions) {
    if (req.status === 'issued' && req.issuedAt) {
      const pIds = getTaxPeriodIds(req.issuedAt);
      const targetSummaries = [
        getOrCreateSummary(pIds.dayId, pIds.dayPeriod, 'day', req.issuedAt.slice(0, 10), req.issuedAt.slice(0, 10)),
        getOrCreateSummary(pIds.weekId, pIds.weekPeriod, 'week', pIds.weekStart, pIds.weekEnd),
        getOrCreateSummary(pIds.monthId, pIds.monthPeriod, 'month', pIds.monthStart, pIds.monthEnd),
      ];

      let costValue = 0;
      for (const line of req.lines) {
        costValue += (line.quantityIssued || 0) * 35; // average cost estimate
      }
      for (const s of targetSummaries) {
        s.stockOutValue = Math.round((s.stockOutValue + costValue) * 100) / 100;
      }
    }
  }

  const taxSummaries = Array.from(summariesMap.values());

  // Build Tax Returns for Month -2, Month -1, and Current Month
  const m2Date = new Date();
  m2Date.setMonth(m2Date.getMonth() - 2);
  const m2Period = `${m2Date.getFullYear()}-${String(m2Date.getMonth() + 1).padStart(2, '0')}`;

  const m1Date = new Date();
  m1Date.setMonth(m1Date.getMonth() - 1);
  const m1Period = `${m1Date.getFullYear()}-${String(m1Date.getMonth() + 1).padStart(2, '0')}`;

  const curDate = new Date();
  const curPeriod = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthSummary = (period: string): TaxSummary => {
    return (
      summariesMap.get(`month_${period}`) || {
        id: `month_${period}`,
        period,
        periodType: 'month',
        startDate: `${period}-01`,
        endDate: `${period}-28`,
        standardPurchasesNet: 0,
        exemptPurchases: 0,
        zeroRatedPurchases: 0,
        vatInput: 0,
        nhilInput: 0,
        getfundInput: 0,
        totalInputTax: 0,
        purchasesGross: 0,
        stockOutValue: 0,
        purchaseCount: 0,
      }
    );
  };

  const sM2 = getMonthSummary(m2Period);
  const sM1 = getMonthSummary(m1Period);
  const sCur = getMonthSummary(curPeriod);

  const taxReturns: TaxReturn[] = [
    // Month - 2: Filed
    {
      id: `ret_${m2Period}`,
      period: m2Period,
      periodLabel: `${monthNames[m2Date.getMonth()]} ${m2Date.getFullYear()}`,
      dueDate: calculateGraReturnDueDate(m2Period),
      status: 'Filed',
      businessName: taxSettings.businessName,
      tin: taxSettings.tin,
      standardPurchasesNet: sM2.standardPurchasesNet,
      exemptPurchases: sM2.exemptPurchases,
      zeroRatedPurchases: sM2.zeroRatedPurchases,
      totalPurchasesNet: Math.round((sM2.standardPurchasesNet + sM2.exemptPurchases + sM2.zeroRatedPurchases) * 100) / 100,
      vatInput: sM2.vatInput,
      nhilInput: sM2.nhilInput,
      getfundInput: sM2.getfundInput,
      totalInputTax: sM2.totalInputTax,
      stockOutCost: sM2.stockOutValue,
      filedBy: {
        userId: 'usr_kwame_manager',
        userName: 'Kwame Mensah',
      },
      filedAt: daysFromNowIso(-32),
      referenceNumber: `RET-${m2Period}`,
      isSimulatedFiling: true,
    },
    // Month - 1: Pending
    {
      id: `ret_${m1Period}`,
      period: m1Period,
      periodLabel: `${monthNames[m1Date.getMonth()]} ${m1Date.getFullYear()}`,
      dueDate: calculateGraReturnDueDate(m1Period),
      status: 'Pending',
      businessName: taxSettings.businessName,
      tin: taxSettings.tin,
      standardPurchasesNet: sM1.standardPurchasesNet,
      exemptPurchases: sM1.exemptPurchases,
      zeroRatedPurchases: sM1.zeroRatedPurchases,
      totalPurchasesNet: Math.round((sM1.standardPurchasesNet + sM1.exemptPurchases + sM1.zeroRatedPurchases) * 100) / 100,
      vatInput: sM1.vatInput,
      nhilInput: sM1.nhilInput,
      getfundInput: sM1.getfundInput,
      totalInputTax: sM1.totalInputTax,
      stockOutCost: sM1.stockOutValue,
      filedBy: null,
      filedAt: null,
      referenceNumber: null,
      isSimulatedFiling: true,
    },
    // Current Month: Pending
    {
      id: `ret_${curPeriod}`,
      period: curPeriod,
      periodLabel: `${monthNames[curDate.getMonth()]} ${curDate.getFullYear()}`,
      dueDate: calculateGraReturnDueDate(curPeriod),
      status: 'Pending',
      businessName: taxSettings.businessName,
      tin: taxSettings.tin,
      standardPurchasesNet: sCur.standardPurchasesNet,
      exemptPurchases: sCur.exemptPurchases,
      zeroRatedPurchases: sCur.zeroRatedPurchases,
      totalPurchasesNet: Math.round((sCur.standardPurchasesNet + sCur.exemptPurchases + sCur.zeroRatedPurchases) * 100) / 100,
      vatInput: sCur.vatInput,
      nhilInput: sCur.nhilInput,
      getfundInput: sCur.getfundInput,
      totalInputTax: sCur.totalInputTax,
      stockOutCost: sCur.stockOutValue,
      filedBy: null,
      filedAt: null,
      referenceNumber: null,
      isSimulatedFiling: true,
    },
  ];

  return {
    items,
    batches,
    movements,
    requisitions,
    alerts,
    suppliers,
    purchases,
    supplierPayments,
    taxSettings,
    taxSummaries,
    taxReturns,
  };
}
