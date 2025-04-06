const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// 创建Express应用
const app = express();
app.use(express.json()); // 解析JSON格式的请求体
app.use(cors());

// 创建数据库连接
const connection = mysql.createConnection({
    host: 'localhost',
    user: '123456', // 替换为你的数据库用户名
    password: '123456', // 替换为你的数据库密码
    database: 'fruit_gift_card' // 数据库名称
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database.');
});

// 查询余额
app.post('/query-balance', (req, res) => {
    const { uid } = req.body;
    connection.query(
        'SELECT balance FROM Cards WHERE uid = ?',
        [uid],
        (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            if (results.length === 0) {
                console.log(`No card found for UID: ${uid}`);
                return res.status(404).json({ success: false, message: 'Card not found' });
            }
            res.json({ success: true, balance: results[0].balance });
        }
    );
});

// 充值
app.post('/recharge', (req, res) => {
    const { uid, amount } = req.body;
    connection.query(
        'UPDATE Cards SET balance = balance + ? WHERE uid = ?',
        [amount, uid],
        (error, results) => {
            if (error || results.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Card not found or update failed' });
            }
            res.json({ success: true, message: 'Recharge successful' });
        }
    );
});

// 扣费
app.post('/deduct', (req, res) => {
    const { uid, amount } = req.body;
    connection.query(
        'SELECT balance FROM Cards WHERE uid = ? FOR UPDATE',
        [uid],
        (selectError, selectResults) => {
            if (selectError || selectResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Card not found' });
            }
            const currentBalance = selectResults[0].balance;
            if (currentBalance < amount) {
                return res.status(400).json({ success: false, message: 'Insufficient balance' });
            }

            connection.query(
                'UPDATE Cards SET balance = balance - ? WHERE uid = ?',
                [amount, uid],
                (updateError, updateResults) => {
                    if (updateError || updateResults.affectedRows === 0) {
                        return res.status(500).json({ success: false, message: 'Deduction failed' });
                    }
                    res.json({ success: true, message: 'Deduction successful' });
                }
            );
        }
    );
});

// 监听端口
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
