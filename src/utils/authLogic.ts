export interface StoredUserAccount {
  username: string;
  password: string;
  fullName: string;
  role: string;
  phone?: string;
}

export interface EmergencyContactMinimal {
  id: string;
  name: string;
  relation?: string;
  phone: string;
  priority?: number;
  autoSos?: boolean;
}

export function normalizePhoneDigits(phone: string): string {
  return String(phone || '').replace(/\D/g, '');
}

export function isValidEmergencyPhone(phone: string): boolean {
  const digits = normalizePhoneDigits(phone);
  return digits.length >= 9 && digits.length <= 15;
}

/**
 * Finds a user account matching either username (case-insensitive, trimmed)
 * OR registered phone number (normalized digits) with exact password match.
 */
export function findMatchingAccount(
  users: StoredUserAccount[],
  identifier: string,
  password: string
): StoredUserAccount | null {
  const cleanId = String(identifier || '').trim();
  const idDigits = normalizePhoneDigits(cleanId);
  if (!cleanId || !password) return null;

  for (const u of users) {
    if (!u || u.password !== password) continue;
    const uname = String(u.username || '').trim();
    const uPhoneDigits = normalizePhoneDigits(u.phone || '');
    if (uname.toLowerCase() === cleanId.toLowerCase()) {
      return u;
    }
    if (idDigits.length >= 9 && uPhoneDigits && uPhoneDigits === idDigits) {
      return u;
    }
  }
  return null;
}

export interface RegistrationPayload {
  fullName: string;
  role: string;
  username: string;
  userPhone?: string;
  password: string;
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  existingEmergencyContacts?: EmergencyContactMinimal[];
}

export interface RegistrationValidationResult {
  ok: boolean;
  error?: string;
  newAccount?: StoredUserAccount;
  newEmergencyContact?: EmergencyContactMinimal | null;
}

export function validateRegistrationInput(
  users: StoredUserAccount[],
  payload: RegistrationPayload
): RegistrationValidationResult {
  const fullName = String(payload.fullName || '').trim();
  const role = String(payload.role || '').trim() || 'Thành Viên Gia Đình';
  const username = String(payload.username || '').trim();
  const userPhone = String(payload.userPhone || '').trim();
  const password = String(payload.password || '');

  if (!fullName) {
    return { ok: false, error: 'Vui lòng nhập Họ và tên để dễ nhận biết tài khoản.' };
  }
  if (!username) {
    return { ok: false, error: 'Vui lòng nhập Tên đăng nhập (hoặc số điện thoại dùng để đăng nhập).' };
  }
  if (!password || password.length < 3) {
    return { ok: false, error: 'Vui lòng nhập Mật khẩu (tối thiểu 3 ký tự để bảo vệ tài khoản).' };
  }
  if (
    users.some(
      (u) => String(u.username || '').trim().toLowerCase() === username.toLowerCase()
    )
  ) {
    return { ok: false, error: 'Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác.' };
  }
  if (userPhone) {
    const uDigits = normalizePhoneDigits(userPhone);
    if (uDigits.length < 9) {
      return { ok: false, error: 'Số điện thoại cá nhân chưa đủ chữ số hợp lệ (tối thiểu 9 số).' };
    }
    if (
      users.some(
        (u) => u.phone && normalizePhoneDigits(u.phone) === uDigits
      )
    ) {
      return { ok: false, error: 'Số điện thoại này đã gắn với một tài khoản khác.' };
    }
  }

  const existingValidContacts = (payload.existingEmergencyContacts || []).filter((c) =>
    isValidEmergencyPhone(c.phone)
  );
  const emName = String(payload.emergencyName || '').trim();
  const emPhone = String(payload.emergencyPhone || '').trim();
  const emRel = String(payload.emergencyRelation || '').trim() || 'Người thân';

  let newEmergencyContact: EmergencyContactMinimal | null = null;
  if (emName || emPhone) {
    if (!emName) {
      return { ok: false, error: 'Vui lòng nhập Tên người thân nhận cuộc gọi/SMS khẩn cấp.' };
    }
    if (!isValidEmergencyPhone(emPhone)) {
      return {
        ok: false,
        error: 'Số điện thoại khẩn cấp bắt buộc phải hợp lệ (tối thiểu 9 chữ số, ví dụ: 0912345678).'
      };
    }
    newEmergencyContact = {
      id: 'fc-reg-' + Date.now(),
      name: emName,
      relation: emRel,
      phone: emPhone,
      priority: existingValidContacts.length === 0 ? 1 : existingValidContacts.length + 1,
      autoSos: true
    };
  } else if (existingValidContacts.length === 0) {
    return {
      ok: false,
      error: 'Bắt buộc phải thiết lập ít nhất 1 Số điện thoại khẩn cấp khi tạo tài khoản để bảo vệ SOS.'
    };
  }

  return {
    ok: true,
    newAccount: {
      username,
      password,
      fullName,
      role,
      phone: userPhone || undefined
    },
    newEmergencyContact
  };
}

export function hasMandatoryEmergencyPhone(contacts: EmergencyContactMinimal[]): boolean {
  return Array.isArray(contacts) && contacts.some((c) => c && isValidEmergencyPhone(c.phone));
}
