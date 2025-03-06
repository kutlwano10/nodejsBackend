const db = require('../config/db')
/**Get all hours worked */
exports.getAllEmployeeHours = async (req, res) => {
    try {
      // Query to get all employee hours
      const [employeeHours] = await db.query(`
        SELECT 
          id,
          employee_id,
          project_id,
          hours_worked,
          work_date,
          description
        FROM employee_hours
      `);
  
      // Check if any hours were found
      if (employeeHours.length === 0) {
        return res.status(404).json({ message: "No employee hours found" });
      }
  
      // Return the employee hours
      res.status(200).json({
        message: "Employee hours retrieved successfully",
        data: employeeHours,
      });
    } catch (error) {
      console.error("Failed to retrieve employee hours:", error);
      res.status(500).json({ error: "Failed to retrieve employee hours" });
    }
  };

  exports.deleteEmployeeHours = async (req, res) => {
    const { id } = req.params; // Get the ID from the URL parameters
  
    // Validate the ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid ID provided" });
    }
  
    try {
      // Check if the entry exists
      const [existingEntry] = await db.query(
        "SELECT * FROM employee_hours WHERE id = ?",
        [id]
      );
  
      if (existingEntry.length === 0) {
        return res.status(404).json({ error: "Logged hours entry not found" });
      }
  
      // Delete the entry
      await db.query("DELETE FROM employee_hours WHERE id = ?", [id]);
  
      res.status(200).json({
        message: "Logged hours deleted successfully",
        data: {
          id: parseInt(id),
        },
      });
    } catch (error) {
      console.error("Failed to delete logged hours:", error);
      res.status(500).json({ error: "Failed to delete logged hours" });
    }
  };