# Bộ Lọc Số Điện Thoại

Ứng dụng web đơn giản cho phép người dùng nhập số điện thoại và lọc ra các số trùng lặp. Dữ liệu được lưu trữ trên MongoDB.

## Tính năng

- Nhập nhiều số điện thoại (mỗi số một dòng)
- Lọc và hiển thị các số điện thoại không trùng lặp
- Lọc và hiển thị các số điện thoại bị trùng lặp
- Đếm số lượng số không trùng và số bị trùng
- Lưu trữ số điện thoại trên MongoDB
- Sao chép kết quả vào clipboard

## Cách sử dụng

### Cài đặt

1. Cài đặt Python (phiên bản 3.6 trở lên)
2. Cài đặt MongoDB:
   - Windows: Tải và cài đặt từ [trang chủ MongoDB](https://www.mongodb.com/try/download/community)
   - Linux: `sudo apt-get install mongodb`
   - macOS: `brew install mongodb-community`
3. Khởi động MongoDB:
   - Windows: MongoDB chạy như một dịch vụ sau khi cài đặt
   - Linux: `sudo systemctl start mongod`
   - macOS: `brew services start mongodb-community`
4. Cài đặt các thư viện Python cần thiết:
   ```
   pip install -r requirements.txt
   ```
5. Khởi động server:
   ```
   python server.py
   ```
6. Mở trình duyệt và truy cập: `http://localhost:5000`

### Sử dụng

1. Nhập số điện thoại vào ô văn bản, mỗi số một dòng
2. Nhấn nút "Lọc Số Trùng"
3. Xem kết quả trong phần "Số Không Trùng" và "Số Bị Trùng"
4. Sử dụng nút "Sao Chép" để sao chép kết quả vào clipboard
5. Sử dụng nút "Xóa Tất Cả" để xóa tất cả số điện thoại

## Ví dụ

Nếu bạn nhập:

```
0123456789
0987654321
0123456789
0123456789
0111222333
```

Ứng dụng sẽ hiển thị:

- Số Không Trùng: 0987654321, 0111222333
- Số Bị Trùng: 0123456789

## Chi tiết kỹ thuật

Ứng dụng được xây dựng bằng:

- HTML, CSS, JavaScript (frontend)
- Python với Flask (backend)
- MongoDB (cơ sở dữ liệu NoSQL)

### Cấu trúc MongoDB

- Database: `phone_filter_db`
- Collection: `phone_numbers`
- Cấu trúc document:
  ```json
  {
    "number": "0123456789",
    "is_duplicate": true,
    "created_at": "2023-07-15T10:30:45.123Z"
  }
  ```

## Cấu trúc file

- `index.html` - File HTML chính
- `styles.css` - CSS cho giao diện
- `script.js` - Mã JavaScript cho xử lý frontend
- `server.py` - Server Python với Flask và kết nối MongoDB
- `requirements.txt` - Danh sách các thư viện Python cần thiết
