const actionHistoryModel = require('../models/actionHistory');
const Sequelize = require('sequelize');
const moment = require('moment-timezone');
const { DateTime } = require('luxon');
class actionHistoryController {
  // [GET] /
  async getAll(req, res, next) {
    try {
      const { page, pageSize, orderBy } = req.query;
      const pageNumber = parseInt(page) || 1;
      const sizePerPage = parseInt(pageSize) || 10;
      let orderCriteria = [];

      // Xác định tiêu chí sắp xếp nếu có
      switch (orderBy) {
        case 'id_DESC':
          orderCriteria = [['id', 'DESC']];
          break;
        case 'deviceName_ASC':
          orderCriteria = [['deviceName', 'ASC']];
          break;
        case 'deviceName_DESC':
          orderCriteria = [['deviceName', 'DESC']];
          break;
        case 'action_ASC':
          orderCriteria = [['action', 'ASC']];
          break;
        case 'action_DESC':
          orderCriteria = [['action', 'DESC']];
          break;
        case 'createdAt_ASC':
          orderCriteria = [['createdAt', 'ASC']];
          break;
        case 'createdAt_DESC':
          orderCriteria = [['createdAt', 'DESC']];
          break;
        default:
          // Mặc định sắp xếp theo ID tăng dần nếu không có tiêu chí
          orderCriteria = [['id', 'ASC']];
          break;
      }

      const ActionHistory = await actionHistoryModel();
      const actionHistory = await ActionHistory.findAll({
        limit: sizePerPage,
        offset: (pageNumber - 1) * sizePerPage,
        order: orderCriteria,
      });

      res.send(actionHistory);
    } catch (error) {
      next(error);
    }
  }

  async getByField(req, res, next) {
    try {
      const { field, value, page, pageSize } = req.query;

      // Tạo điều kiện tìm kiếm dựa trên trường field và giá trị
      let whereCondition = {};

      if (field != 'all' && value) {
        // Kiểm tra xem trường field được chỉ định có hợp lệ không
        const validFields = ['id', 'deviceName', 'action', 'createdAt'];
        if (!validFields.includes(field)) {
          return res.status(400).send(`Field '${field}' is not valid.`);
        }
        whereCondition[field] = { [Sequelize.Op.substring]: value };
      } else if (field === 'all' && value) {
        // Tìm kiếm theo ký tự trên toàn bộ cơ sở dữ liệu
        whereCondition = {
          [Sequelize.Op.or]: [
            { id: { [Sequelize.Op.substring]: value } },
            { deviceName: { [Sequelize.Op.substring]: value } },
            { action: { [Sequelize.Op.substring]: value } },
            { createdAt: { [Sequelize.Op.substring]: value } },
          ],
        };
      }

      // Tính toán limit và offset cho phân trang
      const limit = pageSize ? parseInt(pageSize) : 10; // Số lượng mục trên mỗi trang, mặc định là 10 nếu không được cung cấp
      const offset = page ? (parseInt(page) - 1) * limit : 0; // Số lượng mục bỏ qua, mặc định là 0 nếu không được cung cấp

      const ActionHistory = await actionHistoryModel(); // Lấy model ActionHistory từ actionHistory.js
      const actionHistoryData = await ActionHistory.findAll({
        where: whereCondition,
        limit: limit,
        offset: offset,
      });

      // Trả về dữ liệu dưới dạng JSON
      res.send(actionHistoryData);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      // Lấy đủ dữ liệu từ yêu cầu
      const { deviceName, action } = req.body;
      const currentTime = DateTime.now();

      // Output current time
      console.log(currentTime.toISO());
      const ActionHistory = await actionHistoryModel();
      const newActionHistory = await ActionHistory.create({
        deviceName,
        action, // Gán thời gian hiện tại cho trường createdAt
      });

      // Trả về dữ liệu mới đã tạo dưới dạng JSON
      res.status(201).json(newActionHistory);
    } catch (error) {
      next(error); // Chuyển tiếp lỗi nếu có
    }
  }

  async update(req, res, next) {
    try {
      // Lấy đủ dữ liệu từ yêu cầu
      const { id } = req.params;
      const { deviceName, action } = req.body;

      // Kiểm tra xem action history có tồn tại không
      const ActionHistory = await actionHistoryModel();
      const existingActionHistory = await ActionHistory.findByPk(id);
      if (!existingActionHistory) {
        return res.status(404).json({ error: 'Action history not found' });
      }

      // Cập nhật dữ liệu
      existingActionHistory.deviceName = deviceName;
      existingActionHistory.action = action;
      await existingActionHistory.save();

      // Trả về dữ liệu đã cập nhật dưới dạng JSON
      res.json(existingActionHistory);
    } catch (error) {
      next(error); // Chuyển tiếp lỗi nếu có
    }
  }

  async updateStatus(req, res, next) {
    try {
      // Lấy đủ dữ liệu từ yêu cầu
      const { id } = req.params;
      const { action } = req.body;

      // Kiểm tra xem action history có tồn tại không
      const ActionHistory = await actionHistoryModel();
      const existingActionHistory = await ActionHistory.findByPk(id);
      if (!existingActionHistory) {
        return res.status(404).json({ error: 'Action history not found' });
      }

      if (action !== 'on' && action !== 'off') {
        return res.status(400).json({ error: 'Invalid action value. Action must be off or on' });
      }

      // Cập nhật dữ liệu
      existingActionHistory.action = action;
      await existingActionHistory.save();

      // Tạo chuỗi trả về dựa trên giá trị action
      let responseMessage = '';
      if (action === 'on') {
        responseMessage = `Device status id ${id} is on`;
      } else {
        responseMessage = `Device status ${id} is off`;
      }

      // Trả về dữ liệu đã cập nhật dưới dạng JSON
      res.json({ message: responseMessage });
    } catch (error) {
      next(error); // Chuyển tiếp lỗi nếu có
    }
  }

  async delete(req, res, next) {
    try {
      // Lấy id từ yêu cầu
      const { id } = req.params;

      // Kiểm tra xem action history có tồn tại không
      const ActionHistory = await actionHistoryModel();
      const existingActionHistory = await ActionHistory.findByPk(id);
      if (!existingActionHistory) {
        return res.status(404).json({ error: 'Action history not found' });
      }

      // Xóa action history
      await existingActionHistory.destroy();

      // Trả về thông báo xóa thành công
      res.json({ message: 'Action history deleted successfully' });
    } catch (error) {
      next(error); // Chuyển tiếp lỗi nếu có
    }
  }
}

module.exports = new actionHistoryController();
