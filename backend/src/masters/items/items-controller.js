import { connectDB } from "../../pool.js";
import { generateDocumentNumber } from "../../../utils/generateDocumentNumber.js";


// export const generateItemCode = async (company_id, client) => {

//   await client.query(
//     `INSERT INTO document_sequences (company_id, doc_type, prefix, start_no, current_value)
//      VALUES ($1, 'ITEM_CODE', 'ITM', 301, 300)
//      ON CONFLICT (company_id, doc_type) DO NOTHING`,
//     [company_id]
//   );


//   const { rows } = await client.query(
//     `SELECT prefix, current_value
//      FROM document_sequences
//      WHERE company_id = $1 AND doc_type = 'ITEM_CODE'
//      FOR UPDATE`,
//     [company_id]
//   );

//   if (!rows.length) {
//     throw new Error("ITEM_CODE sequence not found");
//   }

//   const current = rows[0];
//   const next = Number(current.current_value) + 1;



//   await client.query(
//     `UPDATE document_sequences
//      SET current_value = $1
//      WHERE company_id = $2 AND doc_type = 'ITEM_CODE'`,
//     [next, company_id]
//   );


//   return `${current.prefix}-${String(next).padStart(4, '0')}`;
// };


// export const createItem = async (req, res) => {
//   const client = await connectDB.connect();

//   try {
//     await client.query("BEGIN");

//     const {
//       name,
//       code,
//       barcode,
//       categoryId,
//       categoryName,
//       brand,
//       hsnCode,
//       taxRate,
//       unitId,
//       purchaseRate,
//       saleRate,
//       unitName,
//       mrp,
//       minStockLevel,
//       articleNo,
//       sizeColor,
//       imageUrl,
//       isActive,
//     } = req.body;

//     const company_id = req.user.company_id;
//     const created_by = req.user.id;

//     if (!name) {
//       await client.query("ROLLBACK");
//       return res.status(400).json({ success: false, message: "Item name is required" });
//     }

//     const cleanName = name.trim();

//     // ✅ Duplicate code check
//     if (code?.trim()) {
//       const existing = await client.query(
//         `SELECT 1 FROM items WHERE code = $1 AND company_id = $2`,
//         [code.trim(), company_id]
//       );

//       if (existing.rows.length > 0) {
//         await client.query("ROLLBACK");
//         return res.status(400).json({
//           success: false,
//           message: "Item code already exists",
//         });
//       }
//     }

//     // ✅ Resolve final code — manual or auto-generated
//     let finalCode;

//     if (code?.trim()) {
//       finalCode = code.trim();

//       // Sync sequence if manual code prefix matches and number is ahead
//       const match = finalCode.match(/^([A-Za-z]+)-?(\d+)$/);
//       if (match) {
//         const manualPrefix = match[1].toUpperCase();
//         const manualNum = parseInt(match[2]);

//         await client.query(
//           `UPDATE document_sequences
//            SET current_value = GREATEST(current_value, $1)
//            WHERE company_id = $2
//              AND doc_type = 'ITEM_CODE'
//              AND UPPER(prefix) = $3`,
//           [manualNum, company_id, manualPrefix]
//         );
//       }
//     } else {
//       finalCode = await generateItemCode(company_id, client);
//     }

//     // ✅ Ensure barcode_settings row exists
//     await client.query(
//       `INSERT INTO barcode_settings (company_id)
//        VALUES ($1)
//        ON CONFLICT (company_id) DO NOTHING`,
//       [company_id]
//     );

//     // 🔒 Lock barcode_settings row
//     const { rows } = await client.query(
//       `SELECT * FROM barcode_settings
//        WHERE company_id = $1
//        FOR UPDATE`,
//       [company_id]
//     );

//     const config = rows[0];

//     let finalBarcode = barcode?.trim() || null;

//     // 🔍 Duplicate barcode check
//     if (finalBarcode) {
//       const dup = await client.query(
//         `SELECT 1 FROM items WHERE barcode = $1 AND company_id = $2`,
//         [finalBarcode, company_id]
//       );

//       if (dup.rows.length > 0) {
//         await client.query("ROLLBACK");
//         return res.status(400).json({
//           success: false,
//           message: "Barcode already exists",
//         });
//       }
//     }

