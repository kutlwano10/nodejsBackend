
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