import { connectDB } from "../../../pool.js";
import crypto from "crypto";

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

// ─── Helper: generate entry number ───────────────────────────────────────────
async function generateEntryNumber() {
  const year = new Date().getFullYear();
  const result = await connectDB.query(
    `SELECT COUNT(*) FROM public.production_entries WHERE EXTRACT(YEAR FROM created_at) = $1`,
    [year]
  );
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `PE-${year}-${String(seq).padStart(4, '0')}`;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createProductionEntry = async (req, res) => {
  try {
    const {
      production_order_id,
      production_order_number,
      work_order_id,
      work_order_number,
      stage_name,
      stage_number,
      work_center_id,
      work_center_name,
      machine_id,
      machine_name,
      operator_id,
      operator_name,
      shift_id,
      shift_name,
      date,
      produced_qty,
      rejected_qty,
      unit,
      start_time,
      end_time,
      actual_time_minutes,
      rejection_code_id,
      notes,
      status,
      entered_by,
      warehouse_id,
    } = req.body;

    // Validation
    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }
    if (produced_qty === undefined || produced_qty === null) {
      return res.status(400).json({ success: false, message: "Produced quantity is required" });
    }
    if (!start_time) {
      return res.status(400).json({ success: false, message: "Start time is required" });
    }
    if (!end_time) {
      return res.status(400).json({ success: false, message: "End time is required" });
    }

    const finalStatus = status ? status.toUpperCase() : 'PENDING';
    if (!VALID_STATUSES.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const entryNumber = await generateEntryNumber();
    const id = crypto.randomUUID();

    const result = await connectDB.query(
      `INSERT INTO public.production_entries (
        id, entry_number,
        production_order_id, production_order_number,
        work_order_id, work_order_number,
        stage_name, stage_number,
        work_center_id, work_center_name,
        machine_id, machine_name,
        operator_id, operator_name,
        shift_id, shift_name,
        date, produced_qty, rejected_qty, unit,
        start_time, end_time, actual_time_minutes,
        rejection_code_id, notes,
        status, entered_by, warehouse_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28
      ) RETURNING *`,
      [
        id, entryNumber,
        production_order_id || null, production_order_number || null,
        work_order_id || null, work_order_number || null,
        stage_name || null, stage_number || null,
        work_center_id || null, work_center_name || null,
        machine_id || null, machine_name || null,
        operator_id || null, operator_name || null,
        shift_id || null, shift_name || null,
        date, Number(produced_qty) || 0, Number(rejected_qty) || 0, unit || 'Pcs',
        start_time, end_time, Number(actual_time_minutes) || 0,
        rejection_code_id || null, notes || null,
        finalStatus, entered_by || null, warehouse_id || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Production entry created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("createProductionEntry error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getAllProductionEntries = async (req, res) => {
  try {
    const result = await connectDB.query(
      `SELECT * FROM public.production_entries ORDER BY created_at DESC`
    );
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("getAllProductionEntries error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getProductionEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await connectDB.query(
      `SELECT * FROM public.production_entries WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Production entry not found" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("getProductionEntryById error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await connectDB.query(
      `SELECT * FROM public.production_entries WHERE id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Production entry not found" });
    }

    const {
      production_order_id,
      production_order_number,
      work_order_id,
      work_order_number,
      stage_name,
      stage_number,
      work_center_id,
      work_center_name,
      machine_id,
      machine_name,
      operator_id,
      operator_name,
      shift_id,
      shift_name,
      date,
      produced_qty,
      rejected_qty,
      unit,
      start_time,
      end_time,
      actual_time_minutes,
      rejection_code_id,
      notes,
      status,
      supervisor_id,
      approved_at,
      entered_by,
      warehouse_id,
    } = req.body;

    if (status && !VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const result = await connectDB.query(
      `UPDATE public.production_entries SET
        production_order_id      = COALESCE($1,  production_order_id),
        production_order_number  = COALESCE($2,  production_order_number),
        work_order_id            = COALESCE($3,  work_order_id),
        work_order_number        = COALESCE($4,  work_order_number),
        stage_name               = COALESCE($5,  stage_name),
        stage_number             = COALESCE($6,  stage_number),
        work_center_id           = COALESCE($7,  work_center_id),
        work_center_name         = COALESCE($8,  work_center_name),
        machine_id               = COALESCE($9,  machine_id),
        machine_name             = COALESCE($10, machine_name),
        operator_id              = COALESCE($11, operator_id),
        operator_name            = COALESCE($12, operator_name),
        shift_id                 = COALESCE($13, shift_id),
        shift_name               = COALESCE($14, shift_name),
        date                     = COALESCE($15, date),
        produced_qty             = COALESCE($16, produced_qty),
        rejected_qty             = COALESCE($17, rejected_qty),
        unit                     = COALESCE($18, unit),
        start_time               = COALESCE($19, start_time),
        end_time                 = COALESCE($20, end_time),
        actual_time_minutes      = COALESCE($21, actual_time_minutes),
        rejection_code_id        = COALESCE($22, rejection_code_id),
        notes                    = COALESCE($23, notes),
        status                   = COALESCE($24, status),
        supervisor_id            = COALESCE($25, supervisor_id),
        approved_at              = COALESCE($26, approved_at),
        entered_by               = COALESCE($27, entered_by),
        warehouse_id             = COALESCE($28, warehouse_id),
        updated_at               = CURRENT_TIMESTAMP
      WHERE id = $29
      RETURNING *`,
      [
        production_order_id || null, production_order_number || null,
        work_order_id || null, work_order_number || null,
        stage_name || null, stage_number !== undefined ? Number(stage_number) : null,
        work_center_id || null, work_center_name || null,
        machine_id || null, machine_name || null,
        operator_id || null, operator_name || null,
        shift_id || null, shift_name || null,
        date || null,
        produced_qty !== undefined ? Number(produced_qty) : null,
        rejected_qty !== undefined ? Number(rejected_qty) : null,
        unit || null, start_time || null, end_time || null,
        actual_time_minutes !== undefined ? Number(actual_time_minutes) : null,
        rejection_code_id || null, notes !== undefined ? notes : null,
        status ? status.toUpperCase() : null,
        supervisor_id || null, approved_at || null,
        entered_by || null, warehouse_id || null,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Production entry updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("updateProductionEntry error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await connectDB.query(
      `DELETE FROM public.production_entries WHERE id = $1 RETURNING id, entry_number`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Production entry not found" });
    }
    res.json({ success: true, message: "Production entry deleted successfully" });
  } catch (error) {
    console.error("deleteProductionEntry error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── APPROVE ──────────────────────────────────────────────────────────────────
export const approveProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisor_id } = req.body;

    const existing = await connectDB.query(
      `SELECT id, status FROM public.production_entries WHERE id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Production entry not found" });
    }

    const result = await connectDB.query(
      `UPDATE public.production_entries
       SET status = 'APPROVED', supervisor_id = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [supervisor_id || null, id]
    );

    res.json({
      success: true,
      message: "Production entry approved",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("approveProductionEntry error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
