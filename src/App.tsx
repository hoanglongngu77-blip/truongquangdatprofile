/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { db } from './lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

type FormData = Record<string, string | boolean>;

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    hoTen: 'TRƯƠNG QUANG ĐẠT',
    soCCCD: '079209024771',
    ngaySinh: '2009-02-23',
    thangSinh: '2',
    namSinh: '2009',
    ngayCap: '2023-05-04',
    queQuan: 'Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
    thuongTruGD: '43 Trịnh Hoài Đức, Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
  });

  const [photos, setPhotos] = useState<string[]>(Array(5).fill(''));
  const [saveStatus, setSaveStatus] = useState('Chưa lưu');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load from Firebase or local storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const docRef = doc(db, 'submissions', 'truong_quang_dat');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const parsed = docSnap.data();
          setFormData(prev => ({ ...prev, ...parsed.data }));
          if (parsed.photos) {
            setPhotos(parsed.photos);
          }
          setSaveStatus('Đã tải dữ liệu từ máy chủ');
          localStorage.setItem('nvqs_dat_react', JSON.stringify({ data: parsed.data, photos: parsed.photos }));
          return;
        }
      } catch (error) {
        console.error("Lỗi tải từ Firebase:", error);
      }

      // Fallback to local storage
      const saved = localStorage.getItem('nvqs_dat_react');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...parsed.data }));
          if (parsed.photos) {
            setPhotos(parsed.photos);
          }
          setSaveStatus('Đã tải dữ liệu đã lưu');
        } catch (e) {
          console.error('Failed to parse local storage data', e);
        }
      }
    };
    
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, type, value, name } = e.target;
    const target = e.target as HTMLInputElement;
    
    setFormData((prev) => {
      const newData = { ...prev };
      if (type === 'checkbox') {
        newData[id] = target.checked;
      } else if (type === 'radio') {
        newData[name] = value;
      } else {
        newData[id] = value;
      }
      return newData;
    });

    setSaveStatus('Đang lưu...');
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    autoSaveTimeout.current = setTimeout(() => {
      saveToLocal(formData);
    }, 800);
  };

  useEffect(() => {
    if (saveStatus === 'Đang lưu...') {
      saveToLocal(formData);
      setSaveStatus('Đã lưu tự động');
    }
  }, [formData, saveStatus]);

  const saveToLocal = (dataToSave: FormData = formData) => {
    localStorage.setItem('nvqs_dat_react', JSON.stringify({ data: dataToSave, photos }));
  };

  const displayToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  };

  const handleSaveForm = async () => {
    setSaveStatus('Đang lưu lên hệ thống...');
    try {
      // Save locally
      saveToLocal();
      
      // Save to Firebase
      const timestamp = new Date().toISOString();
      const docRef = doc(db, 'submissions', 'truong_quang_dat');
      await setDoc(docRef, {
        data: formData,
        photos,
        updatedAt: timestamp
      }, { merge: true });
      
      displayToast('✓ Đã lưu dữ liệu thành công lên hệ thống');
      setSaveStatus('Đã lưu · ' + new Date().toLocaleTimeString('vi-VN'));
    } catch (error) {
      console.error("Lỗi khi lưu lên Firebase:", error);
      displayToast('⚠️ Đã lưu offline. Lỗi mạng khi lưu lên máy chủ.');
      setSaveStatus('Lỗi đồng bộ · ' + new Date().toLocaleTimeString('vi-VN'));
    }
  };

  const handleClearForm = () => {
    if (!window.confirm('Xóa toàn bộ dữ liệu đã điền?')) return;
    setFormData({
      hoTen: 'TRƯƠNG QUANG ĐẠT',
      soCCCD: '079209024771',
      ngaySinh: '2009-02-23',
      thangSinh: '2',
      namSinh: '2009',
      ngayCap: '2023-05-04',
      queQuan: 'Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
      thuongTruGD: '43 Trịnh Hoài Đức, Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
    });
    setPhotos(Array(5).fill(''));
    localStorage.removeItem('nvqs_dat_react');
    displayToast('Đã xóa trắng form (Giữ lại thông tin CCCD)');
    setSaveStatus('Chưa lưu');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ data: formData, photos }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ly-lich-nvqs-truong-quang-dat.json';
    a.click();
    displayToast('✓ Đã xuất file JSON');
  };

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotos(prev => {
            const next = [...prev];
            next[index] = ev.target!.result as string;
            return next;
          });
          setSaveStatus('Đang lưu...');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getVal = (key: string): string => (formData[key] as string) || '';
  const getBool = (key: string): boolean => (formData[key] as boolean) || false;

  return (
    <>
      <header className="site-header">
        <span className="brand">Lý Lịch NVQS</span>
        <span className="badge">Trương Quang Đạt</span>
      </header>

      <div className="hero">
        <div className="hero-eyebrow">Hồ sơ cá nhân · Nghĩa vụ quân sự</div>
        <h1>Mẫu Khai Lý Lịch<br />Nghĩa Vụ Quân Sự</h1>
        <p className="hero-sub">Yêu cầu công dân kê khai và dán hình đầy đủ trước khi lên nộp hồ sơ</p>
      </div>

      <div className="progress-bar-wrap">
        <div className="step-pill active"><span className="dot"></span>Bản thân</div>
        <span className="step-sep">›</span>
        <div className="step-pill"><span className="dot"></span>Cha</div>
        <span className="step-sep">›</span>
        <div className="step-pill"><span className="dot"></span>Mẹ</div>
        <span className="step-sep">›</span>
        <div className="step-pill"><span className="dot"></span>Vợ / Con</div>
        <span className="step-sep">›</span>
        <div className="step-pill"><span className="dot"></span>Anh chị em</div>
        <span className="step-sep">›</span>
        <div className="step-pill"><span className="dot"></span>Xác nhận</div>
      </div>

      <div className="container">

        {/* ══ SECTION 1: BẢN THÂN ══ */}
        <div className="section-card">
          <div className="section-header">
            <span className="section-num">1</span>
            <span className="section-title">Thông tin bản thân</span>
          </div>
          <div className="section-body">
            <div className="field-group two">
              <div className="field">
                <label>Họ và tên</label>
                <input type="text" id="hoTen" value={getVal('hoTen')} onChange={handleInputChange} placeholder="Họ và tên đầy đủ" />
              </div>
              <div className="field">
                <label>Số CCCD</label>
                <input type="text" id="soCCCD" value={getVal('soCCCD')} onChange={handleInputChange} placeholder="12 số" />
              </div>
            </div>

            <div className="divider"></div>

            <div className="field-group three">
              <div className="field">
                <label>Ngày sinh</label>
                <input type="date" id="ngaySinh" value={getVal('ngaySinh')} onChange={handleInputChange} />
              </div>
              <div className="field">
                <label>Tháng sinh</label>
                <input type="number" id="thangSinh" value={getVal('thangSinh')} onChange={handleInputChange} min="1" max="12" placeholder="1–12" />
              </div>
              <div className="field">
                <label>Năm sinh</label>
                <input type="number" id="namSinh" value={getVal('namSinh')} onChange={handleInputChange} min="1990" max="2010" placeholder="Năm" />
              </div>
            </div>

            <div className="divider"></div>

            <div className="field-group two">
              <div className="field">
                <label>Số điện thoại</label>
                <input type="tel" id="sdt" value={getVal('sdt')} onChange={handleInputChange} placeholder="0xxx xxx xxx" />
              </div>
              <div className="field">
                <label>CCCD ngày cấp</label>
                <input type="date" id="ngayCap" value={getVal('ngayCap')} onChange={handleInputChange} />
              </div>
            </div>

            <div className="divider"></div>

            <div className="field-group full">
              <div className="field">
                <label>Nghề nghiệp</label>
                <input type="text" id="ngheNghiep" value={getVal('ngheNghiep')} onChange={handleInputChange} placeholder="Nghề nghiệp hiện tại" />
              </div>
            </div>

            <div className="field-group full" style={{ marginTop: '14px' }}>
              <div className="field">
                <label>Đăng ký khai sinh tại (xã – tỉnh)</label>
                <input type="text" id="khaisinh" value={getVal('khaisinh')} onChange={handleInputChange} placeholder="Xã, huyện, tỉnh" />
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Quê quán theo CCCD (xã – tỉnh)</label>
                <input type="text" id="queQuan" value={getVal('queQuan')} onChange={handleInputChange} placeholder="Xã, huyện, tỉnh" />
              </div>
            </div>

            <div className="divider"></div>

            <div className="field-group three">
              <div className="field">
                <label>Thành phần gia đình</label>
                <input type="text" id="thanhPhan" value={getVal('thanhPhan')} onChange={handleInputChange} placeholder="Nông dân / Công nhân..." />
              </div>
              <div className="field">
                <label>Dân tộc</label>
                <input type="text" id="danToc" value={getVal('danToc')} onChange={handleInputChange} placeholder="Kinh, Tày..." />
              </div>
              <div className="field">
                <label>Tôn giáo</label>
                <input type="text" id="tonGiao" value={getVal('tonGiao')} onChange={handleInputChange} placeholder="Không / Phật giáo..." />
              </div>
            </div>

            <div className="field-group two" style={{ marginTop: '14px' }}>
              <div className="field">
                <label>Ngày vào Đoàn</label>
                <input type="date" id="ngayDoan" value={getVal('ngayDoan')} onChange={handleInputChange} />
              </div>
              <div className="field">
                <label>Nơi thường trú của gia đình</label>
                <input type="text" id="thuongTruGD" value={getVal('thuongTruGD')} onChange={handleInputChange} placeholder="Địa chỉ" />
              </div>
            </div>

            <div className="field-group full" style={{ marginTop: '14px' }}>
              <div className="field">
                <label>Nơi ở khác của bản thân (nếu có)</label>
                <input type="text" id="noiOKhac" value={getVal('noiOKhac')} onChange={handleInputChange} placeholder="Để trống nếu không có" />
              </div>
            </div>

            <div className="divider"></div>

            <div className="sub-label">Trình độ học vấn</div>
            <div className="field-group three">
              <div className="field">
                <label>Trình độ văn hóa</label>
                <input type="text" id="trinhDoVH" value={getVal('trinhDoVH')} onChange={handleInputChange} placeholder="12/12" />
              </div>
              <div className="field">
                <label>Năm tốt nghiệp THPT</label>
                <input type="number" id="namTNthpt" value={getVal('namTNthpt')} onChange={handleInputChange} placeholder="Năm" />
              </div>
              <div className="field">
                <label>Năm tốt nghiệp CĐ/ĐH</label>
                <input type="number" id="namTNdh" value={getVal('namTNdh')} onChange={handleInputChange} placeholder="Năm (nếu có)" />
              </div>
            </div>

            <div className="divider"></div>

            <div className="sub-label">Quá trình học tập, công tác</div>

            <div className="field-group two">
              <div className="field">
                <label>6–11 tuổi: Trường tiểu học</label>
                <input type="text" id="tieuhoc" value={getVal('tieuhoc')} onChange={handleInputChange} placeholder="Tên trường" />
              </div>
              <div className="field">
                <label>12–15 tuổi: Trường THCS</label>
                <input type="text" id="thcs" value={getVal('thcs')} onChange={handleInputChange} placeholder="Tên trường" />
              </div>
              <div className="field">
                <label>16–18 tuổi: Trường THPT</label>
                <input type="text" id="thpt" value={getVal('thpt')} onChange={handleInputChange} placeholder="Tên trường" />
              </div>
              <div className="field">
                <label>Từ 18 tuổi đến nay: Sinh viên (nếu có)</label>
                <input type="text" id="truongDH" value={getVal('truongDH')} onChange={handleInputChange} placeholder="Tên trường ĐH/CĐ" />
              </div>
            </div>

            <div className="field-group three" style={{ marginTop: '12px' }}>
              <div className="field">
                <label>Niên khóa (từ)</label>
                <input type="number" id="nienKhoaTu" value={getVal('nienKhoaTu')} onChange={handleInputChange} placeholder="20__" />
              </div>
              <div className="field">
                <label>Niên khóa (đến)</label>
                <input type="number" id="nienKhoaDen" value={getVal('nienKhoaDen')} onChange={handleInputChange} placeholder="20__" />
              </div>
              <div className="field">
                <label>Ngành học</label>
                <input type="text" id="nganhHoc" value={getVal('nganhHoc')} onChange={handleInputChange} placeholder="Tên ngành" />
              </div>
            </div>

            <div className="field-group full" style={{ marginTop: '12px' }}>
              <div className="field">
                <label>Trường khác (nếu có)</label>
                <input type="text" id="truongKhac" value={getVal('truongKhac')} onChange={handleInputChange} placeholder="Tên trường, thời gian" />
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Hiện nay làm gì, nơi làm việc (nếu đã nghỉ học)</label>
                <input type="text" id="hienLam" value={getVal('hienLam')} onChange={handleInputChange} placeholder="Nghề nghiệp, tên công ty, địa chỉ" />
              </div>
            </div>

            <div className="divider"></div>

            <div className="sub-label">Tình hình kinh tế gia đình</div>
            <div className="check-row">
              <label className="check-item">
                <input type="radio" name="kinhTe" value="du_song" checked={getVal('kinhTe') === 'du_song'} onChange={handleInputChange} /> Đủ sống / Bình thường
              </label>
              <label className="check-item">
                <input type="radio" name="kinhTe" value="kho_khan" checked={getVal('kinhTe') === 'kho_khan'} onChange={handleInputChange} /> Không đủ sống / Khó khăn
              </label>
            </div>
          </div>
        </div>

        {/* ══ SECTION 2: HỌ TÊN CHA ══ */}
        <div className="section-card">
          <div className="section-header">
            <span className="section-num">2</span>
            <span className="section-title">Họ tên Cha</span>
          </div>
          <div className="section-body">
            <div className="field-group two">
              <div className="field">
                <label>Họ và tên cha</label>
                <input type="text" id="tenCha" value={getVal('tenCha')} onChange={handleInputChange} placeholder="Họ và tên đầy đủ" />
              </div>
              <div className="field">
                <label>Số điện thoại</label>
                <input type="tel" id="sdtCha" value={getVal('sdtCha')} onChange={handleInputChange} placeholder="0xxx xxx xxx" />
              </div>
            </div>
            <div className="field-group three" style={{ marginTop: '12px' }}>
              <div className="field">
                <label>Ngày sinh</label>
                <input type="number" id="ngaySinhCha" value={getVal('ngaySinhCha')} onChange={handleInputChange} placeholder="Ngày" />
              </div>
              <div className="field">
                <label>Tháng sinh</label>
                <input type="number" id="thangSinhCha" value={getVal('thangSinhCha')} onChange={handleInputChange} placeholder="Tháng" />
              </div>
              <div className="field">
                <label>Năm sinh</label>
                <input type="number" id="namSinhCha" value={getVal('namSinhCha')} onChange={handleInputChange} placeholder="Năm" />
              </div>
            </div>

            <div className="divider"></div>

            <div className="sub-label">Trước 30/4/1975</div>
            <div className="check-row">
              <label className="check-item"><input type="checkbox" id="chaChuaSinh" checked={getBool('chaChuaSinh')} onChange={handleInputChange} /> Chưa sinh</label>
              <label className="check-item"><input type="checkbox" id="chaConNho" checked={getBool('chaConNho')} onChange={handleInputChange} /> Còn nhỏ sống phụ thuộc gia đình</label>
              <label className="check-item"><input type="checkbox" id="chaHocVH" checked={getBool('chaHocVH')} onChange={handleInputChange} /> Đi học văn hóa</label>
            </div>

            <div className="field-group full" style={{ marginTop: '12px' }}>
              <div className="field">
                <label>Sau 30/4/1975: Đi học văn hóa và sống cùng cha mẹ tại</label>
                <input type="text" id="chaSau75" value={getVal('chaSau75')} onChange={handleInputChange} placeholder="Địa chỉ nơi ở sau 1975" />
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Sau đó làm (nghề nghiệp, cấp bậc, chức vụ, đơn vị, công ty, nơi làm việc, năm tham gia, nghỉ hưu...)</label>
                <textarea id="chaSauDoLam" value={getVal('chaSauDoLam')} onChange={handleInputChange} placeholder="Mô tả chi tiết quá trình công tác..."></textarea>
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Hiện nay (nghề nghiệp, tên công ty, nơi làm việc)</label>
                <input type="text" id="chaHienNay" value={getVal('chaHienNay')} onChange={handleInputChange} placeholder="Nghề nghiệp hiện tại" />
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Nơi đăng ký thường trú</label>
                <input type="text" id="chaThuongTru" value={getVal('chaThuongTru')} onChange={handleInputChange} placeholder="Địa chỉ thường trú" />
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Nơi ở hiện tại</label>
                <input type="text" id="chaHienTai" value={getVal('chaHienTai')} onChange={handleInputChange} placeholder="Địa chỉ hiện tại (nếu khác thường trú)" />
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION 3: HỌ TÊN MẸ ══ */}
        <div className="section-card">
          <div className="section-header">
            <span className="section-num">3</span>
            <span className="section-title">Họ tên Mẹ</span>
          </div>
          <div className="section-body">
            <div className="field-group two">
              <div className="field">
                <label>Họ và tên mẹ</label>
                <input type="text" id="tenMe" value={getVal('tenMe')} onChange={handleInputChange} placeholder="Họ và tên đầy đủ" />
              </div>
              <div className="field">
                <label>Số điện thoại</label>
                <input type="tel" id="sdtMe" value={getVal('sdtMe')} onChange={handleInputChange} placeholder="0xxx xxx xxx" />
              </div>
            </div>
            <div className="field-group three" style={{ marginTop: '12px' }}>
              <div className="field">
                <label>Ngày sinh</label>
                <input type="number" id="ngaySinhMe" value={getVal('ngaySinhMe')} onChange={handleInputChange} placeholder="Ngày" />
              </div>
              <div className="field">
                <label>Tháng sinh</label>
                <input type="number" id="thangSinhMe" value={getVal('thangSinhMe')} onChange={handleInputChange} placeholder="Tháng" />
              </div>
              <div className="field">
                <label>Năm sinh</label>
                <input type="number" id="namSinhMe" value={getVal('namSinhMe')} onChange={handleInputChange} placeholder="Năm" />
              </div>
            </div>

            <div className="divider"></div>

            <div className="sub-label">Trước 30/4/1975</div>
            <div className="check-row">
              <label className="check-item"><input type="checkbox" id="meChuaSinh" checked={getBool('meChuaSinh')} onChange={handleInputChange} /> Chưa sinh</label>
              <label className="check-item"><input type="checkbox" id="meConNho" checked={getBool('meConNho')} onChange={handleInputChange} /> Còn nhỏ sống phụ thuộc gia đình</label>
              <label className="check-item"><input type="checkbox" id="meHocVH" checked={getBool('meHocVH')} onChange={handleInputChange} /> Đi học văn hóa</label>
            </div>

            <div className="field-group full" style={{ marginTop: '12px' }}>
              <div className="field">
                <label>Sau 30/4/1975: Đi học văn hóa và sống cùng cha mẹ tại</label>
                <input type="text" id="meSau75" value={getVal('meSau75')} onChange={handleInputChange} placeholder="Địa chỉ nơi ở sau 1975" />
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Sau đó làm</label>
                <textarea id="meSauDoLam" value={getVal('meSauDoLam')} onChange={handleInputChange} placeholder="Mô tả chi tiết quá trình công tác..."></textarea>
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Hiện nay</label>
                <input type="text" id="meHienNay" value={getVal('meHienNay')} onChange={handleInputChange} placeholder="Nghề nghiệp hiện tại" />
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Nơi đăng ký thường trú</label>
                <input type="text" id="meThuongTru" value={getVal('meThuongTru')} onChange={handleInputChange} placeholder="Địa chỉ thường trú" />
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Nơi ở hiện tại</label>
                <input type="text" id="meHienTai" value={getVal('meHienTai')} onChange={handleInputChange} placeholder="Địa chỉ hiện tại" />
              </div>
            </div>

            <div className="divider"></div>
            <div className="field-group three">
              <div className="field">
                <label>Cha mẹ có (số con)</label>
                <input type="number" id="soConTotal" value={getVal('soConTotal')} onChange={handleInputChange} min="0" placeholder="Tổng số con" />
              </div>
              <div className="field">
                <label>Số con trai</label>
                <input type="number" id="soTrai" value={getVal('soTrai')} onChange={handleInputChange} min="0" placeholder="Con trai" />
              </div>
              <div className="field">
                <label>Số con gái</label>
                <input type="number" id="soGai" value={getVal('soGai')} onChange={handleInputChange} min="0" placeholder="Con gái" />
              </div>
            </div>
            <div className="field-group full" style={{ marginTop: '12px' }}>
              <div className="field">
                <label>Bản thân là con thứ</label>
                <input type="number" id="conThu" value={getVal('conThu')} onChange={handleInputChange} min="1" placeholder="Ví dụ: 1 (con cả), 2, 3..." />
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION 4: VỢ ══ */}
        <div className="section-card">
          <div className="section-header">
            <span className="section-num">4</span>
            <span className="section-title">Họ tên Vợ</span>
          </div>
          <div className="section-body">
            <div className="field-group two">
              <div className="field">
                <label>Họ và tên vợ</label>
                <input type="text" id="tenVo" value={getVal('tenVo')} onChange={handleInputChange} placeholder="Họ và tên (nếu đã kết hôn)" />
              </div>
              <div className="field">
                <label>Số điện thoại</label>
                <input type="tel" id="sdtVo" value={getVal('sdtVo')} onChange={handleInputChange} placeholder="0xxx xxx xxx" />
              </div>
            </div>
            <div className="field-group three" style={{ marginTop: '12px' }}>
              <div className="field">
                <label>Ngày sinh</label>
                <input type="number" id="ngaySinhVo" value={getVal('ngaySinhVo')} onChange={handleInputChange} placeholder="Ngày" />
              </div>
              <div className="field">
                <label>Tháng sinh</label>
                <input type="number" id="thangSinhVo" value={getVal('thangSinhVo')} onChange={handleInputChange} placeholder="Tháng" />
              </div>
              <div className="field">
                <label>Năm sinh</label>
                <input type="number" id="namSinhVo" value={getVal('namSinhVo')} onChange={handleInputChange} placeholder="Năm" />
              </div>
            </div>
            <div className="field-group full" style={{ marginTop: '12px' }}>
              <div className="field">
                <label>Nghề nghiệp (tên công ty, nơi làm việc)</label>
                <input type="text" id="ngheVo" value={getVal('ngheVo')} onChange={handleInputChange} placeholder="Nghề nghiệp, công ty" />
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Nơi đăng ký thường trú</label>
                <input type="text" id="voThuongTru" value={getVal('voThuongTru')} onChange={handleInputChange} placeholder="Địa chỉ" />
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Nơi ở hiện tại</label>
                <input type="text" id="voHienTai" value={getVal('voHienTai')} onChange={handleInputChange} placeholder="Địa chỉ hiện tại" />
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION 5: CON RUỘT ══ */}
        <div className="section-card">
          <div className="section-header">
            <span className="section-num">5</span>
            <span className="section-title">Họ tên Con ruột</span>
          </div>
          <div className="section-body">
            <div className="field-group two">
              <div className="field">
                <label>Họ và tên con</label>
                <input type="text" id="tenCon" value={getVal('tenCon')} onChange={handleInputChange} placeholder="Họ và tên (nếu có)" />
              </div>
              <div className="field">
                <label>Ngày sinh (dd/mm/yyyy)</label>
                <input type="date" id="ngaySinhCon" value={getVal('ngaySinhCon')} onChange={handleInputChange} />
              </div>
            </div>
            <div className="field-group full" style={{ marginTop: '12px' }}>
              <div className="field">
                <label>Nơi ở hiện tại</label>
                <input type="text" id="conHienTai" value={getVal('conHienTai')} onChange={handleInputChange} placeholder="Địa chỉ" />
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION 6: ANH CHỊ EM RUỘT ══ */}
        <div className="section-card">
          <div className="section-header">
            <span className="section-num">6</span>
            <span className="section-title">Anh, Chị, Em ruột</span>
          </div>
          <div className="section-body">

            <div className="sub-label">a/ Anh, chị, em ruột 1</div>
            <div className="field-group two">
              <div className="field">
                <label>Họ và tên</label>
                <input type="text" id="ace1Ten" value={getVal('ace1Ten')} onChange={handleInputChange} placeholder="Họ và tên" />
              </div>
              <div className="field">
                <label>Nghề nghiệp</label>
                <input type="text" id="ace1Nghe" value={getVal('ace1Nghe')} onChange={handleInputChange} placeholder="Nghề nghiệp" />
              </div>
            </div>
            <div className="field-group three" style={{ marginTop: '10px' }}>
              <div className="field">
                <label>Ngày sinh</label>
                <input type="number" id="ace1Ngay" value={getVal('ace1Ngay')} onChange={handleInputChange} placeholder="Ngày" />
              </div>
              <div className="field">
                <label>Tháng sinh</label>
                <input type="number" id="ace1Thang" value={getVal('ace1Thang')} onChange={handleInputChange} placeholder="Tháng" />
              </div>
              <div className="field">
                <label>Năm sinh</label>
                <input type="number" id="ace1Nam" value={getVal('ace1Nam')} onChange={handleInputChange} placeholder="Năm" />
              </div>
            </div>
            <div className="field-group full" style={{ marginTop: '10px' }}>
              <div className="field">
                <label>Nơi làm việc / học tập</label>
                <input type="text" id="ace1NoiLam" value={getVal('ace1NoiLam')} onChange={handleInputChange} placeholder="Tên đơn vị, địa chỉ" />
              </div>
              <div className="field" style={{ marginTop: '10px' }}>
                <label>Nơi đăng ký thường trú</label>
                <input type="text" id="ace1ThuongTru" value={getVal('ace1ThuongTru')} onChange={handleInputChange} placeholder="Địa chỉ" />
              </div>
            </div>

            <div className="divider"></div>

            <div className="sub-label">b/ Anh, chị, em ruột 2</div>
            <div className="field-group two">
              <div className="field">
                <label>Họ và tên</label>
                <input type="text" id="ace2Ten" value={getVal('ace2Ten')} onChange={handleInputChange} placeholder="Họ và tên" />
              </div>
              <div className="field">
                <label>Nghề nghiệp</label>
                <input type="text" id="ace2Nghe" value={getVal('ace2Nghe')} onChange={handleInputChange} placeholder="Nghề nghiệp" />
              </div>
            </div>
            <div className="field-group three" style={{ marginTop: '10px' }}>
              <div className="field">
                <label>Ngày sinh</label>
                <input type="number" id="ace2Ngay" value={getVal('ace2Ngay')} onChange={handleInputChange} placeholder="Ngày" />
              </div>
              <div className="field">
                <label>Tháng sinh</label>
                <input type="number" id="ace2Thang" value={getVal('ace2Thang')} onChange={handleInputChange} placeholder="Tháng" />
              </div>
              <div className="field">
                <label>Năm sinh</label>
                <input type="number" id="ace2Nam" value={getVal('ace2Nam')} onChange={handleInputChange} placeholder="Năm" />
              </div>
            </div>
            <div className="field-group full" style={{ marginTop: '10px' }}>
              <div className="field">
                <label>Nơi làm việc / học tập</label>
                <input type="text" id="ace2NoiLam" value={getVal('ace2NoiLam')} onChange={handleInputChange} placeholder="Tên đơn vị, địa chỉ" />
              </div>
              <div className="field" style={{ marginTop: '10px' }}>
                <label>Nơi đăng ký thường trú</label>
                <input type="text" id="ace2ThuongTru" value={getVal('ace2ThuongTru')} onChange={handleInputChange} placeholder="Địa chỉ" />
              </div>
            </div>

            <div className="divider"></div>

            <div className="sub-label">c/ Anh, chị, em ruột khác</div>
            <div className="field-group full">
              <div className="field">
                <label>Họ tên, ngày tháng năm sinh, nghề nghiệp, nơi làm việc/học tập</label>
                <textarea id="aceKhac" value={getVal('aceKhac')} onChange={handleInputChange} placeholder="Liệt kê từng người, mỗi người một dòng..."></textarea>
              </div>
            </div>

            <div className="divider"></div>

            <div className="yn-row">
              <span className="yn-question">d/ Có anh em ruột đang thực hiện nghĩa vụ quân sự, nghĩa vụ công an:</span>
              <div className="yn-options">
                <label className="check-item"><input type="radio" name="aceNVQS" value="co" checked={getVal('aceNVQS') === 'co'} onChange={handleInputChange} /> Có</label>
                <label className="check-item"><input type="radio" name="aceNVQS" value="khong" checked={getVal('aceNVQS') === 'khong'} onChange={handleInputChange} /> Không</label>
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION 7: LAO ĐỘNG DUY NHẤT ══ */}
        <div className="section-card">
          <div className="section-header">
            <span className="section-num">7</span>
            <span className="section-title">Lao động duy nhất</span>
          </div>
          <div className="section-body">
            <div className="yn-row">
              <span className="yn-question">Là lao động duy nhất phải trực tiếp nuôi dưỡng thân nhân không còn khả năng lao động hoặc chưa đến tuổi lao động:</span>
              <div className="yn-options">
                <label className="check-item"><input type="radio" name="laoDongDuyNhat" value="co" checked={getVal('laoDongDuyNhat') === 'co'} onChange={handleInputChange} /> Có</label>
                <label className="check-item"><input type="radio" name="laoDongDuyNhat" value="khong" checked={getVal('laoDongDuyNhat') === 'khong'} onChange={handleInputChange} /> Không</label>
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION 8: VI PHẠM PHÁP LUẬT ══ */}
        <div className="section-card">
          <div className="section-header">
            <span className="section-num">8</span>
            <span className="section-title">Vi phạm pháp luật</span>
          </div>
          <div className="section-body">
            <div className="yn-row">
              <span className="yn-question">Bản thân có vi phạm pháp luật đến mức phải truy cứu trách nhiệm hình sự:</span>
              <div className="yn-options">
                <label className="check-item"><input type="radio" name="viPham" value="co" checked={getVal('viPham') === 'co'} onChange={handleInputChange} /> Có</label>
                <label className="check-item"><input type="radio" name="viPham" value="khong" checked={getVal('viPham') === 'khong'} onChange={handleInputChange} /> Không</label>
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION: ẢNH ══ */}
        <div className="section-card">
          <div className="section-header">
            <span className="section-num">📷</span>
            <span className="section-title">Hình 3×4 của công dân (5 ảnh)</span>
          </div>
          <div className="section-body">
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>Nhấn vào từng ô để tải ảnh lên. Cần đủ 5 ảnh 3×4.</p>
            <div className="photo-grid" id="photoGrid">
              {photos.map((photo, i) => (
                <label key={i} className="photo-slot">
                  {!photo && (
                    <>
                      <span className="slot-icon">+</span>
                      <span className="slot-label">Hình 3×4<br />của công dân</span>
                    </>
                  )}
                  {photo && <img src={photo} alt={`Ảnh ${i + 1}`} />}
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(i, e)} />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ══ LƯU Ý ══ */}
        <div className="note-box">
          <strong>* Lưu ý:</strong> Sau khi kê khai và dán hình đầy đủ, công dân nộp kèm các giấy tờ:<br />
          1. Thẻ CCCD photo của cha, mẹ và công dân (01 bản);<br />
          2. Bằng tốt nghiệp THPT, CĐ, ĐH (photo nếu có); trình độ dưới 12/12 nếu đã nghỉ học nộp kèm theo học bạ photo;<br />
          3. Bản chính giấy xác nhận là Học sinh – Sinh viên đang học giai đoạn năm 2026-2027 (nếu có);<br />
          4. Không xét tạm hoãn NVQS đối với các trường hợp học TC, CĐ, ĐH khóa học kết thúc trong năm 2026;<br />
          5. Trường hợp du học, định cư nước ngoài: nộp đầy đủ hồ sơ bao gồm Visa, giấy thông báo nhập học;<br />
          6. Nếu đã có vợ hoặc con: nộp kèm bản đăng ký kết hôn và giấy khai sinh con;<br />
          7. Nếu đã chuyển nơi thường trú đến địa phương khác, công dân hoặc người thân nộp thông báo giải quyết của công an.
        </div>

      </div>

      {/* ══ ACTION BAR ══ */}
      <div className="action-bar">
        <div className="save-status">
          <span className="dot-live"></span>
          <span>{saveStatus}</span>
        </div>
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={handleClearForm}>Xóa trắng</button>
          <button className="btn btn-ghost" onClick={handleExportJSON}>Xuất JSON</button>
          <button className="btn btn-primary" onClick={handleSaveForm}>Lưu dữ liệu</button>
        </div>
      </div>

      <div className={`toast ${showToast ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