//     // ⚡ Auto-generate barcode if not provided
//     if (!finalBarcode) {
//       const nextNumber = (config.last_used_number || 0) + 1;
//       const padded = String(nextNumber).padStart(config.length || 6, "0");
//       finalBarcode = `${config.prefix || ""}${padded}`;

//       await client.query(
//         `UPDATE barcode_settings
//          SET last_used_number = $1,
//              updated_at = NOW()
//          WHERE company_id = $2`,
//         [nextNumber, company_id]
//       );
//     }

//     // ✅ Insert item
//     const result = await client.query(
//       `INSERT INTO items (
//         company_id, name, code, barcode,
//         category_id, category, brand, hsn_code,
//         gst_rate, primary_unit_id,
//         purchase_rate, sale_rate, unit_name,
//         mrp, min_stock_level,
//         article_no, size_color, image_url,
//         is_active, created_by
//       )
//       VALUES (
//         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
//         $11,$12,$13,$14,$15,$16,$17,$18,$19,$20
//       )
//       RETURNING *`,
//       [
//         company_id,
//         cleanName,
//         finalCode,
//         finalBarcode,
//         categoryId || null,
//         categoryName || null,
//         brand || null,
//         hsnCode || null,
//         taxRate ?? 18,
//         unitId || null,
//         purchaseRate ?? 0,
//         saleRate ?? 0,
//         unitName ?? null,
//         mrp ?? 0,
//         minStockLevel ?? 0,
//         articleNo || null,
//         sizeColor || null,
//         imageUrl || null,
//         isActive ?? true,
//         created_by,
//       ]
//     );

//     await client.query("COMMIT");

//     res.status(201).json({
//       success: true,
//       message: "Item created successfully",
//       data: result.rows[0],
//     });

//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Create Item Error:", error);
//     res.status(500).json({ message: "Server error" });
//   } finally {
//     client.release();
//   }
// };

// ─── Update Item ──────────────────────────────────────────────────────────────


const formatCode = (prefix, num) =>
  `${prefix}-${String(num).padStart(4, "0")}`;


export const generateItemCode = async (company_id, client) => {
  // 1. Ensure the sequence row exists (start at 300 → first generated = 301)
  await client.query(
    `INSERT INTO document_sequences (company_id, doc_type, prefix, start_no, current_value)
     VALUES ($1, 'ITEM_CODE', 'ITM', 301, 300)
     ON CONFLICT (company_id, doc_type) DO NOTHING`,
    [company_id]
  );

  // 2. Lock the sequence row for this transaction
  const { rows } = await client.query(
    `SELECT prefix, current_value
     FROM document_sequences
     WHERE company_id = $1 AND doc_type = 'ITEM_CODE'
     FOR UPDATE`,
    [company_id]
  );

  if (!rows.length) {
    throw new Error("ITEM_CODE sequence not found after upsert — this should never happen.");
  }

  const prefix = rows[0].prefix;
  let next = Number(rows[0].current_value) + 1;

  // 3 & 4. Skip any codes that already exist (manual inserts, imports, etc.)
  // Cap the loop to avoid an infinite loop on a pathologically full table.
  const MAX_ATTEMPTS = 1000;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    const candidate = formatCode(prefix, next);

    const { rows: conflict } = await client.query(
      `SELECT 1 FROM items WHERE code = $1 AND company_id = $2 LIMIT 1`,
      [candidate, company_id]
    );

    if (!conflict.length) break; // free slot found

    next++;
    attempts++;
  }

  if (attempts === MAX_ATTEMPTS) {
    throw new Error(
      `Unable to find a free ITEM_CODE after ${MAX_ATTEMPTS} attempts for company ${company_id}.`
    );
  }

  // 5. Persist the new current_value
  await client.query(
    `UPDATE document_sequences
     SET current_value = $1
     WHERE company_id = $2 AND doc_type = 'ITEM_CODE'`,
    [next, company_id]
  );

  return formatCode(prefix, next);
};

// ─────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────

