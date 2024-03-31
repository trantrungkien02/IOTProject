const dataSensor = require('../models/dataSensor');
const Sequelize = require('sequelize');
class dataSensorController {
  // [GET] /
  async getAll(req, res, next) {
    try {
      const { page, pageSize, orderBy } = req.query;
      const pageNumber = parseInt(page) || 1;
      const sizePerPage = parseInt(pageSize) || 10;
      let orderCriteria = [];

      // Xác định tiêu chí sắp xếp nếu có
      switch (orderBy) {
        case 'id_ASC':
          orderCriteria = [['id', 'ASC']];
          break;
        case 'id_DESC':
          orderCriteria = [['id', 'DESC']];
          break;
        case 'temperature_ASC':
          orderCriteria = [['temperature', 'ASC']];
          break;
        case 'temperature_DESC':
          orderCriteria = [['temperature', 'DESC']];
          break;
        case 'humidity_ASC':
          orderCriteria = [['humidity', 'ASC']];
          break;
        case 'humidity_DESC':
          orderCriteria = [['humidity', 'DESC']];
          break;
        case 'light_ASC':
          orderCriteria = [['light', 'ASC']];
          break;
        case 'light_DESC':
          orderCriteria = [['light', 'DESC']];
          break;
      }

      const SensorData = await dataSensor();
      const sensorData = await SensorData.findAll({
        limit: sizePerPage,
        offset: (pageNumber - 1) * sizePerPage,
        order: orderCriteria,
      });

      res.send(sensorData);
    } catch (error) {
      next(error);
    }
  }

  async getByField(req, res, next) {
    try {
      const { field, value, page, pageSize } = req.query;

      let whereCondition = {};

      // Nếu có trường field được chọn, thêm điều kiện tìm kiếm theo trường đó
      if (field != 'all' && value) {
        // Kiểm tra nếu trường field là một trong các trường string
        whereCondition[field] = { [Sequelize.Op.substring]: value };
      } else if (field === 'all' && value) {
        // Nếu không có trường field được chọn, thực hiện tìm kiếm theo ký tự trên toàn bộ database
        whereCondition = {
          [Sequelize.Op.or]: [
            { id: { [Sequelize.Op.substring]: value } },
            { temperature: { [Sequelize.Op.substring]: value } },
            { humidity: { [Sequelize.Op.substring]: value } },
            { light: { [Sequelize.Op.substring]: value } },
            { createdAt: { [Sequelize.Op.substring]: value } },
          ],
        };
      }

      // Tính toán limit và offset cho phân trang
      const limit = pageSize ? parseInt(pageSize) : 10; // Số lượng mục trên mỗi trang, mặc định là 10 nếu không được cung cấp
      const offset = page ? (parseInt(page) - 1) * limit : 0; // Số lượng mục bỏ qua, mặc định là 0 nếu không được cung cấp

      const SensorData = await dataSensor();
      const sensorData = await SensorData.findAll({
        where: whereCondition,
        limit: limit,
        offset: offset,
      });

      if (sensorData.length === 0) {
        return res.status(404).send(`No data found for the provided value '${value}'.`);
      }

      res.send(sensorData);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      // Lấy đủ dữ liệu từ yêu cầu
      const SensorData = await dataSensor();
      const { temperature, humidity, light } = req.body;
      console.log(req.body);
      // Thêm dữ liệu mới vào cơ sở dữ liệu
      const newSensorData = await SensorData.create({
        temperature,
        humidity,
        light,
      });

      // Trả về dữ liệu mới đã tạo dưới dạng JSON
      res.status(201).json(newSensorData);
    } catch (error) {
      next(error); // Chuyển tiếp lỗi nếu có
    }
  }

  async update(req, res, next) {
    try {
      // Lấy đủ dữ liệu từ yêu cầu
      const { id } = req.params;
      const { temperature, humidity, light } = req.body;

      // Kiểm tra xem datasensor có tồn tại không
      const SensorData = await dataSensor();
      const existingSensorData = await SensorData.findByPk(id);
      if (!existingSensorData) {
        return res.status(404).json({ error: 'Datasensor not found' });
      }

      // Cập nhật dữ liệu
      existingSensorData.temperature = temperature;
      existingSensorData.humidity = humidity;
      existingSensorData.light = light;
      await existingSensorData.save();

      // Trả về dữ liệu đã cập nhật dưới dạng JSON
      res.json(existingSensorData);
    } catch (error) {
      next(error); // Chuyển tiếp lỗi nếu có
    }
  }
  async delete(req, res, next) {
    try {
      // Lấy id từ yêu cầu
      const { id } = req.params;

      // Kiểm tra xem datasensor có tồn tại không
      const SensorData = await dataSensor();
      const existingSensorData = await SensorData.findByPk(id);
      if (!existingSensorData) {
        return res.status(404).json({ error: 'Datasensor not found' });
      }

      // Xóa datasensor
      await existingSensorData.destroy();

      // Trả về thông báo xóa thành công
      res.json({ message: 'Datasensor deleted successfully' });
    } catch (error) {
      next(error); // Chuyển tiếp lỗi nếu có
    }
  }
}

module.exports = new dataSensorController();
