import connectDB from '../../../pool.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate BOM code (company-wise)
const generateBomCode = async (company_id) => {
  const result = await connectDB.query(
    `SELECT code FROM bom_master 
     WHERE company_id = $1 
     ORDER BY CAST(SUBSTRING(code FROM '-([0-9]+)$') AS INTEGER) DESC NULLS LAST
     LIMIT 1`,
    [company_id],
  );

  if (result.rows.length === 0) return 'BOM-001';

  const lastCode = result.rows[0].code;
  const match = lastCode.match(/BOM-(\d+)/);
  const lastNum = match ? parseInt(match[1]) : 0;
  const nextNum = (lastNum + 1).toString().padStart(3, '0');
  return `BOM-${nextNum}`;
};

// Get item purchase rate
const getItemPurchaseRate = async (itemId) => {
  const result = await connectDB.query(
    'SELECT purchase_rate, item_type, unit_name FROM items WHERE id = $1',
    [itemId],
  );
  return {
    rate: parseFloat(result.rows[0]?.purchase_rate || 0),
    type: result.rows[0]?.item_type || 'RAW_MATERIAL',
    unit: result.rows[0]?.unit_name || 'Pcs',
  };
};

// Calculate item totals with scrap
const calculateItemTotals = async (items) => {
  if (!items || !Array.isArray(items)) {
    return { itemsWithPrice: [], totalCost: 0 };
  }

  let totalCost = 0;
  const itemsWithPrice = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const {
      rate: unitPrice,
      type: itemType,
      unit: unitName,
    } = await getItemPurchaseRate(item.itemId);
    const scrapFactor = 1 + (item.scrapPercentage || 0) / 100;
    const totalPrice = unitPrice * item.quantity * scrapFactor;
    totalCost += totalPrice;

    itemsWithPrice.push({
      ...item,
      unitPrice,
      totalPrice,
      itemType,
      unitName,
    });
  }

  return { itemsWithPrice, totalCost };
};

// Calculate BOM levels (avoid infinite recursion)
const calculateLevels = async (items, visited = new Set()) => {
  let maxLevel = 1;

  for (const item of items) {
    if (visited.has(item.itemId)) continue;
    visited.add(item.itemId);

    const result = await connectDB.query(
      `SELECT levels FROM bom_master 
       WHERE product_id = $1 AND status = 'ACTIVE' 
       LIMIT 1`,
      [item.itemId],
    );

    if (result.rows.length > 0) {
      maxLevel = Math.max(maxLevel, result.rows[0].levels + 1);
    }
  }

  return maxLevel;
};

