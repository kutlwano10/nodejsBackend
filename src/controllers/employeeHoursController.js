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


  exports.updateEmployeeHours = async (req, res) => {

    const { id } = req.params; // Get the ID from the URL parameters
    const { hours_worked, work_date, description } = req.body; // Get updated data from the request body
    console.log("Request Body:", req.body); 
    // Validate the ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid ID provided" });
    }
  
    // Validate the input
    if (!hours_worked || !work_date) {
      return res.status(400).json({ error: "Hours worked and work date are required" });
    }
  
    // Validate hours_worked
    const hoursNum = parseFloat(hours_worked);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      return res.status(400).json({ error: "Hours worked must be a number between 0 and 24" });
    }
  
    // Validate work_date format (optional)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
    if (!dateRegex.test(work_date)) {
      return res.status(400).json({ error: "Work date must be in the format YYYY-MM-DD" });
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
  
      // Update the entry
      await db.query(
        "UPDATE employee_hours SET hours_worked = ?, work_date = ?, description = ? WHERE id = ?",
        [hoursNum, work_date, description || null, id]
      );
  
      // Fetch the updated entry
      const [updatedEntry] = await db.query(
        "SELECT * FROM employee_hours WHERE id = ?",
        [id]
      );
  
      res.status(200).json({
        message: "Logged hours updated successfully",
        data: updatedEntry[0], // Return the updated entry
      });
    } catch (error) {
      console.error("Failed to update logged hours:", error);
      res.status(500).json({ error: "Failed to update logged hours" });
    }
  };

  /**
   * 
   * @param {*} req 
   * @param {*} res 
   * @returns - Object of Message and updatedProject data
   */
  exports.updateEmployeeTimesheet = async (req, res) => {

    const { employee_id, project_ids } = req.body;

    // Validate request body
    if (!employee_id || !project_ids || !Array.isArray(project_ids)) {
      return res.status(400).json({ error: "employee_id and project_ids (array) are required" });
    }
  
    try {
      const updatedProjects = [];
  
      // Loop through each project ID
      for (const project_id of project_ids) {
        // Step 1: Fetch all logged hours for the employee and project
        const [fetchResult] = await pool.query(
          `SELECT SUM(hours_worked) AS total_hours
           FROM employee_hours
           WHERE employee_id = ? AND project_id = ?`,
          [employee_id, project_id]
        );
  
        const total_hours = parseFloat(fetchResult[0].total_hours) || 0;
  
        // Step 2: Check if the project exists in the timesheet
        const [checkResult] = await pool.query(
          `SELECT id
           FROM employee_timesheet
           WHERE employee_id = ? AND project_id = ?`,
          [employee_id, project_id]
        );
  
        if (checkResult.length > 0) {
          // Step 3: Update existing entry
          await pool.query(
            `UPDATE employee_timesheet
             SET total_hours = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [total_hours, checkResult[0].id]
          );
        } else {
          // Step 4: Insert new entry
          await pool.query(
            `INSERT INTO employee_timesheet (employee_id, project_id, total_hours)
             VALUES (?, ?, ?)`,
            [employee_id, project_id, total_hours]
          );
        }
  
        // Add the updated project to the response
        updatedProjects.push({
          project_id: project_id,
          total_hours: total_hours,
        });
      }
  
      // Send success response
      res.status(200).json({
        message: "Timesheet updated successfully",
        updated_projects: updatedProjects,
      });
    } catch (error) {
      console.error("Error updating timesheet:", error);
      res.status(500).json({ error: "Failed to update timesheet" });
    }
  }