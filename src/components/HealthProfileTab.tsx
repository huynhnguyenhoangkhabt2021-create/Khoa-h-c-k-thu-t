import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Save,
  Printer,
  Download,
  PhoneCall,
  Heart,
  AlertTriangle,
  Activity,
  User,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Syringe,
  Stethoscope,
  Building,
  Calendar,
  FileCheck,
  ChevronRight,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { Member, HealthRecordData } from '../types';

interface HealthProfileTabProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  privacyMask?: boolean;
}

export const HealthProfileTab: React.FC<HealthProfileTabProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  privacyMask,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    members.length > 0 ? members[0].id : ''
  );
  const [activeSection, setActiveSection] = useState<'admin' | 'history' | 'vaccine' | 'clinical'>('admin');
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [isPrivacyMasked, setIsPrivacyMasked] = useState(privacyMask ?? false);

  useEffect(() => {
    if (privacyMask !== undefined) {
      setIsPrivacyMasked(privacyMask);
    }
  }, [privacyMask]);

  const currentMember = members.find(m => m.id === selectedProfileId) || (members.length > 0 ? members[0] : null);

  // SECTION 1: THÔNG TIN HÀNH CHÍNH
  const [personalId, setPersonalId] = useState('079056001234');
  const [fullName, setFullName] = useState(currentMember?.name || 'Nguyễn Văn An');
  const [dob, setDob] = useState('1956-08-15');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [permanentAddress, setPermanentAddress] = useState('Số 45, Đường Lê Duẩn, Quận 1, TP. Hồ Chí Minh');
  const [phoneNumber, setPhoneNumber] = useState('0912 345 678');
  const [relativeInfo, setRelativeInfo] = useState('Con trai: Nguyễn Anh Tuấn - SĐT: 0988 123 456');
  const [insuranceNumber, setInsuranceNumber] = useState('DN4791234567890');
  const [bloodType, setBloodType] = useState<'A' | 'B' | 'AB' | 'O'>('O');

  // SECTION 2: TIỀN SỬ SỨC KHỎE VÀ CÁC YẾU TỐ LIÊN QUAN
  const [personalHistory, setPersonalHistory] = useState('Tăng huyết áp vô căn (đang điều trị Amlodipine 5mg), Thoái hóa đốt sống cổ.');
  const [surgicalHistory, setSurgicalHistory] = useState('Mổ cắt ruột thừa nội soi năm 2012 tại BV Chợ Rẫy, phục hồi tốt.');
  const [drugAllergies, setDrugAllergies] = useState('Dị ứng Penicillin (nổi mề đay, khó thở nhẹ).');
  const [weatherFoodAllergies, setWeatherFoodAllergies] = useState('Dị ứng hải sản (tôm biển), viêm mũi dị ứng khi trời chuyển lạnh.');
  const [familyHistory, setFamilyHistory] = useState('Bố có tiền sử đột quỵ nhồi máu não; Mẹ mắc đái tháo đường tuýp 2.');
  const [lifestyleRisks, setLifestyleRisks] = useState('Không hút thuốc lá; Thỉnh thoảng uống 1 chén rượu thuốc dịp lễ; Đi bộ dưỡng sinh 30 phút/ngày.');

  // SECTION 3: TIÊM CHỦNG
  const [vaccineList, setVaccineList] = useState<Array<{ id: string; vaccineName: string; date: string; dose: string; facility: string }>>([
    { id: 'v-1', vaccineName: 'Vắc-xin phòng COVID-19 (Pfizer/BioNTech)', date: '2022-03-15', dose: 'Mũi 4 (Nhắc lại)', facility: 'Trạm Y Tế Phường Bến Nghé' },
    { id: 'v-2', vaccineName: 'Vắc-xin Cúm mùa (Vaxigrip Tetra)', date: '2024-10-05', dose: 'Hằng năm', facility: 'Trung tâm Tiêm chủng VNVC' },
    { id: 'v-3', vaccineName: 'Vắc-xin Phế cầu khuẩn (Prevenar 13)', date: '2023-05-20', dose: '1 liều duy nhất', facility: 'Bệnh viện Đại học Y Dược' },
    { id: 'v-4', vaccineName: 'Vắc-xin Uốn ván - Bạch hầu (Td)', date: '2021-08-10', dose: 'Mũi nhắc lại', facility: 'Trạm Y Tế' },
    { id: 'v-5', vaccineName: 'Vắc-xin Viêm gan B', date: '2019-02-12', dose: 'Đủ 3 mũi cơ bản', facility: 'Viện Pasteur TP.HCM' },
  ]);
  const [newVacName, setNewVacName] = useState('');
  const [newVacDate, setNewVacDate] = useState(new Date().toISOString().split('T')[0]);
  const [newVacDose, setNewVacDose] = useState('Mũi 1');
  const [newVacFacility, setNewVacFacility] = useState('Trung tâm Y tế dự phòng');

  // SECTION 4: THÔNG TIN KHÁM LÂM SÀNG, CẬN LÂM SÀNG VÀ ĐIỀU TRỊ
  // 4.1 Khám thể lực
  const [heightCm, setHeightCm] = useState(165);
  const [weightKg, setWeightKg] = useState(62);
  const [bpValue, setBpValue] = useState('125/80 mmHg');
  const [pulseRate, setPulseRate] = useState(74);

  // 4.2 Khám chuyên khoa (lâm sàng)
  const [examInternal, setExamInternal] = useState('Tim đều, T1 T2 rõ, không âm thổi bệnh lý. Phổi trong, không rale.');
  const [examSurgery, setExamSurgery] = useState('Bụng mềm, gan lách không sờ chạm, sẹo mổ ruột thừa cũ lành tốt.');
  const [examEye, setExamEye] = useState('Thị lực 7/10 có kính lão, đục thủy tinh thể nhẹ giai đoạn sớm ở mắt trái.');
  const [examEnt, setExamEnt] = useState('Màng nhĩ sáng bóng, niêm mạc mũi họng sung huyết nhẹ khi trời lạnh.');
  const [examDental, setExamDental] = useState('Mất 2 răng hàm dưới (đã trồng phục hình), men răng ổn định.');
  const [examDermatology, setExamDermatology] = useState('Đồi mồi sinh lý vùng mu bàn tay và cẳng tay do lão hóa tự nhiên.');
  const [examGynecology, setExamGynecology] = useState('Tiền mãn kinh/Mãn kinh ổn định, không có u cục tuyến vú.');

  // 4.3 Cận lâm sàng
  const [testBlood, setTestBlood] = useState('Glucose máu đói: 5.4 mmol/L; HbA1c: 5.6%; Cholesterol toàn phần: 4.8 mmol/L; Creatinin: 78 µmol/L.');
  const [testUrine, setTestUrine] = useState('10 thông số nước tiểu bình thường, không có Protein niệu, không có đường niệu.');
  const [testEcg, setTestEcg] = useState('Điện tâm đồ nhịp xoang đều 72 l/p, trục trung gian, không thiếu máu cơ tim cấp.');
  const [testUltrasound, setTestUltrasound] = useState('Siêu âm ổ bụng: Gan nhiễm mỡ độ 1, thận hai bên không sỏi không ứ nước.');
  const [testXray, setTestXray] = useState('X-quang ngực thẳng: Bóng tim không to, hai phế trường sáng đều, không tổn thương thâm nhiễm.');
  const [testOtherScans, setTestOtherScans] = useState('Đo loãng xương DXA: T-score cột sống -1.8 (Thiếu xương nhẹ).');

  // 4.4 Quá trình điều trị
  const [treatmentDischarge, setTreatmentDischarge] = useState('Giấy ra viện Đợt điều trị ngoại trú định kỳ số 412/BVTM ngày 10/01/2025.');
  const [treatmentPrescription, setTreatmentPrescription] = useState('Đơn thuốc hiện tại: Amlodipine 5mg (1 viên sáng), Ginkgo Biloba 80mg (1 viên sáng, 1 viên chiều).');
  const [treatmentSickLeave, setTreatmentSickLeave] = useState('Không áp dụng (đã nghỉ hưu).');
  const [treatmentSummary, setTreatmentSummary] = useState('Bệnh nhân tuân thủ điều trị huyết áp tốt, không có biến cố tim mạch cấp. Tái khám mỗi tháng 1 lần.');

  // SYNC FROM MEMBER RECORD
  useEffect(() => {
    if (currentMember) {
      setFullName(currentMember.name);
      setGender(currentMember.gender as any);
      setBloodType(currentMember.bloodType);
      setHeightCm(currentMember.height || 165);
      setWeightKg(currentMember.weight || 62);
      setPhoneNumber(currentMember.emergencyContact || '0912 345 678');
      setPersonalId(currentMember.record?.personalId || `0790${currentMember.age}00${currentMember.id.slice(-4)}`);

      if (currentMember.record) {
        const r = currentMember.record;
        if (r.dob) setDob(r.dob);
        if (r.permanentAddress) setPermanentAddress(r.permanentAddress);
        if (r.phoneNumber) setPhoneNumber(r.phoneNumber);
        if (r.relativeInfo) setRelativeInfo(r.relativeInfo);
        if (r.insuranceNumber) setInsuranceNumber(r.insuranceNumber);

        if (r.personalHistory) setPersonalHistory(r.personalHistory);
        if (r.surgicalHistory) setSurgicalHistory(r.surgicalHistory);
        if (r.drugAllergies) setDrugAllergies(r.drugAllergies);
        if (r.weatherFoodAllergies) setWeatherFoodAllergies(r.weatherFoodAllergies);
        if (r.familyHistory) setFamilyHistory(r.familyHistory);
        if (r.lifestyleRisks) setLifestyleRisks(r.lifestyleRisks);

        if (r.vaccinationHistory && r.vaccinationHistory.length > 0) {
          setVaccineList(r.vaccinationHistory);
        }

        if (r.clinicalExam) {
          if (r.clinicalExam.bp) setBpValue(r.clinicalExam.bp);
          if (r.clinicalExam.bpm) setPulseRate(r.clinicalExam.bpm);
          if (r.clinicalExam.generalInternal) setExamInternal(r.clinicalExam.generalInternal);
          if (r.clinicalExam.surgery) setExamSurgery(r.clinicalExam.surgery);
          if (r.clinicalExam.eye) setExamEye(r.clinicalExam.eye);
          if (r.clinicalExam.ent) setExamEnt(r.clinicalExam.ent);
          if (r.clinicalExam.dental) setExamDental(r.clinicalExam.dental);
          if (r.clinicalExam.dermatology) setExamDermatology(r.clinicalExam.dermatology);
          if (r.clinicalExam.gynecology) setExamGynecology(r.clinicalExam.gynecology);
        }

        if (r.paraclinical) {
          if (r.paraclinical.bloodTest) setTestBlood(r.paraclinical.bloodTest);
          if (r.paraclinical.urineTest) setTestUrine(r.paraclinical.urineTest);
          if (r.paraclinical.ecg) setTestEcg(r.paraclinical.ecg);
          if (r.paraclinical.ultrasound) setTestUltrasound(r.paraclinical.ultrasound);
          if (r.paraclinical.xray) setTestXray(r.paraclinical.xray);
          if (r.paraclinical.otherScans) setTestOtherScans(r.paraclinical.otherScans);
        }

        if (r.treatmentProcess) {
          if (r.treatmentProcess.dischargePaper) setTreatmentDischarge(r.treatmentProcess.dischargePaper);
          if (r.treatmentProcess.prescription) setTreatmentPrescription(r.treatmentProcess.prescription);
          if (r.treatmentProcess.sickLeave) setTreatmentSickLeave(r.treatmentProcess.sickLeave);
          if (r.treatmentProcess.hospitalizationSummary) setTreatmentSummary(r.treatmentProcess.hospitalizationSummary);
        }
      }
    }
  }, [currentMember]);

  const bmi = heightCm > 0 ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10 : 0;

  const handleSaveAll = () => {
    if (!currentMember) return;

    const fullRecord: HealthRecordData = {
      personalId,
      dob,
      permanentAddress,
      phoneNumber,
      relativeInfo,
      insuranceNumber,

      personalHistory,
      surgicalHistory,
      drugAllergies,
      weatherFoodAllergies,
      familyHistory,
      lifestyleRisks,

      vaccinationHistory: vaccineList,

      clinicalExam: {
        bp: bpValue,
        bpm: pulseRate,
        generalInternal: examInternal,
        surgery: examSurgery,
        eye: examEye,
        ent: examEnt,
        dental: examDental,
        dermatology: examDermatology,
        gynecology: examGynecology,
      },

      paraclinical: {
        bloodTest: testBlood,
        urineTest: testUrine,
        ecg: testEcg,
        ultrasound: testUltrasound,
        xray: testXray,
        otherScans: testOtherScans,
      },

      treatmentProcess: {
        dischargePaper: treatmentDischarge,
        prescription: treatmentPrescription,
        sickLeave: treatmentSickLeave,
        hospitalizationSummary: treatmentSummary,
      },
    };

    const updatedMember: Member = {
      ...currentMember,
      name: fullName,
      gender,
      bloodType,
      height: heightCm,
      weight: weightKg,
      conditions: personalHistory,
      allergies: `${drugAllergies}; ${weatherFoodAllergies}`,
      emergencyContact: phoneNumber,
      record: fullRecord,
    };

    onUpdateMember(updatedMember);
    alert(`Đã lưu thành công hồ sơ sức khỏe y tế 4 phần của ${fullName}!`);
  };

  const handleAddVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVacName.trim()) return;
    const item = {
      id: 'v-' + Date.now(),
      vaccineName: newVacName.trim(),
      date: newVacDate,
      dose: newVacDose,
      facility: newVacFacility,
    };
    setVaccineList(prev => [item, ...prev]);
    setNewVacName('');
  };

  const handleDeleteVaccine = (id: string) => {
    setVaccineList(prev => prev.filter(v => v.id !== id));
  };

  const exportMedicalXml = () => {
    if (!currentMember) return;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HoSoSucKhoeDienTu ngayTao="${new Date().toISOString()}" phienBan="2.0">
  <!-- 1. PHẦN THÔNG TIN HÀNH CHÍNH -->
  <ThongTinHanhChinh>
    <MaDinhDanhCaNhan>${personalId}</MaDinhDanhCaNhan>
    <HoVaTen>${fullName}</HoVaTen>
    <NgaySinh>${dob}</NgaySinh>
    <GioiTinh>${gender}</GioiTinh>
    <DiaChiThuongTruTamTru>${permanentAddress}</DiaChiThuongTruTamTru>
    <SoDienThoaiLienLac>${phoneNumber}</SoDienThoaiLienLac>
    <ThongTinNguoiThan>${relativeInfo}</ThongTinNguoiThan>
    <BaoHiemYTe>${insuranceNumber}</BaoHiemYTe>
    <NhomMau>${bloodType}</NhomMau>
  </ThongTinHanhChinh>

  <!-- 2. PHẦN TIỀN SỬ SỨC KHỎE VÀ CÁC YẾU TỐ LIÊN QUAN -->
  <TienSuSucKhoe>
    <TienSuBenhBanThan>${personalHistory}</TienSuBenhBanThan>
    <TienSuPhauThuat>${surgicalHistory}</TienSuPhauThuat>
    <DiUngThuoc>${drugAllergies}</DiUngThuoc>
    <DiUngThoiTietThucPham>${weatherFoodAllergies}</DiUngThoiTietThucPham>
    <TienSuGiaDinh>${familyHistory}</TienSuGiaDinh>
    <YeuToNguyCo>${lifestyleRisks}</YeuToNguyCo>
  </TienSuSucKhoe>

  <!-- 3. PHẦN TIÊM CHỦNG -->
  <LichSuTiemChung>
    ${vaccineList
      .map(
        v => `
    <MuiTiem>
      <TenVacXin>${v.vaccineName}</TenVacXin>
      <NgayTiem>${v.date}</NgayTiem>
      <LieuLuong>${v.dose}</LieuLuong>
      <CoSoTiem>${v.facility}</CoSoTiem>
    </MuiTiem>`
      )
      .join('')}
  </LichSuTiemChung>

  <!-- 4. PHẦN THÔNG TIN KHÁM LÂM SÀNG, CẬN LÂM SÀNG VÀ ĐIỀU TRỊ -->
  <KhamVaDieuTri>
    <KhamTheLuc>
      <ChieuCaoCm>${heightCm}</ChieuCaoCm>
      <CanNangKg>${weightKg}</CanNangKg>
      <ChiSoBMI>${bmi}</ChiSoBMI>
      <HuyetAp>${bpValue}</HuyetAp>
      <NhipTimBPM>${pulseRate}</NhipTimBPM>
    </KhamTheLuc>
    <KhamChuyenKhoaLamSang>
      <NoiTongQuat>${examInternal}</NoiTongQuat>
      <NgoaiKhoa>${examSurgery}</NgoaiKhoa>
      <Mat>${examEye}</Mat>
      <TaiMuiHong>${examEnt}</TaiMuiHong>
      <RangHamMat>${examDental}</RangHamMat>
      <DaLieu>${examDermatology}</DaLieu>
      <SanPhuKhoa>${examGynecology}</SanPhuKhoa>
    </KhamChuyenKhoaLamSang>
    <CanLamSang>
      <XetNghiemMau>${testBlood}</XetNghiemMau>
      <XetNghiemNuocTieu>${testUrine}</XetNghiemNuocTieu>
      <DienTamDoECG>${testEcg}</DienTamDoECG>
      <SieuAm>${testUltrasound}</SieuAm>
      <XQuang>${testXray}</XQuang>
      <ChanDoanHinhAnhKhac>${testOtherScans}</ChanDoanHinhAnhKhac>
    </CanLamSang>
    <QuaTrinhDieuTri>
      <GiayRaVien>${treatmentDischarge}</GiayRaVien>
      <DonThuoc>${treatmentPrescription}</DonThuoc>
      <GiayNghiOm>${treatmentSickLeave}</GiayNghiOm>
      <TomTatDieuTri>${treatmentSummary}</TomTatDieuTri>
    </QuaTrinhDieuTri>
  </KhamVaDieuTri>
</HoSoSucKhoeDienTu>`;

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ho_So_Suc_Khoe_Dien_Tu_${fullName.replace(/[^a-z0-9]/gi, '_')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" /> HỒ SƠ SỨC KHỎE ĐIỆN TỬ (EHR)
          </h2>
          <p className="text-xs text-slate-300">
            Hồ sơ y bạ điện tử 4 phần theo quy chuẩn y tế quốc gia dành cho người cao tuổi & gia đình
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddProfileModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Thêm hồ sơ người bệnh
          </button>
          {currentMember && (
            <>
              <button
                onClick={() => setIsPrivacyMasked(!isPrivacyMasked)}
                className="px-3 py-2 rounded-xl glass-card text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
                title="Bật/Tắt che giấu số CCCD và SĐT nơi công cộng"
              >
                {isPrivacyMasked ? (
                  <>
                    <EyeOff className="w-4 h-4 text-amber-400" />
                    <span>Đang ẩn CCCD/SĐT</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Hiện đầy đủ</span>
                  </>
                )}
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-2 rounded-xl glass-card text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
              >
                <Printer className="w-4 h-4" /> In Hồ Sơ
              </button>
              <button
                onClick={exportMedicalXml}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Xuất Hồ Sơ XML
              </button>
              <button
                onClick={handleSaveAll}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Save className="w-4 h-4" /> Lưu Hồ Sơ
              </button>
            </>
          )}
        </div>
      </div>

      {/* MEMBER SELECTOR TABS */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedProfileId(m.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition flex items-center gap-2 cursor-pointer ${
              m.id === (currentMember?.id || '')
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                : 'glass-card text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{m.name}</span>
            <span className="text-[10px] opacity-75">({m.age} tuổi)</span>
          </button>
        ))}
      </div>

      {/* 4 CORE EHR SECTIONS NAVIGATION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveSection('admin')}
          className={`p-3 rounded-2xl text-left transition flex items-center gap-2.5 cursor-pointer border ${
            activeSection === 'admin'
              ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg'
              : 'glass-card border-white/5 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
            1
          </div>
          <div>
            <div className="text-xs font-bold">Thông Tin Hành Chính</div>
            <div className="text-[10px] opacity-75">Định danh, CCCD, BHYT</div>
          </div>
        </button>

        <button
          onClick={() => setActiveSection('history')}
          className={`p-3 rounded-2xl text-left transition flex items-center gap-2.5 cursor-pointer border ${
            activeSection === 'history'
              ? 'bg-amber-600/30 border-amber-500 text-white shadow-lg'
              : 'glass-card border-white/5 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
            2
          </div>
          <div>
            <div className="text-xs font-bold">Tiền Sử & Nguy Cơ</div>
            <div className="text-[10px] opacity-75">Bệnh lý, dị ứng, gia đình</div>
          </div>
        </button>

        <button
          onClick={() => setActiveSection('vaccine')}
          className={`p-3 rounded-2xl text-left transition flex items-center gap-2.5 cursor-pointer border ${
            activeSection === 'vaccine'
              ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-lg'
              : 'glass-card border-white/5 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            3
          </div>
          <div>
            <div className="text-xs font-bold">Phần Tiêm Chủng</div>
            <div className="text-[10px] opacity-75">Vắc-xin từ nhỏ đến lớn</div>
          </div>
        </button>

        <button
          onClick={() => setActiveSection('clinical')}
          className={`p-3 rounded-2xl text-left transition flex items-center gap-2.5 cursor-pointer border ${
            activeSection === 'clinical'
              ? 'bg-purple-600/30 border-purple-500 text-white shadow-lg'
              : 'glass-card border-white/5 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold shrink-0">
            4
          </div>
          <div>
            <div className="text-xs font-bold">Khám & Điều Trị</div>
            <div className="text-[10px] opacity-75">Thể lực, xét nghiệm, đơn thuốc</div>
          </div>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: PHẦN THÔNG TIN HÀNH CHÍNH */}
      {/* ========================================================= */}
      {activeSection === 'admin' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          {/* Privacy mask alert banner */}
          {isPrivacyMasked && (
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2.5 shadow-md">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="block text-white font-bold">Chế độ Bảo Mật Y Khoa & Ẩn Danh Tính: ĐANG BẬT</strong>
                <span>Số CCCD, Mã BHYT, Số điện thoại và Địa chỉ nhà đã được che bằng dấu •••• và *** để đảm bảo quyền riêng tư ở nơi công cộng.</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2 text-blue-400">
              <Building className="w-5 h-5 text-blue-400" /> 1. PHẦN THÔNG TIN HÀNH CHÍNH
            </h3>
            <span className="text-xs text-slate-400">Được mã hóa liên kết cơ sở dữ liệu định danh</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* CCCD / Định danh duy nhất */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-bold">
                  • Mã định danh cá nhân duy nhất, suốt đời (CCCD / Định danh quốc gia) *
                </label>
                {isPrivacyMasked && (
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Đã ẩn danh tính
                  </span>
                )}
              </div>
              <input
                type={isPrivacyMasked ? 'password' : 'text'}
                value={isPrivacyMasked && personalId.length > 6 ? personalId.slice(0, 4) + '••••' + personalId.slice(-4) : personalId}
                onChange={e => setPersonalId(e.target.value)}
                readOnly={isPrivacyMasked}
                placeholder="Ví dụ: 079056001234"
                className={`w-full glass-input p-2.5 rounded-xl font-mono font-bold ${isPrivacyMasked ? 'text-amber-300' : 'text-cyan-300'}`}
              />
              <span className="text-[10px] text-slate-400 italic">Mã số định danh điện tử gắn liền với cơ sở dữ liệu quốc gia</span>
            </div>

            {/* Họ và tên */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">• Họ và tên *</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                className="w-full glass-input p-2.5 rounded-xl font-bold text-white"
              />
            </div>

            {/* Ngày sinh & Giới tính */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-bold mb-1">• Ngày sinh *</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">• Giới tính *</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full glass-input p-2.5 rounded-xl text-slate-200"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            {/* Nhóm máu & BHYT */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-bold mb-1">• Nhóm máu</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value as any)}
                  className="w-full glass-input p-2.5 rounded-xl font-bold text-rose-300"
                >
                  <option value="O">Nhóm O</option>
                  <option value="A">Nhóm A</option>
                  <option value="B">Nhóm B</option>
                  <option value="AB">Nhóm AB</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">• Mã số Bảo hiểm y tế (BHYT)</label>
                <input
                  type={isPrivacyMasked ? 'password' : 'text'}
                  value={isPrivacyMasked && insuranceNumber.length > 6 ? insuranceNumber.slice(0, 5) + '••••••' + insuranceNumber.slice(-3) : insuranceNumber}
                  onChange={e => setInsuranceNumber(e.target.value)}
                  readOnly={isPrivacyMasked}
                  placeholder="Ví dụ: DN4791234567890"
                  className="w-full glass-input p-2.5 rounded-xl font-mono text-emerald-300 font-semibold"
                />
              </div>
            </div>

            {/* Địa chỉ thường trú/tạm trú */}
            <div className="md:col-span-2">
              <label className="block text-slate-300 font-bold mb-1">• Địa chỉ thường trú / tạm trú</label>
              <input
                type="text"
                value={isPrivacyMasked ? 'Quận 1, TP. Hồ Chí Minh (Đã ẩn số nhà để bảo vệ quyền riêng tư)' : permanentAddress}
                onChange={e => setPermanentAddress(e.target.value)}
                readOnly={isPrivacyMasked}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                className="w-full glass-input p-2.5 rounded-xl text-slate-200"
              />
            </div>

            {/* Số điện thoại liên lạc & Thông tin người thân */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">• Số điện thoại liên lạc người bệnh</label>
              <input
                type="text"
                value={isPrivacyMasked && phoneNumber.length > 5 ? phoneNumber.slice(0, 4) + '***' + phoneNumber.slice(-3) : phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                readOnly={isPrivacyMasked}
                placeholder="0912 345 678"
                className="w-full glass-input p-2.5 rounded-xl text-cyan-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">• Thông tin người thân liên hệ khi cần thiết (Khẩn cấp)</label>
              <input
                type="text"
                value={isPrivacyMasked ? 'Con trai: Nguyễn Anh Tuấn - SĐT: 0988***456' : relativeInfo}
                onChange={e => setRelativeInfo(e.target.value)}
                readOnly={isPrivacyMasked}
                placeholder="Họ tên người thân, quan hệ, SĐT liên hệ khẩn cấp"
                className="w-full glass-input p-2.5 rounded-xl text-rose-300 font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveSection('history')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              Tiếp tục: Phần 2. Tiền sử sức khỏe <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: PHẦN TIỀN SỬ SỨC KHỎE VÀ CÁC YẾU TỐ LIÊN QUAN */}
      {/* ========================================================= */}
      {activeSection === 'history' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2 text-amber-400">
              <Heart className="w-5 h-5 text-amber-400" /> 2. PHẦN TIỀN SỬ SỨC KHỎE VÀ CÁC YẾU TỐ LIÊN QUAN
            </h3>
            <span className="text-xs text-slate-400">Hồ sơ bệnh nền & cảnh báo dị ứng y khoa</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Tiền sử bệnh bản thân */}
            <div className="md:col-span-2">
              <label className="block text-slate-300 font-bold mb-1">
                • Tiền sử bệnh bản thân: Các bệnh mạn tính đã/đang mắc (tăng huyết áp, đái tháo đường, hen suyễn, tim mạch...)
              </label>
              <textarea
                rows={2}
                value={personalHistory}
                onChange={e => setPersonalHistory(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-amber-300 font-medium"
              />
            </div>

            {/* Tiền sử phẫu thuật */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">• Tiền sử phẫu thuật (các ca mổ, năm thực hiện, biến chứng nếu có)</label>
              <textarea
                rows={2}
                value={surgicalHistory}
                onChange={e => setSurgicalHistory(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-slate-200"
              />
            </div>

            {/* Tiền sử gia đình */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                • Tiền sử gia đình: Các bệnh lý di truyền hoặc bệnh mạn tính liên quan người thân cận huyết (ung thư, tim mạch, huyết áp, tiểu đường...)
              </label>
              <textarea
                rows={2}
                value={familyHistory}
                onChange={e => setFamilyHistory(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-slate-200"
              />
            </div>

            {/* Dị ứng thuốc */}
            <div>
              <label className="block text-rose-300 font-bold mb-1">• Dị ứng thuốc (Kháng sinh, thuốc giảm đau, NSAIDs...):</label>
              <textarea
                rows={2}
                value={drugAllergies}
                onChange={e => setDrugAllergies(e.target.value)}
                placeholder="Ghi rõ tên thuốc và triệu chứng phản vệ..."
                className="w-full glass-input p-2.5 rounded-xl text-rose-300 font-semibold border-rose-500/30"
              />
            </div>

            {/* Dị ứng thời tiết/thực phẩm */}
            <div>
              <label className="block text-amber-300 font-bold mb-1">• Dị ứng thời tiết hoặc thực phẩm (hải sản, phấn hoa, đậu phộng...):</label>
              <textarea
                rows={2}
                value={weatherFoodAllergies}
                onChange={e => setWeatherFoodAllergies(e.target.value)}
                placeholder="Triệu chứng và thức ăn gây dị ứng..."
                className="w-full glass-input p-2.5 rounded-xl text-amber-200"
              />
            </div>

            {/* Yếu tố nguy cơ */}
            <div className="md:col-span-2">
              <label className="block text-slate-300 font-bold mb-1">
                • Yếu tố nguy cơ: Thói quen sinh hoạt (hút thuốc lá, uống rượu bia, chế độ vận động, tiếp xúc khói bụi...)
              </label>
              <textarea
                rows={2}
                value={lifestyleRisks}
                onChange={e => setLifestyleRisks(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActiveSection('admin')}
              className="px-4 py-2 glass-card text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
            >
              Quay lại: Phần 1
            </button>
            <button
              onClick={() => setActiveSection('vaccine')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              Tiếp tục: Phần 3. Tiêm chủng <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: PHẦN TIÊM CHỦNG */}
      {/* ========================================================= */}
      {activeSection === 'vaccine' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2 text-emerald-400">
                <Syringe className="w-5 h-5 text-emerald-400" /> 3. PHẦN TIÊM CHỦNG
              </h3>
              <p className="text-xs text-slate-300">
                Lịch sử tiêm chủng các loại vắc-xin từ nhỏ đến trưởng thành (uốn ván, viêm gan B, lao, sởi, bạch hầu, cúm, COVID-19,...)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs">
              {vaccineList.length} Mũi tiêm đã ghi nhận
            </span>
          </div>

          {/* Form thêm mũi tiêm mới */}
          <form onSubmit={handleAddVaccine} className="p-3.5 rounded-2xl glass-card border border-emerald-500/20 space-y-2.5 text-xs">
            <span className="font-bold text-emerald-300 block">+ THÊM MŨI TIÊM VẮC-XIN VÀO HỒ SƠ</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1">Tên Vắc-xin *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Vắc-xin Cúm mùa, Uốn ván, Viêm gan B..."
                  value={newVacName}
                  onChange={e => setNewVacName(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-white font-medium"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Ngày tiêm</label>
                <input
                  type="date"
                  value={newVacDate}
                  onChange={e => setNewVacDate(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Mũi tiêm / Liều</label>
                <input
                  type="text"
                  value={newVacDose}
                  onChange={e => setNewVacDose(e.target.value)}
                  placeholder="Mũi 1, Nhắc lại..."
                  className="w-full glass-input p-2 rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newVacFacility}
                onChange={e => setNewVacFacility(e.target.value)}
                placeholder="Cơ sở y tế tiêm (Bệnh viện / Trạm y tế / Trung tâm tiêm chủng)..."
                className="flex-1 glass-input p-2 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Mũi Tiêm
              </button>
            </div>
          </form>

          {/* Danh sách mũi tiêm chủng */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {vaccineList.map((vac, index) => (
              <div
                key={vac.id}
                className="p-3 rounded-xl glass-card border border-white/5 flex items-center justify-between gap-3 text-xs hover:border-emerald-500/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-sm">{vac.vaccineName}</div>
                    <div className="text-slate-300 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold text-[10px]">
                        {vac.dose}
                      </span>
                      <span>Ngày tiêm: <strong className="text-white">{vac.date}</strong></span>
                      <span>• Nơi tiêm: {vac.facility}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteVaccine(vac.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  title="Xóa mũi tiêm này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActiveSection('history')}
              className="px-4 py-2 glass-card text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
            >
              Quay lại: Phần 2
            </button>
            <button
              onClick={() => setActiveSection('clinical')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              Tiếp tục: Phần 4. Khám & Điều trị <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: PHẦN THÔNG TIN KHÁM LÂM SÀNG, CẬN LÂM SÀNG VÀ ĐIỀU TRỊ */}
      {/* ========================================================= */}
      {activeSection === 'clinical' && (
        <div className="glass-panel rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2 text-purple-400">
                <Stethoscope className="w-5 h-5 text-purple-400" /> 4. PHẦN THÔNG TIN KHÁM LÂM SÀNG, CẬN LÂM SÀNG VÀ ĐIỀU TRỊ
              </h3>
              <p className="text-xs text-slate-300">
                Khám thể lực, các chuyên khoa lâm sàng, kết quả cận lâm sàng và toàn bộ quá trình điều trị
              </p>
            </div>
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Lưu Hồ Sơ
            </button>
          </div>

          {/* 4.1 KHÁM THỂ LỰC */}
          <div className="glass-card rounded-2xl p-4 space-y-3 border border-white/5 text-xs">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> 4.1 Khám Thể Lực
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="text-slate-400 block mb-1">Chiều cao (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={e => setHeightCm(parseFloat(e.target.value) || 160)}
                  className="w-full glass-input p-2 rounded-xl text-center font-bold text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cân nặng (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={e => setWeightKg(parseFloat(e.target.value) || 60)}
                  className="w-full glass-input p-2 rounded-xl text-center font-bold text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Chỉ số BMI</label>
                <div className="glass-input p-2 rounded-xl text-center font-extrabold text-emerald-400">
                  {bmi} ({bmi >= 18.5 && bmi <= 24.9 ? 'Chuẩn' : bmi < 18.5 ? 'Gầy' : 'Thừa cân'})
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Đo Huyết áp</label>
                <input
                  type="text"
                  value={bpValue}
                  onChange={e => setBpValue(e.target.value)}
                  placeholder="120/80 mmHg"
                  className="w-full glass-input p-2 rounded-xl text-center font-bold text-amber-300"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Nhịp tim (BPM)</label>
                <input
                  type="number"
                  value={pulseRate}
                  onChange={e => setPulseRate(parseInt(e.target.value) || 75)}
                  className="w-full glass-input p-2 rounded-xl text-center font-bold text-rose-400"
                />
              </div>
            </div>
          </div>

          {/* 4.2 KHÁM CHUYÊN KHOA (LÂM SÀNG) */}
          <div className="glass-card rounded-2xl p-4 space-y-3 border border-white/5 text-xs">
            <h4 className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-indigo-400" /> 4.2 Khám Chuyên Khoa (Lâm Sàng)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">• Nội tổng quát:</label>
                <input
                  type="text"
                  value={examInternal}
                  onChange={e => setExamInternal(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Ngoại khoa:</label>
                <input
                  type="text"
                  value={examSurgery}
                  onChange={e => setExamSurgery(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Mắt:</label>
                <input
                  type="text"
                  value={examEye}
                  onChange={e => setExamEye(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Tai - Mũi - Họng:</label>
                <input
                  type="text"
                  value={examEnt}
                  onChange={e => setExamEnt(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Răng - Hàm - Mặt:</label>
                <input
                  type="text"
                  value={examDental}
                  onChange={e => setExamDental(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Da liễu:</label>
                <input
                  type="text"
                  value={examDermatology}
                  onChange={e => setExamDermatology(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-300 font-bold block mb-1">• Sản - Phụ khoa (đối với nữ):</label>
                <input
                  type="text"
                  value={examGynecology}
                  onChange={e => setExamGynecology(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* 4.3 CẬN LÂM SÀNG */}
          <div className="glass-card rounded-2xl p-4 space-y-3 border border-white/5 text-xs">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" /> 4.3 Cận Lâm Sàng & Chẩn Đoán Hình Ảnh
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">• Kết quả xét nghiệm máu:</label>
                <textarea
                  rows={2}
                  value={testBlood}
                  onChange={e => setTestBlood(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Kết quả xét nghiệm nước tiểu:</label>
                <textarea
                  rows={2}
                  value={testUrine}
                  onChange={e => setTestUrine(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Điện tâm đồ (ECG):</label>
                <input
                  type="text"
                  value={testEcg}
                  onChange={e => setTestEcg(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Siêu âm:</label>
                <input
                  type="text"
                  value={testUltrasound}
                  onChange={e => setTestUltrasound(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Chụp X-quang tim phổi:</label>
                <input
                  type="text"
                  value={testXray}
                  onChange={e => setTestXray(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Các chẩn đoán hình ảnh khác (CT/MRI/DXA):</label>
                <input
                  type="text"
                  value={testOtherScans}
                  onChange={e => setTestOtherScans(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* 4.4 QUÁ TRÌNH ĐIỀU TRỊ */}
          <div className="glass-card rounded-2xl p-4 space-y-3 border border-white/5 text-xs">
            <h4 className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-rose-400" /> 4.4 Quá Trình Điều Trị
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">• Giấy ra viện:</label>
                <input
                  type="text"
                  value={treatmentDischarge}
                  onChange={e => setTreatmentDischarge(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Đơn thuốc điều trị hiện tại:</label>
                <input
                  type="text"
                  value={treatmentPrescription}
                  onChange={e => setTreatmentPrescription(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-rose-300 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Giấy nghỉ ốm / xác nhận y tế:</label>
                <input
                  type="text"
                  value={treatmentSickLeave}
                  onChange={e => setTreatmentSickLeave(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">• Tóm tắt các đợt điều trị tại bệnh viện / cơ sở y tế:</label>
                <textarea
                  rows={2}
                  value={treatmentSummary}
                  onChange={e => setTreatmentSummary(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-white/10">
            <button
              onClick={() => setActiveSection('vaccine')}
              className="px-4 py-2 glass-card text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
            >
              Quay lại: Phần 3
            </button>

            <button
              onClick={handleSaveAll}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Hoàn Tất & Lưu Toàn Bộ Hồ Sơ Y Tế
            </button>
          </div>
        </div>
      )}

      {/* MODAL: THÊM HỒ SƠ BỆNH NHÂN MỚI */}
      {showAddProfileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-5 w-full max-w-md space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <Plus className="w-4 h-4" /> THÊM HỒ SƠ NGƯỜI BỆNH MỚI
              </h3>
              <button
                onClick={() => setShowAddProfileModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.elements.namedItem('memName') as HTMLInputElement).value;
                const age = parseInt((form.elements.namedItem('memAge') as HTMLInputElement).value) || 65;
                const g = (form.elements.namedItem('memGender') as HTMLSelectElement).value as any;
                const cccd = (form.elements.namedItem('memCccd') as HTMLInputElement).value;
                const phone = (form.elements.namedItem('memPhone') as HTMLInputElement).value;

                if (!name.trim()) return;

                const newMem: Member = {
                  id: 'mem-' + Date.now(),
                  name: name.trim(),
                  age,
                  gender: g,
                  height: 165,
                  weight: 60,
                  bloodType: 'O',
                  conditions: 'Theo dõi thường xuyên',
                  allergies: 'Chưa ghi nhận',
                  emergencyContact: phone || '0988 123 456',
                  wristbandId: 'BLE-BAND-0' + (members.length + 1),
                  avgSpO2: 98,
                  restBPM: 75,
                  bodyTemp: 36.6,
                  record: {
                    personalId: cccd || `0790${age}00${Date.now().toString().slice(-4)}`,
                    phoneNumber: phone,
                    permanentAddress: 'TP. Hồ Chí Minh',
                    insuranceNumber: 'DN479' + Date.now().toString().slice(-8),
                  },
                  logs: [
                    {
                      id: 'log-init-' + Date.now(),
                      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                      type: 'Khởi tạo hồ sơ',
                      note: 'Tạo hồ sơ bệnh án điện tử 4 phần',
                    },
                  ],
                };

                onAddMember(newMem);
                setSelectedProfileId(newMem.id);
                setShowAddProfileModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-300 mb-1">Họ và tên bệnh nhân *</label>
                <input
                  name="memName"
                  required
                  placeholder="Ví dụ: Cụ Trần Văn Bình..."
                  className="w-full glass-input p-2.5 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Tuổi *</label>
                  <input
                    name="memAge"
                    type="number"
                    defaultValue={70}
                    className="w-full glass-input p-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Giới tính</label>
                  <select name="memGender" className="w-full glass-input p-2 rounded-xl">
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Mã CCCD / Định danh quốc gia</label>
                <input
                  name="memCccd"
                  placeholder="079070001234..."
                  className="w-full glass-input p-2.5 rounded-xl font-mono text-cyan-300"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Số điện thoại liên lạc người nhà</label>
                <input
                  name="memPhone"
                  placeholder="0912 345 678..."
                  className="w-full glass-input p-2.5 rounded-xl text-rose-300 font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Khởi Tạo Hồ Sơ Y Tế
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
