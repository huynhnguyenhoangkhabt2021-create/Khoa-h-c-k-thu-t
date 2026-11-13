import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhoneDigits,
  isValidEmergencyPhone,
  findMatchingAccount,
  validateRegistrationInput,
  hasMandatoryEmergencyPhone,
  type StoredUserAccount
} from './authLogic.ts';

const SAMPLE_USERS: StoredUserAccount[] = [
  {
    username: 'OngMinh',
    password: '456',
    fullName: 'Ông Nguyễn Văn Minh',
    role: 'Người Bệnh / Người Cao Tuổi',
    phone: '0909 123 456'
  }
];

test('findMatchingAccount supports case-insensitive username OR registered phone number with exact password', () => {
  const byUser = findMatchingAccount(SAMPLE_USERS, ' ongminh ', '456');
  assert.ok(byUser);
  assert.equal(byUser.fullName, 'Ông Nguyễn Văn Minh');

  const byPhone = findMatchingAccount(SAMPLE_USERS, '0909123456', '456');
  assert.ok(byPhone);
  assert.equal(byPhone.username, 'OngMinh');

  const wrongPass = findMatchingAccount(SAMPLE_USERS, 'OngMinh', '000');
  assert.equal(wrongPass, null);
});

test('validateRegistrationInput requires at least one valid emergency phone number', () => {
  const missingEmergency = validateRegistrationInput(SAMPLE_USERS, {
    fullName: 'Bà Hoa',
    role: 'Người Bệnh / Người Cao Tuổi',
    username: 'BaHoa',
    password: '789',
    existingEmergencyContacts: []
  });
  assert.equal(missingEmergency.ok, false);
  assert.match(missingEmergency.error || '', /ít nhất 1 Số điện thoại khẩn cấp/i);

  const shortEmergency = validateRegistrationInput(SAMPLE_USERS, {
    fullName: 'Bà Hoa',
    role: 'Người Bệnh / Người Cao Tuổi',
    username: 'BaHoa',
    password: '789',
    emergencyName: 'Con trai',
    emergencyPhone: '12345',
    existingEmergencyContacts: []
  });
  assert.equal(shortEmergency.ok, false);

  const validReg = validateRegistrationInput(SAMPLE_USERS, {
    fullName: 'Bà Hoa',
    role: 'Người Bệnh / Người Cao Tuổi',
    username: 'BaHoa',
    userPhone: '0918 222 333',
    password: '789',
    emergencyName: 'Anh Tuấn',
    emergencyRelation: 'Con trai',
    emergencyPhone: '0912 345 678',
    existingEmergencyContacts: []
  });
  assert.equal(validReg.ok, true);
  assert.equal(validReg.newAccount?.username, 'BaHoa');
  assert.equal(validReg.newEmergencyContact?.phone, '0912 345 678');
  assert.equal(validReg.newEmergencyContact?.priority, 1);
  assert.equal(hasMandatoryEmergencyPhone([validReg.newEmergencyContact!]), true);
  assert.equal(isValidEmergencyPhone('0912-345-678'), true);
  assert.equal(normalizePhoneDigits('0912-345-678'), '0912345678');
});
