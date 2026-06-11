import connectDB from '../../../pool.js'; // path sahi karna

// Helper function to generate BOM code (company-wise)
const generateBomCode = async (company_id) => {
  const result = await connectDB.query(
    `SELECT code FROM bom_master 
     WHERE code LIKE 'BOM-%' AND company_id = $1 
     ORDER BY code DESC LIMIT 1`,
    [company_id],
  );
  if (result.rows.length === 0) return 'BOM-001';
  const lastCode = result.rows[0].code;
  const match = lastCode.match(/BOM-(\d+)/);
  const lastNum = match ? parseInt(match[1]) : 0;
  const nextNum = (lastNum + 1).toString().padStart(3, '0');
  return `BOM-${nextNum}`;
};

// Helper function to calculate item totals
const calculateItemTotals = async (items) => {
  let totalCost = 0;
  const itemsWithPrice = [];

  for (const item of items) {
    const result = await connectDB.query(
      'SELECT purchase_rate FROM items WHERE id = $1',
      [item.itemId],
    );
    const unitPrice = result.rows[0]?.purchase_rate || 0;
    const scrapFactor = 1 + (item.scrapPercentage || 0) / 100;
    const totalPrice = unitPrice * item.quantity * scrapFactor;
    totalCost += totalPrice;

    itemsWithPrice.push({
      ...item,
      unitPrice,
      totalPrice,
    });
  }

  return { itemsWithPrice, totalCost };
};

// Helper function to calculate levels
const calculateLevels = async (items) => {
  let maxLevel = 1;
  for (const item of items) {
    const result = await connectDB.query(
      `SELECT levels FROM bom_master WHERE product_id = $1 AND status = 'ACTIVE'`,
      [item.itemId],
    );
    if (result.rows.length > 0) {
      maxLevel = Math.max(maxLevel, result.rows[0].levels + 1);
    }
  }
  return maxLevel;
};