export const createItem = async (req, res) => {
  const client = await connectDB.connect();

  try {
    await client.query("BEGIN");

    // ── Destructure & validate ──────────────────
    const {
      name,
      code,
      barcode,
      categoryId,
      categoryName,
      brand,
      hsnCode,
      taxRate,
      unitId,
      purchaseRate,
      saleRate,
      unitName,
      mrp,
      minStockLevel,
      articleNo,
      sizeColor,
      imageUrl,
      isActive,
      warehouseId,
    } = req.body;

    const company_id = req.user.company_id;
    const created_by = req.user.id;

    if (!name?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Item name is required",
      });
    }

    const cleanName = name.trim();
    const manualCode = code?.trim() || null;

    // ── Manual code: duplicate check ───────────
    if (manualCode) {
      const { rows: existing } = await client.query(
        `SELECT 1 FROM items WHERE code = $1 AND company_id = $2 LIMIT 1`,
        [manualCode, company_id]
      );

      if (existing.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Item code "${manualCode}" already exists`,
        });
      }
    }

    // ── Resolve final item code ─────────────────
    let finalCode;

    if (manualCode) {
      finalCode = manualCode;

      // Keep the sequence in sync so the next auto-generated code
      // doesn't collide with a manually entered one.
      const match = finalCode.match(/^([A-Za-z]+)-?(\d+)$/);
      if (match) {
        const manualPrefix = match[1].toUpperCase();
        const manualNum = parseInt(match[2], 10);

        await client.query(
          `UPDATE document_sequences
           SET current_value = GREATEST(current_value, $1)
           WHERE company_id = $2
             AND doc_type   = 'ITEM_CODE'
             AND UPPER(prefix) = $3`,
          [manualNum, company_id, manualPrefix]
        );
      }
    } else {
      // Auto-generate; collision-safe (skips 301 if it exists, uses 302, etc.)
      finalCode = await generateItemCode(company_id, client);
    }

    // ── Barcode handling ────────────────────────

    // Ensure barcode_settings row exists
    await client.query(
      `INSERT INTO barcode_settings (company_id)
       VALUES ($1)
       ON CONFLICT (company_id) DO NOTHING`,
      [company_id]
    );

    // Lock the barcode_settings row
    const { rows: barcodeRows } = await client.query(
      `SELECT * FROM barcode_settings
       WHERE company_id = $1
       FOR UPDATE`,
      [company_id]
    );

    const config = barcodeRows[0];
    let finalBarcode = barcode?.trim() || null;

    // Duplicate barcode check (manual)
    if (finalBarcode) {
      const { rows: dupBarcode } = await client.query(
        `SELECT 1 FROM items WHERE barcode = $1 AND company_id = $2 LIMIT 1`,
        [finalBarcode, company_id]
      );

      if (dupBarcode.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Barcode "${finalBarcode}" already exists`,
        });
      }
    }

    // Auto-generate barcode when not provided
    if (!finalBarcode) {
      const nextNumber = (config.last_used_number || 0) + 1;
      const padLength = config.length || 6;
      const padded = String(nextNumber).padStart(padLength, "0");
      finalBarcode = `${config.prefix || ""}${padded}`;

      await client.query(
        `UPDATE barcode_settings
         SET last_used_number = $1,
             updated_at       = NOW()
         WHERE company_id = $2`,
        [nextNumber, company_id]
      );
    }

    // ── Insert item ─────────────────────────────
    const { rows: inserted } = await client.query(
      `INSERT INTO items (
        company_id, name, code, barcode,
        category_id, category, brand, hsn_code,
        gst_rate, primary_unit_id,
        purchase_rate, sale_rate, unit_name,
        mrp, min_stock_level,
        article_no, size_color, image_url,warehouseid,
        is_active, created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )
      RETURNING *`,
      [
        company_id,
        cleanName,
        finalCode,
        finalBarcode,
        categoryId ?? null,
        categoryName ?? null,
        brand ?? null,
        hsnCode ?? null,
        taxRate ?? 18,
        unitId ?? null,
        purchaseRate ?? 0,
        saleRate ?? 0,
        unitName ?? null,
        mrp ?? 0,
        minStockLevel ?? 0,
        articleNo ?? null,
        sizeColor ?? null,
        imageUrl ?? null,
        warehouseId ?? null,
        isActive ?? true,
        created_by,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: inserted[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("createItem error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
    });
  } finally {
    client.release();
  }
};

