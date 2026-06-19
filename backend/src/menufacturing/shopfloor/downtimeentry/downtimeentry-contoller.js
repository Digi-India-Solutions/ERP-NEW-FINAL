import { connectDB } from "../../../pool.js";
import crypto from "crypto";

// Helper: Generate Downtime Entry Number
async function generateEntryNumber() {
  const year = new Date().getFullYear();
  const result = await connectDB.query(
    `SELECT COUNT(*) FROM public.downtime_entries WHERE EXTRACT(YEAR FROM created_at) = $1`,
    [year]
  );
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `DTE-${year}-${String(seq).padStart(4, '0')}`;
}

// Helper: Resolve machine status based on category
function getMachineStatusForCategory(category) {
  const cat = (category || '').toUpperCase();
  if (cat === 'BREAKDOWN') return 'BREAKDOWN';
  if (cat === 'PLANNED') return 'MAINTENANCE';
  return 'IDLE';
}

// ─── CREATE DOWNTIME ENTRY ───────────────────────────────────────────────────
export const createDowntimeEntry = async (req, res) => {
  try {
    const {
      machine_id,
      downtime_code_id,
      date,
      start_time,
      production_order_id,
      shift_id,
      operator_id,
      description,
      warehouse_id,
    } = req.body;

    // Validation
    if (!machine_id) return res.status(400).json({ success: false, message: "Machine is required" });
    if (!downtime_code_id) return res.status(400).json({ success: false, message: "Downtime Code is required" });
    if (!date) return res.status(400).json({ success: false, message: "Date is required" });
    if (!start_time) return res.status(400).json({ success: false, message: "Start Time is required" });
    if (!shift_id) return res.status(400).json({ success: false, message: "Shift is required" });
    if (!operator_id) return res.status(400).json({ success: false, message: "Operator is required" });

    // Fetch Machine & Work Center Name
    const machineRes = await connectDB.query(
      `SELECT m.*, wc.name as work_center_name 
       FROM public."Machines" m
       LEFT JOIN public."Work-Center" wc ON m.work_center_id = wc.id
       WHERE m.id = $1`,
      [machine_id]
    );
    if (machineRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Machine not found" });
    }
    const machine = machineRes.rows[0];

    // Fetch Downtime Code Info
    const codeRes = await connectDB.query(
      `SELECT * FROM public."Downtime-Codes" WHERE id = $1`,
      [downtime_code_id]
    );
    if (codeRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Downtime Code not found" });
    }
    const code = codeRes.rows[0];

    // Fetch Shift Info
    const shiftRes = await connectDB.query(
      `SELECT * FROM public."Shifts" WHERE id = $1`,
      [shift_id]
    );
    if (shiftRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }
    const shift = shiftRes.rows[0];

    // Fetch Operator Info
    const operatorRes = await connectDB.query(
      `SELECT * FROM public."Operators" WHERE id = $1`,
      [operator_id]
    );
    if (operatorRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Operator not found" });
    }
    const operator = operatorRes.rows[0];

    const entryNumber = await generateEntryNumber();
    const id = crypto.randomUUID();

    const result = await connectDB.query(
      `INSERT INTO public.downtime_entries (
        id, entry_number,
        machine_id, machine_name,
        work_center_id, work_center_name,
        downtime_code_id, downtime_code_name,
        category, start_time, end_time, duration_minutes,
        production_order_id, shift_id, shift_name,
        operator_id, operator_name, description,
        is_resolved, resolved_by, resolved_at, date, warehouse_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *`,
      [
        id, entryNumber,
        machine.id, machine.name,
        machine.work_center_id || null, machine.work_center_name || null,
        code.id, code.description,
        code.category, start_time, null, null,
        production_order_id || null, shift.id, shift.name,
        operator.id, operator.name, description || null,
        false, null, null, date, warehouse_id || machine.warehouse_id || null
      ]
    );

    // Update Machine Status based on Downtime category
    const nextMachineStatus = getMachineStatusForCategory(code.category);
    await connectDB.query(
      `UPDATE public."Machines" SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [nextMachineStatus, machine.id]
    );

    res.status(201).json({
      success: true,
      message: "Downtime logged successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("createDowntimeEntry error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET ALL DOWNTIME ENTRIES ────────────────────────────────────────────────
export const getAllDowntimeEntries = async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    let query = `SELECT * FROM public.downtime_entries`;
    const params = [];

    if (warehouse_id) {
      query += ` WHERE warehouse_id = $1`;
      params.push(warehouse_id);
    }

    query += ` ORDER BY date DESC, start_time DESC`;

    const result = await connectDB.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("getAllDowntimeEntries error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET DOWNTIME ENTRY BY ID ────────────────────────────────────────────────
export const getDowntimeEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await connectDB.query(
      `SELECT * FROM public.downtime_entries WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Downtime entry not found" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("getDowntimeEntryById error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE DOWNTIME ENTRY ───────────────────────────────────────────────────
export const updateDowntimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      machine_id,
      downtime_code_id,
      date,
      start_time,
      production_order_id,
      shift_id,
      operator_id,
      description,
      warehouse_id,
    } = req.body;

    const existingRes = await connectDB.query(
      `SELECT * FROM public.downtime_entries WHERE id = $1`,
      [id]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Downtime entry not found" });
    }
    const oldEntry = existingRes.rows[0];

    // If machine, code, shift, or operator has changed, resolve names
    let machine = { id: oldEntry.machine_id, name: oldEntry.machine_name, work_center_id: oldEntry.work_center_id, work_center_name: oldEntry.work_center_name, warehouse_id: oldEntry.warehouse_id };
    if (machine_id && machine_id !== oldEntry.machine_id) {
      const machineRes = await connectDB.query(
        `SELECT m.*, wc.name as work_center_name 
         FROM public."Machines" m
         LEFT JOIN public."Work-Center" wc ON m.work_center_id = wc.id
         WHERE m.id = $1`,
        [machine_id]
      );
      if (machineRes.rows.length > 0) {
        machine = machineRes.rows[0];
      }
    }

    let code = { id: oldEntry.downtime_code_id, description: oldEntry.downtime_code_name, category: oldEntry.category };
    if (downtime_code_id && downtime_code_id !== oldEntry.downtime_code_id) {
      const codeRes = await connectDB.query(
        `SELECT * FROM public."Downtime-Codes" WHERE id = $1`,
        [downtime_code_id]
      );
      if (codeRes.rows.length > 0) {
        code = codeRes.rows[0];
      }
    }

    let shift = { id: oldEntry.shift_id, name: oldEntry.shift_name };
    if (shift_id && shift_id !== oldEntry.shift_id) {
      const shiftRes = await connectDB.query(
        `SELECT * FROM public."Shifts" WHERE id = $1`,
        [shift_id]
      );
      if (shiftRes.rows.length > 0) {
        shift = shiftRes.rows[0];
      }
    }

    let operator = { id: oldEntry.operator_id, name: oldEntry.operator_name };
    if (operator_id && operator_id !== oldEntry.operator_id) {
      const operatorRes = await connectDB.query(
        `SELECT * FROM public."Operators" WHERE id = $1`,
        [operator_id]
      );
      if (operatorRes.rows.length > 0) {
        operator = operatorRes.rows[0];
      }
    }

    const result = await connectDB.query(
      `UPDATE public.downtime_entries SET
        machine_id = $1, machine_name = $2,
        work_center_id = $3, work_center_name = $4,
        downtime_code_id = $5, downtime_code_name = $6,
        category = $7, date = $8, start_time = $9,
        production_order_id = $10, shift_id = $11, shift_name = $12,
        operator_id = $13, operator_name = $14, description = $15,
        warehouse_id = $16, updated_at = CURRENT_TIMESTAMP
      WHERE id = $17 RETURNING *`,
      [
        machine.id, machine.name,
        machine.work_center_id || null, machine.work_center_name || null,
        code.id, code.description,
        code.category, date || oldEntry.date, start_time || oldEntry.start_time,
        production_order_id !== undefined ? (production_order_id || null) : oldEntry.production_order_id,
        shift.id, shift.name,
        operator.id, operator.name,
        description !== undefined ? description : oldEntry.description,
        warehouse_id || machine.warehouse_id || oldEntry.warehouse_id,
        id
      ]
    );

    // If machine changed and old was active, set old machine back to RUNNING
    if (oldEntry.machine_id !== machine.id && !oldEntry.is_resolved) {
      await connectDB.query(
        `UPDATE public."Machines" SET status = 'RUNNING', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [oldEntry.machine_id]
      );
    }

    // Update new/current machine's status if not resolved
    if (!oldEntry.is_resolved) {
      const nextMachineStatus = getMachineStatusForCategory(code.category);
      await connectDB.query(
        `UPDATE public."Machines" SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [nextMachineStatus, machine.id]
      );
    }

    res.json({
      success: true,
      message: "Downtime entry updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("updateDowntimeEntry error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── RESOLVE DOWNTIME ENTRY ──────────────────────────────────────────────────
export const resolveDowntimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { end_time, resolved_by, notes } = req.body;

    if (!end_time) {
      return res.status(400).json({ success: false, message: "End Time is required to resolve downtime" });
    }

    const existingRes = await connectDB.query(
      `SELECT * FROM public.downtime_entries WHERE id = $1`,
      [id]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Downtime entry not found" });
    }
    const entry = existingRes.rows[0];

    if (entry.is_resolved) {
      return res.status(400).json({ success: false, message: "Downtime entry is already resolved" });
    }

    // Calculate duration in minutes
    const [startH, startM] = entry.start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    let duration = endMinutes - startMinutes;
    if (duration <= 0) {
      return res.status(400).json({ success: false, message: "End Time must be after Start Time" });
    }

    const result = await connectDB.query(
      `UPDATE public.downtime_entries SET
        is_resolved = true,
        end_time = $1,
        duration_minutes = $2,
        resolved_by = $3,
        resolved_at = CURRENT_TIMESTAMP,
        description = COALESCE($4, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 RETURNING *`,
      [
        end_time,
        duration,
        resolved_by || 'System',
        notes || null,
        id
      ]
    );

    // Set machine status back to RUNNING
    await connectDB.query(
      `UPDATE public."Machines" SET status = 'RUNNING', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [entry.machine_id]
    );

    res.json({
      success: true,
      message: "Downtime entry resolved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("resolveDowntimeEntry error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE DOWNTIME ENTRY ───────────────────────────────────────────────────
export const deleteDowntimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await connectDB.query(
      `DELETE FROM public.downtime_entries WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Downtime entry not found" });
    }
    const entry = result.rows[0];

    // If deleting an active downtime, restore machine status to RUNNING
    if (!entry.is_resolved) {
      await connectDB.query(
        `UPDATE public."Machines" SET status = 'RUNNING', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [entry.machine_id]
      );
    }

    res.json({
      success: true,
      message: "Downtime entry deleted successfully",
    });
  } catch (error) {
    console.error("deleteDowntimeEntry error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