// 📌 CREATE BOM (with warehouse and company)
export const createBom = async (req, res) => {
  const client = await connectDB;

  try {
    const {
      code,
      productId,
      version,
      effectiveFrom,
      effectiveTo,
      isVariantBom,
      variantName,
      warehouseId, // ✅ NEW: warehouse id
      items,
    } = req.body;

    const company_id = req.user.company_id; // ✅ from auth
    const created_by = req.user.id;

    // ✅ Validation
    if (
      !productId ||
      !version ||
      !effectiveFrom ||
      !warehouseId ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: productId, version, effectiveFrom, warehouseId, items',
      });
    }

    // ✅ Check if warehouse belongs to this company
    const warehouseCheck = await connectDB.query(
      `SELECT id FROM warehouses WHERE id = $1 AND company_id = $2`,
      [warehouseId, company_id],
    );

    if (warehouseCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse for this company',
      });
    }

    await client.query('BEGIN');

    const bomCode = code || (await generateBomCode(company_id));
    const { itemsWithPrice, totalCost } = await calculateItemTotals(items);
    const levels = await calculateLevels(items);
    const totalItems = items.length;

    const bomResult = await client.query(
      `INSERT INTO bom_master 
       (code, product_id, version, status, is_variant_bom, variant_name, 
        effective_from, effective_to, levels, total_items, total_material_cost,
        warehouse_id, company_id, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        bomCode,
        productId,
        version,
        'DRAFT',
        isVariantBom || false,
        variantName || null,
        effectiveFrom,
        effectiveTo || null,
        levels,
        totalItems,
        totalCost,
        warehouseId,
        company_id,
        created_by,
        created_by,
      ],
    );

    const bom = bomResult.rows[0];

    for (let i = 0; i < itemsWithPrice.length; i++) {
      const item = itemsWithPrice[i];
      await client.query(
        `INSERT INTO bom_items 
         (bom_id, item_id, quantity, scrap_percentage, unit_price, total_price, sequence_no)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          bom.id,
          item.itemId,
          item.quantity,
          item.scrapPercentage || 0,
          item.unitPrice,
          item.totalPrice,
          item.sequenceNo || i + 1,
        ],
      );
    }

    await client.query('COMMIT');

    const completeBom = await connectDB.query(
      `SELECT b.*, i.name as product_name, i.code as product_code,
              w.name as warehouse_name
       FROM bom_master b
       JOIN items i ON b.product_id = i.id
       LEFT JOIN warehouses w ON b.warehouse_id = w.id
       WHERE b.id = $1 AND b.company_id = $2`,
      [bom.id, company_id],
    );

    const itemsResult = await connectDB.query(
      `SELECT bi.*, i.name as item_name, i.code as item_code
       FROM bom_items bi
       JOIN items i ON bi.item_id = i.id
       WHERE bi.bom_id = $1
       ORDER BY bi.sequence_no`,
      [bom.id],
    );

    res.status(201).json({
      success: true,
      data: { ...completeBom.rows[0], items: itemsResult.rows },
      message: 'BOM created successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 GET ALL BOMS (company + warehouse + filters)
export const getAllBoms = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const {
      status,
      type,
      search,
      warehouseId,
      page = '1',
      limit = '20',
    } = req.query;

    let query = `
      SELECT b.*, 
             i.name as product_name,
             i.code as product_code,
             w.name as warehouse_name,
             COALESCE((SELECT COUNT(*) FROM bom_items WHERE bom_id = b.id), 0) as actual_items
      FROM bom_master b
      JOIN items i ON b.product_id = i.id
      LEFT JOIN warehouses w ON b.warehouse_id = w.id
      WHERE b.company_id = $1
    `;
    const params = [company_id];
    let paramIndex = 2;

    if (warehouseId) {
      query += ` AND b.warehouse_id = $${paramIndex++}`;
      params.push(warehouseId);
    }

    if (status && status !== 'ALL') {
      query += ` AND b.status = $${paramIndex++}`;
      params.push(status);
    }

    if (type === 'REGULAR') {
      query += ` AND b.is_variant_bom = false`;
    } else if (type === 'VARIANT') {
      query += ` AND b.is_variant_bom = true`;
    }

    if (search) {
      query += ` AND (b.code ILIKE $${paramIndex++} OR i.name ILIKE $${paramIndex++} OR i.code ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY b.created_at DESC`;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await connectDB.query(query, params);

    // Count query for pagination
    let countQuery = `SELECT COUNT(*) FROM bom_master b WHERE b.company_id = $1`;
    const countParams = [company_id];
    let countIndex = 2;

    if (warehouseId) {
      countQuery += ` AND b.warehouse_id = $${countIndex++}`;
      countParams.push(warehouseId);
    }
    if (status && status !== 'ALL') {
      countQuery += ` AND b.status = $${countIndex++}`;
      countParams.push(status);
    }

    const countResult = await connectDB.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 GET SINGLE BOM (with company check)
export const getBomById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const bomResult = await connectDB.query(
      `SELECT b.*, i.name as product_name, i.code as product_code,
              w.name as warehouse_name
       FROM bom_master b
       JOIN items i ON b.product_id = i.id
       LEFT JOIN warehouses w ON b.warehouse_id = w.id
       WHERE b.id = $1 AND b.company_id = $2`,
      [id, company_id],
    );

    if (bomResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    const itemsResult = await connectDB.query(
      `SELECT bi.*, i.name as item_name, i.code as item_code
       FROM bom_items bi
       JOIN items i ON bi.item_id = i.id
       WHERE bi.bom_id = $1
       ORDER BY bi.sequence_no`,
      [id],
    );

    res.json({
      success: true,
      data: { ...bomResult.rows[0], items: itemsResult.rows },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 UPDATE BOM
export const updateBom = async (req, res) => {
  const client = await connectDB;

  try {
    const { id } = req.params;
    const company_id = req.user.company_id;
    const {
      version,
      status,
      effectiveFrom,
      effectiveTo,
      variantName,
      warehouseId,
      items,
    } = req.body;

    // Check if BOM exists and belongs to company
    const existingBom = await connectDB.query(
      `SELECT id FROM bom_master WHERE id = $1 AND company_id = $2`,
      [id, company_id],
    );

    if (existingBom.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    await client.query('BEGIN');

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (version) {
      updateFields.push(`version = $${paramIndex++}`);
      values.push(version);
    }
    if (status) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (effectiveFrom) {
      updateFields.push(`effective_from = $${paramIndex++}`);
      values.push(effectiveFrom);
    }
    if (effectiveTo) {
      updateFields.push(`effective_to = $${paramIndex++}`);
      values.push(effectiveTo);
    }
    if (variantName !== undefined) {
      updateFields.push(`variant_name = $${paramIndex++}`);
      values.push(variantName);
    }
    if (warehouseId) {
      updateFields.push(`warehouse_id = $${paramIndex++}`);
      values.push(warehouseId);
    }

    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length > 0) {
      values.push(id);
      await client.query(
        `UPDATE bom_master SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        values,
      );
    }

    if (items && items.length > 0) {
      await client.query('DELETE FROM bom_items WHERE bom_id = $1', [id]);

      const { itemsWithPrice, totalCost } = await calculateItemTotals(items);
      const levels = await calculateLevels(items);

      for (let i = 0; i < itemsWithPrice.length; i++) {
        const item = itemsWithPrice[i];
        await client.query(
          `INSERT INTO bom_items 
           (bom_id, item_id, quantity, scrap_percentage, unit_price, total_price, sequence_no)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id,
            item.itemId,
            item.quantity,
            item.scrapPercentage || 0,
            item.unitPrice,
            item.totalPrice,
            item.sequenceNo || i + 1,
          ],
        );
      }

      await client.query(
        `UPDATE bom_master SET total_items = $1, total_material_cost = $2, levels = $3 WHERE id = $4`,
        [items.length, totalCost, levels, id],
      );
    }

    await client.query('COMMIT');

    const updatedBom = await connectDB.query(
      `SELECT b.*, i.name as product_name, i.code as product_code,
              w.name as warehouse_name
       FROM bom_master b
       JOIN items i ON b.product_id = i.id
       LEFT JOIN warehouses w ON b.warehouse_id = w.id
       WHERE b.id = $1 AND b.company_id = $2`,
      [id, company_id],
    );

    const updatedItems = await connectDB.query(
      `SELECT bi.*, i.name as item_name, i.code as item_code
       FROM bom_items bi
       JOIN items i ON bi.item_id = i.id
       WHERE bi.bom_id = $1`,
      [id],
    );

    res.json({
      success: true,
      data: { ...updatedBom.rows[0], items: updatedItems.rows },
      message: 'BOM updated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 DELETE BOM
export const deleteBom = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const result = await connectDB.query(
      'DELETE FROM bom_master WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, company_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    res.json({ success: true, message: 'BOM deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 DUPLICATE BOM
export const duplicateBom = async (req, res) => {
  const client = await connectDB;

  try {
    const { id } = req.params;
    const company_id = req.user.company_id;
    const user_id = req.user.id;

    const existingBom = await connectDB.query(
      `SELECT b.*, i.name as product_name, i.code as product_code 
       FROM bom_master b
       JOIN items i ON b.product_id = i.id
       WHERE b.id = $1 AND b.company_id = $2`,
      [id, company_id],
    );

    if (existingBom.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    const existingItems = await connectDB.query(
      `SELECT item_id, quantity, scrap_percentage, sequence_no 
       FROM bom_items WHERE bom_id = $1`,
      [id],
    );

    const bom = existingBom.rows[0];

    const [major, minor] = bom.version.split('.').map(Number);
    const newVersion = `${major}.${(minor || 0) + 1}`;

    let newCode = `${bom.code}-COPY`;
    let counter = 1;
    while (true) {
      const check = await connectDB.query(
        'SELECT id FROM bom_master WHERE code = $1 AND company_id = $2',
        [newCode, company_id],
      );
      if (check.rows.length === 0) break;
      newCode = `${bom.code}-COPY-${counter}`;
      counter++;
    }

    await client.query('BEGIN');

    const newBomResult = await client.query(
      `INSERT INTO bom_master 
       (code, product_id, version, status, is_variant_bom, variant_name, 
        effective_from, levels, total_items, total_material_cost,
        warehouse_id, company_id, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        newCode,
        bom.product_id,
        newVersion,
        'DRAFT',
        bom.is_variant_bom,
        bom.variant_name,
        new Date().toISOString().split('T')[0],
        bom.levels,
        bom.total_items,
        bom.total_material_cost,
        bom.warehouse_id,
        company_id,
        user_id,
        user_id,
      ],
    );

    const newBom = newBomResult.rows[0];

    for (const item of existingItems.rows) {
      await client.query(
        `INSERT INTO bom_items (bom_id, item_id, quantity, scrap_percentage, sequence_no)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          newBom.id,
          item.item_id,
          item.quantity,
          item.scrap_percentage,
          item.sequence_no,
        ],
      );
    }

    await client.query('COMMIT');

    const completeBom = await connectDB.query(
      `SELECT b.*, i.name as product_name, i.code as product_code,
              w.name as warehouse_name
       FROM bom_master b
       JOIN items i ON b.product_id = i.id
       LEFT JOIN warehouses w ON b.warehouse_id = w.id
       WHERE b.id = $1 AND b.company_id = $2`,
      [newBom.id, company_id],
    );

    const newItems = await connectDB.query(
      `SELECT bi.*, i.name as item_name, i.code as item_code
       FROM bom_items bi
       JOIN items i ON bi.item_id = i.id
       WHERE bi.bom_id = $1`,
      [newBom.id],
    );

    res.status(201).json({
      success: true,
      data: { ...completeBom.rows[0], items: newItems.rows },
      message: 'BOM duplicated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