export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      code,
      barcode,
      categoryId,
      categoryName,
      brand,
      hsnCode,
      taxRate,
      unitId,
      purchaseRate,
      saleRate,
      unitName,
      mrp,
      minStockLevel,
      articleNo,
      sizeColor,
      imageUrl,
      isActive,
      warehouseId,
    } = req.body;

    const company_id = req.user.company_id;
    console.log("WHEREHOUSEID:=>", req.body.warehouseId, req.body)
    // 🔍 Check if item exists
    const existing = await connectDB.query(
      `SELECT * FROM items WHERE id = $1 AND company_id = $2`,
      [id, company_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // 🔍 Duplicate code check + sequence sync
    if (code?.trim()) {
      const duplicate = await connectDB.query(
        `SELECT 1 FROM items 
         WHERE code = $1 AND company_id = $2 AND id != $3`,
        [code.trim(), company_id, id]
      );

      if (duplicate.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Item code already exists",
        });
      }

      // ✅ Sync sequence if manual code is ahead
      const match = code.trim().match(/^([A-Za-z]+)-?(\d+)$/);
      if (match) {
        const manualPrefix = match[1].toUpperCase();
        const manualNum = parseInt(match[2]);

        await connectDB.query(
          `UPDATE document_sequences
           SET current_value = GREATEST(current_value, $1)
           WHERE company_id = $2
             AND doc_type = 'ITEM_CODE'
             AND UPPER(prefix) = $3`,
          [manualNum, company_id, manualPrefix]
        );
      }
    }

    // 🔍 Duplicate barcode check
    if (barcode?.trim()) {
      const duplicate = await connectDB.query(
        `SELECT 1 FROM items
         WHERE barcode = $1 AND company_id = $2 AND id != $3`,
        [barcode.trim(), company_id, id]
      );

      if (duplicate.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Barcode already exists",
        });
      }
    }

    // ✅ Update item
    const result = await connectDB.query(
      `UPDATE items SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        barcode = COALESCE($3, barcode),
        category_id = COALESCE($4, category_id),
        category = COALESCE($5, category),
        brand = COALESCE($6, brand),
        hsn_code = COALESCE($7, hsn_code),
        gst_rate = COALESCE($8, gst_rate),
        primary_unit_id = COALESCE($9, primary_unit_id),
        purchase_rate = COALESCE($10, purchase_rate),
        sale_rate = COALESCE($11, sale_rate),
        unit_name = COALESCE($12, unit_name),
        mrp = COALESCE($13, mrp),
        min_stock_level = COALESCE($14, min_stock_level),
        article_no = COALESCE($15, article_no),
        size_color = COALESCE($16, size_color),
        image_url = COALESCE($17, image_url),
        warehouseid=COALESCE($18, warehouseid),
        is_active = COALESCE($19, is_active)
      WHERE id = $20 AND company_id = $21
      RETURNING *`,
      [
        name ? name.trim() : null,
        code?.trim() || null,
        barcode ? barcode.trim() : null,
        categoryId || null,
        categoryName || null,
        brand || null,
        hsnCode || null,
        taxRate ?? null,
        unitId || null,
        purchaseRate ?? null,
        saleRate ?? null,
        unitName || null,
        mrp ?? null,
        minStockLevel ?? null,
        articleNo || null,
        sizeColor || null,
        imageUrl || null,
        warehouseId || null,
        isActive ?? null,
        id,
        company_id,
      ]
    );

    res.json({
      success: true,
      message: "Item updated successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Update Item Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Delete Item ──────────────────────────────────────────────────────────────

export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    // ── Check item exists ────────────────────────────────────────────────────
    const existing = await connectDB.query(
      `SELECT id FROM items WHERE id = $1 AND company_id = $2`,
      [id, company_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // ── Delete ───────────────────────────────────────────────────────────────
    await connectDB.query(
      `DELETE FROM items WHERE id = $1 AND company_id = $2`,
      [id, company_id]
    );

    return res.json({
      success: true,
      message: "Item deleted successfully",
    });

  } catch (error) {
    console.error("Delete Item Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// ─── Get All Items ────────────────────────────────────────────────────────────

export const getAllItems = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const result = await connectDB.query(
      `SELECT
         i.*,
         COALESCE(ws.stock, 0) AS stock
       FROM items i
       LEFT JOIN (
         SELECT item_id, SUM(quantity)::int AS stock
         FROM warehouse_stock
         GROUP BY item_id
       ) ws ON ws.item_id = i.id
       WHERE i.company_id = $1
       AND i.is_active = true
       ORDER BY created_at DESC`,
      [company_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("Get All Items Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const result = await connectDB.query(
      `SELECT * FROM items
       WHERE id = $1 AND company_id = $2 AND is_active = true
       LIMIT 1`,
      [id, company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get Item By ID Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Filter Items ─────────────────────────────────────────────────────────────

// export const filterItems = async (req, res) => {
//   try {
//     const company_id = req.user.company_id;

//     const { categoryId, categoryName, search, warehouseId, stockStatus, isActive } = req.query;

//     const isUuid = (value) =>
//       typeof value === "string" &&
//       /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

//     const values = [company_id];
//     let index = 2;

//     const stockJoin = warehouseId && warehouseId.toUpperCase() !== "ALL" && isUuid(warehouseId)
//       ? `LEFT JOIN (
//           SELECT item_id, SUM(quantity)::int AS stock
//           FROM warehouse_stock
//           WHERE warehouse_id = $${index}
//           GROUP BY item_id
//         ) ws ON ws.item_id = i.id`
//       : `LEFT JOIN (
//           SELECT item_id, SUM(quantity)::int AS stock
//           FROM warehouse_stock
//           GROUP BY item_id
//         ) ws ON ws.item_id = i.id`;
// console.log('stockJoin==>' ,stockJoin)

//     if (warehouseId && warehouseId.toUpperCase() !== "ALL" && isUuid(warehouseId)) {
//       values.push(warehouseId);
//       index++;
//     }

//     let query = `SELECT
//         i.*,
//         COALESCE(ws.stock, 0) AS stock
//       FROM items i
//       ${stockJoin}`;

//     query += ` WHERE i.company_id = $1`;

//     if (categoryId && categoryId.toUpperCase() !== "ALL") {
//       query += ` AND i.category_id = $${index}`;
//       values.push(categoryId);
//       index++;
//     }

//     if (categoryName && categoryName.toUpperCase() !== "ALL") {
//       query += ` AND LOWER(i.category) = LOWER($${index})`;
//       values.push(categoryName);
//       index++;
//     }

//     if (search) {
//       query += ` AND (
//         LOWER(i.name) LIKE LOWER($${index}) OR
//         i.code ILIKE $${index} OR
//         i.barcode ILIKE $${index}
//       )`;
//       values.push(`%${search}%`);
//       index++;
//     }

//     if (stockStatus && stockStatus.toUpperCase() !== "ALL") {
//       const normalized = String(stockStatus).toUpperCase();
//       if (normalized === "IN_STOCK") {
//         query += ` AND COALESCE(ws.stock, 0) > 0 AND COALESCE(ws.stock, 0) >= COALESCE(i.min_stock_level, 0)`;
//       } else if (normalized === "LOW_STOCK") {
//         query += ` AND COALESCE(ws.stock, 0) > 0 AND COALESCE(ws.stock, 0) < COALESCE(i.min_stock_level, 0)`;
//       } else if (normalized === "OUT_OF_STOCK") {
//         query += ` AND COALESCE(ws.stock, 0) = 0`;
//       }
//     }

//     if (typeof isActive === 'string' && isActive.toUpperCase() !== 'ALL') {
//       query += ` AND i.is_active = $${index}`;
//       values.push(isActive === 'true' || isActive === 'TRUE');
//       index++;
//     }

//     query += ` ORDER BY i.created_at DESC`;

//     const result = await connectDB.query(query, values);

//     res.json({
//       success: true,
//       count: result.rows.length,
//       data: result.rows,
//     });

//   } catch (error) {
//     console.error("Filter Items Error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };



const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (v) => typeof v === "string" && UUID_RE.test(v);


export const filterItems = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      categoryId,
      categoryName,
      search,
      warehouseId,
      stockStatus,
      isActive,
    } = req.query;

    // ── Warehouse validation ───────────────────────────────────────────────
    // Validate BEFORE building SQL so param positions are stable.
    const scopedWarehouse =
      warehouseId &&
      warehouseId.toUpperCase() !== "ALL" &&
      isUuid(warehouseId)
        ? warehouseId
        : null;

    // ── Param array ───────────────────────────────────────────────────────
    // $1 = company_id  (always)
    // $2 = warehouseId (pushed immediately when scoped, so JOIN subquery $2 is safe)
    // $3+ = remaining filters in declaration order
    const values = [company_id];
    let idx = 2;

    if (scopedWarehouse) {
      values.push(scopedWarehouse); // $2
      idx = 3;
    }

    // ── Stock JOIN ────────────────────────────────────────────────────────
    // When scopedWarehouse is set $2 is already in values — no timing bug.
    // FIX: items.warehouseid is a direct column; we no longer need an EXISTS
    //      subquery. The LEFT JOIN still computes the correct per-warehouse stock.
    const stockJoin = scopedWarehouse
      ? `LEFT JOIN (
           SELECT item_id, SUM(quantity)::int AS stock
           FROM   warehouse_stock
           WHERE  warehouse_id = $2
           GROUP  BY item_id
         ) ws ON ws.item_id = i.id`
      : `LEFT JOIN (
           SELECT item_id, SUM(quantity)::int AS stock
           FROM   warehouse_stock
           GROUP  BY item_id
         ) ws ON ws.item_id = i.id`;

    // ── Base query ────────────────────────────────────────────────────────
    // FIX: column names corrected to match actual schema:
    //   category_name → category
    //   tax_rate      → gst_rate
    //   unit_id       → primary_unit_id
    //   hsn           → hsn_code
    // No is_deleted column exists — removed.
  let query = `
SELECT
  i.id,
  i.company_id,
  i.name,
  i.code,
  i.barcode,
  i.category_id,
  i.category,
  i.brand,
  i.hsn_code,
  i.gst_rate,
  i.primary_unit_id,
  i.unit_name,
  i.purchase_rate,
  i.sale_rate,
  i.mrp,
  i.min_stock_level,
  i.article_no,
  i.size_color,
  i.image_url,
  i.is_active,
  i.created_at,
  i.created_by,
  i.warehouseid,
  COALESCE(ws.stock,0) AS stock
FROM items i
${stockJoin}
WHERE i.company_id = $1
`;

if (scopedWarehouse) {
  query += `
    AND EXISTS (
      SELECT 1
      FROM warehouse_stock w
      WHERE w.item_id = i.id
      AND w.warehouse_id = $2
    )
  `;
}

    // ── Category by UUID ──────────────────────────────────────────────────
    if (categoryId && categoryId.toUpperCase() !== "ALL" && isUuid(categoryId)) {
      query += ` AND i.category_id = $${idx}`;
      values.push(categoryId);
      idx++;
    }

    // ── Category by name ─────────────────────────────────────────────────
    // FIX: column is "category" not "category_name"
    if (categoryName && categoryName.toUpperCase() !== "ALL") {
      query += ` AND LOWER(i.category) = LOWER($${idx})`;
      values.push(categoryName.trim());
      idx++;
    }

    // ── Full-text search ──────────────────────────────────────────────────
    // PostgreSQL allows the same $N multiple times in one statement.
    // Push the value once, reference $N in all three OR branches.
    if (search && search.trim()) {
      query += ` AND (
        i.name    ILIKE $${idx} OR
        i.code    ILIKE $${idx} OR
        i.barcode ILIKE $${idx}
      )`;
      values.push(`%${search.trim()}%`);
      idx++;
    }

    // ── Stock status ──────────────────────────────────────────────────────
    if (stockStatus && stockStatus.toUpperCase() !== "ALL") {
      const s = stockStatus.toUpperCase();
      if (s === "IN_STOCK") {
        query += ` AND COALESCE(ws.stock, 0) > 0
                   AND COALESCE(ws.stock, 0) >= COALESCE(i.min_stock_level, 0)`;
      } else if (s === "LOW_STOCK") {
        query += ` AND COALESCE(ws.stock, 0) > 0
                   AND COALESCE(ws.stock, 0) <  COALESCE(i.min_stock_level, 0)`;
      } else if (s === "OUT_OF_STOCK") {
        query += ` AND COALESCE(ws.stock, 0) = 0`;
      }
      // unknown value → safely ignored
    }

    // ── Active flag ───────────────────────────────────────────────────────
    // FIX: original compared isActive === 'TRUE' (uppercase) which never
    // matched browser query strings. Normalize with toLowerCase().
    if (typeof isActive === "string" && isActive.toUpperCase() !== "ALL") {
      query += ` AND i.is_active = $${idx}`;
      values.push(isActive.toLowerCase() === "true");
      idx++;
    }

    // ── Order ─────────────────────────────────────────────────────────────
    query += ` ORDER BY i.created_at DESC`;

    // ── Execute ───────────────────────────────────────────────────────────
    const result = await connectDB.query(query, values);

    return res.json({
      success: true,
      count:   result.rows.length,
      data:    result.rows,
    });

  } catch (error) {
    console.error("filterItems error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};