from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime
from pymongo import MongoClient
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='.')

# Cấu hình CORS cho toàn bộ ứng dụng
CORS(app, resources={
    r"/*": {  # Cho phép tất cả các route
        "origins": [
            "http://localhost:5500",  # Live Server
            "http://127.0.0.1:5500",  # Live Server alternative
            "http://localhost:5000",   # Flask development server
            "http://127.0.0.1:5000",   # Flask development server alternative
            "https://cuongdevv.github.io",  # GitHub Pages
            "https://web-production-6b6c7.up.railway.app"  # Railway
        ],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False  # Thêm dòng này
    }
})

username = quote_plus(os.getenv('MONGODB_USERNAME'))
password = quote_plus(os.getenv('MONGODB_PASSWORD'))
# Tạo MongoDB URI với credentials đã được encode
default_uri = f'mongodb+srv://{username}:{password}@cluster0.rvn8m.mongodb.net/phone_filter_db?retryWrites=true&w=majority'
MONGODB_URI = os.environ.get('MONGODB_URI', default_uri)
PORT = int(os.environ.get('PORT', 5000))  # Sử dụng port 5000 cho development

try:
    client = MongoClient(MONGODB_URI)
    # Test connection
    db = client.get_database('phone_filter_db')
    db.command('ping')
    phone_collection = db['phone_numbers']
    # Tạo index cho số điện thoại
    phone_collection.create_index('number', unique=True)
    print("Kết nối MongoDB thành công!")
    USE_MONGODB = True
except Exception as e:
    print(f"Lỗi kết nối MongoDB: {str(e)}")
    print("Sử dụng lưu trữ trong bộ nhớ thay thế.")
    USE_MONGODB = False
    # Lưu trữ dữ liệu trong bộ nhớ
    memory_storage = {
        'unique_numbers': [],
        'duplicate_numbers': [],
        'phone_notes': []
    }

# Route để phục vụ các file tĩnh (HTML, CSS, JS)
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# API để lưu số điện thoại
@app.route('/api/save', methods=['POST'])
def save_numbers():
    data = request.json
    unique_numbers = data.get('uniqueNumbers', [])
    duplicate_numbers = data.get('duplicateNumbers', [])
    
    try:
        if USE_MONGODB:
            # Tạo session_id để nhóm các số được lưu cùng một lần
            session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
            current_time = datetime.now()
            
            # Xóa tất cả các số cũ khỏi database
            phone_collection.delete_many({
                'number': {'$in': unique_numbers + duplicate_numbers}
            })
            
            # Chuẩn bị dữ liệu để insert
            documents = []
            
            # Thêm số điện thoại duy nhất
            for number in unique_numbers:
                documents.append({
                    'number': number,
                    'is_duplicate': False,
                    'session_id': session_id,
                    'created_at': current_time
                })
            
            # Thêm số điện thoại trùng lặp
            for number in duplicate_numbers:
                documents.append({
                    'number': number,
                    'is_duplicate': True,
                    'session_id': session_id,
                    'created_at': current_time
                })
            
            # Insert nhiều document cùng lúc nếu có dữ liệu
            if documents:
                phone_collection.insert_many(documents)
        else:
            # Lưu vào bộ nhớ (vẫn giữ cách cũ vì đây là lưu tạm)
            memory_storage['unique_numbers'] = unique_numbers
            memory_storage['duplicate_numbers'] = duplicate_numbers
        
        return jsonify({"success": True, "message": "Đã lưu số điện thoại thành công"})
    
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi: {str(e)}"}), 500

