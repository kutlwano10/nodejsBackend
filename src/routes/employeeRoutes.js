const express = require('express')

const employeeHoursController = require('../controllers/employeeHoursController')

const router = express.Router()

router.get('/employee-hours', employeeHoursController.getAllEmployeeHours)
router.delete('/hours/:id', employeeHoursController.deleteEmployeeHours)

module.exports = router