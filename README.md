# Lý Lịch Nghĩa Vụ Quân Sự - Trương Quang Đạt

Đây là ứng dụng web điền thông tin lý lịch Nghĩa vụ quân sự cá nhân, được xây dựng bằng React và Vite.

## Tính năng
- Giao diện điền đơn rõ ràng, chia theo từng phần (Bản thân, Cha, Mẹ, Vợ/Con, Anh chị em).
- Tự động lưu tạm thời vào Local Storage để tránh mất dữ liệu.
- Lưu trữ dữ liệu lâu dài và an toàn thông qua Firebase Firestore.
- Tính năng xuất dữ liệu ra file JSON.
- Tải lên và xem trước ảnh thẻ 3x4 trực tiếp trên trình duyệt.

## Triển khai (Deployment)
Dự án đã được cấu hình sẵn để triển khai dễ dàng lên **Vercel** thông qua file `vercel.json`.

### Các biến môi trường cần thiết (Environment Variables)
Khi triển khai lên Vercel, bạn cần thiết lập các biến môi trường sau trong phần Settings > Environment Variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