# API để lấy số điện thoại đã lưu
@app.route('/api/numbers', methods=['GET'])
def get_numbers():
    try:
        page = int(request.args.get('page', 1))
        per_page = 100
        skip = (page - 1) * per_page
        
        if USE_MONGODB:
            # Lấy tổng số lượng
            total_unique = phone_collection.count_documents({'is_duplicate': False})
            total_pages = (total_unique + per_page - 1) // per_page
            
            # Lấy số không trùng với phân trang
            unique_cursor = phone_collection.find(
                {'is_duplicate': False},
                {'number': 1, '_id': 0}
            ).sort('created_at', -1).skip(skip).limit(per_page)
            
            unique_numbers = [doc['number'] for doc in unique_cursor]
            
            # Lấy tất cả số trùng
            duplicate_cursor = phone_collection.find(
                {'is_duplicate': True},
                {'number': 1, '_id': 0}
            ).sort('created_at', -1)
            
            duplicate_numbers = [doc['number'] for doc in duplicate_cursor]
        else:
            # Lấy từ bộ nhớ với phân trang
            unique_numbers = memory_storage['unique_numbers'][skip:skip + per_page]
            duplicate_numbers = memory_storage['duplicate_numbers']
            total_unique = len(memory_storage['unique_numbers'])
            total_pages = (total_unique + per_page - 1) // per_page
        
        return jsonify({
            "success": True,
            "uniqueNumbers": unique_numbers,
            "duplicateNumbers": duplicate_numbers,
            "pagination": {
                "currentPage": page,
                "totalPages": total_pages,
                "totalItems": total_unique,
                "perPage": per_page
            }
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi: {str(e)}"}), 500

# Thêm API để lấy thống kê
@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        if USE_MONGODB:
            unique_count = phone_collection.count_documents({'is_duplicate': False})
            duplicate_count = phone_collection.count_documents({'is_duplicate': True})
        else:
            # Đếm từ bộ nhớ
            unique_count = len(memory_storage['unique_numbers'])
            duplicate_count = len(memory_storage['duplicate_numbers'])
        
        return jsonify({
            "success": True,
            "stats": {
                "uniqueCount": unique_count,
                "duplicateCount": duplicate_count,
                "totalCount": unique_count + duplicate_count,
                "storage_type": "MongoDB" if USE_MONGODB else "Memory"
            }
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi: {str(e)}"}), 500

# API để lấy lịch sử các lần lọc số
@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        if USE_MONGODB:
            # Lấy danh sách các session theo thứ tự thời gian giảm dần
            pipeline = [
                {
                    '$group': {
                        '_id': '$session_id',
                        'created_at': {'$first': '$created_at'},
                        'unique_count': {
                            '$sum': {'$cond': [{'$eq': ['$is_duplicate', False]}, 1, 0]}
                        },
                        'duplicate_count': {
                            '$sum': {'$cond': [{'$eq': ['$is_duplicate', True]}, 1, 0]}
                        },
                        'numbers': {'$push': '$number'}
                    }
                },
                {'$sort': {'created_at': -1}},
                {'$limit': 10}  # Giới hạn 10 session gần nhất
            ]
            
            history = list(phone_collection.aggregate(pipeline))
            
            # Định dạng lại dữ liệu để trả về
            formatted_history = [{
                'session_id': session['_id'],
                'created_at': session['created_at'].strftime("%Y-%m-%d %H:%M:%S"),
                'unique_count': session['unique_count'],
                'duplicate_count': session['duplicate_count'],
                'total_count': len(session['numbers']),
                'numbers': session['numbers']
            } for session in history]
            
            return jsonify({
                "success": True,
                "history": formatted_history
            })
        else:
            return jsonify({
                "success": True,
                "history": []
            })
    
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi: {str(e)}"}), 500

# API để lưu số điện thoại với ghi chú
@app.route('/api/notes/save', methods=['POST'])
def save_phone_notes():
    try:
        data = request.json
        phone_numbers = data.get('phoneNumbers', [])
        
        if USE_MONGODB:
            # Cập nhật hoặc thêm mới từng số điện thoại
            for phone in phone_numbers:
                phone_collection.update_one(
                    {'number': phone['number']},
                    {
                        '$set': {
                            'description': phone['description'],
                            'updated_at': datetime.now()
                        }
                    },
                    upsert=True  # Tạo mới nếu chưa tồn tại
                )
            
            return jsonify({"success": True, "message": "Đã lưu ghi chú thành công"})
        else:
            memory_storage['phone_notes'] = phone_numbers
            return jsonify({"success": True, "message": "Đã lưu ghi chú vào bộ nhớ tạm"})
            
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi: {str(e)}"}), 500

# API để lấy danh sách số điện thoại có ghi chú
@app.route('/api/notes', methods=['GET'])
def get_phone_notes():
    try:
        if USE_MONGODB:
            # Lấy tất cả số điện thoại có ghi chú
            cursor = phone_collection.find(
                {'description': {'$exists': True}},  # Chỉ lấy các số có ghi chú
                {
                    '_id': 0,
                    'number': 1,
                    'description': 1,
                    'is_duplicate': 1
                }
            ).sort('updated_at', -1)
            
            phone_notes = list(cursor)
            
            return jsonify({
                "success": True,
                "phoneNotes": phone_notes
            })
        else:
            return jsonify({
                "success": True,
                "phoneNotes": memory_storage['phone_notes']
            })
            
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi: {str(e)}"}), 500

# API để xóa ghi chú của số điện thoại
@app.route('/api/notes/delete/<number>', methods=['DELETE'])
def delete_phone_note(number):
    try:
        if USE_MONGODB:
            # Xóa trường description của số điện thoại
            result = phone_collection.update_one(
                {'number': number},
                {'$unset': {'description': "", 'updated_at': ""}}
            )
            if result.modified_count > 0:
                return jsonify({"success": True, "message": "Đã xóa ghi chú thành công"})
            else:
                return jsonify({"success": False, "message": "Không tìm thấy số điện thoại"}), 404
        else:
            # Xóa trong bộ nhớ tạm
            memory_storage['phone_notes'] = [
                note for note in memory_storage['phone_notes'] 
                if note['number'] != number
            ]
            return jsonify({"success": True, "message": "Đã xóa ghi chú thành công"})
            
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi: {str(e)}"}), 500

@app.route('/api/numbers/delete', methods=['DELETE'])
def delete_numbers():
    try:
        data = request.json
        numbers = data.get('numbers', [])
        
        if not numbers:
            return jsonify({"success": False, "message": "Không có số điện thoại để xóa"}), 400
        
        if USE_MONGODB:
            result = phone_collection.delete_many({
                'number': {'$in': numbers}
            })
            
            if result.deleted_count > 0:
                return jsonify({
                    "success": True,
                    "message": f"Đã xóa {result.deleted_count} số điện thoại"
                })
            else:
                return jsonify({
                    "success": False,
                    "message": "Không tìm thấy số điện thoại để xóa"
                }), 404
        else:
            # Xóa trong bộ nhớ tạm
            initial_count = len(memory_storage['unique_numbers'])
            memory_storage['unique_numbers'] = [
                num for num in memory_storage['unique_numbers'] 
                if num not in numbers
            ]
            deleted_count = initial_count - len(memory_storage['unique_numbers'])
            
            return jsonify({
                "success": True,
                "message": f"Đã xóa {deleted_count} số điện thoại"
            })
            
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)