// ============================================
// 📌 CREATE BOM
// ============================================
export const createBom = async (req, res) => {
  try {
    const {
      code,
      productId,
      version,
      effectiveFrom,
      effectiveTo,
      isVariantBom,
      variantName,
      warehouseId,
      linkToItemMaster, // ✅ NEW
      items,
    } = req.body;

    const company_id = req.user.company_id;
    const created_by = req.user.id;

    // Validation
    if (!productId || !version || !effectiveFrom || !warehouseId) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: productId, version, effectiveFrom, warehouseId',
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one component is required',
      });
    }

    // Check if warehouse belongs to this company
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

    // Check if product exists
    const productCheck = await connectDB.query(
      `SELECT id, name, code, item_type FROM items WHERE id = $1 AND company_id = $2`,
      [productId, company_id],
    );

    if (productCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product not found',
      });
    }

    const bomCode = code || (await generateBomCode(company_id));
    const { itemsWithPrice, totalCost } = await calculateItemTotals(items);
    const levels = await calculateLevels(items);
    const totalItems = items.length;

    const bomResult = await connectDB.query(
      `INSERT INTO bom_master 
       (code, product_id, version, status, is_variant_bom, variant_name, 
        effective_from, effective_to, levels, total_items, total_material_cost,
        warehouse_id, company_id, created_by, updated_by, link_to_item_master)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
        linkToItemMaster || false, // ✅ NEW
      ],
    );

    const bom = bomResult.rows[0];

    // Insert items
    for (let i = 0; i < itemsWithPrice.length; i++) {
      const item = itemsWithPrice[i];
      await connectDB.query(
        `INSERT INTO bom_items 
         (bom_id, item_id, quantity, scrap_percentage, unit_price, total_price, sequence_no, item_type, unit_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          bom.id,
          item.itemId,
          item.quantity,
          item.scrapPercentage || 0,
          item.unitPrice,
          item.totalPrice,
          item.sequenceNo || i + 1,
          item.itemType,
          item.unitName,
        ],
      );
    }

    // If link_to_item_master is true, update item's standard cost
    if (linkToItemMaster) {
      await connectDB.query(
        `UPDATE items SET standard_cost = $1 WHERE id = $2 AND company_id = $3`,
        [totalCost, productId, company_id],
      );
    }

    // Get complete BOM with details
    const completeBom = await connectDB.query(
      `SELECT b.*, i.name as product_name, i.code as product_code, i.item_type as product_type,
              w.name as warehouse_name
       FROM bom_master b
       JOIN items i ON b.product_id = i.id
       LEFT JOIN warehouses w ON b.warehouse_id = w.id
       WHERE b.id = $1 AND b.company_id = $2`,
      [bom.id, company_id],
    );

    const itemsResult = await connectDB.query(
      `SELECT bi.*, i.name as item_name, i.code as item_code, i.item_type
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
    console.error('createBom error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 📌 GET ALL BOMS
// ============================================
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
        totalPages: Math.ceil(
          parseInt(countResult.rows[0].count) / parseInt(limit),
        ),
      },
    });
  } catch (error) {
    console.error('getAllBoms error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 📌 GET SINGLE BOM
// ============================================
export const getBomById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const bomResult = await connectDB.query(
      `SELECT b.*, i.name as product_name, i.code as product_code,
              i.item_type as product_type, w.name as warehouse_name
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
      `SELECT bi.*, i.name as item_name, i.code as item_code, i.item_type
       FROM bom_items bi
       JOIN items i ON bi.item_id = i.id
       WHERE bi.bom_id = $1
       ORDER BY bi.sequence_no`,
      [id],
    );

    // Calculate summary
    let rawTotal = 0,
      semiTotal = 0,
      consumableTotal = 0,
      packagingTotal = 0,
      scrapTotal = 0;

    for (const item of itemsResult.rows) {
      const baseCost = item.quantity * parseFloat(item.unit_price);
      const scrapAmount = baseCost * (item.scrap_percentage / 100);

      scrapTotal += scrapAmount;

      if (item.item_type === 'RAW_MATERIAL') rawTotal += baseCost + scrapAmount;
      else if (item.item_type === 'SEMI_FINISHED')
        semiTotal += baseCost + scrapAmount;
      else if (item.item_type === 'CONSUMABLE')
        consumableTotal += baseCost + scrapAmount;
      else if (item.item_type === 'PACKAGING')
        packagingTotal += baseCost + scrapAmount;
    }

    const total = rawTotal + semiTotal + consumableTotal + packagingTotal;

    res.json({
      success: true,
      data: {
        ...bomResult.rows[0],
        items: itemsResult.rows,
        summary: {
          raw: rawTotal,
          semi: semiTotal,
          consumable: consumableTotal,
          packaging: packagingTotal,
          total: total,
          scrapCost: scrapTotal,
        },
      },
    });
  } catch (error) {
    console.error('getBomById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 📌 UPDATE BOM
// ============================================
export const updateBom = async (req, res) => {
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
      linkToItemMaster, // ✅ NEW
      items,
    } = req.body;

    // Check if BOM exists and belongs to company
    const existingBom = await connectDB.query(
      `SELECT id, product_id FROM bom_master WHERE id = $1 AND company_id = $2`,
      [id, company_id],
    );

    if (existingBom.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    const productId = existingBom.rows[0].product_id;

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (version !== undefined) {
      updateFields.push(`version = $${paramIndex++}`);
      values.push(version);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (effectiveFrom !== undefined) {
      updateFields.push(`effective_from = $${paramIndex++}`);
      values.push(effectiveFrom);
    }
    if (effectiveTo !== undefined) {
      updateFields.push(`effective_to = $${paramIndex++}`);
      values.push(effectiveTo);
    }
    if (variantName !== undefined) {
      updateFields.push(`variant_name = $${paramIndex++}`);
      values.push(variantName);
    }
    if (warehouseId !== undefined) {
      updateFields.push(`warehouse_id = $${paramIndex++}`);
      values.push(warehouseId);
    }
    if (linkToItemMaster !== undefined) {
      // ✅ NEW
      updateFields.push(`link_to_item_master = $${paramIndex++}`);
      values.push(linkToItemMaster);
    }

    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length > 1) {
      values.push(id);
      await connectDB.query(
        `UPDATE bom_master SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        values,
      );
    }

    // Update items if provided
    if (items && items.length > 0) {
      // Delete old items
      await connectDB.query('DELETE FROM bom_items WHERE bom_id = $1', [id]);

      const { itemsWithPrice, totalCost } = await calculateItemTotals(items);
      const levels = await calculateLevels(items);

      for (let i = 0; i < itemsWithPrice.length; i++) {
        const item = itemsWithPrice[i];
        await connectDB.query(
          `INSERT INTO bom_items 
           (bom_id, item_id, quantity, scrap_percentage, unit_price, total_price, sequence_no, item_type, unit_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id,
            item.itemId,
            item.quantity,
            item.scrapPercentage || 0,
            item.unitPrice,
            item.totalPrice,
            item.sequenceNo || i + 1,
            item.itemType,
            item.unitName,
          ],
        );
      }

      await connectDB.query(
        `UPDATE bom_master SET total_items = $1, total_material_cost = $2, levels = $3 WHERE id = $4`,
        [items.length, totalCost, levels, id],
      );

      // If link_to_item_master is true, update item's standard cost
      if (linkToItemMaster === true) {
        await connectDB.query(
          `UPDATE items SET standard_cost = $1 WHERE id = $2 AND company_id = $3`,
          [totalCost, productId, company_id],
        );
      }
    }

    // Get updated BOM
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
      `SELECT bi.*, i.name as item_name, i.code as item_code, i.item_type
       FROM bom_items bi
       JOIN items i ON bi.item_id = i.id
       WHERE bi.bom_id = $1
       ORDER BY bi.sequence_no`,
      [id],
    );

    res.json({
      success: true,
      data: { ...updatedBom.rows[0], items: updatedItems.rows },
      message: 'BOM updated successfully',
    });
  } catch (error) {
    console.error('updateBom error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 📌 DELETE BOM
// ============================================
export const deleteBom = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    // Check if BOM exists
    const checkResult = await connectDB.query(
      'SELECT id FROM bom_master WHERE id = $1 AND company_id = $2',
      [id, company_id],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    // Delete bom_items first
    await connectDB.query('DELETE FROM bom_items WHERE bom_id = $1', [id]);

    // Delete bom_master
    const result = await connectDB.query(
      'DELETE FROM bom_master WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, company_id],
    );

    res.json({ success: true, message: 'BOM deleted successfully' });
  } catch (error) {
    console.error('deleteBom error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 📌 DUPLICATE BOM
// ============================================
export const duplicateBom = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;
    const user_id = req.user.id;

    // Get existing BOM
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

    // Get existing items
    const existingItems = await connectDB.query(
      `SELECT item_id, quantity, scrap_percentage, unit_price, sequence_no, item_type, unit_name
       FROM bom_items WHERE bom_id = $1`,
      [id],
    );

    const bom = existingBom.rows[0];

    // Generate new version
    const versionParts = bom.version.split('.');
    const major = parseInt(versionParts[0]);
    const minor = parseInt(versionParts[1]) || 0;
    const newVersion = `${major}.${minor + 1}`;

    // Generate unique code
    let newCode = `${bom.code}-COPY`;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const check = await connectDB.query(
        'SELECT id FROM bom_master WHERE code = $1 AND company_id = $2',
        [newCode, company_id],
      );
      if (check.rows.length === 0) {
        isUnique = true;
      } else {
        newCode = `${bom.code}-COPY-${counter}`;
        counter++;
      }
    }

    // Insert duplicate BOM (link_to_item_master false by default)
    const newBomResult = await connectDB.query(
      `INSERT INTO bom_master 
       (code, product_id, version, status, is_variant_bom, variant_name, 
        effective_from, levels, total_items, total_material_cost,
        warehouse_id, company_id, created_by, updated_by, link_to_item_master)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
        false, // ✅ link_to_item_master = false for duplicate
      ],
    );

    const newBom = newBomResult.rows[0];

    // Copy items
    for (const item of existingItems.rows) {
      await connectDB.query(
        `INSERT INTO bom_items (bom_id, item_id, quantity, scrap_percentage, unit_price, sequence_no, item_type, unit_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          newBom.id,
          item.item_id,
          item.quantity,
          item.scrap_percentage,
          item.unit_price,
          item.sequence_no,
          item.item_type,
          item.unit_name,
        ],
      );
    }

    // Get complete duplicated BOM
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
      `SELECT bi.*, i.name as item_name, i.code as item_code, i.item_type
       FROM bom_items bi
       JOIN items i ON bi.item_id = i.id
       WHERE bi.bom_id = $1
       ORDER BY bi.sequence_no`,
      [newBom.id],
    );

    res.status(201).json({
      success: true,
      data: { ...completeBom.rows[0], items: newItems.rows },
      message: 'BOM duplicated successfully',
    });
  } catch (error) {
    console.error('duplicateBom error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 📌 LINK TO ITEM MASTER (NEW)
// ============================================
export const linkToItemMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    // Check if BOM exists
    const bomResult = await connectDB.query(
      `SELECT b.id, b.product_id, b.total_material_cost 
       FROM bom_master b
       WHERE b.id = $1 AND b.company_id = $2`,
      [id, company_id],
    );

    if (bomResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    const bom = bomResult.rows[0];

    // Update BOM's link status
    await connectDB.query(
      `UPDATE bom_master SET link_to_item_master = true, updated_at = NOW()
       WHERE id = $1 AND company_id = $2`,
      [id, company_id],
    );

    // Update product's standard cost
    await connectDB.query(
      `UPDATE items SET standard_cost = $1 
       WHERE id = $2 AND company_id = $3`,
      [bom.total_material_cost, bom.product_id, company_id],
    );

    res.json({
      success: true,
      message: 'BOM linked to item master successfully',
      data: {
        linkToItemMaster: true,
        standardCost: bom.total_material_cost,
      },
    });
  } catch (error) {
    console.error('linkToItemMaster error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
