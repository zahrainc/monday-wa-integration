const router = require('express').Router();
const { authenticationMiddleware } = require('../middlewares/authentication');
const mondayController = require('../controllers/monday-controller');

router.post('/monday/execute_action', authenticationMiddleware, mondayController.executeAction);
router.post('/monday/get_remote_list_options', authenticationMiddleware, mondayController.getRemoteListOptions);
router.post('/monday/notify_whatsapp', authenticationMiddleware, mondayController.notifyWhatsapp);
router.post('/monday/notify_message', authenticationMiddleware, mondayController.notifyMessage);
router.post('/monday/notify_whatsapp_change_status', authenticationMiddleware, mondayController.notifyWhatsappChangeStatus);
router.post('/monday/get_phone_number', authenticationMiddleware, mondayController.getPhoneNumber);
router.post('/monday/create_new_item', authenticationMiddleware, mondayController.createNewItem);
router.post('/monday/send_message_change_status', authenticationMiddleware, mondayController.sendMessageChangeStatus);
router.post('/monday/get_new_lead', authenticationMiddleware, mondayController.checkStatusSendMessage);
router.post('/monday/check_status_not_send_message', authenticationMiddleware, mondayController.checkStatusNotSendMessage);

module.exports = router;
