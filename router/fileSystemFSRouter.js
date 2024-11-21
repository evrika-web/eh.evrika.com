const express = require("express");
const router = express.Router();
const moment = require("moment");
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Добавляем multer
const { authenticateToken } = require("../utility/authorization");
const SimpleNodeLogger = require("simple-node-logger");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-file-system-fs.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

// Устанавливаем директорию, с которой будем работать
const ROOT_DIR = path.join(__dirname, '../files');

// Настраиваем хранилище для multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ROOT_DIR);
  },
  filename: function (req, file, cb) {
    // Используем оригинальное имя файла
    const originalName = path.basename(file.originalname);

    // Предотвращаем обход пути
    if (originalName.includes('..') || originalName.includes('/')) {
      return cb(new Error('Недопустимое имя файла'));
    }

    cb(null, originalName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Ограничение размера файла до 10 МБ
  fileFilter: function (req, file, cb) {
    // Разрешенные MIME-типы
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла'));
    }
  }
});

router.get('/', authenticateToken, (req, res) => {
  fs.readdir(ROOT_DIR, (err, items) => {
    if (err) {
      log.error("Ошибка при чтении директории ", {
        error: err
      });
      return res.status(500).json({ message: 'Ошибка при чтении директории' });
    }

    const result = items.map(item => {
      const itemPath = path.join(ROOT_DIR, item);
      const isDirectory = fs.lstatSync(itemPath).isDirectory();
      return {
        name: item,
        type: isDirectory ? 'directory' : 'file'
      };
    });

    res.json(result);
  });
});

// Маршрут для загрузки нового файла
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    log.error("Файл не был загружен ");
    return res.status(400).json({ message: 'Файл не был загружен' });
  }
  res.json({ message: 'Файл успешно загружен', fileName: req.file.filename });
});

// Маршрут для создания новой директории
router.post('/directory', authenticateToken, (req, res) => {
  let dirName = req.body.name;
  dirName = path.basename(dirName); // Убираем путь, оставляя только имя директории

  if (!dirName) {
    log.error("Имя директории не может быть пустым");
    return res.status(400).json({ message: 'Имя директории не может быть пустым' });
  }

  const dirPath = path.normalize(path.join(ROOT_DIR, dirName));

  if (!dirPath.startsWith(ROOT_DIR)) {
    log.error("Недопустимый путь");
    return res.status(400).json({ message: 'Недопустимый путь' });
  }

  fs.mkdir(dirPath, { recursive: true }, err => {
    if (err) {
      log.error("Ошибка при создании директории ", {
        error: err
      });
      return res.status(500).json({ message: 'Ошибка при создании директории' });
    }
    res.json({ message: 'Директория успешно создана' });
  });
});

// Маршрут для скачивания файла
router.get('/download/:name', authenticateToken, (req, res) => {
  const fileName = req.params.name;
  const filePath = path.normalize(path.join(ROOT_DIR, fileName));

  // Проверка на предотвращение обхода директорий
  if (!filePath.startsWith(ROOT_DIR)) {
    
    log.error("Недопустимый путь");
    return res.status(400).json({ message: 'Недопустимый путь' });
  }

  if (!fs.existsSync(filePath)) {
    
    log.error("Файл не найден");
    return res.status(404).json({ message: 'Файл не найден' });
  }

  // Отправка файла для скачивания
  res.download(filePath, fileName, err => {
    if (err) {log.error("Ошибка при скачивании файла ", {
      error: err
    });
      return res.status(500).json({ message: 'Ошибка при скачивании файла' });
    }
  });
});

// Маршрут для удаления файла или директории
router.delete('/:name', authenticateToken, (req, res) => {
  const itemName = req.params.name;
  const itemPath = path.normalize(path.join(ROOT_DIR, itemName));

  if (!itemPath.startsWith(ROOT_DIR)) {
    
    log.error("Недопустимый путь");
    return res.status(400).json({ message: 'Недопустимый путь' });
  }

  fs.lstat(itemPath, (err, stats) => {
    if (err) {log.error("Ошибка при доступе к элементу ", {
      error: err
    });
      return res.status(500).json({ message: 'Ошибка при доступе к элементу' });
    }

    if (stats.isDirectory()) {
      fs.rmdir(itemPath, { recursive: true }, err => {
        if (err) {log.error("Ошибка при удалении директории ", {
          error: err
        });
          return res.status(500).json({ message: 'Ошибка при удалении директории' });
        }
        res.json({ message: 'Директория успешно удалена' });
      });
    } else {
      fs.unlink(itemPath, err => {
        if (err) {log.error("Ошибка при удалении файла ", {
          error: err
        });
          return res.status(500).json({ message: 'Ошибка при удалении файла' });
        }
        res.json({ message: 'Файл успешно удален' });
      });
    }
  });
});

  module.exports = router;  