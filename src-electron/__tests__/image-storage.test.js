import { describe, it, expect, vi, beforeEach } from "vitest";

// ── helpers compartidos por los tests ──────────────────────────────────────────

/**
 * Crea un objeto "db" falso que acepta queries SQL y retorna resultados
 * configurables. Todos los métodos son vi.fn() para poder hacer assertions.
 */
function makeFakeDb({ rowForGet = null, rowsForAll = [] } = {}) {
  return {
    runAsync: vi.fn().mockResolvedValue({ lastID: 1, changes: 1 }),
    getAsync: vi.fn().mockResolvedValue(rowForGet),
    allAsync: vi.fn().mockResolvedValue(rowsForAll),
  };
}

// ── lógica extraída de api.cjs (pura, sin dependencia de pool real) ────────────

function makeImageApi(db) {
  async function saveProductImageData(productId, base64Data) {
    const sql = "UPDATE products_services SET image_data = $1 WHERE id = $2";
    await db.runAsync(sql, [base64Data, productId]);
    return true;
  }

  async function getProductImageData(productId) {
    const sql = "SELECT image_data FROM products_services WHERE id = $1";
    const row = await db.getAsync(sql, [productId]);
    return row ? row.image_data : null;
  }

  async function deleteProductImageData(productId) {
    const sql = "UPDATE products_services SET image_data = NULL WHERE id = $1";
    await db.runAsync(sql, [productId]);
    return true;
  }

  return { saveProductImageData, getProductImageData, deleteProductImageData };
}

// ── lógica de migración extraída de main.cjs (pura) ───────────────────────────

async function runMigration(products, getProductImageFromDisk, saveProductImageData) {
  let migrated = 0;
  let skipped = 0;
  for (const product of products) {
    if (product.image_data) { skipped++; continue; }
    const imageData = await getProductImageFromDisk(product.id);
    if (imageData) {
      await saveProductImageData(product.id, imageData);
      migrated++;
    }
  }
  return { migrated, skipped, total: products.length };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("saveProductImageData", () => {
  it("ejecuta UPDATE con el base64 y el id correctos", async () => {
    const db = makeFakeDb();
    const { saveProductImageData } = makeImageApi(db);

    await saveProductImageData(42, "data:image/png;base64,abc123");

    expect(db.runAsync).toHaveBeenCalledOnce();
    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toContain("SET image_data");
    expect(params).toEqual(["data:image/png;base64,abc123", 42]);
  });

  it("retorna true al guardar", async () => {
    const db = makeFakeDb();
    const { saveProductImageData } = makeImageApi(db);
    const result = await saveProductImageData(1, "data:image/jpeg;base64,xyz");
    expect(result).toBe(true);
  });
});

describe("getProductImageData", () => {
  it("retorna el base64 cuando la fila existe en DB", async () => {
    const db = makeFakeDb({ rowForGet: { image_data: "data:image/png;base64,stored" } });
    const { getProductImageData } = makeImageApi(db);

    const result = await getProductImageData(5);
    expect(result).toBe("data:image/png;base64,stored");
  });

  it("retorna null cuando no hay imagen en DB", async () => {
    const db = makeFakeDb({ rowForGet: null });
    const { getProductImageData } = makeImageApi(db);

    const result = await getProductImageData(99);
    expect(result).toBeNull();
  });

  it("retorna null cuando image_data es null en la fila", async () => {
    const db = makeFakeDb({ rowForGet: { image_data: null } });
    const { getProductImageData } = makeImageApi(db);

    const result = await getProductImageData(7);
    expect(result).toBeNull();
  });
});

describe("deleteProductImageData", () => {
  it("ejecuta UPDATE SET image_data = NULL con el id correcto", async () => {
    const db = makeFakeDb();
    const { deleteProductImageData } = makeImageApi(db);

    await deleteProductImageData(10);

    expect(db.runAsync).toHaveBeenCalledOnce();
    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toContain("image_data = NULL");
    expect(params).toContain(10);
  });
});

describe("runMigration (migrar imágenes de disco a DB)", () => {
  it("migra los productos que no tienen image_data y tienen archivo en disco", async () => {
    const products = [
      { id: 1, image_data: null },
      { id: 2, image_data: null },
    ];
    const diskImages = { 1: "data:image/png;base64,img1", 2: "data:image/png;base64,img2" };
    const getFromDisk = vi.fn((id) => Promise.resolve(diskImages[id] ?? null));
    const saveToDb = vi.fn().mockResolvedValue(true);

    const result = await runMigration(products, getFromDisk, saveToDb);

    expect(saveToDb).toHaveBeenCalledTimes(2);
    expect(saveToDb).toHaveBeenCalledWith(1, "data:image/png;base64,img1");
    expect(saveToDb).toHaveBeenCalledWith(2, "data:image/png;base64,img2");
    expect(result).toEqual({ migrated: 2, skipped: 0, total: 2 });
  });

  it("omite productos que ya tienen image_data en DB", async () => {
    const products = [
      { id: 1, image_data: "data:image/png;base64,already" },
      { id: 2, image_data: null },
    ];
    const getFromDisk = vi.fn(() => Promise.resolve("data:image/png;base64,new"));
    const saveToDb = vi.fn().mockResolvedValue(true);

    const result = await runMigration(products, getFromDisk, saveToDb);

    expect(saveToDb).toHaveBeenCalledTimes(1);
    expect(saveToDb).toHaveBeenCalledWith(2, "data:image/png;base64,new");
    expect(result).toEqual({ migrated: 1, skipped: 1, total: 2 });
  });

  it("no llama a saveToDb si el disco no tiene imagen para el producto", async () => {
    const products = [{ id: 3, image_data: null }];
    const getFromDisk = vi.fn(() => Promise.resolve(null));
    const saveToDb = vi.fn();

    const result = await runMigration(products, getFromDisk, saveToDb);

    expect(saveToDb).not.toHaveBeenCalled();
    expect(result).toEqual({ migrated: 0, skipped: 0, total: 1 });
  });

  it("retorna ceros cuando no hay productos", async () => {
    const getFromDisk = vi.fn();
    const saveToDb = vi.fn();

    const result = await runMigration([], getFromDisk, saveToDb);

    expect(result).toEqual({ migrated: 0, skipped: 0, total: 0 });
    expect(getFromDisk).not.toHaveBeenCalled();
    expect(saveToDb).not.toHaveBeenCalled();
  });

  it("omite el producto si getFromDisk retorna undefined", async () => {
    const products = [{ id: 5, image_data: null }];
    const getFromDisk = vi.fn(() => Promise.resolve(undefined));
    const saveToDb = vi.fn();

    const result = await runMigration(products, getFromDisk, saveToDb);

    expect(saveToDb).not.toHaveBeenCalled();
    expect(result.migrated).toBe(0);
  });
});
