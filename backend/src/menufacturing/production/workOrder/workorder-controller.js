import { connectDB } from "../../../pool.js";
import crypto from "crypto";

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];

// ─── Helper: Generate WO Number ──────────────────────────────────────────────
async function generateWorkOrderNumber() {
  const year = new Date().getFullYear();
  const result = await connectDB.query(
    `SELECT COUNT(*) FROM public.work_orders WHERE EXTRACT(YEAR FROM created_at) = $1`,
    [year]
  );
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `WO-${year}-${String(seq).padStart(4, '0')}`;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createWorkOrder = async (req, res) => {
  try {
    const {
      production_order_id,
      production_order_number,
      stage_number,
      stage_name,
      work_center_id,
      work_center_name,
      machine_id,
      machine_name,
      operator_id,
      operator_name,
      shift_id,
      shift_name,
      planned_qty,
      completed_qty,
      rejected_qty,
      status,
      planned_start_date,
      planned_end_date,
      planned_time_minutes,
      notes,
      warehouse_id,
    } = req.body;

    // Required fields validation
    if (!production_order_id) {
      return res.status(400).json({ success: false, message: "Production Order ID is required" });
    }
    if (!production_order_number) {
      return res.status(400).json({ success: false, message: "Production Order Number is required" });
    }
    if (stage_number === undefined || stage_number === null) {
      return res.status(400).json({ success: false, message: "Stage Number is required" });
    }
    if (!stage_name) {
      return res.status(400).json({ success: false, message: "Stage Name is required" });
    }
    if (!work_center_id) {
      return res.status(400).json({ success: false, message: "Work Center ID is required" });
    }
    if (!work_center_name) {
      return res.status(400).json({ success: false, message: "Work Center Name is required" });
    }
    if (!planned_start_date) {
      return res.status(400).json({ success: false, message: "Planned Start Date is required" });
    }
    if (!planned_end_date) {
      return res.status(400).json({ success: false, message: "Planned End Date is required" });
    }

    const finalStatus = status ? status.toUpperCase() : 'PENDING';
    if (!VALID_STATUSES.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const woNumber = await generateWorkOrderNumber();
    const id = crypto.randomUUID();

    // Set actual dates based on status
    let actualStartDate = null;
    let actualEndDate = null;
    if (finalStatus === 'IN_PROGRESS') {
      actualStartDate = new Date();
    } else if (finalStatus === 'COMPLETED') {
      actualStartDate = new Date();
      actualEndDate = new Date();
    }

    const result = await connectDB.query(
      `INSERT INTO public.work_orders (
        id, wo_number,
        production_order_id, production_order_number,
        stage_number, stage_name,
        work_center_id, work_center_name,
        machine_id, machine_name,
        operator_id, operator_name,
        shift_id, shift_name,
        planned_qty, completed_qty, rejected_qty,
        status,
        planned_start_date, planned_end_date,
        actual_start_date, actual_end_date,
        planned_time_minutes, actual_time_minutes,
        notes, warehouse_id, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, true
      ) RETURNING *`,
      [
        id, woNumber,
        production_order_id, production_order_number,
        Number(stage_number), stage_name,
        work_center_id, work_center_name,
        machine_id || null, machine_name || null,
        operator_id || null, operator_name || null,
        shift_id || null, shift_name || null,
        Number(planned_qty) || 0, Number(completed_qty) || 0, Number(rejected_qty) || 0,
        finalStatus,
        planned_start_date, planned_end_date,
        actualStartDate, actualEndDate,
        Number(planned_time_minutes) || 0, null,
        notes || null, warehouse_id || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Work Order created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create Work Order error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getAllWorkOrders = async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    let query = `SELECT * FROM public.work_orders WHERE is_active = true`;
    const params = [];

    if (warehouse_id) {
      params.push(warehouse_id);
      query += ` AND warehouse_id = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await connectDB.query(query, params);
    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get All Work Orders error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getWorkOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await connectDB.query(
      `SELECT * FROM public.work_orders WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Work Order not found" });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get Work Order By ID error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      machine_id,
      machine_name,
      operator_id,
      operator_name,
      shift_id,
      shift_name,
      planned_qty,
      completed_qty,
      rejected_qty,
      status,
      planned_start_date,
      planned_end_date,
      planned_time_minutes,
      notes,
      warehouse_id,
    } = req.body;

    // Retrieve existing Work Order to check status transitions
    const existResult = await connectDB.query(
      `SELECT * FROM public.work_orders WHERE id = $1 AND is_active = true`,
      [id]
    );
    if (existResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Work Order not found" });
    }

    const currentWO = existResult.rows[0];
    const newStatus = status ? status.toUpperCase() : currentWO.status;

    if (status && !VALID_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Determine actual dates and times
    let actualStartDate = currentWO.actual_start_date;
    let actualEndDate = currentWO.actual_end_date;
    let actualTimeMinutes = currentWO.actual_time_minutes;

    if (newStatus === 'IN_PROGRESS' && currentWO.status !== 'IN_PROGRESS') {
      if (!actualStartDate) {
        actualStartDate = new Date();
      }
    } else if (newStatus === 'COMPLETED' && currentWO.status !== 'COMPLETED') {
      if (!actualStartDate) {
        actualStartDate = new Date();
      }
      actualEndDate = new Date();

      // Calculate actual time in minutes
      const startMs = new Date(actualStartDate).getTime();
      const endMs = new Date(actualEndDate).getTime();
      actualTimeMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));
    }

    const result = await connectDB.query(
      `UPDATE public.work_orders SET
        machine_id = $1, machine_name = $2,
        operator_id = $3, operator_name = $4,
        shift_id = $5, shift_name = $6,
        planned_qty = $7, completed_qty = $8, rejected_qty = $9,
        status = $10,
        planned_start_date = $11, planned_end_date = $12,
        actual_start_date = $13, actual_end_date = $14,
        planned_time_minutes = $15, actual_time_minutes = $16,
        notes = $17, warehouse_id = $18,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $19 AND is_active = true
      RETURNING *`,
      [
        machine_id !== undefined ? machine_id : currentWO.machine_id,
        machine_name !== undefined ? machine_name : currentWO.machine_name,
        operator_id !== undefined ? operator_id : currentWO.operator_id,
        operator_name !== undefined ? operator_name : currentWO.operator_name,
        shift_id !== undefined ? shift_id : currentWO.shift_id,
        shift_name !== undefined ? shift_name : currentWO.shift_name,
        planned_qty !== undefined ? Number(planned_qty) : currentWO.planned_qty,
        completed_qty !== undefined ? Number(completed_qty) : currentWO.completed_qty,
        rejected_qty !== undefined ? Number(rejected_qty) : currentWO.rejected_qty,
        newStatus,
        planned_start_date !== undefined ? planned_start_date : currentWO.planned_start_date,
        planned_end_date !== undefined ? planned_end_date : currentWO.planned_end_date,
        actualStartDate,
        actualEndDate,
        planned_time_minutes !== undefined ? Number(planned_time_minutes) : currentWO.planned_time_minutes,
        actualTimeMinutes,
        notes !== undefined ? notes : currentWO.notes,
        warehouse_id !== undefined ? warehouse_id : currentWO.warehouse_id,
        id
      ]
    );

    res.status(200).json({
      success: true,
      message: "Work Order updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update Work Order error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // We do soft delete by default, setting is_active = false
    const result = await connectDB.query(
      `UPDATE public.work_orders SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Work Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Work Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete Work Order error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
