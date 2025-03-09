const express = require('express')

const employeeHoursController = require('../controllers/employeeHoursController')

const router = express.Router()

router.get('/employee-hours', employeeHoursController.getAllEmployeeHours)
router.delete('/hours/:id', employeeHoursController.deleteEmployeeHours)
router.put('/hours/update/:id', employeeHoursController.updateEmployeeHours)
router.post('/update/timesheet', employeeHoursController.updateEmployeeTimesheet)
router.get('/retrieve/timesheet/:id', employeeHoursController.getEmployeeTimesheet)

module.exports = router