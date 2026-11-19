from src import create_app

# Khởi tạo instance ứng dụng Flask từ package src
app = create_app()

if __name__ == '__main__':
    # Chạy dev server tại 127.0.0.1:5000
    app.run(debug=True, host='127.0.0.1', port=5000)
