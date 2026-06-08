import express from "express";
// import {
//   createWarehouse,
//   getAllWarehouses,
//   updateWarehouse,
//   deleteWarehouse,

//   searchWarehouses,

// } from "./e-controller.js";
import { verifyToken } from "../../../middlewares/verifyToken.middleware.js";
import { createItem, updateItem, deleteItem, getAllItems, getItemById, filterItems } from "./items-controller.js";
const router = express.Router();

// Apply authentication middleware to all lead routes
router.use(verifyToken);

router.post("/", createItem);            
 router.get("/", getAllItems);                 
// router.post("/search", searchWarehouses); 


 router.put("/:id", updateItem);           
 router.delete("/:id", deleteItem);     
 
 router.get("/filter", filterItems); // For simplicity, using getAllItems with query params for search
 router.get("/:id", getItemById);



export default router;